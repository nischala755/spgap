"""Guide Pydantic schemas."""

from pydantic import BaseModel
from datetime import datetime


class GuideCreate(BaseModel):
    name: str
    employee_id: str
    designation: str
    domains: list[str] = []


class GuideUpdate(BaseModel):
    name: str | None = None
    designation: str | None = None
    domains: list[str] | None = None


class GuideResponse(BaseModel):
    id: int
    name: str
    employee_id: str
    designation: str
    domains: list[str] = []
    max_capacity: int = 0
    current_load: int = 0
    available_slots: int = 0
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class GuideListResponse(BaseModel):
    guides: list[GuideResponse]
    total: int
