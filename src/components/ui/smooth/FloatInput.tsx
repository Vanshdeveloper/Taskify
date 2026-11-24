import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export interface FloatInputProps {
  placeholder?: string;
  onSubmit?: (val: string) => void;
  className?: string;
}

export const FloatInput: React.FC<FloatInputProps> = ({
  placeholder = 'Quick add...',
  onSubmit,
  className = '',
}) => {
  const [focused, setFocused] = useState(false);
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    onSubmit?.(val.trim());
    setVal('');
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      layout
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className={`flex items-center gap-2 rounded-2xl border transition-colors ${
        focused
          ? 'bg-zinc-900/95 border-white/25 shadow-xl ring-2 ring-white/10'
          : 'bg-zinc-900/60 border-white/10 hover:border-white/18 shadow-md'
      } px-3.5 py-2.5 ${className}`}
    >
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
      />
      <AnimatePresence>
        {val.trim() && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            type="submit"
            className="w-6 h-6 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.form>
  );
};
