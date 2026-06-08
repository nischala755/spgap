"""CSV upload, validation, and reset service."""

import csv
import io
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.services.auth_service import create_student_user
from app.models.user import Student, User
from app.models.domain import StudentSpecialization
from app.models.team import Team, TeamMember, TeamStatus
from app.models.allocation import Allocation


REQUIRED_COLUMNS = ["USN", "Name", "Email", "Department", "Semester", "Section", "Domain", "Specialization"]
OPTIONAL_COLUMNS = ["Contact", "Contact No"]
BATCH_COMMIT_SIZE = 25

# Header aliases (case-insensitive)
HEADER_ALIASES = {
    "usn": "USN",
    "name": "Name",
    "email": "Email",
    "department": "Department",
    "semester": "Semester",
    "section": "Section",
    "domain": "Domain",
    "specialization": "Specialization",
    "contact": "Contact",
    "contact no": "Contact",
    "contact no.": "Contact",
    "contact_number": "Contact",
    "phone": "Contact",
}


def _normalize_headers(fieldnames: list[str] | None) -> dict[str, str]:
    """Map original CSV headers to canonical column names."""
    if not fieldnames:
        return {}
    mapping = {}
    for header in fieldnames:
        key = header.strip().lower()
        if key in HEADER_ALIASES:
            mapping[header] = HEADER_ALIASES[key]
    return mapping


def _get_row_value(row: dict, header_map: dict, canonical: str) -> str:
    """Get a value from a row using normalized header mapping."""
    for orig, canon in header_map.items():
        if canon == canonical:
            return (row.get(orig) or "").strip()
    return ""


def _parse_specializations(raw: str) -> list[str]:
    """Split specialization field — supports comma or semicolon separators."""
    if not raw:
        return []
    parts = raw.replace(";", ",").split(",")
    return [p.strip() for p in parts if p.strip()]


def process_csv_upload(db: Session, file_content: bytes) -> dict:
    """
    Process uploaded CSV file, validate rows, and create student accounts.
    Optimized for large imports (~140 students) with batched commits.
    """
    imported = 0
    skipped = 0
    errors = 0
    error_details = []
    batch_id = f"csv_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    pending_commits = 0

    try:
        content = file_content.decode("utf-8")
    except UnicodeDecodeError:
        content = file_content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(content))

    if reader.fieldnames is None:
        return {
            "imported": 0,
            "skipped": 0,
            "errors": 1,
            "error_details": [{"row": 0, "error": "Empty or invalid CSV file"}],
        }

    header_map = _normalize_headers(reader.fieldnames)
    present_canonical = set(header_map.values())
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in present_canonical]
    if missing_cols:
        return {
            "imported": 0,
            "skipped": 0,
            "errors": 1,
            "error_details": [{"row": 0, "error": f"Missing required columns: {', '.join(missing_cols)}"}],
        }

    for row_num, row in enumerate(reader, start=2):
        try:
            missing_fields = []
            for col in REQUIRED_COLUMNS:
                if not _get_row_value(row, header_map, col):
                    missing_fields.append(col)

            if missing_fields:
                errors += 1
                error_details.append({
                    "row": row_num,
                    "usn": _get_row_value(row, header_map, "USN"),
                    "error": f"Missing fields: {', '.join(missing_fields)}",
                })
                continue

            usn = _get_row_value(row, header_map, "USN")
            name = _get_row_value(row, header_map, "Name")
            email = _get_row_value(row, header_map, "Email")
            department = _get_row_value(row, header_map, "Department")
            semester = int(_get_row_value(row, header_map, "Semester"))
            section = _get_row_value(row, header_map, "Section").upper()
            domain = _get_row_value(row, header_map, "Domain")
            specialization_raw = _get_row_value(row, header_map, "Specialization")
            contact_number = _get_row_value(row, header_map, "Contact") or None
            specializations = _parse_specializations(specialization_raw)

            user = create_student_user(
                db=db,
                email=email,
                password=usn.lower(),
                name=name,
                usn=usn,
                department=department,
                semester=semester,
                section=section,
                domain=domain if domain else None,
                contact_number=contact_number,
                specializations=specializations,
                commit=False,
            )

            student = user.student
            if student:
                student.import_source = "csv"
                student.import_batch_id = batch_id

            pending_commits += 1
            if pending_commits >= BATCH_COMMIT_SIZE:
                db.commit()
                pending_commits = 0

            imported += 1

        except ValueError as e:
            db.rollback()
            pending_commits = 0
            error_msg = str(e)
            if "already" in error_msg.lower():
                skipped += 1
                error_details.append({
                    "row": row_num,
                    "usn": _get_row_value(row, header_map, "USN"),
                    "error": f"Duplicate: {error_msg}",
                })
            else:
                errors += 1
                error_details.append({
                    "row": row_num,
                    "usn": _get_row_value(row, header_map, "USN"),
                    "error": error_msg,
                })
        except Exception as e:
            db.rollback()
            pending_commits = 0
            errors += 1
            error_details.append({
                "row": row_num,
                "usn": _get_row_value(row, header_map, "USN"),
                "error": str(e),
            })

    if pending_commits > 0:
        db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "batch_id": batch_id,
        "error_details": error_details,
    }


