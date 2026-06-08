"""Guide and GuideDomain models."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


class Designation(str, enum.Enum):
    ASSISTANT_PROFESSOR = "assistant_professor"
    ASSOCIATE_PROFESSOR = "associate_professor"
    PROFESSOR = "professor"


# Guide capacity rules by designation
GUIDE_CAPACITY = {
    Designation.ASSISTANT_PROFESSOR: 2,
    Designation.ASSOCIATE_PROFESSOR: 3,
    Designation.PROFESSOR: 3,
}


class Guide(Base):
    __tablename__ = "guides"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    designation = Column(SAEnum(Designation), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    domains = relationship("GuideDomain", back_populates="guide", cascade="all, delete-orphan")
    allocations = relationship("Allocation", back_populates="guide")

    @property
    def max_capacity(self) -> int:
        return GUIDE_CAPACITY.get(self.designation, 2)

    @property
    def current_load(self) -> int:
        return len(self.allocations)

    @property
    def available_slots(self) -> int:
        return self.max_capacity - self.current_load


class GuideDomain(Base):
    __tablename__ = "guide_domains"

    id = Column(Integer, primary_key=True, index=True)
    guide_id = Column(Integer, ForeignKey("guides.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(100), nullable=False)

    # Relationships
    guide = relationship("Guide", back_populates="domains")
