import React, { useState, useEffect, useMemo } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { fetchAllApplications, subscribeToApplications } from '../../lib/firebase';
import { StudentApplication, ApplicationFilterState } from '../../types';

import { exportStudentsToExcel, exportStudentsToCSV, formatDateTime } from '../../lib/exportEngine';
import { StudentDetailModal } from '../../components/admin/StudentDetailModal';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Eye, 
  FileSpreadsheet, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentApplication | null>(null);
  
  // Toast Notification State
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filter State
  const [filters, setFilters] = useState<ApplicationFilterState>({
    searchQuery: '',
    department: 'All',
    year: 'All',
    status: 'All',
    interest: 'All'
  });


  useEffect(() => {
    setIsLoading(true);
    setDbError(null);
    const unsubscribe = subscribeToApplications(
      (data) => {
        setApplications(data);
        setIsLoading(false);
        setDbError(null);
      },
      (err) => {
        setIsLoading(false);
        setDbError(err.message || 'Unable to connect to Firebase Firestore database.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const data = await fetchAllApplications();
      setApplications(data);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setDbError(err.message || 'Unable to load student registrations from Firestore.');
    }
  };

  const departments = ['All', 'CSE', 'CSE (AI & ML)', 'CSE (Data Science)', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
  const years = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
  const statuses = ['All', 'pending', 'approved', 'shortlisted', 'rejected'];
  const interestsList = [
    'All', 'Algebra', 'Calculus', 'Geometry', 'Statistics', 'Probability', 
    'Number Theory', 'Discrete Mathematics', 'Logical Reasoning', 
    'Mathematical Puzzles', 'Competitive Mathematics', 'Cryptography', 'Applied Mathematics'
  ];

  // Filter & Search Logic (Same dataset powers view and exports)
  const filteredStudents = useMemo(() => {
    return applications.filter((app) => {
      // Search Query Match
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesName = app.fullName.toLowerCase().includes(q);
        const matchesRoll = app.rollNumberDisplay.toLowerCase().includes(q) || app.rollNumber.toLowerCase().includes(q);
        const matchesAppId = app.applicationId.toLowerCase().includes(q);
        const matchesEmail = app.emailDisplay.toLowerCase().includes(q) || app.email.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesAppId && !matchesEmail) {
          return false;
        }
      }

      // Department Match
      if (filters.department !== 'All') {
        if (filters.department === 'Other') {
          if (app.department !== 'Other') return false;
        } else if (app.department !== filters.department) {
          return false;
        }
      }

      // Year Match
      if (filters.year !== 'All' && app.year !== filters.year) {
        return false;
      }

      // Status Match
      if (filters.status !== 'All' && app.status !== filters.status) {
        return false;
      }

      // Interest Match
      if (filters.interest !== 'All') {
        if (!app.interests.includes(filters.interest)) {
          return false;
        }
      }

      return true;
    });
  }, [applications, filters]);

  // Pagination Calculation
  const totalRecords = filteredStudents.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      department: 'All',
      year: 'All',
      status: 'All',
      interest: 'All'
    });
    setCurrentPage(1);
  };

  const handleStudentUpdate = (updated: StudentApplication) => {
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelectedStudent(updated);
  };

  // EXCEL & CSV EXPORT HANDLERS (Uses filtered dataset!)
  const handleExcelExport = async () => {
    try {
      const filename = await exportStudentsToExcel(
        filteredStudents, 
        `SIXATE MATHEMATICS CLUB — STUDENT REGISTRATIONS (${filteredStudents.length} RECORDS)`
      );
      setExportToast(`✓ Excel file downloaded successfully — ${filteredStudents.length} student records exported as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      setExportToast('⚠️ Unable to generate Excel file. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  const handleCSVExport = () => {
    try {
      const filename = exportStudentsToCSV(filteredStudents);
      setExportToast(`✓ CSV file downloaded successfully — ${filteredStudents.length} student records exported as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      setExportToast('⚠️ Unable to generate CSV file. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col md:flex-row font-body">
      <AdminSidebar />

      <main className="flex-grow md:ml-64 p-6 sm:p-10 space-y-6 overflow-x-hidden">
        
        {/* Header Bar with Export Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                WHO JOINED SIXATE?
              </h1>
              <span className="px-3 py-1 rounded-full bg-sixate-purple/20 border border-sixate-purple/40 text-sixate-green font-mono font-bold text-xs">
                {totalRecords} {totalRecords === 1 ? 'Student' : 'Students'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manage and review all public student registration records.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              className="px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Refresh Firestore Applications Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
            </button>

            <button
              onClick={handleExcelExport}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> 📊 DOWNLOAD EXCEL ({filteredStudents.length})
            </button>

            <button
              onClick={handleCSVExport}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sixate-purple" /> 📄 DOWNLOAD CSV
            </button>
          </div>
        </div>

        {/* Export Toast Notification */}
        {exportToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{exportToast}</span>
          </div>
        )}

        {/* Database Error Banner */}
        {dbError && (
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <h3 className="font-heading font-bold text-sm text-rose-200">Unable to load student registrations</h3>
                <p className="text-xs text-rose-300/80 mt-0.5">{dbError}</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl font-heading font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> TRY AGAIN
            </button>
          </div>
        )}

        {/* Search & Filters Controls Container */}
        <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Search students by Full Name, Roll Number, Application ID, or Email..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple text-xs font-body"
            />
          </div>

          {/* Filters Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
            
            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, department: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, year: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {statuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">Math Interest</label>
              <select
                value={filters.interest}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, interest: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {interestsList.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> CLEAR FILTERS
              </button>
            </div>

          </div>
        </div>

        {/* Student Applications Table Container */}
        <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-heading font-semibold text-[11px]">
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">College Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4 text-right">View Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sixate-green">{s.applicationId}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{s.fullName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{s.rollNumberDisplay}</td>
                      <td className="py-3.5 px-4 text-slate-300">{s.department}</td>
                      <td className="py-3.5 px-4 text-slate-300">{s.year}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{s.emailDisplay}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{s.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                          s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                          s.status === 'rejected' ? 'bg-rose-500/15 text-rose-400' :
                          s.status === 'shortlisted' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-indigo-500/15 text-indigo-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{formatDateTime(s.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="px-3.5 py-1.5 rounded-lg bg-sixate-purple/20 hover:bg-sixate-purple text-sixate-purple hover:text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No student registration records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalRecords > 0 && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>
                Showing <strong className="text-white">{startIndex + 1}</strong>–
                <strong className="text-white">{Math.min(startIndex + pageSize, totalRecords)}</strong> of{' '}
                <strong className="text-sixate-green">{totalRecords}</strong> Students
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="px-3 font-mono text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Student Profile Modal */}
        {selectedStudent && (
          <StudentDetailModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onUpdate={handleStudentUpdate}
          />
        )}

      </main>
    </div>
  );
};
