"""
API Endpoint Integration Tests for GridForecast
Directly tests route logic and data integrity.
"""

import pytest
from backend.app.api.routes import (
    get_health,
    get_dates,
    evaluate_day,
    get_monthly_stats,
    export_csv
)

def test_health_logic():
    data = get_health()
    assert data["status"] == "HEALTHY"
    assert data["actual_wind_records"] > 1400
    assert data["forecast_records"] > 15000

def test_get_dates_logic():
    data = get_dates()
    assert data["count"] == 31
    assert "2026-01-01" in data["dates"]
    assert "2026-01-15" in data["dates"]
    assert "2026-01-31" in data["dates"]

def test_evaluation_logic():
    m = evaluate_day("2026-01-15", gate_closure_hour=11)
    assert m.date == "2026-01-15"
    assert m.gate_closure_hour == 11
    assert m.total_settlement_periods == 48
    assert m.mae_mw > 0
    assert m.rmse_mw > 0
    assert len(m.periods) == 48
    # Period 1 should have valid data
    p1 = m.periods[0]
    assert p1.settlement_period == 1
    assert p1.actual_mw is not None
    assert p1.forecast_mw is not None

def test_monthly_summary_logic():
    data = get_monthly_stats(gate_closure_hour=11)
    assert data["dates_evaluated"] == 31
    assert data["monthly_mae_mw"] > 0
    assert data["monthly_wmape_pct"] > 0
    assert len(data["daily_breakdown"]) == 31

def test_csv_export_logic():
    response = export_csv("2026-01-15", gate_closure_hour=11)
    content = response.body.decode("utf-8") if isinstance(response.body, bytes) else response.body
    lines = content.strip().split("\r\n") if "\r\n" in content else content.strip().split("\n")
    assert len(lines) == 49 # Header + 48 settlement periods
    assert "Settlement Period" in lines[0]
