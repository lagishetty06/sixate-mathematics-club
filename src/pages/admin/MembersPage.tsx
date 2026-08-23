import React, { useState, useEffect, useMemo } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { fetchAllApplications, subscribeToApplications } from '../../lib/firebase';
import { StudentApplication } from '../../types';
import { exportStudentsToExcel, exportStudentsToCSV, formatDateTime } from '../../lib/exportEngine';
import { StudentDetailModal } from '../../components/admin/StudentDetailModal';
import { 
  UserCheck, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Eye, 
  User, 
  CheckCircle2 
} from 'lucide-react';

export const MembersPage: React.FC = () => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<StudentApplication | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToApplications((data) => {
      setApplications(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllApplications();
      setApplications(data);
    } catch (e) {}
    setIsLoading(false);
  };

  // Filter approved members only
  const approvedMembers = useMemo(() => {
    return applications.filter((s) => {
      if (s.status !== 'approved') return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const mName = s.fullName.toLowerCase().includes(q);
        const mRoll = s.rollNumberDisplay.toLowerCase().includes(q);
        const mMemberId = (s.memberId || '').toLowerCase().includes(q);
        if (!mName && !mRoll && !mMemberId) return false;
      }

      if (selectedDept !== 'All' && s.department !== selectedDept) {
        return false;
      }

      return true;
    });
  }, [applications, searchQuery, selectedDept]);

  const handleStudentUpdate = (updated: StudentApplication) => {
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelectedStudent(updated);
  };

  const handleExcelExport = async () => {
    try {
      const filename = await exportStudentsToExcel(
        approvedMembers,
        `SIXATE MATHEMATICS CLUB — OFFICIAL MEMBERS ROSTER (${approvedMembers.length} MEMBERS)`,
        'sixate-members'
      );
      setExportToast(`✓ Excel roster exported successfully as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      setExportToast('⚠️ Failed to generate Excel roster. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  const handleCSVExport = () => {
    try {
      const filename = exportStudentsToCSV(approvedMembers, 'sixate-members');
      setExportToast(`✓ CSV roster exported successfully as ${filename}`);
      setTimeout(() => setExportToast(null), 5000);
    } catch (e) {
      setExportToast('⚠️ Failed to generate CSV roster. Please try again.');
      setTimeout(() => setExportToast(null), 5000);
    }
  };

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
                {approvedMembers.length} Confirmed Members
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Official roster of approved student members with assigned SIXATE Member IDs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExcelExport}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> EXPORT MEMBERS EXCEL ({approvedMembers.length})
            </button>

            <button
              onClick={handleCSVExport}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-sixate-purple" /> EXPORT CSV
            </button>
          </div>
        </div>

        {exportToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{exportToast}</span>
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
              placeholder="Search approved members by Name, Roll Number, or Member ID..."
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
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
          </select>
        </div>

        {/* Members Table */}
        <div className="p-6 rounded-3xl bg-sixate-card/80 border border-slate-800 shadow-xl">
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
                {approvedMembers.length > 0 ? (
                  approvedMembers.map((m) => (
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
                      No approved club members found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
