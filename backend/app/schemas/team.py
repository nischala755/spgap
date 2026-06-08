"""Team Pydantic schemas."""

from pydantic import BaseModel
from datetime import datetime


class TeamCreate(BaseModel):
    name: str


class TeamJoin(BaseModel):
    team_code: str


class TeamMemberResponse(BaseModel):
    student_id: int
    name: str
    usn: str
    domain: str | None = None

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: int
    name: str
    team_code: str
    leader_id: int
    leader_name: str | None = None
    department: str
    semester: int
    section: str
    status: str
    member_count: int = 0
    members: list[TeamMemberResponse] = []
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    teams: list[TeamResponse]
    total: int
