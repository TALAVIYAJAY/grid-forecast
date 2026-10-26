import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area
} from 'recharts';
import { SettlementPeriodData } from '../types';
import { Eye, EyeOff, Layers } from 'lucide-react';

interface ForecastChartProps {
  periods: SettlementPeriodData[];
  date: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ periods, date }) => {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showArea, setShowArea] = useState(true);

  const chartData = periods.map((p) => {
    // Format UTC time: e.g. "14:30"
    const timeStr = p.start_time ? p.start_time.substring(11, 16) : `SP ${p.settlement_period}`;
    return {
      period: p.settlement_period,
      time: timeStr,
      actual: p.actual_mw,
      forecast: p.forecast_mw,
      error: p.error_mw,
    };
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Day-Ahead Wind Forecast vs Actual Generation
          </h2>
          <p className="text-xs text-slate-400">
            Delivery Date: <span className="text-cyan-400 font-medium">{date}</span> (48 Half-Hourly Settlement Periods)
          </p>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border transition ${
              showActual
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            {showActual ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Actual (MW)</span>
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border transition ${
              showForecast
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            {showForecast ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Day-Ahead Forecast</span>
          </button>

          <button
            onClick={() => setShowArea(!showArea)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border transition ${
              showArea
                ? 'bg-slate-700/60 text-slate-200 border-slate-600'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Shading</span>
          </button>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              domain={['auto', 'auto']}
              unit=" MW"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const delta = data.forecast !== null && data.actual !== null ? data.forecast - data.actual : null;
                  return (
                    <div className="bg-[#111827] border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                      <div className="flex items-center justify-between space-x-4 border-b border-slate-800 pb-1 font-semibold text-slate-200">
                        <span>SP {data.period}</span>
                        <span className="text-cyan-400">{data.time} UTC</span>
                      </div>
                      <div className="flex items-center justify-between space-x-4">
                        <span className="text-cyan-400">Actual Delivered:</span>
                        <span className="font-mono font-medium text-white">
                          {data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between space-x-4">
                        <span className="text-amber-400">Day-Ahead Forecast:</span>
                        <span className="font-mono font-medium text-white">
                          {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : 'N/A'}
                        </span>
                      </div>
                      {delta !== null && (
                        <div className="flex items-center justify-between space-x-4 pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Forecast Delta:</span>
                          <span
                            className={`font-mono font-bold ${
                              delta > 0 ? 'text-amber-400' : delta < 0 ? 'text-cyan-400' : 'text-slate-300'
                            }`}
                          >
                            {delta > 0 ? `+${delta.toFixed(0)}` : delta.toFixed(0)} MW
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
            />
            {showArea && (
              <Area
                type="monotone"
                dataKey="actual"
                fill="url(#actualGradient)"
                stroke="none"
              />
            )}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Generation"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#06B6D4' }}
              />
            )}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                name="Day-Ahead Forecast"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, fill: '#F59E0B' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
