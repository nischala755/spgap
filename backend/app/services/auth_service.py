"""Authentication service for login and registration."""

from sqlalchemy.orm import Session
from app.models.user import User, UserRole, Student, Teacher
from app.models.domain import StudentSpecialization
from app.utils.security import hash_password, verify_password, create_access_token


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Validate credentials and return user or None."""
    user = db.query(User).filter(User.email == email).first()
    if user and verify_password(password, user.hashed_password):
        return user
    return None


def create_teacher_user(
    db: Session,
    email: str,
    password: str,
    name: str,
    employee_id: str,
    department: str,
) -> User:
    """Register a new teacher account."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("Email already registered")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.TEACHER,
    )
    db.add(user)
    db.flush()

    teacher = Teacher(
        user_id=user.id,
        name=name,
        employee_id=employee_id,
        department=department,
    )
    db.add(teacher)
    db.commit()
    db.refresh(user)
    return user


def create_student_user(
    db: Session,
    email: str,
    password: str,
    name: str,
    usn: str,
    department: str,
    semester: int,
    section: str,
    domain: str | None = None,
    contact_number: str | None = None,
    specializations: list[str] | None = None,
    commit: bool = True,
) -> User:
    """Create a new student account (used by CSV upload and manual creation)."""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError(f"Email already registered: {email}")

    existing_usn = db.query(Student).filter(Student.usn == usn).first()
    if existing_usn:
        raise ValueError(f"USN already exists: {usn}")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.STUDENT,
    )
    db.add(user)
    db.flush()

    student = Student(
        user_id=user.id,
        name=name,
        usn=usn,
        department=department,
        semester=semester,
        section=section.upper(),
        domain=domain,
        contact_number=contact_number,
    )
    db.add(student)
    db.flush()

    if specializations:
        for spec_name in specializations:
            db.add(StudentSpecialization(student_id=student.id, specialization=spec_name))

    if commit:
        db.commit()
        db.refresh(user)
    else:
        db.flush()
    return user


def generate_login_token(user: User) -> dict:
    """Generate JWT token and response data for a user."""
    name = ""
    if user.role == UserRole.STUDENT and user.student:
        name = user.student.name
    elif user.role == UserRole.TEACHER and user.teacher:
        name = user.teacher.name

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "name": name,
    }
