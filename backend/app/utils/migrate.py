"""Lightweight SQLite migrations for schema additions."""

from sqlalchemy import inspect, text
from app.database import engine


def run_migrations():
    """Add any missing columns to existing SQLite tables."""
    inspector = inspect(engine)

    if "students" in inspector.get_table_names():
        existing = {col["name"] for col in inspector.get_columns("students")}
        additions = {
            "contact_number": "VARCHAR(20)",
            "domain_description": "TEXT",
            "import_source": "VARCHAR(20) DEFAULT 'manual'",
            "import_batch_id": "VARCHAR(50)",
        }
        with engine.begin() as conn:
            for col_name, col_type in additions.items():
                if col_name not in existing:
                    conn.execute(text(f"ALTER TABLE students ADD COLUMN {col_name} {col_type}"))

    if "projects" in inspector.get_table_names():
        existing_proj = {col["name"] for col in inspector.get_columns("projects")}
        with engine.begin() as conn:
            if "mapped_sdg" not in existing_proj:
                conn.execute(text("ALTER TABLE projects ADD COLUMN mapped_sdg TEXT"))
                # Also delete the existing project as requested by the user
                conn.execute(text("DELETE FROM allocations"))
                conn.execute(text("DELETE FROM projects"))
