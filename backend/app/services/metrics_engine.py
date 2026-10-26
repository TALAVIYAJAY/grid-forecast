"""
Quantitative Evaluation & Metrics Engine for Wind Generation Forecasts
Calculates standard power market metrics:
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- MAPE (Mean Absolute Percentage Error)
- wMAPE (Weighted Mean Absolute Percentage Error)
- Bias (Mean Error: Over vs Under Forecasting)
- Peak Discrepancies & Hourly Error Distribution
"""

import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SettlementPeriodData(BaseModel):
    settlement_period: int
    start_time: str
    actual_mw: Optional[float]
    forecast_mw: Optional[float]
    error_mw: Optional[float]       # forecast - actual
    abs_error_mw: Optional[float]   # |forecast - actual|
    pct_error: Optional[float]      # |forecast - actual| / actual * 100
    is_under_forecast: Optional[bool] # true if forecast < actual

class DailyMetrics(BaseModel):
    date: str
    gate_closure_hour: int
    total_settlement_periods: int
    valid_periods: int
    mae_mw: float
    rmse_mw: float
    mape_pct: float
    wmape_pct: float
    mean_bias_mw: float
    max_under_forecast_mw: float
    max_over_forecast_mw: float
    total_actual_mwh: float
    total_forecast_mwh: float
    bias_direction: str # "OVER_FORECASTING" | "UNDER_FORECASTING" | "BALANCED"
    periods: List[SettlementPeriodData]

def calculate_metrics(
    records: List[Dict[str, Any]], 
    date_str: str, 
    gate_closure_hour: int
) -> DailyMetrics:
    """
    Calculate comprehensive forecast accuracy metrics from aligned actual vs forecast records.
    Each record must have:
      - 'settlement_period': int (1-48)
      - 'start_time': str
      - 'actual_mw': float or None
      - 'forecast_mw': float or None
    """
    periods_data: List[SettlementPeriodData] = []
    
    valid_errors = []
    valid_squared_errors = []
    valid_abs_errors = []
    valid_pct_errors = []
    
    sum_actual = 0.0
    sum_forecast = 0.0
    sum_abs_error = 0.0
    
    max_under_forecast = 0.0 # actual > forecast
    max_over_forecast = 0.0  # forecast > actual
    
    for r in records:
        sp = r.get("settlement_period")
        st = r.get("start_time")
        act = r.get("actual_mw")
        fc = r.get("forecast_mw")
        
        if act is not None and fc is not None:
            err = fc - act # Positive = over-forecast, Negative = under-forecast
            abs_err = abs(err)
            
            valid_errors.append(err)
            valid_squared_errors.append(err ** 2)
            valid_abs_errors.append(abs_err)
            
            sum_actual += act
            sum_forecast += fc
            sum_abs_error += abs_err
            
            # Avoid division by zero for MAPE
            if act > 5.0:
                pct = (abs_err / act) * 100.0
                valid_pct_errors.append(pct)
            else:
                pct = None
                
            is_under = fc < act
            if is_under:
                under_val = act - fc
                if under_val > max_under_forecast:
                    max_under_forecast = under_val
            else:
                over_val = fc - act
                if over_val > max_over_forecast:
                    max_over_forecast = over_val
                    
            periods_data.append(SettlementPeriodData(
                settlement_period=sp,
                start_time=st,
                actual_mw=round(act, 2),
                forecast_mw=round(fc, 2),
                error_mw=round(err, 2),
                abs_error_mw=round(abs_err, 2),
                pct_error=round(pct, 2) if pct is not None else None,
                is_under_forecast=is_under
            ))
        else:
            periods_data.append(SettlementPeriodData(
                settlement_period=sp,
                start_time=st,
                actual_mw=round(act, 2) if act is not None else None,
                forecast_mw=round(fc, 2) if fc is not None else None,
                error_mw=None,
                abs_error_mw=None,
                pct_error=None,
                is_under_forecast=None
            ))
            
    n = len(valid_errors)
    if n > 0:
        mae = sum(valid_abs_errors) / n
        rmse = math.sqrt(sum(valid_squared_errors) / n)
        mape = (sum(valid_pct_errors) / len(valid_pct_errors)) if valid_pct_errors else 0.0
        wmape = (sum_abs_error / sum_actual * 100.0) if sum_actual > 0 else 0.0
        mean_bias = sum(valid_errors) / n
    else:
        mae = 0.0
        rmse = 0.0
        mape = 0.0
        wmape = 0.0
        mean_bias = 0.0
        
    if mean_bias > 50.0:
        bias_dir = "OVER_FORECASTING"
    elif mean_bias < -50.0:
        bias_dir = "UNDER_FORECASTING"
    else:
        bias_dir = "BALANCED"
        
    # In UK electricity market, each settlement period is 30 mins (0.5 hour).
    # Energy in MWh = Generation in MW * 0.5 h.
    total_act_mwh = sum_actual * 0.5
    total_fc_mwh = sum_forecast * 0.5

    return DailyMetrics(
        date=date_str,
        gate_closure_hour=gate_closure_hour,
        total_settlement_periods=len(records),
        valid_periods=n,
        mae_mw=round(mae, 2),
        rmse_mw=round(rmse, 2),
        mape_pct=round(mape, 2),
        wmape_pct=round(wmape, 2),
        mean_bias_mw=round(mean_bias, 2),
        max_under_forecast_mw=round(max_under_forecast, 2),
        max_over_forecast_mw=round(max_over_forecast, 2),
        total_actual_mwh=round(total_act_mwh, 2),
        total_forecast_mwh=round(total_fc_mwh, 2),
        bias_direction=bias_dir,
        periods=periods_data
    )
