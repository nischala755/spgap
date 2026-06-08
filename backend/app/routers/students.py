"""Student API routes — profile, preferences, team, allocation views."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Student, UserRole
from app.models.team import Team, TeamMember
from app.models.allocation import Allocation
from app.models.domain import StudentSpecialization
from app.middleware.auth import get_current_user, require_student
from app.schemas.student import StudentResponse, StudentUpdate
from app.utils.audit import log_action

router = APIRouter(prefix="/api/students", tags=["Students"])


def _get_student(user: User, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


def _student_to_response(student: Student, db: Session) -> dict:
    specs = db.query(StudentSpecialization).filter(
        StudentSpecialization.student_id == student.id
    ).all()
    user = student.user
    return {
        "id": student.id,
        "user_id": student.user_id,
        "email": user.email if user else None,
        "name": student.name,
        "usn": student.usn,
        "department": student.department,
        "semester": student.semester,
        "section": student.section,
        "domain": student.domain,
        "contact_number": student.contact_number,
        "domain_description": student.domain_description,
        "team_id": student.team_id,
        "pref_domain_1": student.pref_domain_1,
        "pref_domain_2": student.pref_domain_2,
        "pref_domain_3": student.pref_domain_3,
        "specializations": [s.specialization for s in specs],
    }


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Get the current student's profile."""
    student = _get_student(current_user, db)
    return _student_to_response(student, db)


@router.put("/me")
def update_my_profile(
    data: StudentUpdate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Update domain, specializations, and preferences."""
    student = _get_student(current_user, db)

    if data.domain is not None:
        student.domain = data.domain
    if data.pref_domain_1 is not None:
        student.pref_domain_1 = data.pref_domain_1
    if data.pref_domain_2 is not None:
        student.pref_domain_2 = data.pref_domain_2
    if data.pref_domain_3 is not None:
        student.pref_domain_3 = data.pref_domain_3
    if data.contact_number is not None:
        student.contact_number = data.contact_number
    if data.domain_description is not None:
        student.domain_description = data.domain_description

    if data.specializations is not None:
        # Replace all specializations
        db.query(StudentSpecialization).filter(
            StudentSpecialization.student_id == student.id
        ).delete()
        for spec_name in data.specializations:
            db.add(StudentSpecialization(student_id=student.id, specialization=spec_name))

    db.commit()
    db.refresh(student)
    log_action(db, current_user.id, "UPDATE_PROFILE", "student", student.id)
    return _student_to_response(student, db)


@router.get("/me/team")
def get_my_team(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Get the current student's team information."""
    student = _get_student(current_user, db)
    if not student.team_id:
        return {"team": None}

    team = db.query(Team).filter(Team.id == student.team_id).first()
    if not team:
        return {"team": None}

    from app.services.team_service import get_team_details
    return {"team": get_team_details(db, team)}


@router.get("/me/allocation")
def get_my_allocation(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Get the current student's allocation (project + guide)."""
    student = _get_student(current_user, db)
    if not student.team_id:
        return {"allocation": None}

    allocation = db.query(Allocation).filter(Allocation.team_id == student.team_id).first()
    if not allocation:
        return {"allocation": None}

    project = allocation.project
    guide = allocation.guide

    return {
        "allocation": {
            "id": allocation.id,
            "project": {
                "id": project.id,
                "title": project.title,
                "domain": project.domain,
                "description": project.description,
                "difficulty": project.difficulty.value if hasattr(project.difficulty, 'value') else project.difficulty,
            } if project else None,
            "guide": {
                "id": guide.id,
                "name": guide.name,
                "designation": guide.designation.value if hasattr(guide.designation, 'value') else guide.designation,
                "employee_id": guide.employee_id,
            } if guide else None,
            "score": allocation.score,
            "reasoning": allocation.reasoning,
            "mode": allocation.mode.value if hasattr(allocation.mode, 'value') else allocation.mode,
            "is_frozen": allocation.is_frozen,
        }
    }
