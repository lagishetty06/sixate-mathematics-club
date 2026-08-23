import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { SixateLogo } from '../common/SixateLogo';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Members', path: '/admin/members', icon: UserCheck },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-sixate-navy border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <SixateLogo size="sm" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sixate-navy border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 space-y-8">
          
          {/* Logo */}
          <div className="pt-2">
            <SixateLogo size="md" />
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sixate-purple/15 text-sixate-green text-[10px] font-mono font-bold border border-sixate-purple/30">
              <ShieldCheck className="w-3 h-3 text-sixate-green" /> ADMIN PORTAL
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-semibold text-xs transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-sixate-violet to-sixate-purple text-white shadow-lg shadow-sixate-purple/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

        </div>

        {/* Footer Admin Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-sixate-purple/30 border border-sixate-purple/40 text-sixate-green font-mono font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser?.email.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
