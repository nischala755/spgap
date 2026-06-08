"""Teacher Pydantic schemas."""

from pydantic import BaseModel


class TeacherResponse(BaseModel):
    id: int
    user_id: int
    name: str
    employee_id: str
    department: str

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_students: int
    total_teams: int
    total_projects: int
    total_guides: int
    pending_allocations: int
    completed_allocations: int
    frozen: bool
