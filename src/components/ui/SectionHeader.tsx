import React from 'react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = '',
}) => {
  return (
    <header
      className={`w-full min-h-[64px] sm:min-h-[72px] flex items-center justify-between gap-3 shrink-0 select-none ${className}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-zinc-400 mt-1 truncate leading-normal font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
};
