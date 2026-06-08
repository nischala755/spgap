"""
SPGAP — Smart Project & Guide Allocation Platform
FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.models import *  # noqa: F401, F403 — ensures all models are registered
from app.utils.migrate import run_migrations

from app.routers import auth, students, teachers, teams, projects, guides, allocations, csv_upload, reports, domains


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    run_migrations()
    yield


app = FastAPI(
    title="SPGAP — Smart Project & Guide Allocation Platform",
    description="Automates student team formation, project allocation, and guide allocation for college departments.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(teams.router)
app.include_router(projects.router)
app.include_router(guides.router)
app.include_router(allocations.router)
app.include_router(csv_upload.router)
app.include_router(reports.router)
app.include_router(domains.router)


@app.get("/")
def root():
    return {
        "app": "SPGAP — Smart Project & Guide Allocation Platform",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
