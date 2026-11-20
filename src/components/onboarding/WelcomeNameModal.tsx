import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, User } from 'lucide-react';
import { APPLE_SPRINGS } from '../../utils/motion';
import { feedback } from '../../utils/feedback';

export interface WelcomeNameModalProps {
  isOpen: boolean;
  initialName?: string;
  onSave: (name: string) => void;
  onSkip?: () => void;
}

export const WelcomeNameModal: React.FC<WelcomeNameModalProps> = ({
  isOpen,
  initialName = '',
  onSave,
  onSkip,
}) => {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    feedback.playSuccessChime();
    onSave(clean || 'Alex');
  };

  const handleSkip = () => {
    feedback.playClick();
    if (onSkip) {
      onSkip();
    } else {
      onSave('Alex');
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 sm:p-6 select-none modal-backdrop">
        {/* Darkened Translucent Glass Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
          style={{ willChange: 'opacity' }}
        />

        {/* Modal Card Surface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={APPLE_SPRINGS.modal}
          className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 bg-zinc-950/95 border border-white/15 shadow-2xl flex flex-col justify-between overflow-hidden"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Ambient Corner Glow Accent */}
          <div
            className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-25"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />

          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
            {/* Top Brand Pill & Icon */}
            <div className="flex items-center justify-between">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md shrink-0"
                style={{
                  backgroundColor: 'rgba(242, 106, 54, 0.15)',
                  borderColor: 'rgba(242, 106, 54, 0.35)',
                  color: 'var(--accent-primary)',
                }}
              >
                <User className="w-6 h-6 stroke-[2.2]" />
              </div>

              <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-400">
                100% PRIVATE
              </span>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display font-black text-2xl text-white tracking-tight">
                What should we call you?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                Enter your good name. It stays strictly on this device and personalizes your daily briefings and focus sessions.
              </p>
            </div>

            {/* Input Box */}
            <div className="flex flex-col gap-2">
              <label htmlFor="user-good-name" className="text-xs font-mono font-semibold text-zinc-400">
                Your Name
              </label>
              <div className="relative">
                <input
                  id="user-good-name"
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  maxLength={32}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 text-white font-display text-base placeholder-zinc-500 transition-all"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Security Microcopy */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                No user accounts or cloud servers. Stored directly in local device storage.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 pressable transition-all cursor-pointer"
              >
                Skip for now
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold pressable transition-all cursor-pointer shadow-md text-white font-display"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                }}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
