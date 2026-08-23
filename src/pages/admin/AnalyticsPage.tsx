import React, { useState, useEffect, useMemo } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { fetchAllApplications, subscribeToApplications } from '../../lib/firebase';
import { StudentApplication } from '../../types';
import { useAuth } from '../../context/AuthContext';
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
  Legend 
} from 'recharts';
import { exportStudentsToExcel, exportStudentsToCSV } from '../../lib/exportEngine';
import { BarChart3, TrendingUp, PieChart as PieIcon, Calendar, Compass, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const { currentUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToApplications((data) => {
      setApplications(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [authLoading, currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllApplications();
      setApplications(data);
    } catch (e) {}
    setIsLoading(false);
  };

  const handleExcelExport = async () => {
    try {
      const filename = await exportStudentsToExcel(
        applications, 
        `SIXATE MATHEMATICS CLUB — STUDENT REGISTRATIONS (${applications.length} RECORDS)`
      );
      setExportToast(`✓ Excel file downloaded successfully — ${applications.length} student records exported as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      setExportToast('⚠️ Unable to generate Excel file. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  const handleCSVExport = () => {
    try {
      const filename = exportStudentsToCSV(applications);
      setExportToast(`✓ CSV file downloaded successfully — ${applications.length} student records exported as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      setExportToast('⚠️ Unable to generate CSV file. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  // Helper to shorten long department titles for clean chart legibility
  const getShortDept = (dept: string) => {
    if (dept.includes('Computer Science')) return 'CSE';
    if (dept.includes('Information Tech')) return 'IT';
    if (dept.includes('Electronics & Comm')) return 'ECE';
    if (dept.includes('Electrical & Ele')) return 'EEE';
    if (dept.includes('Mechanical')) return 'ME';
    if (dept.includes('Civil')) return 'CE';
    if (dept.includes('Artificial Intelligence') || dept.includes('AI & DS')) return 'AI & DS';
    return dept;
  };

  // 1. Registrations by Academic Year
  const yearData = useMemo(() => {
    const counts: Record<string, number> = {
      '1st Year': 0,
      '2nd Year': 0,
      '3rd Year': 0,
      '4th Year': 0
    };
    applications.forEach(app => {
      const yearStr = app.year ? String(app.year).trim() : '1st Year';
      if (counts[yearStr] !== undefined) {
        counts[yearStr]++;
      } else {
        counts[yearStr] = (counts[yearStr] || 0) + 1;
      }
    });
    return Object.keys(counts).map(year => ({
      year,
      count: counts[year]
    }));
  }, [applications]);

  // 2. Registrations by Department
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      let dept = app.department || 'CSE';
      if (dept === 'Other' && app.departmentOther) {
        dept = `Other (${app.departmentOther.trim()})`;
      } else {
        dept = getShortDept(dept);
      }
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.keys(counts).map(dept => ({
      name: dept,
      value: counts[dept]
    }));
  }, [applications]);

  // 3. Most Popular Mathematics Interests
  const interestData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      if (Array.isArray(app.interests) && app.interests.length > 0) {
        app.interests.forEach(interest => {
          counts[interest] = (counts[interest] || 0) + 1;
        });
      } else {
        counts['General Mathematics'] = (counts['General Mathematics'] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .map(name => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 interests
  }, [applications]);

  // 4. Registrations Over Time (Grouped by Date)
  const timeData = useMemo(() => {
    const dateCounts: Record<string, number> = {};
    applications.forEach(app => {
      if (app.createdAt) {
        const rawDate = app.createdAt.substring(0, 10);
        dateCounts[rawDate] = (dateCounts[rawDate] || 0) + 1;
      }
    });
    const sortedRawDates = Object.keys(dateCounts).sort();
    if (sortedRawDates.length === 0) {
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return [{ date: todayStr, submissions: applications.length }];
    }
    return sortedRawDates.map(rawDate => {
      const parts = rawDate.split('-');
      let formattedDate = rawDate;
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return {
        date: formattedDate,
        submissions: dateCounts[rawDate]
      };
    });
  }, [applications]);

  const COLORS = ['#6D28D9', '#7C3AED', '#10B981', '#06B6D4', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6'];

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
                Live Real-Time Data ({applications.length} Records)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visual graphs, branch distributions, and interest metrics powered by Firestore registration data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExcelExport}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> 📊 DOWNLOAD EXCEL ({applications.length})
            </button>

            <button
              onClick={handleCSVExport}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sixate-purple" /> 📄 DOWNLOAD CSV
            </button>
          </div>
        </div>

        {exportToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{exportToast}</span>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Registrations by Academic Year */}
          <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sixate-purple" /> Registrations by Year
              </h2>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Bar Chart</span>
            </div>
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
                    {yearData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Registrations by Department */}
          <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-sixate-green" /> Registrations by Department
              </h2>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Pie Chart</span>
            </div>
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
                    {deptData.map((entry, index) => (
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
          </div>

          {/* Chart 3: Most Popular Mathematics Interests */}
          <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-sixate-purple" /> Popular Mathematics Interests
              </h2>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Top 8 Topics</span>
            </div>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interestData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={150} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#7C3AED', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]}>
                    {interestData.map((entry, index) => (
                      <Cell key={`cell-int-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Registrations Over Time */}
          <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sixate-green" /> Registrations Over Time
              </h2>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Timeline</span>
            </div>
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
          </div>
        </div>

      </main>
    </div>
  );
};
