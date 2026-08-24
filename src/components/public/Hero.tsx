import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Binary, Award, Users } from 'lucide-react';

export const Hero: React.FC = () => {
  const scrollToAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-20 sm:pt-24 md:pt-28 pb-20 md:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Vardhaman College of Engineering Logo */}
          <div className="flex justify-center mb-3.5 sm:mb-4">
            <img
              src="/vce_logo.png"
              alt="Vardhaman College of Engineering"
              className="w-16 sm:w-20 md:w-[105px] h-auto object-contain rounded-xl p-1 bg-white/95 shadow-lg shadow-black/30 border border-white/20 transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sixate-purple/10 border border-sixate-purple/30 backdrop-blur-md text-sixate-green text-xs md:text-sm font-semibold tracking-wide shadow-lg shadow-sixate-purple/10 animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-sixate-green animate-spin-slow" />
            <span>OFFICIAL STUDENT MATHEMATICS CLUB</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sixate-green" />
          </div>

          {/* Subheading & Tagline */}
          <div className="space-y-1">
            <p className="font-heading font-extrabold uppercase tracking-widest text-sixate-purple text-sm md:text-lg">
              SIXATE Mathematics Club
            </p>
            <p className="text-xs md:text-sm font-body italic text-slate-400">
              "Like 6 & 8, be a part of perfection"
            </p>
          </div>

          {/* Main Hero Heading */}
          <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-none">
            THINK. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sixate-purple via-sixate-violet to-sixate-green">SOLVE.</span> DISCOVER.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 font-body leading-relaxed max-w-3xl mx-auto pt-2">
            Explore mathematics beyond the classroom. Challenge your thinking, solve complex problems, participate in competitions, and become part of a community that loves mathematics.
          </p>

          {/* CTA Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/join"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-heading font-bold text-base text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-xl shadow-sixate-purple/30 hover:shadow-sixate-green/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              JOIN SIXATE <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#about"
              onClick={scrollToAbout}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-heading font-semibold text-base text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-sixate-purple/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md"
            >
              EXPLORE SIXATE
            </a>
          </div>

          {/* Visual Stat Badges */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-sixate-card/60 border border-sixate-purple/20 backdrop-blur-md flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sixate-violet/20 text-sixate-violet">
                <Binary className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-lg text-white">Interactive</p>
                <p className="text-xs text-slate-400">Puzzles & Quizzes</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sixate-card/60 border border-sixate-green/20 backdrop-blur-md flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sixate-green/20 text-sixate-green">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-lg text-white">Competitions</p>
                <p className="text-xs text-slate-400">Olympiads & Events</p>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-sixate-card/60 border border-sixate-purple/20 backdrop-blur-md flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sixate-purple/20 text-sixate-purple">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading font-bold text-lg text-white">Community</p>
                <p className="text-xs text-slate-400">Math Enthusiasts</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
