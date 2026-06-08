"""Teacher API routes — student management and dashboard."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Student, UserRole
from app.models.team import Team, TeamMember
from app.models.allocation import Allocation
from app.models.domain import StudentSpecialization
from app.middleware.auth import require_teacher
from app.schemas.teacher import DashboardStats
from app.schemas.student import StudentResponse, StudentListResponse
from app.services.report_service import get_overview_stats
from app.services.team_service import is_system_frozen
from app.utils.audit import log_action

router = APIRouter(prefix="/api/teachers", tags=["Teachers"])


@router.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics."""
    stats = get_overview_stats(db)
    stats["frozen"] = is_system_frozen(db)
    return stats


@router.get("/students")
def list_students(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    search: str = Query(None),
    department: str = Query(None),
    semester: int = Query(None),
    section: str = Query(None),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """List all students with filtering and pagination."""
    query = db.query(Student)

    if search:
        query = query.filter(
            (Student.name.ilike(f"%{search}%")) |
            (Student.usn.ilike(f"%{search}%"))
        )
    if department:
        query = query.filter(Student.department == department)
    if semester:
        query = query.filter(Student.semester == semester)
    if section:
        query = query.filter(Student.section == section.upper())

    total = query.count()
    students = query.offset((page - 1) * per_page).limit(per_page).all()

    student_list = []
    for s in students:
        specs = db.query(StudentSpecialization).filter(
            StudentSpecialization.student_id == s.id
        ).all()
        user = s.user
        student_list.append({
            "id": s.id,
            "user_id": s.user_id,
            "email": user.email if user else None,
            "name": s.name,
            "usn": s.usn,
            "department": s.department,
            "semester": s.semester,
            "section": s.section,
            "domain": s.domain,
            "team_id": s.team_id,
            "pref_domain_1": s.pref_domain_1,
            "pref_domain_2": s.pref_domain_2,
            "pref_domain_3": s.pref_domain_3,
            "specializations": [sp.specialization for sp in specs],
            "contact_number": s.contact_number,
            "import_source": s.import_source,
        })

    return {"students": student_list, "total": total, "page": page, "per_page": per_page}


@router.put("/students/{student_id}")
def update_student(
    student_id: int,
    data: dict,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Update a student's details (teacher override)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    updatable_fields = ["name", "department", "semester", "section", "domain",
                        "pref_domain_1", "pref_domain_2", "pref_domain_3"]
    for field in updatable_fields:
        if field in data:
            setattr(student, field, data[field])

    db.commit()
    db.refresh(student)
    log_action(db, current_user.id, "UPDATE_STUDENT", "student", student.id, data)
    return {"message": "Student updated", "id": student.id}


@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Delete a student and their user account."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    user = db.query(User).filter(User.id == student.user_id).first()
    if user:
        db.delete(user)

    log_action(db, current_user.id, "DELETE_STUDENT", "student", student_id)
    db.commit()
    return {"message": "Student deleted"}
