"""Allocation engine API routes — run, freeze, reset, list."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.allocation import Allocation
from app.middleware.auth import require_teacher, get_current_user
from app.schemas.allocation import AllocationRunRequest, AllocationResponse
from app.services.allocation_engine import AllocationEngine
from app.utils.audit import log_action

router = APIRouter(prefix="/api/allocations", tags=["Allocations"])


@router.post("/run")
def run_allocation(
    data: AllocationRunRequest,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Run the smart allocation engine."""
    engine = AllocationEngine(db)
    try:
        result = engine.run(mode="smart")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allocation failed: {str(e)}")

    log_action(db, current_user.id, "RUN_ALLOCATION", "allocation", None, result)

    # Get full allocation list for response
    allocations = db.query(Allocation).filter(Allocation.is_frozen == False).all()
    alloc_list = []
    for a in allocations:
        alloc_list.append({
            "id": a.id,
            "team_id": a.team_id,
            "team_name": a.team.name if a.team else None,
            "project_id": a.project_id,
            "project_title": a.project.title if a.project else None,
            "guide_id": a.guide_id,
            "guide_name": a.guide.name if a.guide else None,
            "mode": a.mode.value if hasattr(a.mode, 'value') else a.mode,
            "score": a.score,
            "reasoning": a.reasoning,
            "is_frozen": a.is_frozen,
            "allocated_at": a.allocated_at,
        })

    result["allocations"] = alloc_list
    return result


@router.post("/freeze")
def freeze_allocations(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Freeze all current allocations."""
    count = AllocationEngine.freeze_allocations(db)
    log_action(db, current_user.id, "FREEZE_ALLOCATIONS", "allocation", None, {"count": count})
    return {"message": f"Frozen {count} allocations", "frozen_count": count}


@router.post("/reset")
def reset_allocations(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Reset (unfreeze and clear) all allocations."""
    count = AllocationEngine.reset_allocations(db)
    log_action(db, current_user.id, "RESET_ALLOCATIONS", "allocation", None, {"count": count})
    return {"message": f"Reset {count} allocations", "reset_count": count}


@router.get("")
def list_allocations(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """List all allocations."""
    allocations = db.query(Allocation).all()
    alloc_list = []
    for a in allocations:
        alloc_list.append({
            "id": a.id,
            "team_id": a.team_id,
            "team_name": a.team.name if a.team else None,
            "project_id": a.project_id,
            "project_title": a.project.title if a.project else None,
            "guide_id": a.guide_id,
            "guide_name": a.guide.name if a.guide else None,
            "mode": a.mode.value if hasattr(a.mode, 'value') else a.mode,
            "score": a.score,
            "reasoning": a.reasoning,
            "is_frozen": a.is_frozen,
            "allocated_at": a.allocated_at,
        })

    return {"allocations": alloc_list, "total": len(alloc_list)}
