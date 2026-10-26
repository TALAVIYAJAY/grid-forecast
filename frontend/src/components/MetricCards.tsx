import React from 'react';
import { DailyMetrics } from '../types';
import { Activity, AlertTriangle, CheckCircle, Scale, Zap, ShieldAlert } from 'lucide-react';

interface MetricCardsProps {
  metrics: DailyMetrics | null;
  loading: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[#111827]/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const {
    mae_mw,
    rmse_mw,
    wmape_pct,
    mean_bias_mw,
    bias_direction,
    max_under_forecast_mw,
    total_actual_mwh,
    total_forecast_mwh
  } = metrics;

  // wMAPE status badge
  const isWmapeGood = wmape_pct < 12;
  const isWmapeModerate = wmape_pct >= 12 && wmape_pct < 20;

  // Bias badge styling
  const isOver = bias_direction === 'OVER_FORECASTING';
  const isUnder = bias_direction === 'UNDER_FORECASTING';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* 1. MAE */}
      <div className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">MAE</span>
          <Activity className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold tracking-tight text-white">{mae_mw.toLocaleString()}</span>
          <span className="text-xs font-medium text-slate-400">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Mean Absolute Error per 30-min period</p>
      </div>

      {/* 2. RMSE */}
      <div className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">RMSE</span>
          <Zap className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold tracking-tight text-white">{rmse_mw.toLocaleString()}</span>
          <span className="text-xs font-medium text-slate-400">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Penalizes large forecast variance</p>
      </div>

      {/* 3. wMAPE */}
      <div className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Volume wMAPE</span>
          {isWmapeGood ? (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold tracking-tight text-white">{wmape_pct.toFixed(1)}%</span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isWmapeGood
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isWmapeModerate
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isWmapeGood ? 'HIGH ACCURACY' : isWmapeModerate ? 'MODERATE' : 'VOLATILE'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Weighted relative error</p>
      </div>

      {/* 4. Forecast Bias */}
      <div className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Forecast Bias</span>
          <Scale className="h-4 w-4 text-sky-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span
            className={`text-2xl font-bold tracking-tight ${
              isOver ? 'text-amber-400' : isUnder ? 'text-cyan-400' : 'text-slate-100'
            }`}
          >
            {mean_bias_mw > 0 ? `+${mean_bias_mw.toFixed(0)}` : mean_bias_mw.toFixed(0)}
          </span>
          <span className="text-xs font-medium text-slate-400">MW</span>
        </div>
        <div className="mt-1">
          <span
            className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isOver
                ? 'bg-amber-500/10 text-amber-400'
                : isUnder
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {isOver ? 'OVER-ESTIMATING' : isUnder ? 'UNDER-ESTIMATING' : 'BALANCED'}
          </span>
        </div>
      </div>

      {/* 5. Peak Shortfall Risk */}
      <div className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Peak Deficit Risk</span>
          <ShieldAlert className="h-4 w-4 text-rose-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold tracking-tight text-rose-400">
            {max_under_forecast_mw.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-400">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Largest single settlement period deficit</p>
      </div>

      {/* 6. Delivered Energy MWh */}
      <div className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Volume</span>
          <span className="text-[10px] text-slate-500">24-Hour</span>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold tracking-tight text-white">
            {Math.round(total_actual_mwh / 1000).toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-400">GWh</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          FC: {Math.round(total_forecast_mwh / 1000).toLocaleString()} GWh (
          {((total_forecast_mwh - total_actual_mwh) / 1000 > 0 ? '+' : '')}
          {Math.round((total_forecast_mwh - total_actual_mwh) / 1000)} GWh)
        </p>
      </div>
    </div>
  );
};
