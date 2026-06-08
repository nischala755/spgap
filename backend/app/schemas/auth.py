"""Authentication schemas."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str


class RegisterTeacherRequest(BaseModel):
    email: str
    password: str
    name: str
    employee_id: str
    department: str
