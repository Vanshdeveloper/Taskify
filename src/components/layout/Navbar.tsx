import React from 'react';
import { Menu, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onOpenInspector: () => void;
  onOpenStreaks: () => void;
  streakCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInspector,
  onOpenStreaks,
  streakCount,
}) => {
  return (
    <header
      className="sticky top-0 z-30 w-full px-5 sm:px-8 py-3.5 flex items-center justify-between select-none hairline-b transition-colors"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Brand Title: Minimal "Taskify" wordmark */}
      <div className="flex items-center gap-2">
        <span className="font-display font-black text-lg sm:text-xl text-white tracking-[-0.04em]">
          Taskify
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
      </div>

      {/* Right Controls: Live Flame Streak Trigger & Minimal Inspector Trigger */}
      <div className="flex items-center gap-2">
        {/* Live Flame Streak Pill */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 400 }}
          onClick={onOpenStreaks}
          className="h-9 px-2.5 rounded-xl flex items-center gap-1.5 pressable transition-all border shadow-sm cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'rgba(242, 106, 54, 0.35)',
            color: 'var(--accent-primary)',
          }}
          title="Open Consistency Hall of Fame"
        >
          <div className="relative flex items-center justify-center">
            <Flame className="w-4 h-4 fill-current animate-pulse text-amber-500" />
            <span className="absolute -inset-1 rounded-full bg-amber-500/25 animate-ping opacity-40 pointer-events-none" />
          </div>
          <span className="font-mono text-xs font-black tabular-nums text-white">
            {streakCount}
          </span>
        </motion.button>

        {/* Minimal Inspector Trigger */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          onClick={onOpenInspector}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white pressable transition-colors border border-white/8 hover:border-white/16 cursor-pointer"
          style={{ backgroundColor: 'var(--bg-card)' }}
          aria-label="Open System Inspector"
          title="Inspector & Preferences"
        >
          <Menu className="w-4 h-4 stroke-[2]" />
        </motion.button>
      </div>
    </header>
  );
};
