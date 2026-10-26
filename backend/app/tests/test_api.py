"""
API Endpoint Integration Tests for GridForecast
Directly tests route logic and data integrity.
"""

import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

try:
    import pytest
except ImportError:
    pytest = None

try:
    from backend.app.api.routes import (
        get_health,
        get_dates,
        evaluate_day,
        get_monthly_stats,
        get_raw_data,
        export_csv
    )
except ModuleNotFoundError:
    from app.api.routes import (
        get_health,
        get_dates,
        evaluate_day,
        get_monthly_stats,
        get_raw_data,
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

def test_raw_data_logic():
    data = get_raw_data("2026-01-15", dataset="ALL", gate_closure_hour=11)
    assert data["delivery_date"] == "2026-01-15"
    assert data["fuelhh"] is not None
    assert data["fuelhh"]["count"] == 48
    assert data["windfor"] is not None
    assert data["windfor"]["total_stream_updates"] > 100
    assert data["windfor"]["selected_day_ahead_count"] == 24

if __name__ == "__main__":
    import time
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    start_time = time.time()
    
    print("\n" + "=" * 74)
    print("  GRIDFORECAST: Automated Integration & Data Integrity Test Suite")
    print("=" * 74)
    
    # 1. Health check & records assertion
    t0 = time.time()
    data_health = get_health()
    assert data_health["status"] == "HEALTHY"
    assert data_health["actual_wind_records"] > 1400
    assert data_health["forecast_records"] > 15000
    ms = (time.time() - t0) * 1000
    print(f"  [PASS] test_health_endpoint ............. OK  ({ms:5.1f}ms)")
    print(f"         + Database Status: HEALTHY | {data_health['actual_wind_records']:,} Actuals | {data_health['forecast_records']:,} Forecasts")

    # 2. January dates assertion
    t0 = time.time()
    data_dates = get_dates()
    assert data_dates["count"] == 31
    assert "2026-01-01" in data_dates["dates"]
    assert "2026-01-31" in data_dates["dates"]
    ms = (time.time() - t0) * 1000
    print(f"  [PASS] test_january_delivery_dates ...... OK  ({ms:5.1f}ms)")
    print(f"         + Date Range: 2026-01-01 to 2026-01-31 (31 Distinct Delivery Days)")

    # 3. Day-Ahead Gate Closure Alignment (11:00 GMT)
    t0 = time.time()
    m = evaluate_day("2026-01-15", gate_closure_hour=11)
    assert m.date == "2026-01-15"
    assert len(m.periods) == 48
    assert m.mae_mw > 0
    ms = (time.time() - t0) * 1000
    print(f"  [PASS] test_day_ahead_evaluation ........ OK  ({ms:5.1f}ms)")
    print(f"         + 2026-01-15 Aligned: 48/48 Periods (MAE: {m.mae_mw:,.1f} MW | wMAPE: {m.wmape_pct:.2f}%)")

    # 4. Monthly Macro Benchmark Aggregate
    t0 = time.time()
    m_summary = get_monthly_stats(gate_closure_hour=11)
    assert m_summary["dates_evaluated"] == 31
    assert len(m_summary["daily_breakdown"]) == 31
    ms = (time.time() - t0) * 1000
    print(f"  [PASS] test_monthly_summary_engine ...... OK  ({ms:5.1f}ms)")
    print(f"         + Month Aggregate: 31 Days Evaluated (Monthly wMAPE: {m_summary['monthly_wmape_pct']:.2f}%)")

    # 5. Raw Grid Telemetry Stream & Cutoff Audit
    t0 = time.time()
    raw = get_raw_data("2026-01-15", dataset="ALL", gate_closure_hour=11)
    assert raw["fuelhh"]["count"] == 48
    assert raw["windfor"]["selected_day_ahead_count"] == 24
    ms = (time.time() - t0) * 1000
    print(f"  [PASS] test_raw_grid_stream_explorer .... OK  ({ms:5.1f}ms)")
    print(f"         + Stream Telemetry: 48 FUELHH actuals | {raw['windfor']['total_stream_updates']} WINDFOR rolling updates")

    # 6. CSV Export Stream
    t0 = time.time()
    test_csv_export_logic()
    ms = (time.time() - t0) * 1000
    print(f"  [PASS] test_csv_export_streaming ........ OK  ({ms:5.1f}ms)")
    print(f"         + CSV Data Stream: 49 lines verified (Header + 48 Settlement Periods)")

    elapsed = time.time() - start_time
    print("=" * 74)
    print(f"  RESULTS: ALL 6 INTEGRATION TESTS PASSED in {elapsed:.2f}s (100% Success Rate)")
    print("=" * 74 + "\n")
