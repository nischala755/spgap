"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse, RegisterTeacherRequest
from app.services.auth_service import authenticate_user, create_teacher_user, generate_login_token
from app.utils.audit import log_action

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT token."""
    user = authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    log_action(db, user.id, "LOGIN", "user", user.id)
    return generate_login_token(user)


@router.post("/register", response_model=LoginResponse)
def register_teacher(req: RegisterTeacherRequest, db: Session = Depends(get_db)):
    """Register a new teacher/admin account."""
    try:
        user = create_teacher_user(
            db=db,
            email=req.email,
            password=req.password,
            name=req.name,
            employee_id=req.employee_id,
            department=req.department,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    log_action(db, user.id, "REGISTER_TEACHER", "user", user.id)
    return generate_login_token(user)
