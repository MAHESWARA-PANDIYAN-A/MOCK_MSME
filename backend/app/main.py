import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.services.seed_service import seed_database
from app.routers import (
    auth_router, verification_router, applications_router,
    officer_router, admin_router, integrations_router, public_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Run seed
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="SIMULATED UDYAM INTEGRATION API — SIH26130 Prototype",
    description=(
        "Simulated Udyam MSME Registration and Interoperability Service for SIH26130. "
        "NOTICE: This is a prototype simulation environment for testing and demonstration. "
        "It does not connect to or represent official Government of India portals or UIDAI/GSTN services."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for generated artifacts (QR codes, PDFs)
if os.path.exists(settings.CERTIFICATE_OUTPUT_DIR):
    app.mount("/generated", StaticFiles(directory=settings.CERTIFICATE_OUTPUT_DIR), name="generated")

# Routers
app.include_router(auth_router, prefix="/api")
app.include_router(verification_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(officer_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(integrations_router, prefix="/api")
app.include_router(public_router, prefix="/api")

@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return {
        "status": "ok",
        "service": "mock-udyam-portal",
        "database": db_status
    }

from fastapi.responses import FileResponse

# Path to frontend build directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
FRONTEND_ASSETS = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(FRONTEND_ASSETS):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS), name="frontend-assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend_spa(full_path: str):
    # Allow API, docs, OpenAPI, generated files to be handled by FastAPI routers
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json") or full_path.startswith("generated"):
        return {"detail": "Not Found"}
        
    target_file = os.path.join(FRONTEND_DIST, full_path)
    if os.path.isfile(target_file):
        return FileResponse(target_file)
        
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return {
        "portal": "Udyam MSME Registration Portal (Prototype)",
        "badge": "SIH26130 Prototype — Simulated Udyam Workflow",
        "documentation": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
