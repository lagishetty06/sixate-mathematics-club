import React from 'react';
import { HelpCircle, Puzzle, Trophy, BookOpen, Gamepad2, GraduationCap, Cpu, Code } from 'lucide-react';

export const Activities: React.FC = () => {
  const activities = [
    {
      title: 'Mathematical Quizzes',
      description: 'Test your mathematical knowledge, speed, and recall with regular competitive quizzes.',
      icon: HelpCircle,
      tag: 'Weekly'
    },
    {
      title: 'Puzzle Challenges',
      description: 'Tackle complex logic puzzles, spatial riddles, and lateral thinking brain-teasers.',
      icon: Puzzle,
      tag: 'Interactive'
    },
    {
      title: 'Competitions',
      description: 'Participate in intra-college Math Olympiads and national level problem-solving contests.',
      icon: Trophy,
      tag: 'Olympiad'
    },
    {
      title: 'Workshops',
      description: 'Hands-on sessions on LaTeX, SageMath, competitive mathematics, and calculus shortcuts.',
      icon: BookOpen,
      tag: 'Skill Build'
    },
    {
      title: 'Mathematical Games',
      description: 'Engage in strategic games based on combinatorics, game theory, and probability matrixes.',
      icon: Gamepad2,
      tag: 'Engaging'
    },
    {
      title: 'Guest Lectures',
      description: 'Interact with visiting professors, researchers, and data scientists applying mathematics.',
      icon: GraduationCap,
      tag: 'Industry'
    },
    {
      title: 'Problem Solving',
      description: 'Collaborative group brainstorming sessions focused on breaking down complex problems.',
      icon: Cpu,
      tag: 'Collaborative'
    },
    {
      title: 'Research & Projects',
      description: 'Explore undergraduate mathematics topics and build computational math projects.',
      icon: Code,
      tag: 'Innovation'
    }
  ];

  return (
    <section id="activities" className="py-20 md:py-28 bg-slate-900/40 relative z-10 border-y border-sixate-purple/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="font-heading font-extrabold text-xs uppercase tracking-[0.25em] text-sixate-purple">
            WHAT WE DO
          </h2>
          <p className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight">
            WHAT HAPPENS AT SIXATE?
          </p>
          <p className="text-base sm:text-lg text-slate-300 font-body leading-relaxed">
            From fast-paced puzzle sprints to deep-dive research workshops, SIXATE offers engaging activities designed for every level of mathematical curiosity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((act, i) => {
            const Icon = act.icon;
            return (
              <div
                key={i}
                className="group rounded-2xl bg-sixate-card/60 backdrop-blur-md border border-slate-800 p-6 hover:border-sixate-purple/40 hover:bg-sixate-card transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-sixate-purple/10 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-sixate-purple/10 text-sixate-purple group-hover:bg-sixate-purple group-hover:text-white transition-colors duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {act.tag}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-white group-hover:text-sixate-green transition-colors">
                    {act.title}
                  </h3>

                  <p className="text-xs text-slate-300 font-body leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>ACTIVITY #{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sixate-green font-bold">✓ Active</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
