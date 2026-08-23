import React from 'react';
import { Link } from 'react-router-dom';
import { SixateLogo } from '../common/SixateLogo';
import { Shield, Mail, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-sixate-dark border-t border-slate-800/80 pt-16 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/60">
          
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-4">
            <SixateLogo size="lg" />
            <p className="text-sm italic font-body text-sixate-green">
              "Like 6 & 8, be a part of perfection"
            </p>
            <p className="text-xs text-slate-400 font-body leading-relaxed max-w-md">
              SIXATE is the official college student mathematics club dedicated to nurturing analytical thinking, logical reasoning, and mathematical curiosity.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <p className="font-heading font-bold text-xs uppercase tracking-wider text-white">
              QUICK LINKS
            </p>
            <ul className="space-y-2 text-xs font-body text-slate-400">
              <li><a href="#about" className="hover:text-white transition-colors">About SIXATE</a></li>
              <li><a href="#activities" className="hover:text-white transition-colors">Club Activities</a></li>
              <li><a href="#why-sixate" className="hover:text-white transition-colors">Why Join Us</a></li>
              <li><Link to="/join" className="text-sixate-green font-semibold hover:underline">Student Registration</Link></li>
            </ul>
          </div>

          {/* Admin & Contact */}
          <div className="md:col-span-3 space-y-3">
            <p className="font-heading font-bold text-xs uppercase tracking-wider text-white">
              ADMINISTRATION
            </p>
            <p className="text-xs text-slate-400 font-body">
              Authorized SIXATE faculty and executive committee members only.
            </p>
            <div className="pt-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-sixate-green" /> Admin Login Portal
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-body">
          <p>© {new Date().getFullYear()} SIXATE Mathematics Club. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-sixate-purple fill-sixate-purple" /> for Mathematics Enthusiasts
          </p>
        </div>

      </div>
    </footer>
  );
};
