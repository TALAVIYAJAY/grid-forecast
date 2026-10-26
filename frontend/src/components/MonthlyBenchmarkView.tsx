import React from 'react';
import { MonthlySummary } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Award, ArrowRight } from 'lucide-react';

interface MonthlyBenchmarkViewProps {
  summary: MonthlySummary | null;
  loading: boolean;
  onSelectDate: (date: string) => void;
}

export const MonthlyBenchmarkView: React.FC<MonthlyBenchmarkViewProps> = ({
  summary,
  loading,
  onSelectDate
}) => {
  if (loading || !summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-[#111827] rounded-xl border border-slate-800" />
        <div className="h-72 bg-[#111827] rounded-xl border border-slate-800" />
      </div>
    );
  }

  const { monthly_mae_mw, monthly_rmse_mw, monthly_wmape_pct, daily_breakdown } = summary;

  // Best Day and Most Volatile Day
  const sortedByWmape = [...daily_breakdown].sort((a, b) => a.wmape_pct - b.wmape_pct);
  const bestDay = sortedByWmape[0];
  const worstDay = sortedByWmape[sortedByWmape.length - 1];

  const chartData = daily_breakdown.map((d) => ({
    date: d.date.substring(8, 10), // "01", "02", etc.
    fullDate: d.date,
    wmape: d.wmape_pct,
    mae: d.mae_mw,
    bias: d.mean_bias_mw,
  }));

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Monthly MAE (Jan 2026)
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold text-white">{monthly_mae_mw.toLocaleString()}</span>
            <span className="text-xs text-slate-400">MW</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 1,488 settlement periods</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Monthly RMSE
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold text-amber-400">{monthly_rmse_mw.toLocaleString()}</span>
            <span className="text-xs text-slate-400">MW</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Reflects peak storm deviations</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Aggregate wMAPE
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-bold text-cyan-400">{monthly_wmape_pct.toFixed(1)}%</span>
            <span className="text-xs text-emerald-400 font-medium ml-2">Benchmark Level</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Volume-weighted relative accuracy</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Highest Accuracy Day
            </span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold text-white">{bestDay?.date}</span>
            <span className="text-xs text-emerald-400 ml-2 font-mono">
              ({bestDay?.wmape_pct.toFixed(1)}% error)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Worst Day: {worstDay?.date} ({worstDay?.wmape_pct.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Daily Error Distribution Chart */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              January 2026 Daily Forecast Error (wMAPE %)
            </h3>
            <p className="text-xs text-slate-400">
              Click any bar to drill down directly into that day's 48 settlement periods
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>&lt;15% (High Accuracy)</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 inline-block" />
              <span>15–25% (Moderate)</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-400">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 inline-block" />
              <span>&gt;25% (Storm / Volatile)</span>
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clicked = state.activePayload[0].payload.fullDate;
                  onSelectDate(clicked);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748B"
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#111827] border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
                        <div className="font-semibold text-white border-b border-slate-800 pb-1">
                          Delivery Date: {data.fullDate}
                        </div>
                        <div className="flex justify-between space-x-4">
                          <span className="text-slate-400">wMAPE:</span>
                          <span className="font-mono font-bold text-cyan-400">{data.wmape.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between space-x-4">
                          <span className="text-slate-400">MAE:</span>
                          <span className="font-mono text-white">{data.mae.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between space-x-4">
                          <span className="text-slate-400">Bias:</span>
                          <span className="font-mono text-slate-300">
                            {data.bias > 0 ? `+${data.bias.toFixed(0)}` : data.bias.toFixed(0)} MW
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-400 pt-1">Click bar to drill down →</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="wmape" radius={[4, 4, 0, 0]} cursor="pointer">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.wmape < 15 ? '#10B981' : entry.wmape < 25 ? '#F59E0B' : '#F43F5E'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 31-Day Ledger Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Full Month Day-by-Day Audit Table</h3>
          <span className="text-xs text-slate-400">31 Delivery Days</span>
        </div>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19] text-slate-400 sticky top-0 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">MAE (MW)</th>
                <th className="py-2.5 px-3 text-right">RMSE (MW)</th>
                <th className="py-2.5 px-3 text-right">wMAPE (%)</th>
                <th className="py-2.5 px-3 text-right">Mean Bias (MW)</th>
                <th className="py-2.5 px-3 text-center">Bias Trend</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {daily_breakdown.map((row) => (
                <tr key={row.date} className="hover:bg-slate-800/30 transition">
                  <td className="py-2 px-3 text-cyan-400 font-semibold">{row.date}</td>
                  <td className="py-2 px-3 text-right text-white">{row.mae_mw.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{row.rmse_mw.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-bold text-amber-300">{row.wmape_pct.toFixed(1)}%</td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      row.mean_bias_mw > 0 ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  >
                    {row.mean_bias_mw > 0 ? `+${row.mean_bias_mw.toFixed(0)}` : row.mean_bias_mw.toFixed(0)}
                  </td>
                  <td className="py-2 px-3 text-center font-sans text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        row.bias_direction === 'OVER_FORECASTING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : row.bias_direction === 'UNDER_FORECASTING'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {row.bias_direction}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-sans">
                    <button
                      onClick={() => onSelectDate(row.date)}
                      className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-xs transition"
                    >
                      <span>Drill Down</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
