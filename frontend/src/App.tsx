import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { ForecastChart } from './components/ForecastChart';
import { ErrorAnalysisChart } from './components/ErrorAnalysisChart';
import { DayAheadCopilot } from './components/DayAheadCopilot';
import { SettlementTable } from './components/SettlementTable';
import { MonthlyBenchmarkView } from './components/MonthlyBenchmarkView';
import { RawDataExplorer } from './components/RawDataExplorer';
import { DailyMetrics, CopilotAdvisory, MonthlySummary, RawGridDataResponse } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

export const App: React.FC = () => {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-15');
  const [gateClosureHour, setGateClosureHour] = useState<number>(11);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'raw'>('daily');

  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [advisory, setAdvisory] = useState<CopilotAdvisory | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [rawData, setRawData] = useState<RawGridDataResponse | null>(null);

  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [loadingAdvisory, setLoadingAdvisory] = useState<boolean>(false);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [loadingRawData, setLoadingRawData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch available dates on load
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dates`);
        const fetchedDates: string[] = res.data.dates;
        setDates(fetchedDates);
        if (fetchedDates.length > 0) {
          // Default to mid-month Jan 15th if available, else first
          const defaultD = fetchedDates.includes('2026-01-15')
            ? '2026-01-15'
            : fetchedDates[0];
          setSelectedDate(defaultD);
        }
      } catch (err: any) {
        console.error('Failed to load dates', err);
        setError('Failed to connect to backend server. Please verify backend is running on port 8000.');
      }
    };
    fetchDates();
  }, []);

  // 2. Fetch daily evaluation metrics when date or gateClosureHour changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchDailyData = async () => {
      setLoadingMetrics(true);
      setError(null);
      try {
        const res = await axios.get(
          `${API_BASE}/evaluation?date=${selectedDate}&gate_closure_hour=${gateClosureHour}`
        );
        setMetrics(res.data);
      } catch (err: any) {
        console.error('Failed to fetch evaluation', err);
        setError(`Failed to retrieve forecast evaluation for ${selectedDate}.`);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchDailyData();
  }, [selectedDate, gateClosureHour]);

  // 3. Fetch AI Copilot Advisory for the date
  useEffect(() => {
    if (!selectedDate) return;

    const fetchCopilot = async () => {
      setLoadingAdvisory(true);
      try {
        const res = await axios.get(
          `${API_BASE}/copilot?date=${selectedDate}&gate_closure_hour=${gateClosureHour}`
        );
        setAdvisory(res.data);
      } catch (err: any) {
        console.warn('Copilot request failed', err);
      } finally {
        setLoadingAdvisory(false);
      }
    };

    fetchCopilot();
  }, [selectedDate, gateClosureHour]);

  // 4. Fetch Monthly Summary when monthly tab is active
  useEffect(() => {
    if (activeTab === 'monthly' && !monthlySummary) {
      const fetchMonthly = async () => {
        setLoadingMonthly(true);
        try {
          const res = await axios.get(
            `${API_BASE}/monthly-summary?gate_closure_hour=${gateClosureHour}`
          );
          setMonthlySummary(res.data);
        } catch (err: any) {
          console.error('Failed to load monthly summary', err);
        } finally {
          setLoadingMonthly(false);
        }
      };
      fetchMonthly();
    }
  }, [activeTab, gateClosureHour, monthlySummary]);

  // 5. Fetch Raw Grid Data when raw tab is active, or date/cutoff changes
  useEffect(() => {
    if (activeTab === 'raw' && selectedDate) {
      const fetchRawData = async () => {
        setLoadingRawData(true);
        try {
          const res = await axios.get(
            `${API_BASE}/raw-data?date=${selectedDate}&gate_closure_hour=${gateClosureHour}`
          );
          setRawData(res.data);
        } catch (err: any) {
          console.error('Failed to load raw data', err);
        } finally {
          setLoadingRawData(false);
        }
      };
      fetchRawData();
    }
  }, [activeTab, selectedDate, gateClosureHour]);

  // Handle CSV Download
  const handleExportCsv = () => {
    window.open(
      `${API_BASE}/export-csv?date=${selectedDate}&gate_closure_hour=${gateClosureHour}`,
      '_blank'
    );
  };

  // Switch tab and drill down to date
  const handleDrillDownDate = (date: string) => {
    setSelectedDate(date);
    setActiveTab('daily');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        dates={dates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        gateClosureHour={gateClosureHour}
        onSelectGateClosure={(hour) => {
          setGateClosureHour(hour);
          setMonthlySummary(null); // Invalidate monthly cache on cutoff change
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExportCsv={handleExportCsv}
        loading={loadingMetrics}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-medium transition"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Tab 1: Day-Ahead Operational Console */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <MetricCards metrics={metrics} loading={loadingMetrics} />

            {/* AI Day-Ahead Trading Copilot Advisory */}
            <DayAheadCopilot
              advisory={advisory}
              loading={loadingAdvisory}
              onRefresh={async () => {
                setLoadingAdvisory(true);
                try {
                  const res = await axios.get(
                    `${API_BASE}/copilot?date=${selectedDate}&gate_closure_hour=${gateClosureHour}`
                  );
                  setAdvisory(res.data);
                } finally {
                  setLoadingAdvisory(false);
                }
              }}
            />

            {/* Main Interactive Time-Series Overlay Chart */}
            {metrics && (
              <ForecastChart periods={metrics.periods} date={metrics.date} />
            )}

            {/* Settlement Period Error Delta Bar Chart */}
            {metrics && (
              <ErrorAnalysisChart periods={metrics.periods} />
            )}

            {/* Complete 48 Settlement Periods Audit Ledger */}
            {metrics && (
              <SettlementTable periods={metrics.periods} />
            )}
          </div>
        )}

        {/* Tab 2: Full Month January 2026 Quantitative Benchmark */}
        {activeTab === 'monthly' && (
          <MonthlyBenchmarkView
            summary={monthlySummary}
            loading={loadingMonthly}
            onSelectDate={handleDrillDownDate}
          />
        )}

        {/* Tab 3: Raw Grid Data Explorer & Elexon Telemetry Audit */}
        {activeTab === 'raw' && (
          <RawDataExplorer
            rawData={rawData}
            loading={loadingRawData}
            selectedDate={selectedDate}
            gateClosureHour={gateClosureHour}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#111827]/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>GridForecast • Renewable Wind Day-Ahead Decision Support</span>
          <span>Data Sources: Elexon BMRS (FUELHH Actuals & WINDFOR Forecasts) • January 2026</span>
          <span className="text-slate-400 font-mono">UK Grid Settlement Periods 1–48</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
