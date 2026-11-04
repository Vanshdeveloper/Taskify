import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { feedback } from '../../utils/feedback';

export const ReminderBanner: React.FC = () => {
  const {
    activeReminderAlert,
    dismissReminderAlert,
    completeReminderAlert,
  } = useApp();


  // Auto-dismiss after 8 seconds if untouched
  useEffect(() => {
    if (!activeReminderAlert) return;
    const timer = setTimeout(() => {
      dismissReminderAlert();
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeReminderAlert, dismissReminderAlert]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {activeReminderAlert && (
        <div
          className="fixed left-0 right-0 z-50 flex justify-center px-3.5 sm:px-4 pointer-events-none select-none"
          style={{
            top: 'calc(max(var(--sat, 0px), 14px) + 8px)',
          }}
        >
          {/* Apple iOS Native Notification Banner Card */}
          <motion.div
            drag="y"
            dragConstraints={{ top: -120, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y < -40) {
                feedback.playClick();
                dismissReminderAlert();
              }
            }}
            initial={{ y: -90, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -90, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', damping: 28, stiffness: 420 }}
            className="pointer-events-auto w-full max-w-md rounded-[22px] p-3.5 sm:p-4 shadow-2xl border flex flex-col gap-2 relative overflow-hidden backdrop-blur-2xl cursor-grab active:cursor-grabbing"
            style={{
              backgroundColor: 'rgba(28, 20, 18, 0.88)',
              borderColor: 'rgba(255, 255, 255, 0.14)',
              boxShadow: '0 20px 48px -10px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Top Row: Native Apple App Header (Icon + App Name + Type + Timestamp) */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                {/* Rounded Taskify App Icon */}
                <div
                  className="w-5 h-5 rounded-[5px] flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {activeReminderAlert.type === 'habit' ? (
                    <Sparkles className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <Bell className="w-3 h-3 stroke-[2.5]" />
                  )}
                </div>

                <span className="font-mono font-bold tracking-wider text-white/90 uppercase text-[10px]">
                  Taskify
                </span>
                <span className="text-zinc-500">•</span>
                <span className="capitalize text-zinc-400 font-medium">
                  {activeReminderAlert.type === 'habit' ? 'Routine' : 'Objective'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-normal">now</span>
                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    dismissReminderAlert();
                  }}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 pressable transition-colors cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Middle Row: Notification Body (Title & Detail) */}
            <div className="flex items-start justify-between gap-3 pt-0.5">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug truncate">
                  {activeReminderAlert.title}
                </span>
                <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed line-clamp-2">
                  {activeReminderAlert.subtitle}
                </p>
              </div>

              {/* Right: Apple Pill Quick Action */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  completeReminderAlert(activeReminderAlert);
                }}
                className="px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 pressable shadow-md text-white cursor-pointer shrink-0 border border-white/15"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {activeReminderAlert.type === 'habit' ? 'Check In' : 'Complete'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
