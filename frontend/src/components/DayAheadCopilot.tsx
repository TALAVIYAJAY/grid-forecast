import React from 'react';
import { CopilotAdvisory } from '../types';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw, Bot } from 'lucide-react';

interface DayAheadCopilotProps {
  advisory: CopilotAdvisory | null;
  loading: boolean;
  onRefresh: () => void;
}

export const DayAheadCopilot: React.FC<DayAheadCopilotProps> = ({
  advisory,
  loading,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="bg-[#111827] border border-cyan-500/20 rounded-xl p-5 shadow-sm animate-pulse">
        <div className="h-5 w-48 bg-slate-800 rounded mb-3" />
        <div className="h-4 w-full bg-slate-800 rounded mb-2" />
        <div className="h-4 w-3/4 bg-slate-800 rounded" />
      </div>
    );
  }

  if (!advisory) return null;

  const {
    headline,
    imbalance_risk,
    wmape_assessment,
    recommendation,
    provider,
    model_used
  } = advisory;

  const isCritical = imbalance_risk === 'CRITICAL' || imbalance_risk === 'HIGH';
  const isModerate = imbalance_risk === 'MODERATE';

  return (
    <div className="bg-gradient-to-r from-[#111827] via-[#131F33] to-[#111827] border border-cyan-500/30 rounded-xl p-5 shadow-md relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                AI Day-Ahead Procurement Advisory
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center space-x-1">
                <Bot className="h-2.5 w-2.5 mr-0.5" />
                <span>{provider}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Risk Level Badge */}
          <span
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
              isCritical
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : isModerate
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isCritical ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>{imbalance_risk} RISK</span>
          </span>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Refresh AI Analysis"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Headline */}
      <h4 className="text-sm font-semibold text-slate-100 mb-2">{headline}</h4>

      {/* Recommendation & Assessment */}
      <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
        <p className="bg-[#0B0F19]/60 p-3 rounded-lg border border-slate-800 text-slate-300">
          <strong className="text-cyan-400 font-medium">Bidding Strategy: </strong>
          {recommendation}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Model: {model_used} • Forecast Reliability: {wmape_assessment}</span>
          <span className="text-slate-600">UK Wholesale Day-Ahead Decision Support</span>
        </div>
      </div>
    </div>
  );
};