def reset_csv_imports(db: Session) -> dict:
    """
    Remove all students imported via CSV and clean up related data
    (teams, allocations, specializations).
    """
    csv_students = db.query(Student).filter(Student.import_source == "csv").all()
    if not csv_students:
        return {"deleted_students": 0, "deleted_teams": 0, "message": "No CSV-imported students found"}

    csv_student_ids = {s.id for s in csv_students}
    deleted_teams = 0

    # Remove allocations for teams containing CSV students
    team_ids = {s.team_id for s in csv_students if s.team_id}
    if team_ids:
        db.query(Allocation).filter(Allocation.team_id.in_(team_ids)).delete(synchronize_session="fetch")

    # Handle teams
    for team_id in list(team_ids):
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            continue

        members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
        member_ids = {m.student_id for m in members}
        all_csv = member_ids.issubset(csv_student_ids)

        if all_csv:
            db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
            for sid in member_ids:
                s = db.query(Student).filter(Student.id == sid).first()
                if s:
                    s.team_id = None
            db.delete(team)
            deleted_teams += 1
        else:
            for sid in member_ids & csv_student_ids:
                db.query(TeamMember).filter(
                    TeamMember.team_id == team_id,
                    TeamMember.student_id == sid,
                ).delete()
                s = db.query(Student).filter(Student.id == sid).first()
                if s:
                    s.team_id = None
            remaining = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
            if remaining < 4 and team.status != TeamStatus.FROZEN:
                team.status = TeamStatus.OPEN
            if team.leader_id in csv_student_ids:
                new_leader = db.query(TeamMember).filter(TeamMember.team_id == team_id).first()
                if new_leader:
                    team.leader_id = new_leader.student_id

    # Delete CSV students and their user accounts
    deleted_students = 0
    for student in csv_students:
        db.query(StudentSpecialization).filter(
            StudentSpecialization.student_id == student.id
        ).delete()
        user = db.query(User).filter(User.id == student.user_id).first()
        db.delete(student)
        if user:
            db.delete(user)
        deleted_students += 1

    db.commit()

    return {
        "deleted_students": deleted_students,
        "deleted_teams": deleted_teams,
        "message": f"Removed {deleted_students} CSV-imported students and {deleted_teams} teams",
    }


def get_csv_import_stats(db: Session) -> dict:
    """Return statistics about CSV-imported students."""
    count = db.query(Student).filter(Student.import_source == "csv").count()
    batches = db.query(Student.import_batch_id).filter(
        Student.import_source == "csv",
        Student.import_batch_id.isnot(None),
    ).distinct().all()
    return {
        "csv_student_count": count,
        "import_batches": [b[0] for b in batches if b[0]],
    }
