import React, { useState } from 'react';
import { RawGridDataResponse, RawFuelhhRecord, RawWindforRecord } from '../types';
import { Database, ExternalLink, Filter, Search, CheckCircle, Clock, AlertTriangle, Layers, Zap, Info } from 'lucide-react';

interface RawDataExplorerProps {
  rawData: RawGridDataResponse | null;
  loading: boolean;
  selectedDate: string;
  gateClosureHour: number;
}

export const RawDataExplorer: React.FC<RawDataExplorerProps> = ({
  rawData,
  loading,
  selectedDate,
  gateClosureHour
}) => {
  const [activeDataset, setActiveDataset] = useState<'fuelhh' | 'windfor'>('windfor');
  const [windforFilter, setWindforFilter] = useState<'ALL' | 'SELECTED' | 'SUPERSEDED' | 'POST_CUTOFF'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (loading || !rawData) {
    return (
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
        <p className="text-slate-400 text-sm">Loading raw Elexon BMRS stream records for {selectedDate}...</p>
      </div>
    );
  }

  const { fuelhh, windfor, gate_closure_cutoff_utc } = rawData;

  // Filter FUELHH records
  const filteredFuelhh = fuelhh?.records.filter((r: RawFuelhhRecord) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.settlement_period.toString().includes(query) ||
      r.start_time.toLowerCase().includes(query) ||
      r.publish_time.toLowerCase().includes(query) ||
      r.generation_mw.toString().includes(query)
    );
  }) || [];

  // Filter WINDFOR records
  const filteredWindfor = windfor?.records.filter((r: RawWindforRecord) => {
    // 1. Status filter
    if (windforFilter === 'SELECTED' && !r.is_selected) return false;
    if (windforFilter === 'SUPERSEDED' && r.status !== 'SUPERSEDED_PRE_CUTOFF') return false;
    if (windforFilter === 'POST_CUTOFF' && r.status !== 'POST_CUTOFF_INTRADAY') return false;

    // 2. Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.start_time.toLowerCase().includes(query) ||
        r.publish_time.toLowerCase().includes(query) ||
        r.generation_mw.toString().includes(query) ||
        r.status_label.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Dataset Selector & Live Elexon API Links */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Raw Grid Data Explorer & Audit Trail</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inspect ground-truth telemetry streamed from official UK Elexon BMRS feeds for Delivery Date <span className="text-cyan-300 font-mono font-medium">{selectedDate}</span>.
            </p>
          </div>

          {/* Dataset Switcher */}
          <div className="flex items-center bg-[#1F2937] p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveDataset('windfor')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeDataset === 'windfor'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>WINDFOR (Forecast Stream)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-900/40 text-cyan-200 border border-cyan-400/20">
                {windfor?.total_stream_updates ?? 0}
              </span>
            </button>
            <button
              onClick={() => setActiveDataset('fuelhh')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeDataset === 'fuelhh'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>FUELHH (Actuals)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-900/40 text-emerald-200 border border-emerald-400/20">
                {fuelhh?.count ?? 0}
              </span>
            </button>
          </div>
        </div>

        {/* Educational Domain Explainer Panel */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-3">
          <div className="flex items-start space-x-2.5">
            <Info className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span>Understanding Elexon BMRS Data Streams & Day-Ahead Auction Gate Closure:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Cutoff: {gate_closure_cutoff_utc.replace('T', ' ').replace('Z', ' UTC')} ({gateClosureHour}:00 GMT on D-1)
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                National Grid ESO continuously streams forecast updates via <span className="font-mono text-cyan-300">WINDFOR</span> throughout the days preceding delivery. 
                However, UK wholesale day-ahead power bids (EPEX SPOT / Nord Pool) lock strictly at <strong>11:00 GMT on Day D-1</strong>. 
                Our platform enforces this market rule by selecting the latest forecast published <em>before</em> the cutoff, discarding subsequent intraday updates to eliminate lookahead bias. 
                Actual wind generation is delivered in <span className="font-mono text-emerald-300">FUELHH</span> across 48 half-hour settlement periods.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-slate-400">Status Legend:</span>
              <span className="flex items-center space-x-1 text-cyan-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block"></span>
                <span>Selected Day-Ahead (Locked)</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-500 inline-block"></span>
                <span>Superseded Pre-Cutoff</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400 inline-block"></span>
                <span>Post-Cutoff (Intraday Update)</span>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href={activeDataset === 'windfor' ? windfor?.elexon_url : fuelhh?.elexon_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-medium transition"
              >
                <span>Verify on Official Elexon API Docs</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {activeDataset === 'windfor' ? (
            <>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Stream Updates</span>
                <p className="text-lg font-bold text-white font-mono mt-0.5">{windfor?.total_stream_updates}</p>
                <span className="text-[10px] text-slate-500">For 24 target hours</span>
              </div>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-cyan-400 uppercase font-semibold">Selected Day-Ahead</span>
                <p className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{windfor?.selected_day_ahead_count}</p>
                <span className="text-[10px] text-slate-500">Latest before D-1 cutoff</span>
              </div>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Pre-Cutoff Superseded</span>
                <p className="text-lg font-bold text-slate-300 font-mono mt-0.5">{windfor?.superseded_pre_cutoff_count}</p>
                <span className="text-[10px] text-slate-500">Replaced by newer updates</span>
              </div>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-amber-400 uppercase font-semibold">Post-Cutoff (Intraday)</span>
                <p className="text-lg font-bold text-amber-300 font-mono mt-0.5">{windfor?.post_cutoff_intraday_count}</p>
                <span className="text-[10px] text-slate-500">Excluded from Day-Ahead</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Settlement Periods</span>
                <p className="text-lg font-bold text-white font-mono mt-0.5">{fuelhh?.count} / 48</p>
                <span className="text-[10px] text-emerald-400">100% telemetry coverage</span>
              </div>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-emerald-400 uppercase font-semibold">Total Wind Volume</span>
                <p className="text-lg font-bold text-emerald-300 font-mono mt-0.5">{fuelhh?.total_energy_gwh} GWh</p>
                <span className="text-[10px] text-slate-500">Delivered to UK grid</span>
              </div>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Average Generation</span>
                <p className="text-lg font-bold text-slate-200 font-mono mt-0.5">{fuelhh?.avg_generation_mw.toLocaleString()} MW</p>
                <span className="text-[10px] text-slate-500">Across 24 hours</span>
              </div>
              <div className="bg-[#1F2937]/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-cyan-400 uppercase font-semibold">Peak Generation</span>
                <p className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{fuelhh?.max_generation_mw.toLocaleString()} MW</p>
                <span className="text-[10px] text-slate-500">Min: {fuelhh?.min_generation_mw.toLocaleString()} MW</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111827] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {activeDataset === 'windfor' && (
            <div className="flex items-center space-x-1.5 bg-[#1F2937] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400">Filter Status:</span>
              <select
                value={windforFilter}
                onChange={(e) => setWindforFilter(e.target.value as any)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#1F2937]">All Stream Updates ({windfor?.total_stream_updates})</option>
                <option value="SELECTED" className="bg-[#1F2937]">Selected Day-Ahead Only ({windfor?.selected_day_ahead_count})</option>
                <option value="SUPERSEDED" className="bg-[#1F2937]">Superseded Pre-Cutoff ({windfor?.superseded_pre_cutoff_count})</option>
                <option value="POST_CUTOFF" className="bg-[#1F2937]">Post-Cutoff Intraday ({windfor?.post_cutoff_intraday_count})</option>
              </select>
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeDataset === 'windfor' ? 'target hour, publish time, MW...' : 'period, start time, MW...'}`}
            className="w-full bg-[#1F2937] text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Raw Data Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[600px]">
          {activeDataset === 'windfor' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#1F2937]/90 sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Row ID</th>
                  <th className="py-3 px-4 font-semibold">Target Delivery Time (UTC)</th>
                  <th className="py-3 px-4 font-semibold">Publish Timestamp (UTC)</th>
                  <th className="py-3 px-4 font-semibold text-right">Lead Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Forecast (MW)</th>
                  <th className="py-3 px-4 font-semibold text-center">Day-Ahead Cutoff Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredWindfor.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No matching WINDFOR forecast records found.
                    </td>
                  </tr>
                ) : (
                  filteredWindfor.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/40 transition ${
                        row.is_selected ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-slate-500 font-normal">#{row.id}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">
                        {row.start_time.replace('T', ' ').replace('Z', ' UTC')}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {row.publish_time.replace('T', ' ').replace('Z', ' UTC')}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400">
                        {row.lead_hours !== null ? `${row.lead_hours} hrs ahead` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-white">
                        {row.generation_mw.toLocaleString()} MW
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {row.is_selected ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            <CheckCircle className="h-3 w-3 text-cyan-400" />
                            <span>Selected for D-1 Bid</span>
                          </span>
                        ) : row.is_before_cutoff ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>Superseded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            <span>Post-Cutoff (Intraday)</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#1F2937]/90 sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Row ID</th>
                  <th className="py-3 px-4 font-semibold text-center">Settlement Period</th>
                  <th className="py-3 px-4 font-semibold">Target Interval Start (UTC)</th>
                  <th className="py-3 px-4 font-semibold">Telemetry Publish (UTC)</th>
                  <th className="py-3 px-4 font-semibold">Fuel Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Delivered Actual (MW)</th>
                  <th className="py-3 px-4 font-semibold text-center">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredFuelhh.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No matching FUELHH actual generation records found.
                    </td>
                  </tr>
                ) : (
                  filteredFuelhh.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-4 text-slate-500 font-normal">#{row.id}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-cyan-300">
                        SP {row.settlement_period}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">
                        {row.start_time.replace('T', ' ').replace('Z', ' UTC')}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {row.publish_time.replace('T', ' ').replace('Z', ' UTC')}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {row.fuel_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                        {row.generation_mw.toLocaleString()} MW
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          <span>Delivered & Verified</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary Bar */}
        <div className="bg-[#1F2937]/80 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{activeDataset === 'windfor' ? filteredWindfor.length : filteredFuelhh.length}</strong> records
          </span>
          <span className="text-[11px] text-slate-500">
            Source: Elexon BMRS API ({activeDataset.toUpperCase()}/stream) • Direct SQL Window Query
          </span>
        </div>
      </div>
    </div>
  );
};
