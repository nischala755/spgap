"""Project and ProjectSpecialization models."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), unique=True, nullable=False, index=True)
    domain = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(SAEnum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    is_allocated = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), unique=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    team = relationship("Team", back_populates="project")
    required_skills = relationship("ProjectSpecialization", back_populates="project", cascade="all, delete-orphan")
    allocation = relationship("Allocation", back_populates="project", uselist=False)


class ProjectSpecialization(Base):
    __tablename__ = "project_specializations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    specialization = Column(String(100), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="required_skills")
