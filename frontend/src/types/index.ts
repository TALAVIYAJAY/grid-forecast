export interface SettlementPeriodData {
  settlement_period: number;
  start_time: string;
  actual_mw: number | null;
  forecast_mw: number | null;
  error_mw: number | null;
  abs_error_mw: number | null;
  pct_error: number | null;
  is_under_forecast: boolean | null;
}

export interface DailyMetrics {
  date: string;
  gate_closure_hour: number;
  total_settlement_periods: number;
  valid_periods: number;
  mae_mw: number;
  rmse_mw: number;
  mape_pct: number;
  wmape_pct: number;
  mean_bias_mw: number;
  max_under_forecast_mw: number;
  max_over_forecast_mw: number;
  total_actual_mwh: number;
  total_forecast_mwh: number;
  bias_direction: 'OVER_FORECASTING' | 'UNDER_FORECASTING' | 'BALANCED';
  periods: SettlementPeriodData[];
}

export interface CopilotAdvisory {
  headline: string;
  imbalance_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  wmape_assessment: string;
  peak_shortfall_risk_mw: number;
  peak_excess_risk_mw: number;
  recommendation: string;
  provider: string;
  model_used: string;
}

export interface DailySummaryItem {
  date: string;
  mae_mw: number;
  rmse_mw: number;
  wmape_pct: number;
  mean_bias_mw: number;
  total_actual_mwh: number;
  total_forecast_mwh: number;
  bias_direction: string;
}

export interface MonthlySummary {
  dates_evaluated: number;
  total_settlement_periods: number;
  monthly_mae_mw: number;
  monthly_rmse_mw: number;
  monthly_wmape_pct: number;
  daily_breakdown: DailySummaryItem[];
}

export interface RawFuelhhRecord {
  id: number;
  settlement_period: number;
  settlement_date: string;
  start_time: string;
  publish_time: string;
  generation_mw: number;
  fuel_type: string;
  dataset: string;
  resolution: string;
}

export interface RawWindforRecord {
  id: number;
  start_time: string;
  publish_time: string;
  generation_mw: number;
  dataset: string;
  resolution: string;
  is_before_cutoff: boolean;
  is_selected: boolean;
  status: 'LOCKED_DAY_AHEAD' | 'SUPERSEDED_PRE_CUTOFF' | 'POST_CUTOFF_INTRADAY';
  status_label: string;
  lead_hours: number | null;
}

export interface RawFuelhhSummary {
  dataset_name: string;
  elexon_url: string;
  count: number;
  total_energy_gwh: number;
  avg_generation_mw: number;
  min_generation_mw: number;
  max_generation_mw: number;
  records: RawFuelhhRecord[];
}

export interface RawWindforSummary {
  dataset_name: string;
  elexon_url: string;
  total_stream_updates: number;
  selected_day_ahead_count: number;
  superseded_pre_cutoff_count: number;
  post_cutoff_intraday_count: number;
  gate_closure_cutoff_utc: string;
  records: RawWindforRecord[];
}

export interface RawGridDataResponse {
  delivery_date: string;
  gate_closure_cutoff_utc: string;
  fuelhh: RawFuelhhSummary;
  windfor: RawWindforSummary;
}
