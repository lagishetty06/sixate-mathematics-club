import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { fetchAllApplications, subscribeToApplications } from '../../lib/firebase';
import { StudentApplication } from '../../types';
import { formatDateTime } from '../../lib/exportEngine';
import { StudentDetailModal } from '../../components/admin/StudentDetailModal';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentApplication | null>(null);

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

  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const recentRegistrations = applications.slice(0, 7);

  const handleStudentUpdate = (updated: StudentApplication) => {
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelectedStudent(updated);
  };

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col md:flex-row font-body">
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 p-6 sm:p-10 space-y-8 overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
              SIXATE ADMIN DASHBOARD
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Overview of student registrations, approvals, and club metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Refresh Firestore Applications Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
            </button>
            <Link
              to="/admin/students"
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-lg shadow-sixate-purple/20 flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> MANAGE APPLICATIONS
            </Link>
          </div>
        </div>

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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="p-5 rounded-2xl bg-sixate-card/80 border border-sixate-purple/30 backdrop-blur-md space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-sixate-purple">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-400">Total</span>
              <Users className="w-5 h-5" />
            </div>
            <p className="font-heading font-black text-3xl text-white">{totalCount}</p>
            <p className="text-[10px] text-slate-500">All submissions</p>
          </div>

          <div className="p-5 rounded-2xl bg-sixate-card/80 border border-indigo-500/30 backdrop-blur-md space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-400">Pending</span>
              <Clock className="w-5 h-5" />
            </div>
            <p className="font-heading font-black text-3xl text-indigo-300">{pendingCount}</p>
            <p className="text-[10px] text-slate-500">Awaiting review</p>
          </div>

          <div className="p-5 rounded-2xl bg-sixate-card/80 border border-emerald-500/30 backdrop-blur-md space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-400">Approved</span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-heading font-black text-3xl text-emerald-400">{approvedCount}</p>
            <p className="text-[10px] text-sixate-green font-semibold">Active Members</p>
          </div>

          <div className="p-5 rounded-2xl bg-sixate-card/80 border border-amber-500/30 backdrop-blur-md space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-400">Shortlisted</span>
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="font-heading font-black text-3xl text-amber-400">{shortlistedCount}</p>
            <p className="text-[10px] text-slate-500">Under consideration</p>
          </div>

          <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-sixate-card/80 border border-rose-500/30 backdrop-blur-md space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-400">Rejected</span>
              <XCircle className="w-5 h-5" />
            </div>
            <p className="font-heading font-black text-3xl text-rose-400">{rejectedCount}</p>
            <p className="text-[10px] text-slate-500">Not approved</p>
          </div>

        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/students"
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sixate-purple/50 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-white group-hover:text-sixate-purple transition-colors">
                Manage Registrations
              </h3>
              <p className="text-xs text-slate-400">View, search, filter, approve or reject applications.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-sixate-purple transition-all" />
          </Link>

          <Link
            to="/admin/members"
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sixate-green/50 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-white group-hover:text-sixate-green transition-colors">
                Approved Members
              </h3>
              <p className="text-xs text-slate-400">View confirmed members roster with assigned Member IDs.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-sixate-green transition-all" />
          </Link>

          <Link
            to="/admin/analytics"
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sixate-purple/50 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-white group-hover:text-sixate-purple transition-colors">
                Analytics & Export
              </h3>
              <p className="text-xs text-slate-400">Visual branch breakdowns and formatted Excel/CSV exports.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-sixate-purple transition-all" />
          </Link>
        </div>

        {/* Recent Registrations Table */}
        <div className="p-6 sm:p-8 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg text-white">Recent Student Registrations</h2>
              <p className="text-xs text-slate-400">Latest applications submitted via the public student portal.</p>
            </div>
            <Link
              to="/admin/students"
              className="text-xs font-semibold text-sixate-purple hover:text-sixate-green flex items-center gap-1"
            >
              View All {totalCount} Students <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-heading font-semibold text-[11px]">
                  <th className="py-3 px-4">App ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRegistrations.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sixate-green">{s.applicationId}</td>
                    <td className="py-3 px-4 font-semibold text-white">{s.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{s.rollNumberDisplay}</td>
                    <td className="py-3 px-4 text-slate-300">{s.department}</td>
                    <td className="py-3 px-4 text-slate-300">{s.year}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                        s.status === 'rejected' ? 'bg-rose-500/15 text-rose-400' :
                        s.status === 'shortlisted' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-indigo-500/15 text-indigo-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{formatDateTime(s.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="px-3 py-1.5 rounded-lg bg-sixate-purple/20 hover:bg-sixate-purple text-sixate-purple hover:text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
