import React from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onOpenInspector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenInspector }) => {
  return (
    <header className="sticky top-0 z-30 w-full px-5 sm:px-8 py-3.5 flex items-center justify-between select-none hairline-b transition-colors"
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

      {/* Right Controls: Minimal Inspector Trigger */}
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          onClick={onOpenInspector}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white pressable transition-colors border border-white/8 hover:border-white/16"
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
