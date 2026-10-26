"""
AI Trading & Dispatch Copilot
Powered by Google Gemini (with deterministic rule-based fallback)
Provides commercial market commentary and Day-Ahead bidding guidance
for energy trading and procurement teams.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from backend.app.config import settings
from backend.app.services.metrics_engine import DailyMetrics

logger = logging.getLogger(__name__)

def generate_local_rule_based_advisory(metrics: DailyMetrics) -> Dict[str, Any]:
    """
    Deterministic rule-based power trading advisory.
    Provides instant, high-quality domain insights even without an external API key.
    """
    date = metrics.date
    mae = metrics.mae_mw
    wmape = metrics.wmape_pct
    bias = metrics.mean_bias_mw
    max_under = metrics.max_under_forecast_mw
    max_over = metrics.max_over_forecast_mw
    
    # Analyze peak risk periods
    risk_periods = []
    for p in metrics.periods:
        if p.abs_error_mw and p.abs_error_mw > mae * 1.5:
            risk_periods.append(f"SP {p.settlement_period} ({p.start_time[11:16]} UTC: {p.error_mw:+.0f} MW)")
            
    risk_summary = ", ".join(risk_periods[:4]) if risk_periods else "Even error distribution across settlement periods."
    
    if bias > 100:
        headline = f"High Over-Forecasting Bias (+{bias:.0f} MW avg) – Day-Ahead Shortfall Risk"
        imbalance_risk = "CRITICAL"
        recommendation = (
            f"The wind forecast systematically over-estimated output throughout {date}. "
            f"If relying entirely on this forecast, the utility would have under-procured day-ahead generation, "
            f"exposing the portfolio to high cash-out imbalance penalties. "
            f"Action: Procure an additional {int(bias * 1.2)} MW of thermal or flexible capacity in the Day-Ahead auction "
            f"as a dynamic hedge, particularly around {risk_summary}."
        )
    elif bias < -100:
        headline = f"Under-Forecasting Bias ({bias:.0f} MW avg) – Thermal Over-Procurement Risk"
        imbalance_risk = "MODERATE"
        recommendation = (
            f"Actual wind generation exceeded day-ahead predictions by an average of {abs(bias):.0f} MW. "
            f"Over-procuring thermal power in the Day-Ahead auction locks in unnecessary fuel and carbon costs. "
            f"Action: Consider shaving conservative safety margins on wind bids and keep bilateral flexible contracts "
            f"in reserve for real-time balancing rather than pre-committing thermal baseload."
        )
    else:
        headline = f"Well-Balanced Day-Ahead Forecast (MAE: {mae:.0f} MW, wMAPE: {wmape:.1f}%)"
        imbalance_risk = "LOW"
        recommendation = (
            f"Wind generation followed predicted trajectory closely with low aggregate bias ({bias:+.0f} MW). "
            f"Standard day-ahead procurement schedule is suitable. "
            f"Monitor localized deviations during {risk_summary}."
        )
        
    return {
        "headline": headline,
        "imbalance_risk": imbalance_risk,
        "wmape_assessment": f"{wmape:.1f}% volume error ({'Excellent' if wmape < 10 else 'Acceptable' if wmape < 25 else 'High Volatility'})",
        "peak_shortfall_risk_mw": max_under,
        "peak_excess_risk_mw": max_over,
        "recommendation": recommendation,
        "provider": "Local Energy Market Rules Engine",
        "model_used": "Deterministic Power Heuristics"
    }

async def generate_gemini_advisory(metrics: DailyMetrics) -> Dict[str, Any]:
    """
    Generate commercial trading commentary using Google Gemini API.
    Falls back gracefully to local rule-based engine if key is not configured or errors occur.
    """
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.info("No GEMINI_API_KEY set; using local energy trading rules engine.")
        return generate_local_rule_based_advisory(metrics)
        
    try:
        client = genai.Client(api_key=api_key)
        
        # Prepare concise data summary for prompt
        sample_periods = [
            {"sp": p.settlement_period, "time": p.start_time[11:16], "act": p.actual_mw, "fc": p.forecast_mw, "err": p.error_mw}
            for p in metrics.periods if p.settlement_period % 4 == 0 or (p.abs_error_mw and p.abs_error_mw > metrics.mae_mw * 1.5)
        ][:12]
        
        prompt = f"""
You are an expert power trader and energy risk analyst specialized in the UK wholesale electricity market (Day-Ahead auction, Elexon BMRS, and Balancing Mechanism).
Review this Day-Ahead Wind Generation forecast evaluation for Delivery Date {metrics.date}:

SUMMARY METRICS:
- Date: {metrics.date}
- Gate Closure Cutoff: {metrics.gate_closure_hour}:00 GMT on D-1
- MAE: {metrics.mae_mw} MW
- RMSE: {metrics.rmse_mw} MW
- wMAPE: {metrics.wmape_pct}%
- Mean Bias: {metrics.mean_bias_mw:+.1f} MW ({metrics.bias_direction})
- Max Under-Forecast (Shortfall): {metrics.max_under_forecast_mw} MW
- Max Over-Forecast (Surplus): {metrics.max_over_forecast_mw} MW
- Total Actual Energy: {metrics.total_actual_mwh} MWh vs Forecasted: {metrics.total_forecast_mwh} MWh

KEY SETTLEMENT PERIOD SAMPLES (UTC):
{json.dumps(sample_periods)}

Provide a commercial decision memo in valid JSON format with exactly these keys:
{{
  "headline": "<Concise 1-sentence executive finding>",
  "imbalance_risk": "<LOW | MODERATE | HIGH | CRITICAL>",
  "wmape_assessment": "<Brief assessment of forecast reliability>",
  "peak_shortfall_risk_mw": <number>,
  "peak_excess_risk_mw": <number>,
  "recommendation": "<2-3 actionable sentences advising the procurement desk on thermal buffer procurement, day-ahead bidding, and real-time imbalance exposure>"
}}
Return ONLY valid JSON without Markdown fences or backticks.
"""
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        
        text = response.text.strip()
        # Clean potential markdown backticks
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:].strip()
        text = text.strip("`")
        
        data = json.loads(text)
        data["provider"] = "Google Gemini AI"
        data["model_used"] = settings.gemini_model
        return data
        
    except Exception as e:
        logger.warning("Gemini AI advisory generation failed (%s); falling back to rule engine.", e)
        fallback = generate_local_rule_based_advisory(metrics)
        fallback["gemini_error"] = str(e)
        return fallback
