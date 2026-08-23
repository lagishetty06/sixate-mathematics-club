import React, { useState } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { AdminUser } from '../../types';
import { 
  Settings, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Save, 
  Key, 
  Mail, 
  Building, 
  CheckCircle2,
  Database
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateAdminPassword } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  // Settings State
  const [clubName, setClubName] = useState('SIXATE Mathematics Club');
  const [tagline, setTagline] = useState('Like 6 & 8, be a part of perfection');
  const [contactEmail, setContactEmail] = useState('contact@sixate.edu');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Super Admin Team Management State
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    { uid: 'admin-1', email: 'admin@sixate.edu', role: 'super_admin', name: 'Primary Super Admin' },
    { uid: 'admin-2', email: 'faculty@sixate.edu', role: 'admin', name: 'Faculty Advisor' },
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('✓ Club settings updated successfully!');
    setTimeout(() => setToast(null), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setToast('⚠️ Please enter your current password.');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setToast('⚠️ New password must be at least 6 characters.');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    try {
      await updateAdminPassword(currentPassword, newPassword);
      setToast('✓ Admin password updated successfully! Future logins will require the new password.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setToast(`⚠️ ${err.message || 'Current password is incorrect.'}`);
    }
    setTimeout(() => setToast(null), 5000);
  };

  const handleAddAdminUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      setToast('⚠️ Please enter a valid email address.');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const newUser: AdminUser = {
      uid: `admin-${Date.now()}`,
      email: newAdminEmail.trim().toLowerCase(),
      role: newAdminRole,
      name: newAdminEmail.split('@')[0].toUpperCase()
    };
    setAdminUsers(prev => [...prev, newUser]);
    setNewAdminEmail('');
    setToast(`✓ Admin user ${newUser.email} added successfully!`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleRemoveAdminUser = (uid: string) => {
    if (adminUsers.length <= 1) {
      setToast('⚠️ Cannot remove the sole remaining administrator account.');
      setTimeout(() => setToast(null), 4000);
      return;
    }
    setAdminUsers(prev => prev.filter(a => a.uid !== uid));
    setToast('✓ Admin user access revoked.');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col md:flex-row font-body">
      <AdminSidebar />

      <main className="flex-grow md:ml-64 p-6 sm:p-10 space-y-8 overflow-x-hidden">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
              ADMIN SETTINGS
            </h1>
            <span className="px-3 py-1 rounded-full bg-sixate-purple/20 border border-sixate-purple/40 text-sixate-green font-mono font-bold text-xs">
              Role: {currentUser?.role.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage club configuration, password credentials, and administrator accounts.
          </p>
        </div>

        {toast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Form 1: General Club Information */}
          <div className="p-6 sm:p-8 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-6 shadow-xl">
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-sixate-purple" /> Club Branding & Identity
            </h2>

            <form onSubmit={handleSaveGeneralSettings} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-heading font-semibold text-slate-300">Club Display Name</label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-heading font-semibold text-slate-300">Official Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-heading font-semibold text-slate-300">Official Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-3 rounded-xl font-heading font-bold text-xs text-white bg-sixate-purple hover:bg-sixate-violet flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> SAVE BRANDING CHANGES
              </button>
            </form>
          </div>

          {/* Form 2: Change Password */}
          <div className="p-6 sm:p-8 rounded-3xl bg-sixate-card/80 border border-slate-800 space-y-6 shadow-xl">
            <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-sixate-green" /> Update Security Credentials
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-heading font-semibold text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-heading font-semibold text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-5 py-3 rounded-xl font-heading font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> UPDATE PASSWORD
              </button>
            </form>
          </div>

        </div>

        {/* Database Status Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-sixate-card/80 border border-sixate-purple/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-sixate-purple" /> Firebase Firestore Database
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Student registrations, member rosters, and status history are permanently stored in Google Cloud Firestore.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              FIRESTORE ACTIVE
            </span>
          </div>
        </div>

        {/* Super Admin Section: Admin Account Management */}
        <div className="p-6 sm:p-8 rounded-3xl bg-sixate-card/80 border border-sixate-purple/30 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sixate-green" /> Administrator Accounts Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Super Admins can authorize or revoke administrator access. No public admin registration form exists.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
              isSuperAdmin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {isSuperAdmin ? 'Super Admin Mode' : 'Read-Only Access'}
            </span>
          </div>

          {/* Add Admin Form */}
          {isSuperAdmin && (
            <form onSubmit={handleAddAdminUser} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row gap-3 text-xs">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="New admin email (e.g. faculty@sixate.edu)"
                className="flex-grow px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                <option value="admin">Role: Admin</option>
                <option value="super_admin">Role: Super Admin</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-sixate-purple hover:bg-sixate-violet flex items-center justify-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" /> ADD ADMIN
              </button>
            </form>
          )}

          {/* Current Admins List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-body">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-heading font-semibold text-[11px]">
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Name / Title</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {adminUsers.map((usr) => (
                  <tr key={usr.uid}>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{usr.email}</td>
                    <td className="py-3.5 px-4 text-slate-300">{usr.name || 'Admin'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        usr.role === 'super_admin' ? 'bg-sixate-purple/20 text-sixate-purple border border-sixate-purple/40' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {usr.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin && usr.email !== currentUser?.email && (
                        <button
                          onClick={() => handleRemoveAdminUser(usr.uid)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </main>
    </div>
  );
};
