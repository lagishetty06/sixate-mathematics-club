import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  fetchApplicationsPage,
  fetchAllApplicationsForExport,
  getApplicationCount,
  PAGE_SIZE,
} from '../../lib/firebase';
import { StudentApplication, ApplicationStatus, ApplicationFilterState } from '../../types';
import { QueryDocumentSnapshot } from 'firebase/firestore';

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
  RefreshCw,
  Download,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// StudentsPage — server-side paginated Admin Dashboard
//
// Firestore reads per page navigation: exactly PAGE_SIZE (25) document reads.
// Status filter uses Firestore where() clause — NOT client-side filter.
// Search is client-side on the current page (25 records) for name/roll/email.
// Full-text search across all records is handled by exact roll-number lookup.
// ─────────────────────────────────────────────────────────────────────────────

export const StudentsPage: React.FC = () => {
  // Current page of applications (up to PAGE_SIZE records)
  const [applications, setApplications]     = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [isExporting, setIsExporting]       = useState(false);
  const [dbError, setDbError]               = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentApplication | null>(null);
  const [exportToast, setExportToast]       = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage]       = useState(1);
  const [totalCount, setTotalCount]         = useState(0);
  const [hasMore, setHasMore]               = useState(false);
  // Cursor stack: index 0 = before page 1 (null), index N = cursor for page N+1
  const cursorStackRef = useRef<Array<QueryDocumentSnapshot | null>>([null]);

  // Status filter (server-side Firestore query)
  const [statusFilter, setStatusFilter]     = useState<ApplicationStatus | 'All'>('All');

  // Local search query (client-side across the current PAGE_SIZE records)
  const [localSearch, setLocalSearch]       = useState('');

  // Other client-side filters (applied to current page only — acceptable at 25 records)
  const [filters, setFilters] = useState<Omit<ApplicationFilterState, 'searchQuery' | 'status'>>({
    department: 'All',
    year:       'All',
    interest:   'All',
  });

  const departments  = ['All', 'CSE', 'CSE (AI & ML)', 'CSE (Data Science)', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
  const years        = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
  const statuses: Array<ApplicationStatus | 'All'> = ['All', 'pending', 'approved', 'shortlisted', 'rejected'];
  const interestsList = [
    'All', 'Algebra', 'Calculus', 'Geometry', 'Statistics', 'Probability',
    'Number Theory', 'Discrete Mathematics', 'Logical Reasoning',
    'Mathematical Puzzles', 'Competitive Mathematics', 'Cryptography', 'Applied Mathematics',
  ];

  // ── Load a page from Firestore ─────────────────────────────────────────────
  const loadPage = useCallback(async (
    page:          number,
    cursorStack:   Array<QueryDocumentSnapshot | null>,
    statusFilt:    ApplicationStatus | 'All'
  ) => {
    setIsLoading(true);
    setDbError(null);
    try {
      const cursor = cursorStack[page - 1] ?? null;
      const result = await fetchApplicationsPage(PAGE_SIZE, cursor, statusFilt);
      setApplications(result.applications);
      setHasMore(result.hasMore);

      // Store cursor for the next page
      if (result.lastDoc && cursorStack.length <= page) {
        cursorStack.push(result.lastDoc);
      }
    } catch (err: any) {
      setDbError(err.message || 'Unable to load applications from Firestore.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load total count (1 read via count aggregation) ────────────────────────
  const loadCount = useCallback(async (statusFilt: ApplicationStatus | 'All') => {
    try {
      const count = await getApplicationCount(statusFilt);
      setTotalCount(count);
    } catch {
      // Non-fatal — count display degrades gracefully
    }
  }, []);

  // ── Initial load + reload on status filter change ─────────────────────────
  useEffect(() => {
    // Reset cursor stack and page when filter changes
    cursorStackRef.current = [null];
    setCurrentPage(1);
    setLocalSearch('');
    loadPage(1, cursorStackRef.current, statusFilter);
    loadCount(statusFilter);
  }, [statusFilter, loadPage, loadCount]);

  // ── Pagination handlers ────────────────────────────────────────────────────
  const handleNextPage = () => {
    if (!hasMore || isLoading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadPage(nextPage, cursorStackRef.current, statusFilter);
  };

  const handlePrevPage = () => {
    if (currentPage <= 1 || isLoading) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    loadPage(prevPage, cursorStackRef.current, statusFilter);
  };

  const handleRefresh = () => {
    // Reload current page
    loadPage(currentPage, cursorStackRef.current, statusFilter);
    loadCount(statusFilter);
  };

  // ── Status filter change ───────────────────────────────────────────────────
  const handleStatusFilterChange = (newStatus: ApplicationStatus | 'All') => {
    setStatusFilter(newStatus);
    // Reset will happen via useEffect
  };

  // ── Clear all filters ──────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setFilters({ department: 'All', year: 'All', interest: 'All' });
    setLocalSearch('');
    setStatusFilter('All');
  };

  // ── Student update (after CONFIRM CHANGE) ─────────────────────────────────
  const handleStudentUpdate = (updated: StudentApplication) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedStudent(updated);
    // Refresh count (status changed)
    loadCount(statusFilter);
  };

  // ── Client-side filtering on the current page (25 records — cheap) ─────────
  const visibleStudents = applications.filter((app) => {
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      const matchesName  = app.fullName.toLowerCase().includes(q);
      const matchesRoll  = app.rollNumberDisplay.toLowerCase().includes(q) || app.rollNumber.toLowerCase().includes(q);
      const matchesAppId = app.applicationId.toLowerCase().includes(q);
      const matchesEmail = app.emailDisplay.toLowerCase().includes(q) || app.email.toLowerCase().includes(q);
      if (!matchesName && !matchesRoll && !matchesAppId && !matchesEmail) return false;
    }
    if (filters.department !== 'All') {
      if (filters.department === 'Other') { if (app.department !== 'Other') return false; }
      else if (app.department !== filters.department) return false;
    }
    if (filters.year !== 'All' && app.year !== filters.year) return false;
    if (filters.interest !== 'All' && !app.interests.includes(filters.interest)) return false;
    return true;
  });

  // ── Export handlers (explicit full-collection fetch — intentional) ─────────
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const allData = await fetchAllApplicationsForExport(
        statusFilter !== 'All' ? statusFilter : 'All'
      );
      const filename = await exportStudentsToExcel(
        allData,
        `SIXATE MATHEMATICS CLUB — STUDENT REGISTRATIONS (${allData.length} RECORDS)`
      );
      setExportToast(`✓ Excel downloaded — ${allData.length} records exported as ${filename}`);
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
      const allData = await fetchAllApplicationsForExport(
        statusFilter !== 'All' ? statusFilter : 'All'
      );
      const filename = exportStudentsToCSV(allData);
      setExportToast(`✓ CSV downloaded — ${allData.length} records exported as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch {
      setExportToast('⚠️ Unable to generate CSV file. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination display values
  const startIndex  = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex    = Math.min(startIndex + applications.length - 1, totalCount || (startIndex + applications.length - 1));
  const totalPages  = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : (hasMore ? currentPage + 1 : currentPage);

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col md:flex-row font-body">
      <AdminSidebar />

      <main className="flex-grow md:ml-64 p-6 sm:p-10 space-y-6 overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                WHO JOINED SIXATE?
              </h1>
              <span className="px-3 py-1 rounded-full bg-sixate-purple/20 border border-sixate-purple/40 text-sixate-green font-mono font-bold text-xs">
                {totalCount > 0 ? `${totalCount} Total` : `${applications.length} Loaded`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Paginated — loading {PAGE_SIZE} applications per page from Firestore.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              title="Refresh current page"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
            </button>

            <button
              onClick={handleExcelExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isExporting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> EXPORTING...</>
                : <><FileSpreadsheet className="w-4 h-4" /> 📊 DOWNLOAD EXCEL</>
              }
            </button>

            <button
              onClick={handleCSVExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
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
          <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <h3 className="font-heading font-bold text-sm text-rose-200">Unable to load applications</h3>
                <p className="text-xs text-rose-300/80 mt-0.5">{dbError}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl font-heading font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> TRY AGAIN
            </button>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">

          {/* Search Bar (local — within current 25-record page) */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search this page by Name, Roll Number, Application ID, or Email..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple text-xs font-body"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">

            {/* Status filter — triggers Firestore where() query */}
            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">
                Status <span className="text-sixate-purple">(Firestore)</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as ApplicationStatus | 'All')}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Department filter — client-side on current page */}
            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Year filter — client-side on current page */}
            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Math Interest — client-side on current page */}
            <div>
              <label className="text-[10px] font-heading font-bold text-slate-400 uppercase block mb-1">Math Interest</label>
              <select
                value={filters.interest}
                onChange={(e) => setFilters((prev) => ({ ...prev, interest: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sixate-purple"
              >
                {interestsList.map((i) => <option key={i} value={i}>{i}</option>)}
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

        {/* Applications Table */}
        <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-4 shadow-xl">

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 rounded-xl bg-slate-800/50 animate-pulse w-full" />
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-800/30 animate-pulse w-full" style={{ opacity: 1 - i * 0.03 }} />
              ))}
            </div>
          ) : (
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
                  {visibleStudents.length > 0 ? (
                    visibleStudents.map((s) => (
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
                            s.status === 'approved'    ? 'bg-emerald-500/15 text-emerald-400' :
                            s.status === 'rejected'    ? 'bg-rose-500/15 text-rose-400'       :
                            s.status === 'shortlisted' ? 'bg-amber-500/15 text-amber-400'     :
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
                        {localSearch.trim() || filters.department !== 'All' || filters.year !== 'All' || filters.interest !== 'All'
                          ? 'No matching records on this page. Try clearing filters or navigating to another page.'
                          : 'No applications found for this status filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && applications.length > 0 && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div>
                <p>
                  Page <strong className="text-white">{currentPage}</strong>
                  {totalCount > 0 && (
                    <> of <strong className="text-white">{totalPages}</strong></>
                  )}
                  {' '}— Showing{' '}
                  <strong className="text-white">{applications.length}</strong> records
                  {totalCount > 0 && (
                    <> of <strong className="text-sixate-green">{totalCount}</strong> total</>
                  )}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  ✓ Only {PAGE_SIZE} documents fetched from Firestore per page
                  {statusFilter !== 'All' && ` (filtered by status: ${statusFilter})`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="px-3 font-mono text-slate-300 text-xs">
                  Page {currentPage}{totalCount > 0 ? ` / ${totalPages}` : ''}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMore || isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
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
