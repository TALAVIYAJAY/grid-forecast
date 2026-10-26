import React, { useState, useEffect } from 'react';
import { CopilotAdvisory } from '../types';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw, Bot, Cpu } from 'lucide-react';

interface DayAheadCopilotProps {
  advisory: CopilotAdvisory | null;
  loading: boolean;
  onRefresh: () => void;
}

const LOADING_MESSAGES = [
  "Connecting to GridAI Copilot reasoning engine...",
  "Evaluating 48 settlement period actuals against D-1 day-ahead forecasts...",
  "Analyzing volume-weighted wMAPE & peak deficit shortfall exposure...",
  "Formulating commercial bidding recommendations & thermal buffer strategy...",
  "Synthesizing executive wholesale dispatch advisory memo..."
];

export const DayAheadCopilot: React.FC<DayAheadCopilotProps> = ({
  advisory,
  loading,
  onRefresh
}) => {
  const [msgIndex, setMsgIndex] = useState<number>(0);

  // Cycle twinkling status messages every 2.2 seconds while loading
  useEffect(() => {
    if (!loading) {
      setMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  // Luminous Twinkling AI Loading Card
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#111827] via-[#141E30] to-[#111827] border border-cyan-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden animate-pulse-glow">
        {/* Shimmer light beam moving across */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-shimmer-wave pointer-events-none" />

        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shadow-sm shadow-cyan-500/30">
                <Sparkles className="h-4 w-4 animate-twinkle text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                    <span>AI Day-Ahead Procurement Advisory</span>
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span>AI Copilot Active</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center space-x-2 text-[11px] text-cyan-400 font-medium">
              <Cpu className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              <span>Synthesizing Strategy...</span>
            </div>
          </div>

          {/* Twinkling Message & Progress Box */}
          <div className="bg-[#0B0F19]/80 border border-cyan-500/25 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
              <p className="text-xs font-medium text-cyan-200 tracking-wide transition-all duration-300">
                {LOADING_MESSAGES[msgIndex]}
              </p>
            </div>

            {/* Glowing animated progress line */}
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-400 to-teal-400 rounded-full w-full animate-shimmer-wave" />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>Decision Engine: GridForecast Autonomous Trading Copilot</span>
              <span>EPEX SPOT / Nord Pool Gate Closure</span>
            </div>
          </div>
        </div>
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
            <Sparkles className="h-4 w-4 text-cyan-300" />
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
          <span>Engine: {model_used} • Forecast Reliability: {wmape_assessment}</span>
          <span className="text-slate-600">UK Wholesale Day-Ahead Decision Support</span>
        </div>
      </div>
    </div>
  );
};
