import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Bell, RotateCcw, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { useApp } from '../../context/AppContext';
import { feedback } from '../../utils/feedback';
import { TaskifyNativeWidget } from '../../utils/widgetSync';

interface PomodoroFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PomodoroFullscreenModal: React.FC<PomodoroFullscreenModalProps> = ({ isOpen, onClose }) => {
  const {
    status,
    mode,
    formattedTime,
    progress,
    remainingSeconds,
    start,
    pause,
    resume,
    reset,
    setCustomDuration,
  } = useFocusTimer();

  const { settings, updateSettings } = useApp();
  const isEdgeProgressOn = settings.focusEdgeProgress !== false;

  const [isDimmed, setIsDimmed] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(25);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !Capacitor.isNativePlatform() && window.innerWidth >= 768;
  });
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 360,
    height: typeof window !== 'undefined' ? window.innerHeight : 780,
  }));

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isImmersiveActiveRef = useRef(false);

  // Measure window size & platform mode (Desktop vs Mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setIsDesktop(!Capacitor.isNativePlatform() && window.innerWidth >= 768);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Reset inactivity timer (Auto-dims into pitch-black OLED mode after 5s when running)
  const resetInactivityTimer = useCallback(() => {
    setIsDimmed(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Auto-dim into pitch-black mode after 5 seconds of inactivity when timer is actively running
    if (status === 'running') {
      inactivityTimerRef.current = setTimeout(() => {
        setIsDimmed(true);
      }, 5000);
    }
  }, [status]);

  useEffect(() => {
    if (!isOpen) {
      setIsDimmed(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    resetInactivityTimer();

    const handleInteraction = () => {
      resetInactivityTimer();
    };

    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('pointermove', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        feedback.playClick();
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        feedback.playClick();
        if (status === 'running') {
          pause();
        } else if (status === 'paused') {
          resume();
        } else {
          start();
        }
        resetInactivityTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        feedback.playClick();
        reset();
        resetInactivityTimer();
      } else if (e.key === '1') {
        e.preventDefault();
        handleSelectPreset(5);
      } else if (e.key === '2') {
        e.preventDefault();
        handleSelectPreset(25);
      } else if (e.key === '3') {
        e.preventDefault();
        handleSelectPreset(50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('pointermove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, resetInactivityTimer, status, pause, resume, start, reset, onClose]);

  // Mobile Native Immersive Mode & Status Bar Removal
  useEffect(() => {
    if (!isOpen || isDesktop) return;

    const shouldHideBars = isDimmed || status === 'running';

    const setImmersive = async (active: boolean) => {
      if (isImmersiveActiveRef.current === active) return;
      isImmersiveActiveRef.current = active;

      if (Capacitor.isNativePlatform()) {
        try {
          if (active) {
            await StatusBar.hide();
          } else {
            await StatusBar.show();
          }
        } catch {}

        try {
          if (typeof TaskifyNativeWidget.setImmersiveMode === 'function') {
            await TaskifyNativeWidget.setImmersiveMode({ enabled: active });
          }
        } catch {}
      }
    };

    setImmersive(shouldHideBars);
  }, [isOpen, isDimmed, status, isDesktop]);

  // Restore system bars on unmount / modal close
  useEffect(() => {
    return () => {
      if (isImmersiveActiveRef.current && Capacitor.isNativePlatform()) {
        StatusBar.show().catch(() => {});
        if (typeof TaskifyNativeWidget.setImmersiveMode === 'function') {
          TaskifyNativeWidget.setImmersiveMode({ enabled: false }).catch(() => {});
        }
      }
    };
  }, []);

  // Screen Wake Lock while timer is actively running
  useEffect(() => {
    if (!isOpen || status !== 'running') return;
    let wakeLock: any = null;

    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock
        .request('screen')
        .then((lock: any) => {
          wakeLock = lock;
        })
        .catch(() => {});
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOpen, status]);

  // Target finish timestamp (e.g. 14:44)
  const finishTimeStr = useMemo(() => {
    const finishDate = new Date(Date.now() + remainingSeconds * 1000);
    const hours = String(finishDate.getHours()).padStart(2, '0');
    const mins = String(finishDate.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }, [remainingSeconds]);

  // Mobile screen perimeter math for the edge progress contour
  const strokeWidth = 4;
  const cornerRadius = Capacitor.isNativePlatform() ? 38 : 24;
  const padding = 2;
  const rectW = Math.max(10, viewportSize.width - padding * 2);
  const rectH = Math.max(10, viewportSize.height - padding * 2);
  const perimeter = 2 * (rectW + rectH) - 8 * cornerRadius + 2 * Math.PI * cornerRadius;
  const progressRatio = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = perimeter * (1 - progressRatio);

  // Desktop Precision circular dial math
  const dialRadius = 96;
  const dialCircumference = 2 * Math.PI * dialRadius; // ~603.185
  const dialOffset = dialCircumference * (1 - progressRatio);

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    feedback.playClick();
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start();
    }
    resetInactivityTimer();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    feedback.playClick();
    reset();
    resetInactivityTimer();
  };

  const handleSelectPreset = (mins: number) => {
    feedback.playClick();
    setSelectedPreset(mins);
    setCustomDuration(mins * 60);
    resetInactivityTimer();
  };

  const handleToggleEdgeProgress = async () => {
    const nextVal = !isEdgeProgressOn;
    feedback.playClick();
    await updateSettings({ focusEdgeProgress: nextVal });
  };

  if (!isOpen || typeof document === 'undefined') return null;

  // =========================================================================
  // 1. DESKTOP / PC VIEW: Centered Glass Dialog
  // =========================================================================
  if (isDesktop) {
    return createPortal(
      <AnimatePresence>
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none touch-manipulation"
          style={{
            backgroundColor: isDimmed ? '#000000' : 'rgba(0, 0, 0, 0.65)',
            backdropFilter: isDimmed ? 'none' : 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: isDimmed ? 'none' : 'blur(24px) saturate(180%)',
            transition: 'background-color 0.45s ease',
            cursor: isDimmed ? 'pointer' : 'default',
          }}
          onClick={(e) => {
            if (isDimmed) {
              resetInactivityTimer();
            } else if (e.target === e.currentTarget) {
              feedback.playClick();
              onClose();
            }
          }}
        >
          {/* Fullscreen Edge Perimeter Glowing Progress Bar (Lights up in Pomodoro timer, persists in pitch black OLED mode) */}
          {isEdgeProgressOn && (
            <svg
              className="fixed inset-0 w-full h-full pointer-events-none z-30"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(242, 106, 54, 0.75))',
              }}
            >
              {/* Subtle dim track (hidden when pitch-black dimmed) */}
              <rect
                x={padding}
                y={padding}
                width={rectW}
                height={rectH}
                rx={cornerRadius}
                ry={cornerRadius}
                fill="none"
                stroke={isDimmed ? 'none' : 'rgba(242, 106, 54, 0.12)'}
                strokeWidth={strokeWidth}
              />
              {/* Active glowing orange contour */}
              <rect
                x={padding}
                y={padding}
                width={rectW}
                height={rectH}
                rx={cornerRadius}
                ry={cornerRadius}
                fill="none"
                stroke="#F26A36"
                strokeWidth={strokeWidth}
                strokeDasharray={perimeter}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              />
            </svg>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{
              opacity: isDimmed ? 0 : 1,
              scale: isDimmed ? 0.95 : 1,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-3xl glass-expo shadow-[0_32px_80px_rgba(0,0,0,0.85)] border border-white/15 p-7 flex flex-col items-center relative overflow-hidden z-40 cursor-default"
            style={{ pointerEvents: isDimmed ? 'none' : 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Session Status & Close Button */}
            <div className="w-full flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full glass-expo-pill text-xs font-semibold text-zinc-300">
                <span
                  className={`w-2 h-2 rounded-full bg-[#F26A36] ${
                    status === 'running' ? 'animate-pulse' : ''
                  }`}
                />
                <span>
                  {status === 'running'
                    ? 'Focus Session Active'
                    : status === 'paused'
                    ? 'Session Paused'
                    : 'Ready'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  feedback.playClick();
                  onClose();
                }}
                className="w-8 h-8 rounded-full glass-expo-interactive flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Close Focus Dialog"
                title="Close to Background (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Precision Circular Dial */}
            <div className="relative w-[230px] h-[230px] flex items-center justify-center my-2">
              <svg className="w-[230px] h-[230px] -rotate-90">
                {/* Track Circle */}
                <circle
                  cx="115"
                  cy="115"
                  r={dialRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                />
                {/* Progress Circle with Glow */}
                <circle
                  cx="115"
                  cy="115"
                  r={dialRadius}
                  fill="none"
                  stroke="#F26A36"
                  strokeWidth="10"
                  strokeDasharray={dialCircumference}
                  strokeDashoffset={dialOffset}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(242, 106, 54, 0.65))',
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                />
              </svg>

              {/* Dial Interior Content: Bell + Time + Mode */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold mb-1">
                  <Bell className="w-3.5 h-3.5 fill-current text-zinc-400" />
                  <span className="tabular-nums font-mono">{finishTimeStr}</span>
                </div>

                <span
                  className="font-mono text-5xl font-black text-white tabular-nums tracking-[-0.04em] leading-none"
                  style={{
                    fontFeatureSettings: '"tnum"',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formattedTime}
                </span>

                <span className="text-[11px] font-bold tracking-widest text-orange-400/90 uppercase mt-2">
                  {mode === 'focus' ? 'Focus Session' : 'Short Break'}
                </span>
              </div>
            </div>

            {/* Tactile Control Buttons: Play/Pause & Reset */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                type="button"
                onClick={handleReset}
                className="w-12 h-12 rounded-full glass-expo-interactive flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer shadow-md"
                title="Reset Timer (R)"
                aria-label="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleToggleTimer}
                className="w-16 h-16 rounded-full bg-[#F26A36] hover:bg-[#ff7944] text-white flex items-center justify-center pressable shadow-[0_4px_20px_rgba(242,106,54,0.45)] hover:shadow-[0_6px_24px_rgba(242,106,54,0.55)] active:scale-95 transition-all cursor-pointer border border-white/20"
                title={status === 'running' ? 'Pause (Space)' : 'Start (Space)'}
                aria-label={status === 'running' ? 'Pause Timer' : 'Start Timer'}
              >
                {status === 'running' ? (
                  <Pause className="w-7 h-7 fill-white stroke-none" />
                ) : (
                  <Play className="w-7 h-7 fill-white stroke-none ml-0.5" />
                )}
              </button>
            </div>

            {/* Duration Preset Chips */}
            <div className="flex items-center justify-center gap-2.5 mt-6">
              {[5, 25, 50].map((mins, idx) => {
                const isSelected = selectedPreset === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectPreset(mins)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all pressable cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#F26A36] text-white shadow-md shadow-orange-500/25 border border-white/20'
                        : 'glass-expo-interactive text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mins} mins
                    <span className="ml-1.5 text-[10px] opacity-60 font-mono">[{idx + 1}]</span>
                  </button>
                );
              })}
            </div>

            {/* Screen Edge Progress Bar Toggle Bar */}
            <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl glass-expo-pill mt-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-200">
                    Screen Edge Progress Bar
                  </span>
                  <span className="text-[10px] text-zinc-500 leading-tight">
                    Glowing perimeter contour along monitor edges
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isEdgeProgressOn}
                onClick={handleToggleEdgeProgress}
                className={`w-11 h-6 rounded-full transition-colors relative pressable cursor-pointer p-0.5 flex items-center ${
                  isEdgeProgressOn ? 'bg-[#F26A36] justify-end' : 'bg-zinc-700 justify-start'
                }`}
                title={isEdgeProgressOn ? 'Turn off screen edge progress bar' : 'Turn on screen edge progress bar'}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-white shadow-md"
                />
              </button>
            </div>

            {/* Desktop Keyboard Shortcuts Reference */}
            <div className="w-full flex items-center justify-center gap-3 mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-zinc-500 font-medium">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] text-zinc-400 font-mono">
                  Space
                </kbd>{' '}
                {status === 'running' ? 'Pause' : 'Play'}
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] text-zinc-400 font-mono">
                  R
                </kbd>{' '}
                Reset
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] text-zinc-400 font-mono">
                  Esc
                </kbd>{' '}
                Minimize
              </span>
            </div>

            {/* Tactile Inactivity Hint */}
            <p className="text-[10px] text-zinc-600 font-medium tracking-wide mt-3 text-center">
              Turns off screen in 5s • Move mouse or tap to wake
            </p>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    );
  }

  // =========================================================================
  // 2. MOBILE VIEW: Exact Approved Dynamic Island Replica + Edge Glowing OLED
  // =========================================================================
  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-between select-none touch-manipulation cursor-pointer"
        style={{
          backgroundColor: '#000000', // Pure OLED Pitch Black (pixels 100% off)
          paddingTop: isDimmed ? '0px' : 'calc(env(safe-area-inset-top, 0px) + 16px)',
          paddingBottom: isDimmed ? '0px' : 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        }}
        onClick={() => {
          // Single tap wakes up UI if dimmed, or resets inactivity timer
          resetInactivityTimer();
        }}
      >
        {/* Fullscreen Edge Perimeter Glowing Progress Bar */}
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none z-30"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(242, 106, 54, 0.75))',
          }}
        >
          {/* Subtle dim track (hidden when pitch-black dimmed) */}
          <rect
            x={padding}
            y={padding}
            width={rectW}
            height={rectH}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            stroke={isDimmed ? 'none' : 'rgba(242, 106, 54, 0.12)'}
            strokeWidth={strokeWidth}
          />
          {/* Active glowing orange contour */}
          <rect
            x={padding}
            y={padding}
            width={rectW}
            height={rectH}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            stroke="#F26A36"
            strokeWidth={strokeWidth}
            strokeDasharray={perimeter}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        </svg>

        {/* Main Controls Overlay: Fades out in OLED Black Auto-Dim mode */}
        <motion.div
          animate={{
            opacity: isDimmed ? 0 : 1,
            scale: isDimmed ? 0.96 : 1,
          }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm flex flex-col items-center justify-between flex-1 px-4 z-40"
          style={{ pointerEvents: isDimmed ? 'none' : 'auto' }}
        >
          {/* Header Row: Close Button & Subtle Mode Status */}
          <div className="w-full flex items-center justify-between pt-1 pb-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/8 text-[11px] font-semibold text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#F26A36] animate-pulse" />
              <span>{status === 'running' ? 'Focus Session' : 'Ready'}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                feedback.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white pressable active:scale-95 cursor-pointer"
              aria-label="Close Fullscreen Timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Pill Capsule: Compact Pill */}
          <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-[#111113] border border-white/10 shadow-lg mb-4">
            {/* Mini Progress Ring */}
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-6 h-6 -rotate-90">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="rgba(242, 106, 54, 0.2)"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="#F26A36"
                  strokeWidth="2.5"
                  strokeDasharray={2 * Math.PI * 9}
                  strokeDashoffset={2 * Math.PI * 9 * (1 - progressRatio)}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <span className="font-mono text-sm font-bold text-orange-400 tabular-nums">
              {formattedTime}
            </span>
          </div>

          {/* Center Dynamic Island / Live Activity Card (Image Reference Replica) */}
          <div className="relative w-full rounded-[2.5rem] bg-black p-6 sm:p-7 border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            {/* Glowing Orange Perimeter Arc matching Reference Photo */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ filter: 'drop-shadow(0 0 5px rgba(242, 106, 54, 0.6))' }}
            >
              <rect
                x="4"
                y="4"
                width="calc(100% - 8px)"
                height="calc(100% - 8px)"
                rx="36"
                ry="36"
                fill="none"
                stroke="#F26A36"
                strokeWidth="3.5"
                strokeDasharray="180 80 500 80"
                strokeLinecap="round"
              />
            </svg>

            {/* Bell Icon + Expected Finish Time */}
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold mb-2">
              <Bell className="w-3.5 h-3.5 fill-current text-zinc-400" />
              <span className="tabular-nums font-mono">{finishTimeStr}</span>
            </div>

            {/* Interactive Control Row: Pause || , 13:12 Timer , Cancel ✕ */}
            <div className="w-full flex items-center justify-between px-2 sm:px-4 py-2">
              {/* Left Play / Pause Circular Button */}
              <button
                type="button"
                onClick={handleToggleTimer}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#242426] hover:bg-[#2C2C2E] border border-white/10 flex items-center justify-center text-white pressable shadow-lg active:scale-90 transition-transform cursor-pointer"
                aria-label={status === 'running' ? 'Pause Timer' : 'Start Timer'}
              >
                {status === 'running' ? (
                  <Pause className="w-7 h-7 fill-white stroke-none" />
                ) : (
                  <Play className="w-7 h-7 fill-white stroke-none ml-0.5" />
                )}
              </button>

              {/* Center Hero Countdown & Subtitle */}
              <div className="flex flex-col items-center">
                <span
                  className="font-mono text-5xl sm:text-6xl font-black text-white tabular-nums tracking-[-0.04em] leading-none"
                  style={{
                    fontFeatureSettings: '"tnum"',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formattedTime}
                </span>
                <span className="text-zinc-400 text-xs font-semibold tracking-wide uppercase mt-1.5">
                  Timer
                </span>
              </div>

              {/* Right Cancel / Reset Circular Button */}
              <button
                type="button"
                onClick={handleReset}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#3B1416] hover:bg-[#4A191C] border border-red-500/20 flex items-center justify-center text-red-500 pressable shadow-lg active:scale-90 transition-transform cursor-pointer"
                aria-label="Reset Timer"
              >
                <X className="w-7 h-7 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Bottom Duration Preset Chips */}
          <div className="w-full flex items-center justify-center gap-3 pt-6 pb-2">
            {[5, 25, 50].map((mins) => {
              const isSelected = selectedPreset === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSelectPreset(mins)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all pressable cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#F26A36] text-white shadow-md'
                      : 'bg-zinc-900 text-zinc-400 border border-white/8 hover:text-white'
                  }`}
                >
                  {mins} mins
                </button>
              );
            })}
          </div>

          {/* Tactile Inactivity Hint */}
          <p className="text-[10px] text-zinc-600 font-medium tracking-wide pb-1">
            Turns off screen in 5s • Tap anywhere to wake
          </p>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
