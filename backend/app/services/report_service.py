"""Report generation service for analytics and exports."""

import csv
import io
import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    Student, Team, TeamMember, Project, Guide, GuideDomain,
    Allocation, AllocationMode, TeamStatus, Designation
)


def get_overview_stats(db: Session) -> dict:
    """Get aggregate statistics for the teacher dashboard."""
    total_students = db.query(Student).count()
    total_teams = db.query(Team).count()
    total_projects = db.query(Project).count()
    total_guides = db.query(Guide).count()

    # Teams with 3+ members that don't have allocations
    allocated_team_ids = db.query(Allocation.team_id).subquery()
    eligible_teams = db.query(Team).filter(
        Team.id.notin_(db.query(Allocation.team_id))
    ).count()

    completed = db.query(Allocation).count()

    return {
        "total_students": total_students,
        "total_teams": total_teams,
        "total_projects": total_projects,
        "total_guides": total_guides,
        "pending_allocations": eligible_teams,
        "completed_allocations": completed,
    }


def get_workload_distribution(db: Session) -> list[dict]:
    """Get guide workload data for charts."""
    guides = db.query(Guide).all()
    result = []
    for guide in guides:
        load = db.query(Allocation).filter(Allocation.guide_id == guide.id).count()
        result.append({
            "name": guide.name,
            "designation": guide.designation.value if isinstance(guide.designation, Designation) else guide.designation,
            "current_load": load,
            "max_capacity": guide.max_capacity,
        })
    return result


def get_domain_distribution(db: Session) -> dict:
    """Get project and student domain distribution."""
    # Project domains
    project_domains = db.query(
        Project.domain, func.count(Project.id)
    ).group_by(Project.domain).all()

    # Student domains
    student_domains = db.query(
        Student.domain, func.count(Student.id)
    ).filter(Student.domain.isnot(None)).group_by(Student.domain).all()

    return {
        "project_domains": [{"domain": d, "count": c} for d, c in project_domains],
        "student_domains": [{"domain": d, "count": c} for d, c in student_domains],
    }


def get_team_distribution(db: Session) -> list[dict]:
    """Get team size distribution."""
    teams = db.query(Team).all()
    result = []
    for team in teams:
        count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        result.append({
            "team_name": team.name,
            "member_count": count,
            "status": team.status.value if isinstance(team.status, TeamStatus) else team.status,
            "department": team.department,
            "section": team.section,
        })
    return result


def export_allocations_csv(db: Session) -> str:
    """Export all allocations as CSV string."""
    allocations = db.query(Allocation).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Team Name", "Team Code", "Department", "Section",
        "Project Title", "Project Domain",
        "Guide Name", "Guide Designation",
        "Score", "Mode", "Status"
    ])

    for alloc in allocations:
        team = alloc.team
        project = alloc.project
        guide = alloc.guide
        writer.writerow([
            team.name if team else "",
            team.team_code if team else "",
            team.department if team else "",
            team.section if team else "",
            project.title if project else "",
            project.domain if project else "",
            guide.name if guide else "",
            guide.designation.value if guide and isinstance(guide.designation, Designation) else "",
            alloc.score,
            alloc.mode.value if isinstance(alloc.mode, AllocationMode) else alloc.mode,
            "Frozen" if alloc.is_frozen else "Active",
        ])

    return output.getvalue()
