import React from 'react';
import type { AppAesthetic } from '../../types';
import { useApp } from '../../context/AppContext';

export interface AppLogoMarkProps {
  aesthetic?: AppAesthetic;
  className?: string;
  size?: number;
}

export const AppLogoMark: React.FC<AppLogoMarkProps> = ({
  aesthetic: propAesthetic,
  className = '',
  size = 20,
}) => {
  const { settings } = useApp();
  const aesthetic = propAesthetic || settings.appAesthetic || 'dynamic-theme';

  const getOuterCircleColor = () => {
    switch (aesthetic) {
      case 'espresso-terracotta':
        return '#f26a36';
      case 'kyoto-matcha':
        return '#84cc16';
      case 'lavender-mist':
        return '#c084fc';
      case 'nordic-sky':
        return '#38bdf8';
      case 'molten-amber':
        return '#f59e0b';
      case 'minimal-obsidian':
        return '#ffffff';
      case 'dynamic-theme':
      default:
        return 'var(--accent-primary)';
    }
  };

  if (aesthetic === 'text-brackets') {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        className={`rounded-[6px] border border-white/10 flex items-center justify-center font-mono font-black text-white shrink-0 select-none shadow-sm ${className}`}
      >
        <span style={{ fontSize: Math.max(9, Math.round(size * 0.52)) }}>[T]</span>
      </div>
    );
  }

  if (aesthetic === 'text-terminal') {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        className={`rounded-[6px] border border-white/10 flex items-center justify-center font-mono font-black shrink-0 select-none shadow-sm ${className}`}
      >
        <span style={{ fontSize: Math.max(9, Math.round(size * 0.48)), color: 'var(--accent-primary)' }}>///</span>
      </div>
    );
  }

  if (aesthetic === 'text-spark') {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        className={`rounded-[6px] border border-white/10 flex items-center justify-center font-black shrink-0 select-none shadow-sm ${className}`}
      >
        <span style={{ fontSize: Math.max(10, Math.round(size * 0.6)), color: 'var(--accent-primary)' }}>✦</span>
      </div>
    );
  }

  if (aesthetic === 'text-dot') {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        className={`rounded-[6px] border border-white/10 flex items-center justify-center font-display font-black text-white shrink-0 select-none shadow-sm gap-0.5 ${className}`}
      >
        <span style={{ fontSize: Math.max(10, Math.round(size * 0.6)) }}>T</span>
        <span
          className="w-1 h-1 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
      </div>
    );
  }

  if (aesthetic === 'text-caps') {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        className={`rounded-[6px] border border-white/10 flex items-center justify-center font-display font-black text-white shrink-0 select-none shadow-sm ${className}`}
      >
        <span style={{ fontSize: Math.max(9, Math.round(size * 0.48)) }}>TK</span>
      </div>
    );
  }

  // Default: Concentric Chrome-matching circular logo standard
  const outerColor = getOuterCircleColor();

  return (
    <svg
      style={{ width: size, height: size }}
      className={`shrink-0 select-none ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="44" fill={outerColor} />
      <circle cx="50" cy="50" r="20" fill="#ffffff" />
    </svg>
  );
};

export interface BrandLogoProps {
  aesthetic?: AppAesthetic;
  className?: string;
  hideTextOnMobile?: boolean;
  showOnlyMark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  aesthetic: propAesthetic,
  className = '',
  showOnlyMark = false,
}) => {
  const { settings } = useApp();
  const aesthetic = propAesthetic || settings.appAesthetic || 'dynamic-theme';

  if (showOnlyMark) {
    return <AppLogoMark aesthetic={aesthetic} className={className} size={22} />;
  }

  // Text-based minimalist aesthetics
  if (aesthetic === 'text-dot') {
    return (
      <div className={`flex items-center gap-1.5 select-none ${className}`}>
        <span className="font-display font-black text-xl sm:text-2xl text-white tracking-tight leading-none">
          T
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
      </div>
    );
  }

  if (aesthetic === 'text-brackets') {
    return (
      <div className={`flex items-center gap-1 select-none font-mono ${className}`}>
        <span className="text-sm sm:text-base font-bold text-zinc-400">[</span>
        <span
          className="font-display font-black text-base sm:text-lg tracking-tight leading-none"
          style={{ color: 'var(--accent-primary)' }}
        >
          T
        </span>
        <span className="text-sm sm:text-base font-bold text-zinc-400">]</span>
      </div>
    );
  }

  if (aesthetic === 'text-caps') {
    return (
      <div className={`flex items-center gap-1 select-none ${className}`}>
        <span className="font-display font-black text-xs sm:text-sm text-white tracking-[0.25em] uppercase leading-none">
          TASKIFY
        </span>
        <span
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
      </div>
    );
  }

  if (aesthetic === 'text-terminal') {
    return (
      <div className={`flex items-center gap-1.5 select-none font-mono ${className}`}>
        <span
          className="text-xs sm:text-sm font-bold tracking-tighter"
          style={{ color: 'var(--accent-primary)' }}
        >
          ///
        </span>
        <span className="font-display font-bold text-base sm:text-lg text-white tracking-tight leading-none">
          Taskify
        </span>
      </div>
    );
  }

  if (aesthetic === 'text-spark') {
    return (
      <div className={`flex items-center gap-1.5 select-none ${className}`}>
        <span
          className="text-sm sm:text-base leading-none"
          style={{ color: 'var(--accent-primary)' }}
        >
          ✦
        </span>
        <span className="font-display font-black text-base sm:text-lg text-white tracking-tight leading-none">
          Taskify
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <AppLogoMark aesthetic={aesthetic} size={20} />
      <span className="font-display font-black text-lg sm:text-xl text-white tracking-[-0.04em] leading-none">
        Taskify
      </span>
    </div>
  );
};
