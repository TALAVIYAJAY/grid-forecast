"""
Unit Tests for GridForecast Metrics & Day-Ahead Alignment Engine
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
    from backend.app.services.metrics_engine import calculate_metrics
except ModuleNotFoundError:
    from app.services.metrics_engine import calculate_metrics

def test_metrics_calculation_perfect_match():
    records = [
        {"settlement_period": 1, "start_time": "2026-01-15T00:00:00Z", "actual_mw": 1000.0, "forecast_mw": 1000.0},
        {"settlement_period": 2, "start_time": "2026-01-15T00:30:00Z", "actual_mw": 1200.0, "forecast_mw": 1200.0},
        {"settlement_period": 3, "start_time": "2026-01-15T01:00:00Z", "actual_mw": 1500.0, "forecast_mw": 1500.0},
    ]
    m = calculate_metrics(records, "2026-01-15", 11)
    assert m.mae_mw == 0.0
    assert m.rmse_mw == 0.0
    assert m.mape_pct == 0.0
    assert m.wmape_pct == 0.0
    assert m.mean_bias_mw == 0.0
    assert m.bias_direction == "BALANCED"
    assert m.total_actual_mwh == (1000 + 1200 + 1500) * 0.5

def test_metrics_over_forecasting():
    # Forecast systematically 200 MW higher than actual
    records = [
        {"settlement_period": 1, "start_time": "2026-01-15T00:00:00Z", "actual_mw": 1000.0, "forecast_mw": 1200.0},
        {"settlement_period": 2, "start_time": "2026-01-15T00:30:00Z", "actual_mw": 2000.0, "forecast_mw": 2200.0},
    ]
    m = calculate_metrics(records, "2026-01-15", 11)
    assert m.mae_mw == 200.0
    assert m.rmse_mw == 200.0
    assert m.mean_bias_mw == 200.0
    assert m.bias_direction == "OVER_FORECASTING"
    assert m.max_over_forecast_mw == 200.0
    assert m.max_under_forecast_mw == 0.0

def test_metrics_under_forecasting():
    # Forecast systematically 300 MW lower than actual
    records = [
        {"settlement_period": 1, "start_time": "2026-01-15T00:00:00Z", "actual_mw": 1500.0, "forecast_mw": 1200.0},
        {"settlement_period": 2, "start_time": "2026-01-15T00:30:00Z", "actual_mw": 2500.0, "forecast_mw": 2200.0},
    ]
    m = calculate_metrics(records, "2026-01-15", 11)
    assert m.mae_mw == 300.0
    assert m.rmse_mw == 300.0
    assert m.mean_bias_mw == -300.0
    assert m.bias_direction == "UNDER_FORECASTING"
    assert m.max_under_forecast_mw == 300.0
    assert m.max_over_forecast_mw == 0.0

def test_wmape_handles_calm_wind():
    # Check that wMAPE handles low wind output without dividing by zero
    records = [
        {"settlement_period": 1, "start_time": "2026-01-15T00:00:00Z", "actual_mw": 0.0, "forecast_mw": 50.0},
        {"settlement_period": 2, "start_time": "2026-01-15T00:30:00Z", "actual_mw": 500.0, "forecast_mw": 550.0},
    ]
    m = calculate_metrics(records, "2026-01-15", 11)
    # Total actual = 500 MW, Total abs error = 50 + 50 = 100 MW
    # wMAPE = 100 / 500 * 100% = 20.0%
    assert m.wmape_pct == 20.0
    assert m.mae_mw == 50.0

if __name__ == "__main__":
    test_metrics_calculation_perfect_match()
    test_metrics_over_forecasting()
    test_metrics_under_forecasting()
    test_wmape_handles_calm_wind()
    print("All metric tests passed successfully!")
