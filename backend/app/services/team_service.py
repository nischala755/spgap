"""Team formation service with validation logic."""

import string
import random
from sqlalchemy.orm import Session
from app.models.user import Student
from app.models.team import Team, TeamMember, TeamStatus
from app.models.allocation import Allocation


def generate_team_code(db: Session) -> str:
    """Generate a unique 8-character team code."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=8))
        existing = db.query(Team).filter(Team.team_code == code).first()
        if not existing:
            return code


def is_system_frozen(db: Session) -> bool:
    """Check if any allocations are frozen (system-wide freeze)."""
    frozen = db.query(Allocation).filter(Allocation.is_frozen == True).first()
    return frozen is not None


def create_team(db: Session, student: Student, team_name: str) -> Team:
    """Create a new team with the student as leader."""
    if is_system_frozen(db):
        raise ValueError("System is frozen. Cannot create teams.")

    if student.team_id is not None:
        raise ValueError("You are already in a team. Leave your current team first.")

    team = Team(
        name=team_name,
        team_code=generate_team_code(db),
        leader_id=student.id,
        department=student.department,
        semester=student.semester,
        section=student.section,
        status=TeamStatus.OPEN,
    )
    db.add(team)
    db.flush()

    # Add leader as member
    student.team_id = team.id
    member = TeamMember(team_id=team.id, student_id=student.id)
    db.add(member)
    db.commit()
    db.refresh(team)
    return team


def join_team(db: Session, student: Student, team_code: str) -> Team:
    """Join an existing team using a team code."""
    if is_system_frozen(db):
        raise ValueError("System is frozen. Cannot join teams.")

    if student.team_id is not None:
        raise ValueError("You are already in a team. Leave your current team first.")

    team = db.query(Team).filter(Team.team_code == team_code).first()
    if not team:
        raise ValueError("Invalid team code.")

    if team.status in (TeamStatus.FROZEN, TeamStatus.ALLOCATED):
        raise ValueError("This team is no longer accepting members.")

    # Validate same class
    if (student.department != team.department or
            student.semester != team.semester or
            student.section != team.section):
        raise ValueError(
            f"You must be from {team.department} - Semester {team.semester} - Section {team.section} to join this team."
        )

    # Check capacity
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if member_count >= 4:
        raise ValueError("Team is full (maximum 4 members).")

    # Add member
    student.team_id = team.id
    member = TeamMember(team_id=team.id, student_id=student.id)
    db.add(member)

    # Update status if full
    if member_count + 1 >= 4:
        team.status = TeamStatus.FULL

    db.commit()
    db.refresh(team)
    return team


def leave_team(db: Session, student: Student) -> None:
    """Leave the current team (before allocation freeze)."""
    if is_system_frozen(db):
        raise ValueError("System is frozen. Cannot leave teams.")

    if student.team_id is None:
        raise ValueError("You are not in any team.")

    team = db.query(Team).filter(Team.id == student.team_id).first()
    if not team:
        raise ValueError("Team not found.")

    if team.status in (TeamStatus.FROZEN, TeamStatus.ALLOCATED):
        raise ValueError("Cannot leave a frozen/allocated team.")

    # Remove member record
    db.query(TeamMember).filter(
        TeamMember.team_id == team.id,
        TeamMember.student_id == student.id,
    ).delete()

    student.team_id = None

    # Check if leader is leaving
    if team.leader_id == student.id:
        remaining = db.query(TeamMember).filter(TeamMember.team_id == team.id).first()
        if remaining:
            team.leader_id = remaining.student_id
        else:
            # Delete empty team
            db.delete(team)
            db.commit()
            return

    # Update team status
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if member_count < 4:
        team.status = TeamStatus.OPEN

    db.commit()


def get_team_details(db: Session, team: Team) -> dict:
    """Get team details with member info."""
    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    member_list = []
    for tm in members:
        student = db.query(Student).filter(Student.id == tm.student_id).first()
        if student:
            member_list.append({
                "student_id": student.id,
                "name": student.name,
                "usn": student.usn,
                "domain": student.domain,
            })

    project_data = None
    from app.models.project import Project, ProjectSpecialization
    project = db.query(Project).filter(Project.team_id == team.id).first()
    if project:
        skills = db.query(ProjectSpecialization).filter(ProjectSpecialization.project_id == project.id).all()
        project_data = {
            "title": project.title,
            "domain": project.domain,
            "description": project.description,
            "required_skills": [s.specialization for s in skills]
        }

    leader = db.query(Student).filter(Student.id == team.leader_id).first()

    return {
        "id": team.id,
        "name": team.name,
        "team_code": team.team_code,
        "leader_id": team.leader_id,
        "leader_name": leader.name if leader else None,
        "department": team.department,
        "semester": team.semester,
        "section": team.section,
        "status": team.status.value if isinstance(team.status, TeamStatus) else team.status,
        "member_count": len(member_list),
        "members": member_list,
        "project": project_data,
        "created_at": team.created_at,
    }
