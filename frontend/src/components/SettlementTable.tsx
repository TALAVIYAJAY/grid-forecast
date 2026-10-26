import React, { useState } from 'react';
import { SettlementPeriodData } from '../types';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface SettlementTableProps {
  periods: SettlementPeriodData[];
}

export const SettlementTable: React.FC<SettlementTableProps> = ({ periods }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'shortfall' | 'surplus'>('all');

  const filteredPeriods = periods.filter((p) => {
    if (filterMode === 'shortfall') return p.error_mw !== null && p.error_mw < 0;
    if (filterMode === 'surplus') return p.error_mw !== null && p.error_mw > 0;
    return true;
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition select-none"
      >
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-white">
            48 Half-Hourly Settlement Periods Data Ledger
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {periods.length} Periods
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">
            {isOpen ? 'Click to collapse' : 'Click to inspect all 48 periods'}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-slate-800">
          {/* Filter Pills */}
          <div className="flex items-center space-x-2 mb-3 text-xs">
            <span className="text-slate-400 text-[11px]">Filter:</span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                filterMode === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Periods ({periods.length})
            </button>
            <button
              onClick={() => setFilterMode('shortfall')}
              className={`px-2.5 py-1 rounded-md transition ${
                filterMode === 'shortfall'
                  ? 'bg-rose-500/20 text-rose-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deficits Only ({periods.filter((p) => p.error_mw && p.error_mw < 0).length})
            </button>
            <button
              onClick={() => setFilterMode('surplus')}
              className={`px-2.5 py-1 rounded-md transition ${
                filterMode === 'surplus'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Surpluses Only ({periods.filter((p) => p.error_mw && p.error_mw > 0).length})
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F19] text-slate-400 sticky top-0 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">SP #</th>
                  <th className="py-2.5 px-3">Time (UTC)</th>
                  <th className="py-2.5 px-3 text-right">Actual (MW)</th>
                  <th className="py-2.5 px-3 text-right">Forecast (MW)</th>
                  <th className="py-2.5 px-3 text-right">Error (MW)</th>
                  <th className="py-2.5 px-3 text-right">Abs Error (MW)</th>
                  <th className="py-2.5 px-3 text-right">Error (%)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredPeriods.map((p) => {
                  const isDeficit = p.error_mw !== null && p.error_mw < 0;
                  const isSurplus = p.error_mw !== null && p.error_mw > 0;
                  return (
                    <tr key={p.settlement_period} className="hover:bg-slate-800/30 transition">
                      <td className="py-2 px-3 text-slate-400">{p.settlement_period}</td>
                      <td className="py-2 px-3 text-cyan-400">{p.start_time.substring(11, 16)}</td>
                      <td className="py-2 px-3 text-right text-white">
                        {p.actual_mw !== null ? p.actual_mw.toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-300">
                        {p.forecast_mw !== null ? p.forecast_mw.toLocaleString() : 'N/A'}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          isSurplus ? 'text-amber-400' : isDeficit ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {p.error_mw !== null
                          ? (p.error_mw > 0 ? `+${p.error_mw.toFixed(0)}` : p.error_mw.toFixed(0))
                          : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {p.abs_error_mw !== null ? p.abs_error_mw.toFixed(0) : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {p.pct_error !== null ? `${p.pct_error.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isDeficit ? (
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans">
                            <AlertCircle className="h-2.5 w-2.5 mr-1" /> Deficit
                          </span>
                        ) : isSurplus ? (
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
                            Surplus
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans">Exact</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
