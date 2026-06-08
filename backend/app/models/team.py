"""Team and TeamMember models."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


class TeamStatus(str, enum.Enum):
    OPEN = "open"
    FULL = "full"
    ALLOCATED = "allocated"
    FROZEN = "frozen"


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    team_code = Column(String(8), unique=True, nullable=False, index=True)
    leader_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    department = Column(String(100), nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String(10), nullable=False)
    status = Column(SAEnum(TeamStatus), default=TeamStatus.OPEN)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    leader = relationship("Student", foreign_keys=[leader_id])
    members = relationship("Student", back_populates="team", foreign_keys="[Student.team_id]")
    team_members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    project = relationship("Project", back_populates="team", uselist=False)
    allocation = relationship("Allocation", back_populates="team", uselist=False)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    team = relationship("Team", back_populates="team_members")
    student = relationship("Student")
