"""
FastAPI Routes for GridForecast
Endpoints:
- /api/health: System health and dataset record counts
- /api/dates: Available January 2026 delivery dates
- /api/evaluation: Single-day Day-Ahead forecast evaluation & metrics
- /api/copilot: AI Trading Advisory memo (Gemini / rule-based)
- /api/monthly-summary: Aggregate monthly accuracy analytics
- /api/export-csv: Downloadable CSV of 48 settlement periods
"""

import io
import csv
import sqlite3
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response

from backend.app.config import settings
from backend.app.services.day_ahead_service import (
    get_available_dates,
    get_day_ahead_evaluation,
    get_monthly_summary
)
from backend.app.services.ai_copilot import (
    generate_gemini_advisory,
    PRIMARY_MODEL,
    BACKUP_MODEL
)

router = APIRouter(prefix="/api", tags=["Day-Ahead Forecast Analytics"])

@router.get("/health")
def get_health():
    """Health check endpoint showing dataset status."""
    try:
        conn = sqlite3.connect(settings.db_path)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM actual_generation")
        actual_cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM forecast_generation")
        forecast_cnt = cur.fetchone()[0]
        conn.close()
        return {
            "status": "HEALTHY",
            "app": settings.app_name,
            "version": settings.app_version,
            "db_path": settings.db_path,
            "actual_wind_records": actual_cnt,
            "forecast_records": forecast_cnt,
            "ai_primary_model": PRIMARY_MODEL,
            "ai_backup_model": BACKUP_MODEL,
            "has_gemini_key": bool(settings.gemini_api_key)
        }
    except Exception as e:
        return {
            "status": "DEGRADED",
            "error": str(e),
            "db_path": settings.db_path
        }

@router.get("/dates")
def get_dates():
    """Get all delivery dates available in January 2026."""
    dates = get_available_dates(settings.db_path)
    return {
        "count": len(dates),
        "dates": dates,
        "default_date": dates[14] if len(dates) > 14 else (dates[0] if dates else "2026-01-15")
    }

@router.get("/evaluation")
def evaluate_day(
    date: str,
    gate_closure_hour: int = settings.default_gate_closure_hour,
    cutoff_iso: Optional[str] = None
):
    """
    Get the Day-Ahead forecast evaluation for a delivery date.
    Aligns forecasts published before D-1 gate closure against actual wind generation.
    Computes MAE, RMSE, wMAPE, Mean Bias, and 48 half-hour settlement periods.
    """
    try:
        metrics = get_day_ahead_evaluation(
            delivery_date_str=date,
            gate_closure_hour=gate_closure_hour,
            custom_cutoff_iso=cutoff_iso,
            db_path=settings.db_path
        )
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate date {date}: {str(e)}")

@router.get("/copilot")
async def get_copilot_advisory(
    date: str = Query(..., description="Delivery date e.g. 2026-01-15"),
    gate_closure_hour: int = Query(settings.default_gate_closure_hour, ge=0, le=23)
):
    """
    Get AI Trading Copilot memo for a delivery date.
    Powered by Gemini (or fallback rules engine).
    """
    try:
        metrics = get_day_ahead_evaluation(
            delivery_date_str=date,
            gate_closure_hour=gate_closure_hour,
            db_path=settings.db_path
        )
        advisory = await generate_gemini_advisory(metrics)
        return advisory
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot generation failed: {str(e)}")

@router.get("/monthly-summary")
def get_monthly_stats(
    gate_closure_hour: int = Query(settings.default_gate_closure_hour, ge=0, le=23)
):
    """Get aggregate error metrics across the entire month of January 2026."""
    try:
        return get_monthly_summary(gate_closure_hour=gate_closure_hour, db_path=settings.db_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate monthly summary: {str(e)}")

@router.get("/export-csv")
def export_csv(
    date: str = Query(..., description="Delivery date e.g. 2026-01-15"),
    gate_closure_hour: int = Query(settings.default_gate_closure_hour, ge=0, le=23)
):
    """Stream CSV file of all 48 settlement periods with actuals, forecasts, and errors."""
    try:
        metrics = get_day_ahead_evaluation(
            delivery_date_str=date,
            gate_closure_hour=gate_closure_hour,
            db_path=settings.db_path
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Settlement Period", 
            "Target Start Time (UTC)", 
            "Actual Wind Generation (MW)", 
            "Day-Ahead Forecast (MW)", 
            "Forecast Error (MW)", 
            "Absolute Error (MW)", 
            "Error (%)", 
            "Under-Forecasting Flag"
        ])
        for p in metrics.periods:
            writer.writerow([
                p.settlement_period,
                p.start_time,
                p.actual_mw if p.actual_mw is not None else "N/A",
                p.forecast_mw if p.forecast_mw is not None else "N/A",
                p.error_mw if p.error_mw is not None else "N/A",
                p.abs_error_mw if p.abs_error_mw is not None else "N/A",
                f"{p.pct_error:.2f}%" if p.pct_error is not None else "N/A",
                "YES" if p.is_under_forecast else "NO"
            ])
        output.seek(0)
        filename = f"grid_forecast_{date}_cutoff_{gate_closure_hour}h.csv"
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV export failed: {str(e)}")
