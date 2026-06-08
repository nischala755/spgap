"""User, Student, and Teacher models."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Student", back_populates="user", uselist=False)
    teacher = relationship("Teacher", back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    usn = Column(String(50), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String(10), nullable=False)
    domain = Column(String(100), nullable=True)
    contact_number = Column(String(20), nullable=True)
    domain_description = Column(Text, nullable=True)  # natural language interests
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    pref_domain_1 = Column(String(100), nullable=True)
    pref_domain_2 = Column(String(100), nullable=True)
    pref_domain_3 = Column(String(100), nullable=True)
    import_source = Column(String(20), nullable=True, default="manual")  # csv, manual, seed
    import_batch_id = Column(String(50), nullable=True)  # tracks CSV upload batch

    # Relationships
    user = relationship("User", back_populates="student")
    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
    specializations = relationship("StudentSpecialization", back_populates="student", cascade="all, delete-orphan")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False)

    # Relationships
    user = relationship("User", back_populates="teacher")
