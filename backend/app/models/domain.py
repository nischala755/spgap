"""Domain, Specialization, and StudentSpecialization models."""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    # Relationships
    specializations = relationship("Specialization", back_populates="domain", cascade="all, delete-orphan")


class Specialization(Base):
    __tablename__ = "specializations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    domain = relationship("Domain", back_populates="specializations")


class StudentSpecialization(Base):
    __tablename__ = "student_specializations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    specialization = Column(String(100), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="specializations")
