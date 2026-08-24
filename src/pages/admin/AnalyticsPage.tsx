import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  getAnalyticsData,
  getStatusCounts,
  fetchAllApplicationsForExport,
} from '../../lib/firebase';
import { StudentApplication } from '../../types';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { exportStudentsToExcel, exportStudentsToCSV } from '../../lib/exportEngine';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Compass,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';

const COLORS = ['#6D28D9', '#7C3AED', '#10B981', '#06B6D4', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6'];

// ─────────────────────────────────────────────────────────────────────────────
// AnalyticsPage
//
// Data strategy:
//  - Status counts  → getStatusCounts()  reads counters/analytics (1 read)
//  - Dept/Year/Interest distributions → getAnalyticsData() reads counters/analytics (1 read)
//  - Timeline data  → requires full export (explicitly requested only)
//  - Export         → fetchAllApplicationsForExport() (intentional — admin action)
// ─────────────────────────────────────────────────────────────────────────────

export const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData]   = useState<Record<string, number>>({});
  const [isLoading, setIsLoading]           = useState(true);
  const [dbError, setDbError]               = useState<string | null>(null);
  const [exportToast, setExportToast]       = useState<string | null>(null);
  const [isExporting, setIsExporting]       = useState(false);

  // Full dataset only loaded when admin explicitly requests timeline/export
  const [fullData, setFullData]             = useState<StudentApplication[] | null>(null);
  const [isLoadingFull, setIsLoadingFull]   = useState(false);

  // ── Load analytics from counters/analytics (1 read) ───────────────────────
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const [analytics, counts] = await Promise.all([
        getAnalyticsData(),
        getStatusCounts(),
      ]);
      // Merge status counts into analytics data
      setAnalyticsData({
        ...analytics,
        total:       counts.total,
        pending:     counts.pending,
        approved:    counts.approved,
        shortlisted: counts.shortlisted,
        rejected:    counts.rejected,
      });
    } catch (err: any) {
      setDbError(err.message || 'Unable to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ── Load full dataset for timeline chart (admin-initiated only) ────────────
  const handleLoadTimeline = async () => {
    setIsLoadingFull(true);
    try {
      const data = await fetchAllApplicationsForExport();
      setFullData(data);
    } catch (err: any) {
      setDbError('Failed to load timeline data: ' + (err.message || ''));
    } finally {
      setIsLoadingFull(false);
    }
  };

  // ── Derive chart data from counters/analytics document ────────────────────

  // Year chart — keys are year_1st_Year, year_2nd_Year, etc.
  const yearData = useMemo(() => {
    const yearKeys: Record<string, string> = {
      'year_1st_Year': '1st Year',
      'year_2nd_Year': '2nd Year',
      'year_3rd_Year': '3rd Year',
      'year_4th_Year': '4th Year',
    };
    return Object.entries(yearKeys).map(([key, label]) => ({
      year:  label,
      count: analyticsData[key] ?? 0,
    }));
  }, [analyticsData]);

  // Department chart — keys are dept_CSE, dept_ECE, etc.
  const deptData = useMemo(() => {
    return Object.entries(analyticsData)
      .filter(([key]) => key.startsWith('dept_'))
      .map(([key, value]) => ({
        name:  key.replace('dept_', '').replace(/_/g, ' '),
        value: value as number,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [analyticsData]);

  // Interest chart — keys are interest_Algebra, interest_Calculus, etc.
  const interestData = useMemo(() => {
    return Object.entries(analyticsData)
      .filter(([key]) => key.startsWith('interest_'))
      .map(([key, value]) => ({
        name:  key.replace('interest_', '').replace(/_/g, ' '),
        count: value as number,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [analyticsData]);

  // Timeline chart from full dataset (only when loaded)
  const timeData = useMemo(() => {
    if (!fullData) return [];
    const dateCounts: Record<string, number> = {};
    fullData.forEach((app) => {
      if (app.createdAt) {
        const rawDate = app.createdAt.substring(0, 10);
        dateCounts[rawDate] = (dateCounts[rawDate] || 0) + 1;
      }
    });
    return Object.keys(dateCounts)
      .sort()
      .map((rawDate) => {
        const parts = rawDate.split('-');
        let formattedDate = rawDate;
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return { date: formattedDate, submissions: dateCounts[rawDate] };
      });
  }, [fullData]);

  // ── Export handlers (intentional full-collection fetch) ───────────────────
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const data = await fetchAllApplicationsForExport();
      const filename = await exportStudentsToExcel(
        data,
        `SIXATE MATHEMATICS CLUB — STUDENT REGISTRATIONS (${data.length} RECORDS)`
      );
      setExportToast(`✓ Excel downloaded — ${data.length} records as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch {
      setExportToast('⚠️ Unable to generate Excel file. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      const data = await fetchAllApplicationsForExport();
      const filename = exportStudentsToCSV(data);
      setExportToast(`✓ CSV downloaded — ${data.length} records as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch {
      setExportToast('⚠️ Unable to generate CSV file. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const total = analyticsData.total ?? 0;

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col md:flex-row font-body">
      <AdminSidebar />

      <main className="flex-grow md:ml-64 p-6 sm:p-10 space-y-8 overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                REGISTRATION ANALYTICS
              </h1>
              <span className="px-3 py-1 rounded-full bg-sixate-purple/20 border border-sixate-purple/40 text-sixate-green font-mono font-bold text-xs">
                {isLoading ? 'Loading…' : `${total} Records`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aggregated counters — loaded with 2 Firestore reads regardless of collection size.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAnalytics}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
            </button>
            <button
              onClick={handleExcelExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {isExporting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> EXPORTING...</>
                : <><FileSpreadsheet className="w-4 h-4" /> 📊 DOWNLOAD EXCEL ({total})</>
              }
            </button>
            <button
              onClick={handleCSVExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
            >
              <FileText className="w-4 h-4 text-sixate-purple" /> 📄 DOWNLOAD CSV
            </button>
          </div>
        </div>

        {/* Export Toast */}
        {exportToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{exportToast}</span>
          </div>
        )}

        {/* Error Banner */}
        {dbError && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-3 text-xs text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        {/* Info Note */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-sixate-purple shrink-0 mt-0.5" />
          <span>
            Charts use aggregated counters stored in Firestore (2 reads total). The Timeline chart requires loading all records — click the button below to load it on demand.
          </span>
        </div>

        {/* Status Summary Cards */}
        {!isLoading && total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Pending',     key: 'pending',     color: 'text-indigo-300',  border: 'border-indigo-500/30' },
              { label: 'Approved',    key: 'approved',    color: 'text-emerald-400', border: 'border-emerald-500/30' },
              { label: 'Shortlisted', key: 'shortlisted', color: 'text-amber-400',   border: 'border-amber-500/30' },
              { label: 'Rejected',    key: 'rejected',    color: 'text-rose-400',    border: 'border-rose-500/30' },
            ].map((s) => (
              <div key={s.key} className={`p-4 rounded-2xl bg-sixate-card/80 border ${s.border} shadow-md`}>
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className={`font-heading font-black text-2xl ${s.color} mt-1`}>{analyticsData[s.key] ?? 0}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {total > 0 ? `${Math.round(((analyticsData[s.key] ?? 0) / total) * 100)}%` : '—'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Loading Skeleton for Charts */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Chart 1: Registrations by Academic Year */}
            <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sixate-purple" /> Registrations by Year
                </h2>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Bar Chart</span>
              </div>
              {yearData.some((d) => d.count > 0) ? (
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearData}>
                      <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#7C3AED', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#10B981' }}
                      />
                      <Bar dataKey="count" fill="#7C3AED" radius={[8, 8, 0, 0]}>
                        {yearData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No year data yet — submit some applications to populate this chart.
                </div>
              )}
            </div>

            {/* Chart 2: Registrations by Department */}
            <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-sixate-green" /> Registrations by Department
                </h2>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Pie Chart</span>
              </div>
              {deptData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deptData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#10B981', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: '11px', color: '#94A3B8', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No department data yet.
                </div>
              )}
            </div>

            {/* Chart 3: Most Popular Mathematics Interests */}
            <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-sixate-purple" /> Popular Mathematics Interests
                </h2>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Top 8</span>
              </div>
              {interestData.length > 0 ? (
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={interestData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={150} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#7C3AED', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]}>
                        {interestData.map((_, index) => (
                          <Cell key={`cell-int-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                  No interest data yet.
                </div>
              )}
            </div>

            {/* Chart 4: Registrations Over Time (on-demand) */}
            <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sixate-green" /> Registrations Over Time
                </h2>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Timeline</span>
              </div>

              {!fullData && !isLoadingFull && (
                <div className="h-72 flex flex-col items-center justify-center gap-4">
                  <p className="text-slate-400 text-xs text-center">
                    Timeline requires loading all records from Firestore.<br />
                    Click below to load on demand.
                  </p>
                  <button
                    onClick={handleLoadTimeline}
                    className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-sixate-purple hover:bg-sixate-violet flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" /> LOAD TIMELINE DATA
                  </button>
                </div>
              )}

              {isLoadingFull && (
                <div className="h-72 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-sixate-purple" />
                  <span className="ml-3 text-slate-400 text-sm">Loading all records…</span>
                </div>
              )}

              {fullData && timeData.length > 0 && (
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeData}>
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#10B981', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="submissions" stroke="#10B981" strokeWidth={3} dot={{ fill: '#7C3AED', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {fullData && timeData.length === 0 && (
                <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
                  No timeline data available.
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
