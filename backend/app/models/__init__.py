"""Models package - import all models for SQLAlchemy metadata registration."""

from app.models.user import User, Student, Teacher, UserRole
from app.models.team import Team, TeamMember, TeamStatus
from app.models.project import Project, ProjectSpecialization, DifficultyLevel
from app.models.guide import Guide, GuideDomain, Designation, GUIDE_CAPACITY
from app.models.allocation import Allocation, AllocationMode
from app.models.domain import Domain, Specialization, StudentSpecialization
from app.models.audit import AuditLog

__all__ = [
    "User", "Student", "Teacher", "UserRole",
    "Team", "TeamMember", "TeamStatus",
    "Project", "ProjectSpecialization", "DifficultyLevel",
    "Guide", "GuideDomain", "Designation", "GUIDE_CAPACITY",
    "Allocation", "AllocationMode",
    "Domain", "Specialization", "StudentSpecialization",
    "AuditLog",
]
