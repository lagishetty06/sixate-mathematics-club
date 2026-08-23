import React, { useState } from 'react';
import { StudentApplication, ApplicationStatus } from '../../types';
import { updateApplicationStatusInDb } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/exportEngine';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  BookOpen, 
  Compass, 
  Trophy, 
  FileText, 
  Link as LinkIcon,
  ShieldCheck,
  Star,
  ExternalLink,
  History,
  AlertCircle
} from 'lucide-react';

interface StudentDetailModalProps {
  student: StudentApplication | null;
  onClose: () => void;
  onUpdate: (updated: StudentApplication) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose, onUpdate }) => {
  const { currentUser } = useAuth();
  const [confirmStatus, setConfirmStatus] = useState<ApplicationStatus | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (!student) return null;

  const handleActionClick = (targetStatus: ApplicationStatus) => {
    setConfirmStatus(targetStatus);
    setActionNotes('');
    setModalError(null);
  };

  const handleConfirmUpdate = async () => {
    if (!confirmStatus) return;
    setIsUpdating(true);
    setModalError(null);
    console.log(`[SIXATE] Confirm status change clicked`);
    console.log(`[SIXATE] Application ID: ${student.id}`);
    console.log(`[SIXATE] New status: ${confirmStatus}`);
    try {
      console.log(`[SIXATE] Updating Firestore...`);
      const updated = await updateApplicationStatusInDb(
        student.id, 
        confirmStatus, 
        currentUser?.email || 'admin@sixate.edu',
        actionNotes
      );
      console.log(`[SIXATE] Status updated successfully`);
      onUpdate(updated);
      setConfirmStatus(null);
    } catch (err: any) {
      console.error(`[SIXATE] Status update failed:`, err);
      setModalError(err.message || 'Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadges = {
    pending: { bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', label: 'PENDING REVIEW' },
    approved: { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'APPROVED MEMBER' },
    shortlisted: { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'SHORTLISTED' },
    rejected: { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30', label: 'REJECTED' },
  };

  const badge = statusBadges[student.status] || statusBadges.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="max-w-4xl w-full max-h-[90vh] bg-sixate-card border border-sixate-purple/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {student.profilePhotoUrl ? (
              <img src={student.profilePhotoUrl} alt={student.fullName} className="w-12 h-12 rounded-2xl object-cover border border-sixate-purple/40" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-sixate-purple/20 border border-sixate-purple/40 text-sixate-purple flex items-center justify-center font-bold text-lg">
                {student.fullName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-heading font-black text-xl text-white">{student.fullName}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                App ID: <span className="text-sixate-green font-bold">{student.applicationId}</span> · Roll: <span className="text-white">{student.rollNumberDisplay}</span>
                {student.memberId && <span className="ml-2 text-sixate-purple font-bold">· Member ID: {student.memberId}</span>}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-xs font-body">

          {/* Section 1: Personal & Academic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="font-heading font-bold text-sm text-sixate-purple flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div><span className="text-slate-500 block">Email</span> {student.emailDisplay}</div>
                <div><span className="text-slate-500 block">Phone</span> {student.phone}</div>
                <div><span className="text-slate-500 block">Gender</span> {student.gender || 'Not specified'}</div>
                <div><span className="text-slate-500 block">Applied Date</span> {formatDateTime(student.createdAt)}</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="font-heading font-bold text-sm text-sixate-green flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Academic Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div><span className="text-slate-500 block">Department</span> {student.department === 'Other' ? student.departmentOther : student.department}</div>
                <div><span className="text-slate-500 block">Year</span> {student.year}</div>
                <div><span className="text-slate-500 block">Section</span> {student.section || 'N/A'}</div>
                <div><span className="text-slate-500 block">Roll Number</span> {student.rollNumberDisplay}</div>
              </div>
            </div>

          </div>

          {/* Section 2: Math Interests & Rating */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-sixate-purple flex items-center gap-2">
                <Compass className="w-4 h-4" /> Mathematics Interests
              </h3>
              <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 font-bold text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Interest Rating: {student.mathInterestRating} / 5</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {student.interests.map((int, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-sixate-purple/20 text-sixate-purple border border-sixate-purple/30 font-medium">
                  {int}
                </span>
              ))}
              {student.interestsOther && (
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  Other: {student.interestsOther}
                </span>
              )}
            </div>
          </div>

          {/* Section 3: Skills & Competition Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="font-heading font-bold text-sm text-sixate-green flex items-center gap-2">
                Contributed Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((sk, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-sixate-green/15 text-sixate-green border border-sixate-green/30 font-medium">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="font-heading font-bold text-sm text-sixate-purple flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Competition Experience ({student.competitionExperience})
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {student.achievements || 'No previous competition achievements declared.'}
              </p>
            </div>

          </div>

          {/* Section 4: Essay Answers */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sixate-green" /> Why I Want to Join SIXATE
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              "{student.reasonForJoining}"
            </p>

            {student.contribution && (
              <>
                <h4 className="font-heading font-semibold text-xs text-slate-400 mt-2">Personal Contribution Proposal</h4>
                <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  "{student.contribution}"
                </p>
              </>
            )}
          </div>

          {/* Section 5: Social Links */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {student.linkedin && (
              <a href={student.linkedin} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 border border-slate-700 text-xs font-semibold">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" /> LinkedIn Profile <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}
            {student.github && (
              <a href={student.github} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 border border-slate-700 text-xs font-semibold">
                <LinkIcon className="w-3.5 h-3.5 text-purple-400" /> GitHub Profile <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}
          </div>

          {/* Section 6: Audit History */}
          {student.statusHistory && student.statusHistory.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
              <h3 className="font-heading font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> Status Change Audit History
              </h3>
              <div className="space-y-2">
                {student.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/40 pb-2">
                    <div>
                      Status changed to <strong className="text-white font-mono uppercase">{h.status}</strong> by <span className="text-sixate-green">{h.changedBy}</span>
                      {h.notes && <span className="italic text-slate-500 ml-2">("{h.notes}")</span>}
                    </div>
                    <span className="font-mono">{formatDateTime(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Action Buttons */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleActionClick('approved')}
              className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" /> APPROVE STUDENT
            </button>

            <button
              onClick={() => handleActionClick('shortlisted')}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" /> SHORTLIST
            </button>

            <button
              onClick={() => handleActionClick('rejected')}
              className="px-4 py-2.5 rounded-xl font-heading font-bold text-xs text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> REJECT
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-heading font-semibold text-xs text-slate-400 bg-slate-800 hover:bg-slate-700"
          >
            Close Modal
          </button>
        </div>

      </div>

      {/* Action Confirmation Dialog */}
      {confirmStatus && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-3xl bg-sixate-card border border-sixate-purple/40 space-y-5 shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-white">
              Confirm Status Change
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to change <strong className="text-white">{student.fullName}</strong>'s status to{' '}
              <strong className="text-sixate-green uppercase">{confirmStatus}</strong>?
            </p>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Optional Audit Note</label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Excellent olympiad credentials..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmStatus(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sixate-purple hover:bg-sixate-violet"
              >
                {isUpdating ? 'SAVING...' : 'CONFIRM CHANGE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
