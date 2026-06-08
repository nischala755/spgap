"""Project management API routes (teacher only)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectSpecialization, DifficultyLevel
from app.middleware.auth import require_teacher
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.utils.audit import log_action

router = APIRouter(prefix="/api/projects", tags=["Projects"])


def _project_to_response(project: Project, db: Session) -> dict:
    skills = db.query(ProjectSpecialization).filter(
        ProjectSpecialization.project_id == project.id
    ).all()
    return {
        "id": project.id,
        "title": project.title,
        "domain": project.domain,
        "description": project.description,
        "difficulty": project.difficulty.value if hasattr(project.difficulty, 'value') else project.difficulty,
        "is_allocated": project.is_allocated,
        "is_locked": project.is_locked,
        "required_skills": [s.specialization for s in skills],
        "created_at": project.created_at,
    }


@router.get("")
def list_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    domain: str = Query(None),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """List all projects with filtering."""
    query = db.query(Project)

    if search:
        query = query.filter(Project.title.ilike(f"%{search}%"))
    if domain:
        query = query.filter(Project.domain == domain)

    total = query.count()
    projects = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "projects": [_project_to_response(p, db) for p in projects],
        "total": total,
    }



