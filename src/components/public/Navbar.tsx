import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SixateLogo } from '../common/SixateLogo';
import { Menu, X, ArrowRight, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '#about' },
    { name: 'Activities', href: '#activities' },
    { name: 'Why SIXATE', href: '#why-sixate' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-sixate-navy/90 backdrop-blur-md border-b border-sixate-purple/20 py-3 shadow-xl' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <SixateLogo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }
                }}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/admin"
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg border border-slate-700/60 transition-all duration-200 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-sixate-green" />
              ADMIN
            </Link>

            <Link
              to="/join"
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-lg shadow-sixate-purple/25 hover:shadow-sixate-green/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                JOIN SIXATE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-sixate-green to-sixate-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/join"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-sixate-purple to-sixate-green"
            >
              JOIN
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sixate-navy/95 backdrop-blur-xl border-b border-sixate-purple/30 px-4 pt-4 pb-6 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    handleNavClick(link.href);
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
                className="text-base font-medium text-slate-200 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/50"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              to="/join"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl font-heading font-bold text-center text-sm text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-lg flex items-center justify-center gap-2"
            >
              JOIN SIXATE NOW <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-xl font-medium text-center text-xs text-slate-400 bg-slate-800/60 border border-slate-700 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-sixate-green" /> Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
