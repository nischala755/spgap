"""Reports and analytics API routes."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.models.user import User
from app.middleware.auth import require_teacher
from app.services.report_service import (
    get_overview_stats,
    get_workload_distribution,
    get_domain_distribution,
    get_team_distribution,
    export_allocations_csv,
    export_teams_csv,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/overview")
def overview(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Get aggregate overview stats."""
    return get_overview_stats(db)


@router.get("/workload")
def workload(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Get guide workload distribution."""
    return get_workload_distribution(db)


@router.get("/domains")
def domains(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Get domain distribution data."""
    return get_domain_distribution(db)


@router.get("/teams")
def teams(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Get team distribution data."""
    return get_team_distribution(db)


@router.get("/export")
def export_csv(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Export all allocations as a downloadable CSV."""
    csv_content = export_allocations_csv(db)
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=allocations_export.csv"},
    )


@router.get("/export-teams")
def export_teams(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Export all teams as a downloadable CSV."""
    csv_content = export_teams_csv(db)
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=teams_export.csv"},
    )


@router.get("/fix-email")
def fix_email(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    from sqlalchemy import text
    try:
        # Check if 094 exists
        user_094 = db.execute(text("SELECT id FROM users WHERE email = '23aiml094@bnmit.in'")).fetchone()
        user_096 = db.execute(text("SELECT id FROM users WHERE email = '23aiml096@bnmit.in'")).fetchone()
        
        if user_094:
            return {"status": "error", "detail": "094 already exists!", "id": user_094[0]}
            
        if not user_096:
            return {"status": "error", "detail": "096 does not exist!"}
            
        # Do the update
        db.execute(text("UPDATE users SET email = '23aiml094@bnmit.in' WHERE email = '23aiml096@bnmit.in'"))
        db.commit()
        return {"status": "success", "detail": "Updated 096 to 094"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "detail": str(e)}
