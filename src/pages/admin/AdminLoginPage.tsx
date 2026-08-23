import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SixateLogo } from '../../components/common/SixateLogo';
import { MathBackground } from '../../components/common/MathBackground';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col justify-between relative selection:bg-sixate-purple selection:text-white">
      <MathBackground />

      {/* Header */}
      <header className="relative z-20 border-b border-slate-800 py-4 bg-sixate-navy/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/">
            <SixateLogo size="md" />
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </Link>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="relative z-10 flex-grow py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-sixate-card/90 border border-sixate-purple/30 backdrop-blur-xl shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sixate-purple/20 border border-sixate-purple/40 text-sixate-purple mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-sixate-green" />
            </div>
            <h1 className="font-heading font-black text-2xl text-white tracking-tight">
              SIXATE ADMIN PORTAL
            </h1>
            <p className="text-xs text-sixate-purple font-semibold">
              Mathematics Club Administration
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-sixate-purple/15 border border-sixate-purple/40 text-sixate-green text-xs font-medium flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sixate-green shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-heading font-semibold text-slate-200">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sixate.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple font-body"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-heading font-semibold text-slate-200">Admin Password</label>
                <button
                  type="button"
                  onClick={() => setInfoMessage('A secure password reset link has been sent to your registered admin email address.')}
                  className="text-[11px] text-sixate-green hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sixate-purple font-body"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-heading font-bold text-xs text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-xl shadow-sixate-purple/25 hover:shadow-sixate-green/30 transition-all duration-300 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'AUTHENTICATING...' : 'LOGIN TO ADMIN DASHBOARD'}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800">
            <p>Protected System · Authorized Administrators Only</p>
          </div>

        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SIXATE Mathematics Club · Security Enforced</p>
      </footer>
    </div>
  );
};
