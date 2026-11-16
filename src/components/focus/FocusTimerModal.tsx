import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, X, CheckCircle2 } from 'lucide-react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { useApp } from '../../context/AppContext';
import { feedback } from '../../utils/feedback';
import { APPLE_SPRINGS } from '../../utils/motion';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ isOpen, onClose }) => {
  const {
    mode,
    status,
    formattedTime,
    progress,
    completedSessions,
    activeTaskId,
    isMuted,
    start,
    pause,
    reset,
    skip,
    switchMode,
    toggleMute,
    unbindTask,
    nextRecommendedMode,
  } = useFocusTimer();

  const { tasks } = useApp();
  const boundTask = tasks.find((t) => t.id === activeTaskId);

  if (typeof document === 'undefined') return null;

  // Circular ring geometry (Precision dial style)
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  const modeTheme = {
    focus: {
      color: 'var(--accent-primary)',
      label: 'DEEP FOCUS SESSION',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    shortBreak: {
      color: '#10b981',
      label: 'RESTORATIVE BREAK',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    longBreak: {
      color: '#6366f1',
      label: 'EXTENDED REST CYCLE',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
  }[mode];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Scrim with frosted glass blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              feedback.playClick();
              onClose();
            }}
            className="fixed inset-0 bg-black/75 backdrop-blur-[20px]"
          />

          {/* Modal Card with Critically Damped Spring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={APPLE_SPRINGS.modal}
            className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 flex flex-col items-center justify-between border shadow-2xl z-10 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Header: Mute Chimes, Mode Selector, Close Modal */}
            <div className="w-full flex items-center justify-between gap-2 mb-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  toggleMute();
                }}
                className="w-10 h-10 rounded-xl text-zinc-400 hover:text-white pressable border border-white/6 flex items-center justify-center cursor-pointer"
                title={isMuted ? 'Unmute Chimes' : 'Mute Chimes'}
                data-no-swipe="true"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </motion.button>

              {/* Segmented Mode Selector Pill */}
              <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
                {(['focus', 'shortBreak', 'longBreak'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      feedback.playClick();
                      switchMode(m);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all pressable cursor-pointer ${
                      mode === m
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    data-no-swipe="true"
                  >
                    {m === 'focus' ? '25m' : m === 'shortBreak' ? '5m' : '15m'}
                  </button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  onClose();
                }}
                className="w-10 h-10 rounded-xl text-zinc-400 hover:text-white pressable border border-white/6 flex items-center justify-center cursor-pointer"
                title="Close Focus Modal"
                data-no-swipe="true"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Bound Task Pill (if active) */}
            {boundTask && (
              <div className="my-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] flex items-center gap-2 max-w-full">
                <span className="text-[11px] font-mono text-zinc-400">Target:</span>
                <span className="text-xs font-semibold text-white truncate max-w-[220px]">
                  {boundTask.title}
                </span>
                {boundTask.status === 'completed' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    unbindTask();
                  }}
                  className="text-zinc-500 hover:text-zinc-300 ml-1 text-xs"
                  title="Unbind task"
                >
                  ×
                </button>
              </div>
            )}

            {/* Precision Circular Progress Dial */}
            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-60 h-60 -rotate-90" viewBox="0 0 240 240">
                {/* Background Track */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  fill="none"
                />
                {/* Animated Progress Stroke */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke={modeTheme.color}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Dial Center Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={`text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full border mb-1.5 ${modeTheme.badge}`}
                >
                  {modeTheme.label}
                </span>
                <span className="font-mono text-5xl font-extrabold tracking-tight text-white tabular-nums">
                  {formattedTime}
                </span>
                <span className="text-xs font-mono text-zinc-400 mt-1">
                  {status === 'running'
                    ? 'Active'
                    : status === 'paused'
                    ? 'Paused'
                    : status === 'completed'
                    ? 'Session Done'
                    : 'Ready'}
                </span>
              </div>
            </div>

            {/* Session Progress Pips (4 sessions cycle) */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-mono text-zinc-500 mr-1">Cycle:</span>
              {[0, 1, 2, 3].map((idx) => {
                const isFilled =
                  (completedSessions % 4) > idx || (completedSessions > 0 && completedSessions % 4 === 0);
                return (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full border transition-all ${
                      isFilled
                        ? 'bg-amber-400 border-amber-400 shadow-sm shadow-amber-500/50'
                        : 'border-zinc-700 bg-zinc-800'
                    }`}
                    title={`Session ${idx + 1} of 4`}
                  />
                );
              })}
              <span className="text-xs font-mono text-zinc-400 ml-2">
                {completedSessions} focus session{completedSessions === 1 ? '' : 's'} done
              </span>
            </div>

            {/* Primary Controls */}
            <div className="flex items-center gap-4 w-full justify-center">
              {/* Reset Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  reset();
                }}
                className="min-w-[48px] min-h-[48px] rounded-2xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white pressable cursor-pointer"
                title="Reset Timer"
                data-no-swipe="true"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>

              {/* Play/Pause Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  if (status === 'running') pause();
                  else start();
                }}
                className="px-8 min-h-[48px] rounded-2xl flex items-center justify-center gap-2 font-display font-extrabold text-base shadow-xl pressable cursor-pointer text-white"
                style={{ backgroundColor: modeTheme.color }}
                data-no-swipe="true"
              >
                {status === 'running' ? (
                  <>
                    <Pause className="w-5 h-5 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>{status === 'paused' ? 'Resume' : 'Start Focus'}</span>
                  </>
                )}
              </motion.button>

              {/* Skip Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  skip();
                }}
                className="min-w-[48px] min-h-[48px] rounded-2xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white pressable cursor-pointer"
                title={`Skip to ${nextRecommendedMode}`}
                data-no-swipe="true"
              >
                <SkipForward className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
