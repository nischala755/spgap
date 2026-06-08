"""Guide management API routes (teacher only)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.guide import Guide, GuideDomain, Designation
from app.models.allocation import Allocation
from app.middleware.auth import require_teacher
from app.schemas.guide import GuideCreate, GuideUpdate
from app.utils.audit import log_action

router = APIRouter(prefix="/api/guides", tags=["Guides"])


def _guide_to_response(guide: Guide, db: Session) -> dict:
    domains = db.query(GuideDomain).filter(GuideDomain.guide_id == guide.id).all()
    load = db.query(Allocation).filter(Allocation.guide_id == guide.id).count()
    return {
        "id": guide.id,
        "name": guide.name,
        "employee_id": guide.employee_id,
        "designation": guide.designation.value if hasattr(guide.designation, 'value') else guide.designation,
        "domains": [d.domain for d in domains],
        "max_capacity": guide.max_capacity,
        "current_load": load,
        "available_slots": guide.max_capacity - load,
        "created_at": guide.created_at,
    }


@router.get("")
def list_guides(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """List all guides."""
    query = db.query(Guide)
    if search:
        query = query.filter(Guide.name.ilike(f"%{search}%"))

    total = query.count()
    guides = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "guides": [_guide_to_response(g, db) for g in guides],
        "total": total,
    }


@router.post("")
def create_guide(
    data: GuideCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Create a new guide."""
    existing = db.query(Guide).filter(Guide.employee_id == data.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    guide = Guide(
        name=data.name,
        employee_id=data.employee_id,
        designation=Designation(data.designation),
    )
    db.add(guide)
    db.flush()

    for domain_name in data.domains:
        db.add(GuideDomain(guide_id=guide.id, domain=domain_name))

    db.commit()
    db.refresh(guide)
    log_action(db, current_user.id, "CREATE_GUIDE", "guide", guide.id)
    return _guide_to_response(guide, db)


@router.put("/{guide_id}")
def update_guide(
    guide_id: int,
    data: GuideUpdate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Update guide details."""
    guide = db.query(Guide).filter(Guide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")

    if data.name is not None:
        guide.name = data.name
    if data.designation is not None:
        guide.designation = Designation(data.designation)

    if data.domains is not None:
        db.query(GuideDomain).filter(GuideDomain.guide_id == guide.id).delete()
        for domain_name in data.domains:
            db.add(GuideDomain(guide_id=guide.id, domain=domain_name))

    db.commit()
    db.refresh(guide)
    log_action(db, current_user.id, "UPDATE_GUIDE", "guide", guide.id)
    return _guide_to_response(guide, db)


@router.delete("/{guide_id}")
def delete_guide(
    guide_id: int,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Delete a guide."""
    guide = db.query(Guide).filter(Guide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")

    # Check if guide has allocations
    alloc_count = db.query(Allocation).filter(Allocation.guide_id == guide.id).count()
    if alloc_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete guide with active allocations")

    db.delete(guide)
    db.commit()
    log_action(db, current_user.id, "DELETE_GUIDE", "guide", guide_id)
    return {"message": "Guide deleted"}
