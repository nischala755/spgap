"""CSV upload API route."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.middleware.auth import require_teacher
from app.services.csv_service import process_csv_upload, reset_csv_imports, get_csv_import_stats
from app.utils.audit import log_action

router = APIRouter(prefix="/api/csv", tags=["CSV Upload"])


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Upload a CSV file to import student data (supports ~140+ students)."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    result = process_csv_upload(db, content)

    log_action(
        db, current_user.id, "CSV_UPLOAD", "csv", None,
        {
            "filename": file.filename,
            "imported": result["imported"],
            "skipped": result["skipped"],
            "errors": result["errors"],
        },
    )

    return result


@router.get("/stats")
def csv_stats(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Get statistics about CSV-imported students."""
    return get_csv_import_stats(db)


@router.post("/reset")
def reset_csv_data(
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Remove all CSV-imported students and clean up related teams/allocations."""
    result = reset_csv_imports(db)
    log_action(db, current_user.id, "CSV_RESET", "csv", None, result)
    return result
