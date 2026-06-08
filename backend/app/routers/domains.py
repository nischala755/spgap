"""Domain catalog API — exposes seeded domains for dropdowns."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Domain, Specialization
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/domains", tags=["Domains"])


@router.get("")
def list_domains(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all available domains and their specializations."""
    domains = db.query(Domain).order_by(Domain.name).all()
    result = []
    for d in domains:
        specs = db.query(Specialization).filter(Specialization.domain_id == d.id).all()
        result.append({
            "id": d.id,
            "name": d.name,
            "specializations": [s.name for s in specs],
        })
    return {"domains": result}
