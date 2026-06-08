"""Student Pydantic schemas."""

from pydantic import BaseModel
from datetime import datetime


class StudentBase(BaseModel):
    name: str
    usn: str
    department: str
    semester: int
    section: str
    domain: str | None = None
    contact_number: str | None = None


class StudentCreate(StudentBase):
    email: str
    password: str | None = None


class StudentUpdate(BaseModel):
    domain: str | None = None
    specializations: list[str] | None = None
    pref_domain_1: str | None = None
    pref_domain_2: str | None = None
    pref_domain_3: str | None = None
    contact_number: str | None = None
    domain_description: str | None = None


class StudentResponse(StudentBase):
    id: int
    user_id: int
    email: str | None = None
    team_id: int | None = None
    pref_domain_1: str | None = None
    pref_domain_2: str | None = None
    pref_domain_3: str | None = None
    specializations: list[str] = []
    domain_description: str | None = None

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    students: list[StudentResponse]
    total: int
    page: int
    per_page: int
