"""
GridForecast Master Backend Application
FastAPI REST API serving UK wind day-ahead forecast analytics,
quantitative accuracy metrics, and AI trading guidance.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from backend.app.config import settings
from backend.app.api.routes import router

app = FastAPI(
    title=settings.app_name,
    description=(
        "Renewable Wind Generation Day-Ahead Forecast & Quantitative Error Analytics Platform. "
        "Evaluates Elexon BMRS day-ahead wind forecasts against actual delivered generation for January 2026."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup for development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(router)

# Optional: Mount frontend build if directory exists
dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_dir.exists() and dist_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
