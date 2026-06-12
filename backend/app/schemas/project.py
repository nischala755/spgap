"""Project Pydantic schemas."""

from pydantic import BaseModel
from datetime import datetime


class ProjectCreate(BaseModel):
    title: str
    domain: str
    description: str | None = None
    difficulty: str = "medium"
    required_skills: list[str] = []
    mapped_sdg: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    domain: str | None = None
    description: str | None = None
    difficulty: str | None = None
    required_skills: list[str] | None = None
    mapped_sdg: str | None = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    domain: str
    description: str | None = None
    difficulty: str
    is_allocated: bool
    is_locked: bool
    required_skills: list[str] = []
    mapped_sdg: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: list[ProjectResponse]
    total: int
