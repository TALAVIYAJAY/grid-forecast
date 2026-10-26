import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { SettlementPeriodData } from '../types';

interface ErrorAnalysisChartProps {
  periods: SettlementPeriodData[];
}

export const ErrorAnalysisChart: React.FC<ErrorAnalysisChartProps> = ({ periods }) => {
  const chartData = periods.map((p) => {
    const timeStr = p.start_time ? p.start_time.substring(11, 16) : `SP ${p.settlement_period}`;
    return {
      period: p.settlement_period,
      time: timeStr,
      error: p.error_mw,
      isUnder: p.is_under_forecast,
    };
  });

  const overCount = periods.filter((p) => p.error_mw && p.error_mw > 0).length;
  const underCount = periods.filter((p) => p.error_mw && p.error_mw < 0).length;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Settlement Period Forecast Error Distribution
          </h2>
          <p className="text-xs text-slate-400">
            Error = (Day-Ahead Forecast − Actual Generation). Positive = Over-forecast, Negative = Under-forecast
          </p>
        </div>

        {/* Breakdown chips */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {overCount} Over-Forecast Periods
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {underCount} Under-Forecast Deficits
          </span>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              tick={{ fill: '#64748B', fontSize: 10 }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: '#64748B', fontSize: 10 }}
              tickLine={false}
              unit=" MW"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const err = data.error;
                  if (err === null) return null;
                  return (
                    <div className="bg-[#111827] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                      <div className="font-semibold text-slate-300">
                        SP {data.period} ({data.time} UTC)
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">Deviation:</span>
                        <span
                          className={`font-mono font-bold ${
                            err > 0 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {err > 0 ? `+${err.toFixed(0)} MW (Over)` : `${err.toFixed(0)} MW (Shortfall)`}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
            <Bar dataKey="error" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.error !== null && entry.error >= 0 ? '#F59E0B' : '#F43F5E'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
