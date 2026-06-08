"""Team API routes — create, join, leave, list, override."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Student, UserRole
from app.models.team import Team, TeamMember, TeamStatus
from app.middleware.auth import get_current_user, require_student, require_teacher
from app.schemas.team import TeamCreate, TeamJoin, TeamResponse
from app.schemas.project import ProjectCreate
from app.models.project import Project, ProjectSpecialization, DifficultyLevel
from app.services.team_service import (
    create_team, join_team, leave_team, get_team_details, is_system_frozen,
)
from app.utils.audit import log_action

router = APIRouter(prefix="/api/teams", tags=["Teams"])


@router.post("")
def create_new_team(
    data: TeamCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Create a new team (student becomes leader)."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    try:
        team = create_team(db, student, data.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(db, current_user.id, "CREATE_TEAM", "team", team.id)
    return get_team_details(db, team)


@router.post("/join")
def join_existing_team(
    data: TeamJoin,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Join an existing team using a team code."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    try:
        team = join_team(db, student, data.team_code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(db, current_user.id, "JOIN_TEAM", "team", team.id)
    return get_team_details(db, team)


@router.post("/leave")
def leave_current_team(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Leave the current team."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    try:
        leave_team(db, student)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(db, current_user.id, "LEAVE_TEAM", "team", None)
    return {"message": "Successfully left the team"}


@router.get("")
def list_all_teams(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
    section: str = Query(None),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """List all teams (teacher only)."""
    query = db.query(Team)

    if search:
        query = query.filter(
            (Team.name.ilike(f"%{search}%")) |
            (Team.team_code.ilike(f"%{search}%"))
        )
    if department:
        query = query.filter(Team.department == department)
    if section:
        query = query.filter(Team.section == section.upper())

    total = query.count()
    teams = query.offset((page - 1) * per_page).limit(per_page).all()

    team_list = [get_team_details(db, t) for t in teams]
    return {"teams": team_list, "total": total}


@router.get("/{team_id}")
def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get team details."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Students can only view their own team
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.team_id != team.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return get_team_details(db, team)


@router.put("/{team_id}")
def update_team(
    team_id: int,
    data: dict,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Override team details (teacher only)."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if "name" in data:
        team.name = data["name"]
    if "status" in data:
        team.status = TeamStatus(data["status"])

    db.commit()
    db.refresh(team)
    log_action(db, current_user.id, "UPDATE_TEAM", "team", team.id, data)
    return get_team_details(db, team)


@router.post("/me/project")
def submit_team_project(
    data: ProjectCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Submit or update a project for the current user's team (leader only)."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student or not student.team_id:
        raise HTTPException(status_code=400, detail="You must be in a team to submit a project")

    team = db.query(Team).filter(Team.id == student.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.leader_id != student.id:
        raise HTTPException(status_code=403, detail="Only the team leader can submit the project")

    if team.status in (TeamStatus.FROZEN, TeamStatus.ALLOCATED):
        raise HTTPException(status_code=400, detail="Cannot modify project after allocation")

    # Check for duplicate title globally (except if it's their own project)
    existing_title = db.query(Project).filter(Project.title == data.title).first()
    if existing_title and existing_title.team_id != team.id:
        raise HTTPException(status_code=400, detail="Project title is already taken by another team")

    project = db.query(Project).filter(Project.team_id == team.id).first()
    
    if project:
        # Update existing
        project.title = data.title
        project.domain = data.domain
        project.description = data.description
        db.query(ProjectSpecialization).filter(ProjectSpecialization.project_id == project.id).delete()
    else:
        # Create new
        project = Project(
            title=data.title,
            domain=data.domain,
            description=data.description,
            difficulty=DifficultyLevel(data.difficulty) if data.difficulty else DifficultyLevel.MEDIUM,
            team_id=team.id
        )
        db.add(project)
        db.flush()

    for skill in data.required_skills:
        db.add(ProjectSpecialization(project_id=project.id, specialization=skill))

    db.commit()
    log_action(db, current_user.id, "SUBMIT_PROJECT", "team", team.id)
    return get_team_details(db, team)
