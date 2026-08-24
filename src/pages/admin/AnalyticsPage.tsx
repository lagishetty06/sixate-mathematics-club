import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  fetchAllApplicationsForExport,
  db,
} from '../../lib/firebase';
import { StudentApplication } from '../../types';
import { doc, setDoc } from 'firebase/firestore';

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

export const AnalyticsPage: React.FC = () => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [dbError, setDbError]           = useState<string | null>(null);
  const [exportToast, setExportToast]   = useState<string | null>(null);
  const [isExporting, setIsExporting]   = useState(false);

  // ── Load live applications & calculate analytics dynamically ─────────────
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const data = await fetchAllApplicationsForExport();
      setApplications(data);

      // Best-effort: sync analytics counter document in Firestore
      try {
        const counts: Record<string, number> = {
          total:       data.length,
          pending:     0,
          approved:    0,
          shortlisted: 0,
          rejected:    0,
        };

        data.forEach((app) => {
          // Status
          const st = app.status || 'pending';
          counts[st] = (counts[st] || 0) + 1;

          // Department
          const normDept = (app.department || 'Other').replace(/[^a-zA-Z0-9]/g, '_');
          counts[`dept_${normDept}`] = (counts[`dept_${normDept}`] || 0) + 1;

          // Year
          const normYear = (app.year || '1st Year').replace(/[^a-zA-Z0-9]/g, '_');
          counts[`year_${normYear}`] = (counts[`year_${normYear}`] || 0) + 1;

          // Interests
          (app.interests || []).forEach((interest) => {
            const key = `interest_${interest.replace(/[^a-zA-Z0-9]/g, '_')}`;
            counts[key] = (counts[key] || 0) + 1;
          });
        });

        await setDoc(doc(db, 'counters', 'analytics'), counts, { merge: true });
      } catch (syncErr) {
        console.warn('[SIXATE] Analytics doc sync notice:', syncErr);
      }
    } catch (err: any) {
      setDbError(err.message || 'Unable to load student registration data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ── Derive Status Counts ──────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    let pending = 0, approved = 0, shortlisted = 0, rejected = 0;
    applications.forEach((app) => {
      if (app.status === 'approved') approved++;
      else if (app.status === 'shortlisted') shortlisted++;
      else if (app.status === 'rejected') rejected++;
      else pending++;
    });
    return { total: applications.length, pending, approved, shortlisted, rejected };
  }, [applications]);

  // ── Derive Year Chart Data ────────────────────────────────────────────────
  const yearData = useMemo(() => {
    const counts: Record<string, number> = {
      '1st Year': 0,
      '2nd Year': 0,
      '3rd Year': 0,
      '4th Year': 0,
    };
    applications.forEach((app) => {
      if (app.year && counts[app.year] !== undefined) {
        counts[app.year]++;
      }
    });
    return Object.entries(counts).map(([year, count]) => ({ year, count }));
  }, [applications]);

  // ── Derive Department Chart Data ──────────────────────────────────────────
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      const dept = app.department || 'Other';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [applications]);

  // ── Derive Interests Chart Data ───────────────────────────────────────────
  const interestData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      if (Array.isArray(app.interests)) {
        app.interests.forEach((interest) => {
          counts[interest] = (counts[interest] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [applications]);

  // ── Derive Timeline Chart Data ───────────────────────────────────────────
  const timeData = useMemo(() => {
    const dateCounts: Record<string, number> = {};
    applications.forEach((app) => {
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
  }, [applications]);

  // ── Export Handlers ───────────────────────────────────────────────────────
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const data = applications.length > 0 ? applications : await fetchAllApplicationsForExport();
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
      const data = applications.length > 0 ? applications : await fetchAllApplicationsForExport();
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

  const total = statusCounts.total;

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
                {isLoading ? 'Loading…' : `${total} Submissions`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live metrics dynamically calculated from all student applications in Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAnalytics}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH ANALYTICS
            </button>
            <button
              onClick={handleExcelExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isExporting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> EXPORTING...</>
                : <><FileSpreadsheet className="w-4 h-4" /> 📊 DOWNLOAD EXCEL ({total})</>
              }
            </button>
            <button
              onClick={handleCSVExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
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
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-sixate-purple shrink-0 mt-0.5" />
          <span>
            Analytics graphs update automatically whenever a student submits a registration form or status changes.
          </span>
        </div>

        {/* Status Summary Cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Pending',     val: statusCounts.pending,     color: 'text-indigo-300',  border: 'border-indigo-500/30' },
              { label: 'Approved',    val: statusCounts.approved,    color: 'text-emerald-400', border: 'border-emerald-500/30' },
              { label: 'Shortlisted', val: statusCounts.shortlisted, color: 'text-amber-400',   border: 'border-amber-500/30' },
              { label: 'Rejected',    val: statusCounts.rejected,    color: 'text-rose-400',    border: 'border-rose-500/30' },
            ].map((s) => (
              <div key={s.label} className={`p-4 rounded-2xl bg-sixate-card/80 border ${s.border} shadow-md`}>
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className={`font-heading font-black text-2xl ${s.color} mt-1`}>{s.val}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {total > 0 ? `${Math.round((s.val / total) * 100)}% of total` : '—'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
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
                  No year data available.
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
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {deptData.map((_, index) => (
                          <Cell key={`cell-dept-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  No department data available.
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
                      <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={140} />
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
                  No interest data available.
                </div>
              )}
            </div>

            {/* Chart 4: Registrations Over Time */}
            <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sixate-green" /> Registrations Over Time
                </h2>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Timeline</span>
              </div>
              {timeData.length > 0 ? (
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
              ) : (
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
