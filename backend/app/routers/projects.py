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


@router.post("")
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Create a new project."""
    # Check unique title
    existing = db.query(Project).filter(Project.title == data.title).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project title already exists")

    project = Project(
        title=data.title,
        domain=data.domain,
        description=data.description,
        difficulty=DifficultyLevel(data.difficulty) if data.difficulty else DifficultyLevel.MEDIUM,
    )
    db.add(project)
    db.flush()

    for skill in data.required_skills:
        db.add(ProjectSpecialization(project_id=project.id, specialization=skill))

    db.commit()
    db.refresh(project)
    log_action(db, current_user.id, "CREATE_PROJECT", "project", project.id)
    return _project_to_response(project, db)


@router.put("/{project_id}")
def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Update an existing project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.is_locked:
        raise HTTPException(status_code=400, detail="Project is locked and cannot be modified")

    if data.title is not None:
        existing = db.query(Project).filter(Project.title == data.title, Project.id != project_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Project title already exists")
        project.title = data.title

    if data.domain is not None:
        project.domain = data.domain
    if data.description is not None:
        project.description = data.description
    if data.difficulty is not None:
        project.difficulty = DifficultyLevel(data.difficulty)

    if data.required_skills is not None:
        db.query(ProjectSpecialization).filter(
            ProjectSpecialization.project_id == project.id
        ).delete()
        for skill in data.required_skills:
            db.add(ProjectSpecialization(project_id=project.id, specialization=skill))

    db.commit()
    db.refresh(project)
    log_action(db, current_user.id, "UPDATE_PROJECT", "project", project.id)
    return _project_to_response(project, db)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.is_locked:
        raise HTTPException(status_code=400, detail="Project is locked and cannot be deleted")

    db.delete(project)
    db.commit()
    log_action(db, current_user.id, "DELETE_PROJECT", "project", project_id)
    return {"message": "Project deleted"}
