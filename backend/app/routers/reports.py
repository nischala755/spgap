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
