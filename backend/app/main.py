"""
Vanguard City — FastAPI Backend
Phase 3: REST API layer (connects to PostgreSQL/PostGIS in Phase 4)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys

from dotenv import load_dotenv

# Ensure backend root and project root are in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
project_root = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load .env file from backend or root
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

from app.api import (
    wards, roads, infrastructure, complaints,
    water, detections, construction, predictions,
    dashboard, ai_routes, alerts, gis_routes, environment, geocoding, auth
)

app = FastAPI(
    title="Vanguard City API",
    description="AI-driven Urban Digital Twin — Municipal Intelligence Platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — restrict in production (Phase 19)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(wards.router, prefix="/api/wards", tags=["Wards"])
app.include_router(roads.router, prefix="/api/roads", tags=["Roads"])
app.include_router(infrastructure.router, prefix="/api/infrastructure", tags=["Infrastructure"])
app.include_router(complaints.router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(water.router, prefix="/api/water", tags=["Water"])
app.include_router(detections.router, prefix="/api/detections", tags=["Detections"])
app.include_router(construction.router, prefix="/api/construction", tags=["Construction"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["AI"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(gis_routes.router, prefix="/api/gis", tags=["GIS & OpenStreetMap"])
app.include_router(environment.router, prefix="/api/environment", tags=["Environment & Earth Observation"])
app.include_router(geocoding.router, prefix="/api/geocoding", tags=["Geocoding"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Vanguard City API",
        "version": "0.1.0",
        "note": "Phase 2 — returning mock data. DB integration in Phase 4.",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Vanguard City API",
        "docs": "/api/docs",
        "health": "/api/health",
    }
