import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SixateLogo } from '../components/common/SixateLogo';
import { MathBackground } from '../components/common/MathBackground';
import { CheckCircle2, Copy, Share2, ArrowLeft, GraduationCap } from 'lucide-react';

export const SuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { applicationId?: string; fullName?: string; email?: string } | undefined;
  const [copied, setCopied] = useState(false);

  const applicationId = state?.applicationId || 'SIXATE-2026-00125';
  const fullName = state?.fullName || 'Student';

  const handleCopy = () => {
    navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SIXATE Mathematics Club Registration',
        text: `I just registered for SIXATE Mathematics Club! Application ID: ${applicationId}`,
        url: window.location.origin
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 flex flex-col justify-between relative selection:bg-sixate-purple selection:text-white">
      <MathBackground />

      {/* Header */}
      <header className="relative z-20 border-b border-sixate-purple/20 bg-sixate-navy/80 backdrop-blur-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/">
            <SixateLogo size="md" />
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Success Container */}
      <main className="relative z-10 flex-grow py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-sixate-card/90 border border-sixate-green/40 backdrop-blur-xl shadow-2xl text-center space-y-6">
          
          {/* Animated Success Badge */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sixate-green to-emerald-600 p-4 text-slate-950 mx-auto shadow-xl shadow-sixate-green/30 flex items-center justify-center animate-bounce">
            <GraduationCap className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
              WELCOME TO SIXATE! 🎓
            </h1>
            <p className="text-sm font-semibold text-sixate-green">
              Dear {fullName}, your registration has been successfully submitted.
            </p>
          </div>

          {/* Application ID Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-sixate-purple/40 space-y-2 relative group">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              YOUR APPLICATION ID
            </p>
            <p className="font-heading font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-sixate-purple via-sixate-violet to-sixate-green tracking-wider">
              {applicationId}
            </p>
            <p className="text-[11px] text-slate-400">
              Please save your Application ID for future reference and club announcements.
            </p>

            <button
              onClick={handleCopy}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sixate-purple/20 hover:bg-sixate-purple/30 text-sixate-purple text-xs font-semibold border border-sixate-purple/30 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'COPIED TO CLIPBOARD!' : 'COPY APPLICATION ID'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/"
              className="w-full py-3.5 rounded-xl font-heading font-bold text-sm text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-lg shadow-sixate-purple/20 hover:scale-[1.02] transition-all"
            >
              BACK TO HOME
            </Link>

            <button
              onClick={handleShare}
              className="w-full py-3 rounded-xl font-heading font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-sixate-green" /> SHARE SIXATE WITH FRIENDS
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SIXATE Mathematics Club · Registration Complete</p>
      </footer>
    </div>
  );
};
