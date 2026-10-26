import React from 'react';
import { Wind, Calendar, Clock, ChevronLeft, ChevronRight, Download, BarChart2, TrendingUp } from 'lucide-react';

interface HeaderProps {
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  gateClosureHour: number;
  onSelectGateClosure: (hour: number) => void;
  activeTab: 'daily' | 'monthly';
  onSelectTab: (tab: 'daily' | 'monthly') => void;
  onExportCsv: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  dates,
  selectedDate,
  onSelectDate,
  gateClosureHour,
  onSelectGateClosure,
  activeTab,
  onSelectTab,
  onExportCsv,
  loading
}) => {
  const currentIndex = dates.indexOf(selectedDate);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < dates.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectDate(dates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectDate(dates[currentIndex + 1]);
  };

  return (
    <header className="bg-[#111827]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Wind className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">GridForecast</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                UK Wind Power
              </span>
            </div>
            <p className="text-xs text-slate-400">Day-Ahead Wholesale Dispatch & Forecast Accuracy</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-[#1F2937]/70 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onSelectTab('daily')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'daily'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Day-Ahead Console</span>
          </button>
          <button
            onClick={() => onSelectTab('monthly')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'monthly'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>January 2026 Benchmark</span>
          </button>
        </div>

        {/* Controls: Date Picker & Gate Closure */}
        <div className="flex items-center flex-wrap gap-2.5">
          {activeTab === 'daily' && (
            <>
              {/* Date Navigation */}
              <div className="flex items-center bg-[#1F2937] rounded-lg border border-slate-700/60 p-0.5">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev || loading}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center px-2 space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                  <select
                    value={selectedDate}
                    onChange={(e) => onSelectDate(e.target.value)}
                    disabled={loading}
                    className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {dates.map((d) => (
                      <option key={d} value={d} className="bg-[#1F2937] text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleNext}
                  disabled={!hasNext || loading}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Gate Closure Cutoff Selector */}
              <div className="flex items-center bg-[#1F2937] rounded-lg border border-slate-700/60 px-2.5 py-1.5 space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs text-slate-400">D-1 Cutoff:</span>
                <select
                  value={gateClosureHour}
                  onChange={(e) => onSelectGateClosure(Number(e.target.value))}
                  disabled={loading}
                  className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer"
                >
                  <option value={9} className="bg-[#1F2937]">09:00 GMT (Early Morning)</option>
                  <option value={11} className="bg-[#1F2937]">11:00 GMT (EPEX Standard)</option>
                  <option value={12} className="bg-[#1F2937]">12:00 GMT (Nord Pool Cutoff)</option>
                  <option value={14} className="bg-[#1F2937]">14:00 GMT (Afternoon Update)</option>
                  <option value={17} className="bg-[#1F2937]">17:00 GMT (Evening Final)</option>
                </select>
              </div>

              {/* CSV Export */}
              <button
                onClick={onExportCsv}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                title="Download 48 Settlement Periods CSV"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
