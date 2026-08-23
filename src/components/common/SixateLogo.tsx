import React from 'react';

interface SixateLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  useImage?: boolean;
}

export const SixateLogo: React.FC<SixateLogoProps> = ({ 
  size = 'md', 
  showSubtitle = true, 
  className = ''
}) => {
  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 'w-11 h-11', text: 'text-2xl', sub: 'text-[11px]' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-[12px]' },
    xl: { icon: 'w-24 h-24', text: 'text-4xl', sub: 'text-[14px]' }
  };

  const currSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Butterfly 6 & 8 Emblem Container */}
      <div className={`relative ${currSize.icon} flex items-center justify-center rounded-xl bg-white/95 p-1 border border-sixate-purple/40 shadow-lg shadow-sixate-purple/20 group hover:border-sixate-green/60 transition-all duration-300 overflow-hidden shrink-0`}>
        <img 
          src="/sixate_logo.png" 
          alt="SIXATE Mathematics Club Official Logo" 
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to jpg if png not available
            e.currentTarget.src = '/sixate_logo.jpg';
          }}
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`font-heading font-black tracking-tight text-white ${currSize.text} leading-none`}>
            SIX<span className="text-transparent bg-clip-text bg-gradient-to-r from-sixate-purple via-sixate-green to-emerald-400">ATE</span>
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-body font-bold tracking-[0.2em] uppercase text-sixate-purple ${currSize.sub} mt-0.5`}>
            MATHEMATICS CLUB
          </span>
        )}
      </div>
    </div>
  );
};
