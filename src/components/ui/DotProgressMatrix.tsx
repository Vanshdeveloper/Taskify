import React from 'react';
import { motion } from 'framer-motion';

interface DotProgressMatrixProps {
  completed: number;
  total: number;
  label?: string;
  dotColor?: string; // e.g. '#10b981'
}

export const DotProgressMatrix: React.FC<DotProgressMatrixProps> = ({
  completed,
  total,
  label = "today's tasks goal",
  dotColor = 'var(--accent-primary)',
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  // Standardize to 10 visual dots (2 rows of 5)
  const totalDots = 10;
  const filledDotsCount = Math.round((percentage / 100) * totalDots);

  return (
    <div className="solid-card p-4 sm:p-5 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="capitalize font-medium tracking-tight text-zinc-300 font-display">
          {label}
        </span>
        <span className="font-mono tabular-nums text-zinc-400">
          {completed}/{total} completed
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        {/* Big Bold Percentage */}
        <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
          {percentage}%
        </span>

        {/* 2x5 Dot Matrix */}
        <div className="grid grid-rows-2 grid-flow-col gap-1.5 sm:gap-2">
          {Array.from({ length: totalDots }).map((_, idx) => {
            const isFilled = idx < filledDotsCount;
            return (
              <motion.div
                key={idx}
                initial={{ scale: 0.8 }}
                animate={{ scale: isFilled ? 1 : 0.9 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300, delay: idx * 0.02 }}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all ${
                  isFilled
                    ? 'shadow-sm'
                    : 'bg-black/30 border border-white/5'
                }`}
                style={{
                  backgroundColor: isFilled ? dotColor : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
