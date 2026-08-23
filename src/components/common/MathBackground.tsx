import React from 'react';

export const MathBackground: React.FC = () => {
  const mathSymbols = [
    { symbol: 'π', top: '12%', left: '8%', delay: '0s', duration: '8s' },
    { symbol: '∑', top: '25%', left: '88%', delay: '2s', duration: '9s' },
    { symbol: '∞', top: '65%', left: '5%', delay: '1s', duration: '7s' },
    { symbol: '√x', top: '78%', left: '92%', delay: '3s', duration: '10s' },
    { symbol: '∫', top: '45%', left: '15%', delay: '4s', duration: '8.5s' },
    { symbol: 'θ', top: '85%', left: '25%', delay: '1.5s', duration: '9.5s' },
    { symbol: 'x²', top: '18%', left: '72%', delay: '2.5s', duration: '7.5s' },
    { symbol: 'a² + b² = c²', top: '55%', left: '80%', delay: '0.5s', duration: '11s' },
    { symbol: 'lim x→∞', top: '38%', left: '82%', delay: '3.5s', duration: '10.5s' },
    { symbol: 'e^{iπ} + 1 = 0', top: '90%', left: '70%', delay: '1.8s', duration: '12s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Radial Gradient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sixate-violet/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sixate-green/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sixate-purple/15 rounded-full blur-3xl" />

      {/* Low-opacity Coordinate Plane / Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #7C3AED 1px, transparent 1px),
            linear-gradient(to bottom, #7C3AED 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Mathematical Symbols */}
      {mathSymbols.map((item, i) => (
        <div
          key={i}
          className="absolute font-heading font-semibold text-sixate-purple/20 dark:text-sixate-purple/25 animate-float text-sm md:text-xl"
          style={{
            top: item.top,
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration
          }}
        >
          {item.symbol}
        </div>
      ))}
    </div>
  );
};
