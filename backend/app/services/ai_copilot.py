"""
AI Trading & Dispatch Copilot
Uses Google Gemini API with Tenacity retries and Primary / Backup model fallback.
- Primary Model: gemini-3.6-flash
- Backup Model: gemini-3.5-flash
- Offline Fallback: Deterministic Power Rules Engine
"""

import os
import json
import logging
import asyncio
from typing import Dict, Any, Optional

from google import genai
from google.genai import types
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

try:
    from app.config import settings
    from app.services.metrics_engine import DailyMetrics
except ModuleNotFoundError:
    from backend.app.config import settings
    from backend.app.services.metrics_engine import DailyMetrics

logger = logging.getLogger(__name__)

# ==============================================================================
# CONFIGURATION - HARDCODED MODEL HIERARCHY
# ==============================================================================
PRIMARY_MODEL = "gemini-3.6-flash"
BACKUP_MODEL = "gemini-3.5-flash"


def get_generation_config():
    return types.GenerateContentConfig(
        temperature=0.2,
        response_mime_type="application/json"
    )


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


def _build_copilot_prompt(metrics: DailyMetrics) -> str:
    """Construct concise prompt with metrics and settlement period data."""
    sample_periods = [
        {"sp": p.settlement_period, "time": p.start_time[11:16], "act": p.actual_mw, "fc": p.forecast_mw, "err": p.error_mw}
        for p in metrics.periods if p.settlement_period % 4 == 0 or (p.abs_error_mw and p.abs_error_mw > metrics.mae_mw * 1.5)
    ][:12]
    
    return f"""
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


async def _execute_gemini_request_with_retries(client: genai.Client, model_name: str, prompt: str) -> str:
    """Execute model request using Tenacity async exponential retries."""
    async for attempt in AsyncRetrying(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=6),
        stop=stop_after_attempt(3),
        reraise=True
    ):
        with attempt:
            logger.info("Attempting %s (Attempt %d/3)", model_name, attempt.retry_state.attempt_number)
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model_name,
                contents=prompt,
                config=get_generation_config()
            )
            return response.text


async def generate_gemini_advisory(metrics: DailyMetrics) -> Dict[str, Any]:
    """
    Generate commercial trading commentary with Primary -> Backup model fallback.
    1. Try PRIMARY_MODEL (gemini-3.6-flash) with 3 retries
    2. Fallback to BACKUP_MODEL (gemini-3.5-flash) with 3 retries
    3. Fallback to Local Rule-Based Engine if both fail or if no API key
    """
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        logger.info("No GEMINI_API_KEY found; activating deterministic rules engine.")
        return generate_local_rule_based_advisory(metrics)

    client = genai.Client(api_key=api_key)
    prompt = _build_copilot_prompt(metrics)

    # 1. Attempt Primary Model
    try:
        raw_text = await _execute_gemini_request_with_retries(client, PRIMARY_MODEL, prompt)
        clean_text = raw_text.strip().strip("`")
        if clean_text.startswith("json"):
            clean_text = clean_text[4:].strip()
        data = json.loads(clean_text)
        data["provider"] = "Google Gemini AI"
        data["model_used"] = PRIMARY_MODEL
        return data

    except Exception as e_primary:
        logger.warning("Primary model %s failed: %s. Attempting backup model %s...", PRIMARY_MODEL, e_primary, BACKUP_MODEL)

        # 2. Attempt Backup Model
        try:
            raw_text = await _execute_gemini_request_with_retries(client, BACKUP_MODEL, prompt)
            clean_text = raw_text.strip().strip("`")
            if clean_text.startswith("json"):
                clean_text = clean_text[4:].strip()
            data = json.loads(clean_text)
            data["provider"] = "Google Gemini AI (Backup)"
            data["model_used"] = BACKUP_MODEL
            return data

        except Exception as e_backup:
            logger.error("Backup model %s also failed: %s. Falling back to local rules engine.", BACKUP_MODEL, e_backup)
            fallback = generate_local_rule_based_advisory(metrics)
            fallback["gemini_error"] = f"Primary: {e_primary} | Backup: {e_backup}"
            return fallback
