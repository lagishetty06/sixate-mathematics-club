import React from 'react';
import { Brain, Compass, Lightbulb } from 'lucide-react';

export const About: React.FC = () => {
  const cards = [
    {
      title: 'THINK',
      subtitle: 'Logical & Analytical',
      description: 'Develop sharp logical reasoning, pattern recognition, and analytical thinking skills through structured mathematical inquiry.',
      icon: Brain,
      color: 'from-purple-500 to-sixate-purple',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'SOLVE',
      subtitle: 'Challenge & Conquer',
      description: 'Challenge yourself with non-routine mathematical problems, puzzle sprints, and competitive mathematics challenges.',
      icon: Lightbulb,
      color: 'from-emerald-400 to-sixate-green',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'DISCOVER',
      subtitle: 'Beyond Textbooks',
      description: 'Explore fascinating real-world applications of mathematics in machine learning, cryptography, chaos theory, and quantum computing.',
      icon: Compass,
      color: 'from-violet-500 to-indigo-600',
      borderColor: 'border-indigo-500/30'
    }
  ];

  return (
    <section id="about" className="py-20 md:py-28 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="font-heading font-extrabold text-xs uppercase tracking-[0.25em] text-sixate-green">
            ABOUT THE CLUB
          </h2>
          <p className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight">
            MORE THAN MATHEMATICS
          </p>
          <p className="text-base sm:text-lg text-slate-300 font-body leading-relaxed">
            SIXATE is a student mathematics club created to encourage mathematical thinking, logical reasoning, creativity, and problem solving through engaging activities, competitions, workshops, and collaborative learning.
          </p>
        </div>

        {/* 3 Core Pillars Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`relative group rounded-3xl bg-sixate-card/70 backdrop-blur-xl border ${card.borderColor} p-8 hover:border-sixate-green/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-sixate-purple/10 flex flex-col justify-between`}
              >
                <div className="space-y-6">
                  {/* Icon Header */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} p-3 text-white shadow-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-heading font-black text-3xl text-white tracking-tight">
                      {card.title}
                    </h3>
                    <p className="text-xs font-heading font-semibold text-sixate-green tracking-wider uppercase mt-1">
                      {card.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-slate-300 font-body leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>PILLAR 0{i + 1}</span>
                  <span className="text-sixate-purple font-bold">SIXATE</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
