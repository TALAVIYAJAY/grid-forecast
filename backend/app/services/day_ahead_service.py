"""
Day-Ahead Power Trading & Forecast Alignment Service
Implements the exact Day-Ahead decision cutoff logic used by UK power trading desks:
Given a target Delivery Date D (e.g. 2026-01-15) and Gate Closure Cutoff (e.g. 11:00 GMT on D-1):
Pulls the latest available forecast published before that cutoff and aligns it with actuals.
"""

import sqlite3
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
try:
    from app.config import settings
    from app.services.metrics_engine import calculate_metrics, DailyMetrics
except ModuleNotFoundError:
    from backend.app.config import settings
    from backend.app.services.metrics_engine import calculate_metrics, DailyMetrics

logger = logging.getLogger(__name__)

def get_db_connection(db_path: str = settings.db_path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_available_dates(db_path: str = settings.db_path) -> List[str]:
    """Return all distinct settlement dates present in actual_generation."""
    conn = get_db_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT settlement_date 
        FROM actual_generation 
        WHERE settlement_date LIKE '2026-01-%' 
        ORDER BY settlement_date ASC
    """)
    rows = cur.fetchall()
    conn.close()
    return [r["settlement_date"] for r in rows]

def get_day_ahead_evaluation(
    delivery_date_str: str,
    gate_closure_hour: int = settings.default_gate_closure_hour,
    custom_cutoff_iso: Optional[str] = None,
    db_path: str = settings.db_path
) -> DailyMetrics:
    """
    Retrieve and evaluate the Day-Ahead wind forecast against actuals for a delivery date.
    
    Cutoff calculation:
    By default in the UK Day-Ahead wholesale market (EPEX SPOT / Nord Pool),
    bids must be submitted on D-1 before gate closure (default: 11:00 GMT).
    Any forecast published *after* this cutoff could NOT have been used for the Day-Ahead auction!
    """
    conn = get_db_connection(db_path)
    cur = conn.cursor()
    
    # 1. Determine Cutoff timestamp
    if custom_cutoff_iso and isinstance(custom_cutoff_iso, str):
        cutoff_dt = datetime.fromisoformat(custom_cutoff_iso.replace("Z", "+00:00"))
    else:
        # D-1 at gate_closure_hour:00:00 UTC
        target_date = datetime.strptime(delivery_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        d_minus_1 = target_date - timedelta(days=1)
        cutoff_dt = d_minus_1.replace(hour=gate_closure_hour, minute=0, second=0, microsecond=0)
        
    cutoff_iso = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # 2. Fetch Actuals for delivery_date in a single indexed query
    cur.execute("""
        SELECT settlement_period, start_time, generation 
        FROM actual_generation 
        WHERE settlement_date = ? 
        ORDER BY settlement_period ASC
    """, (delivery_date_str,))
    actual_rows = cur.fetchall()
    actual_map = {r["settlement_period"]: {"start_time": r["start_time"], "generation": r["generation"]} for r in actual_rows}

    # 3. Fetch all latest forecasts published BEFORE cutoff in ONE fast window-function query
    day_start = f"{delivery_date_str}T00:00:00Z"
    day_end = f"{delivery_date_str}T23:30:00Z"
    
    cur.execute("""
        SELECT start_time, generation, publish_time
        FROM (
            SELECT start_time, generation, publish_time,
                   ROW_NUMBER() OVER (PARTITION BY start_time ORDER BY publish_time DESC) as rn
            FROM forecast_generation
            WHERE publish_time <= ?
              AND start_time >= ? AND start_time <= ?
        ) WHERE rn = 1
    """, (cutoff_iso, day_start, day_end))
    
    fc_rows = cur.fetchall()
    forecast_map = {r["start_time"]: r["generation"] for r in fc_rows}
    conn.close()

    # 4. Align 48 half-hour settlement periods
    aligned_records = []
    target_dt = datetime.strptime(delivery_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)

    for sp in range(1, 49):
        sp_start_minutes = (sp - 1) * 30
        sp_time = target_dt + timedelta(minutes=sp_start_minutes)
        sp_iso = sp_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Hour start (since Elexon WINDFOR forecasts are published at hourly resolution)
        hour_start_iso = sp_time.replace(minute=0, second=0).strftime("%Y-%m-%dT%H:%M:%SZ")
        
        act_info = actual_map.get(sp)
        actual_mw = act_info["generation"] if act_info else None
        actual_start_time = act_info["start_time"] if act_info else sp_iso
        
        # Match exact start_time or hour_start
        forecast_mw = forecast_map.get(actual_start_time)
        if forecast_mw is None:
            forecast_mw = forecast_map.get(sp_iso)
        if forecast_mw is None:
            forecast_mw = forecast_map.get(hour_start_iso)
            
        aligned_records.append({
            "settlement_period": sp,
            "start_time": actual_start_time,
            "actual_mw": actual_mw,
            "forecast_mw": forecast_mw
        })
        
    metrics = calculate_metrics(aligned_records, delivery_date_str, gate_closure_hour)
    return metrics

def get_monthly_summary(
    gate_closure_hour: int = settings.default_gate_closure_hour,
    db_path: str = settings.db_path
) -> Dict[str, Any]:
    """Compute aggregate monthly accuracy statistics across all available January days."""
    dates = get_available_dates(db_path)
    if not dates:
        return {"dates_evaluated": 0, "monthly_mae_mw": 0, "monthly_rmse_mw": 0, "monthly_wmape_pct": 0, "daily_breakdown": []}
        
    daily_stats = []
    total_valid_periods = 0
    total_abs_error = 0.0
    total_sq_error = 0.0
    total_actual_vol = 0.0
    
    for d in dates:
        m = get_day_ahead_evaluation(d, gate_closure_hour=gate_closure_hour, db_path=db_path)
        daily_stats.append({
            "date": d,
            "mae_mw": m.mae_mw,
            "rmse_mw": m.rmse_mw,
            "wmape_pct": m.wmape_pct,
            "mean_bias_mw": m.mean_bias_mw,
            "total_actual_mwh": m.total_actual_mwh,
            "total_forecast_mwh": m.total_forecast_mwh,
            "bias_direction": m.bias_direction
        })
        for p in m.periods:
            if p.actual_mw is not None and p.forecast_mw is not None:
                err = p.forecast_mw - p.actual_mw
                total_valid_periods += 1
                total_abs_error += abs(err)
                total_sq_error += err ** 2
                total_actual_vol += p.actual_mw
                
    monthly_mae = (total_abs_error / total_valid_periods) if total_valid_periods > 0 else 0.0
    monthly_rmse = (total_sq_error / total_valid_periods) ** 0.5 if total_valid_periods > 0 else 0.0
    monthly_wmape = (total_abs_error / total_actual_vol * 100.0) if total_actual_vol > 0 else 0.0

    return {
        "dates_evaluated": len(dates),
        "total_settlement_periods": total_valid_periods,
        "monthly_mae_mw": round(monthly_mae, 2),
        "monthly_rmse_mw": round(monthly_rmse, 2),
        "monthly_wmape_pct": round(monthly_wmape, 2),
        "daily_breakdown": daily_stats
    }
