"""Allocation model storing team-project-guide assignments."""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


class AllocationMode(str, enum.Enum):
    RANDOM = "random"
    DOMAIN = "domain"
    SMART = "smart"


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), unique=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    guide_id = Column(Integer, ForeignKey("guides.id", ondelete="CASCADE"), nullable=False)
    mode = Column(SAEnum(AllocationMode), nullable=False)
    score = Column(Float, default=0.0)
    reasoning = Column(Text, nullable=True)
    is_frozen = Column(Boolean, default=False)
    allocated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    team = relationship("Team", back_populates="allocation")
    project = relationship("Project", back_populates="allocation")
    guide = relationship("Guide", back_populates="allocations")
