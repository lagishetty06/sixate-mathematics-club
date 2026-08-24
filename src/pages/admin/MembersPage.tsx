import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  fetchApplicationsPage,
  fetchAllApplicationsForExport,
  getApplicationCount,
  PAGE_SIZE,
} from '../../lib/firebase';
import { StudentApplication } from '../../types';
import { QueryDocumentSnapshot } from 'firebase/firestore';

import { exportStudentsToExcel, exportStudentsToCSV, formatDateTime } from '../../lib/exportEngine';
import { StudentDetailModal } from '../../components/admin/StudentDetailModal';
import {
  UserCheck,
  Search,
  FileSpreadsheet,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const MembersPage: React.FC = () => {
  // Current page of approved members
  const [members, setMembers]           = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isExporting, setIsExporting]   = useState(false);
  const [dbError, setDbError]           = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<StudentApplication | null>(null);
  const [exportToast, setExportToast]   = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalCount, setTotalCount]     = useState(0);
  const [hasMore, setHasMore]           = useState(false);
  const cursorStackRef = useRef<Array<QueryDocumentSnapshot | null>>([null]);

  // ── Load one page of approved members ──────────────────────────────────────
  const loadPage = useCallback(async (
    page:        number,
    cursorStack: Array<QueryDocumentSnapshot | null>
  ) => {
    setIsLoading(true);
    setDbError(null);
    try {
      const cursor = cursorStack[page - 1] ?? null;
      const result = await fetchApplicationsPage(PAGE_SIZE, cursor, 'approved');
      setMembers(result.applications);
      setHasMore(result.hasMore);

      if (result.lastDoc && cursorStack.length <= page) {
        cursorStack.push(result.lastDoc);
      }
    } catch (err: any) {
      setDbError(err.message || 'Unable to load members from Firestore.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load total approved count ───────────────────────────────────────────────
  const loadCount = useCallback(async () => {
    try {
      const count = await getApplicationCount('approved');
      setTotalCount(count);
    } catch {/* non-fatal */}
  }, []);

  useEffect(() => {
    cursorStackRef.current = [null];
    setCurrentPage(1);
    loadPage(1, cursorStackRef.current);
    loadCount();
  }, [loadPage, loadCount]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const handleNextPage = () => {
    if (!hasMore || isLoading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadPage(nextPage, cursorStackRef.current);
  };

  const handlePrevPage = () => {
    if (currentPage <= 1 || isLoading) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    loadPage(prevPage, cursorStackRef.current);
  };

  const handleRefresh = () => {
    loadPage(currentPage, cursorStackRef.current);
    loadCount();
  };

  // ── Student update ────────────────────────────────────────────────────────
  const handleStudentUpdate = (updated: StudentApplication) => {
    setMembers((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedStudent(updated);
    loadCount();
  };

  // ── Client-side filter on current page (25 records — cheap) ──────────────
  const visibleMembers = members.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mName     = m.fullName.toLowerCase().includes(q);
      const mRoll     = m.rollNumberDisplay.toLowerCase().includes(q);
      const mMemberId = (m.memberId || '').toLowerCase().includes(q);
      if (!mName && !mRoll && !mMemberId) return false;
    }
    if (selectedDept !== 'All' && m.department !== selectedDept) return false;
    return true;
  });

  // ── Export (intentional full-collection fetch) ────────────────────────────
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const allMembers = await fetchAllApplicationsForExport('approved');
      const filename = await exportStudentsToExcel(
        allMembers,
        `SIXATE MATHEMATICS CLUB — OFFICIAL MEMBERS ROSTER (${allMembers.length} MEMBERS)`,
        'sixate-members'
      );
      setExportToast(`✓ Excel roster exported — ${allMembers.length} members as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch {
      setExportToast('⚠️ Failed to generate Excel roster. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      const allMembers = await fetchAllApplicationsForExport('approved');
      const filename = exportStudentsToCSV(allMembers, 'sixate-members');
      setExportToast(`✓ CSV roster exported — ${allMembers.length} members as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch {
      setExportToast('⚠️ Failed to generate CSV roster. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : (hasMore ? currentPage + 1 : currentPage);

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col md:flex-row font-body">
      <AdminSidebar />

      <main className="flex-grow md:ml-64 p-6 sm:p-10 space-y-6 overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                SIXATE MEMBERS
              </h1>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs">
                {totalCount > 0 ? `${totalCount} Confirmed Members` : `${members.length} Loaded`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Official roster of approved student members — paginated from Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
            </button>
            <button
              onClick={handleExcelExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-60"
            >
              {isExporting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> EXPORTING...</>
                : <><FileSpreadsheet className="w-4 h-4" /> EXPORT MEMBERS EXCEL ({totalCount || ''})</>
              }
            </button>
            <button
              onClick={handleCSVExport}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 disabled:opacity-60"
            >
              <FileText className="w-4 h-4 text-sixate-purple" /> EXPORT CSV
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
                <h3 className="font-heading font-bold text-sm text-rose-200">Unable to load members</h3>
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

        {/* Filter Controls */}
        <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 flex flex-col sm:flex-row gap-4 shadow-xl">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search this page by Name, Roll Number, or Member ID..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sixate-purple"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sixate-purple"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="CSE (AI & ML)">CSE (AI & ML)</option>
            <option value="CSE (Data Science)">CSE (Data Science)</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
          </select>
        </div>

        {/* Members Table */}
        <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 shadow-xl space-y-4">

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 rounded-xl bg-slate-800/50 animate-pulse w-full" />
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-800/30 animate-pulse w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-heading font-semibold text-[11px]">
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Math Interests</th>
                    <th className="py-3 px-4">Approved Date</th>
                    <th className="py-3 px-4 text-right">View Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visibleMembers.length > 0 ? (
                    visibleMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-sixate-purple">{m.memberId || 'SIXATE-M-0001'}</td>
                        <td className="py-3.5 px-4">
                          {m.profilePhotoUrl ? (
                            <img src={m.profilePhotoUrl} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-sixate-purple/20 text-sixate-purple flex items-center justify-center font-bold text-xs">
                              {m.fullName.charAt(0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">{m.fullName}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{m.rollNumberDisplay}</td>
                        <td className="py-3.5 px-4 text-slate-300">{m.department}</td>
                        <td className="py-3.5 px-4 text-slate-300">{m.year}</td>
                        <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">
                          {Array.isArray(m.interests) ? m.interests.slice(0, 3).join(', ') : m.interests}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{formatDateTime(m.createdAt)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedStudent(m)}
                            className="px-3.5 py-1.5 rounded-lg bg-sixate-purple/20 hover:bg-sixate-purple text-sixate-purple hover:text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No approved club members found on this page.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && members.length > 0 && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>
                Page <strong className="text-white">{currentPage}</strong>
                {totalCount > 0 && <> of <strong className="text-white">{totalPages}</strong></>}
                {' '}— Showing <strong className="text-white">{members.length}</strong> members
                {totalCount > 0 && <> of <strong className="text-sixate-green">{totalCount}</strong> total</>}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="px-3 font-mono text-slate-300">
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
