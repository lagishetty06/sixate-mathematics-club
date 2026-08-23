import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WhyJoin: React.FC = () => {
  const benefits = [
    'Improve logical reasoning & analytical thinking',
    'Strengthen competitive problem-solving skills',
    'Participate in state & national math competitions',
    'Attend hands-on workshops & expert guest lectures',
    'Network with passionate students across branches',
    'Develop teamwork, communication & leadership',
    'Explore fascinating math topics beyond textbooks',
    'Contribute to organizing major campus events'
  ];

  return (
    <section id="why-sixate" className="py-20 md:py-28 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sixate-green/10 border border-sixate-green/30 text-sixate-green text-xs font-semibold">
              <span>MEMBERSHIP BENEFITS</span>
            </div>

            <h2 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              WHY BECOME A <span className="text-transparent bg-clip-text bg-gradient-to-r from-sixate-purple to-sixate-green">SIXATE MEMBER?</span>
            </h2>

            <p className="text-base text-slate-300 font-body leading-relaxed">
              Joining SIXATE isn't just about formulas — it's about joining an ambitious community that challenges how you view logic, technology, and real-world problem solving.
            </p>

            <div className="pt-4">
              <Link
                to="/join"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-heading font-bold text-sm text-white bg-gradient-to-r from-sixate-violet via-sixate-purple to-sixate-green shadow-xl shadow-sixate-purple/25 hover:shadow-sixate-green/30 hover:scale-[1.02] transition-all duration-300"
              >
                BECOME A MEMBER TODAY <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Benefits Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-sixate-card/70 border border-sixate-purple/20 hover:border-sixate-green/40 backdrop-blur-md flex items-start gap-4 transition-all duration-300 hover:translate-x-1"
              >
                <div className="p-1.5 rounded-lg bg-sixate-green/10 text-sixate-green mt-0.5 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-slate-200 font-body leading-snug">
                  {b}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
