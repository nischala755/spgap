"""Allocation Pydantic schemas."""

from pydantic import BaseModel
from datetime import datetime


class AllocationRunRequest(BaseModel):
    mode: str = "smart"  # random, domain, smart


class AllocationResponse(BaseModel):
    id: int
    team_id: int
    team_name: str | None = None
    project_id: int
    project_title: str | None = None
    guide_id: int
    guide_name: str | None = None
    mode: str
    score: float
    reasoning: str | None = None
    is_frozen: bool
    allocated_at: datetime | None = None

    class Config:
        from_attributes = True


class AllocationListResponse(BaseModel):
    allocations: list[AllocationResponse]
    total: int


class AllocationSummary(BaseModel):
    total_teams: int
    allocated_teams: int
    unallocated_teams: int
    mode_used: str
    allocations: list[AllocationResponse]


class CSVUploadResponse(BaseModel):
    imported: int
    skipped: int
    errors: int
    error_details: list[dict] = []
