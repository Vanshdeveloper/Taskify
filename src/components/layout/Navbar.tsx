import React from 'react';
import { Menu, Flame, Timer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useFocusTimer } from '../../hooks/useFocusTimer';

interface NavbarProps {
  onOpenInspector: () => void;
  onOpenStreaks: () => void;
  streakCount: number;
  hideBrand?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInspector,
  onOpenStreaks,
  streakCount,
  hideBrand = false,
}) => {
  const { settings, openPomodoro } = useApp();
  const { status: timerStatus, formattedTime } = useFocusTimer();
  const isTimerActive = timerStatus === 'running' || timerStatus === 'paused';

  const currentHeight = settings.navbarHeight || 'default';

  // Symmetrical Y-axis vertical alignment ensuring brand logo & controls are mathematically dead-centered
  const heightConfig = {
    compact: {
      minHeight: '3.25rem', // 52px
      paddingY: '0.4rem',
    },
    default: {
      minHeight: '3.75rem', // 60px
      paddingY: '0.65rem',
    },
    spacious: {
      minHeight: '4.75rem', // 76px
      paddingY: '1.15rem',
    },
  }[currentHeight];

  const glassStyle: React.CSSProperties =
    settings.navbarGlass === 'vibrant'
      ? {
          backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 76%, transparent)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          boxShadow: 'inset 0 -1px 0 0 rgba(255, 255, 255, 0.08), 0 4px 24px -4px rgba(0,0,0,0.5)',
        }
      : {
          // Default frosted glass material with high vibrancy
          backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 82%, transparent)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: 'inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)',
        };

  return (
    <header
      className="sticky top-0 z-30 w-full px-5 sm:px-8 flex flex-col justify-center select-none border-b border-white/[0.04] transition-all duration-200 relative"
      style={{
        ...glassStyle,
        minHeight: heightConfig.minHeight,
        paddingTop: `calc(max(var(--sat, 0px), 0.25rem) + ${heightConfig.paddingY})`,
        paddingBottom: heightConfig.paddingY,
      }}
    >
      {/* Scroll-edge gradient fade mask replacing rigid 1px border */}
      <div
        className="absolute left-0 right-0 -bottom-3 h-3 pointer-events-none opacity-80"
        style={{
          background: 'linear-gradient(to bottom, color-mix(in srgb, var(--bg-canvas) 85%, transparent), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="w-full flex items-center justify-between">
        {/* Brand Title: Traditional Taskify + "." wordmark */}
        <div
          id="navbar-brand-target"
          className="flex items-center gap-1.5 transition-opacity duration-150"
          style={{ opacity: hideBrand ? 0 : 1 }}
        >
          <span className="font-display font-black text-lg sm:text-xl text-white tracking-[-0.04em] leading-none">
            Taskify
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        </div>

        {/* Right Controls: Pomodoro Timer, Live Flame Streak Trigger & Minimal Inspector Trigger */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Pomodoro Fullscreen Timer Trigger / Live Timer Pill */}
          <button
            type="button"
            onClick={openPomodoro}
            onPointerDown={(e) => e.stopPropagation()}
            className={`relative before:absolute before:-inset-2 before:content-[''] h-9 rounded-full flex items-center justify-center pressable cursor-pointer touch-manipulation glass-expo-interactive ${
              isTimerActive
                ? 'px-3 gap-2 border-orange-500/50 bg-orange-500/15 text-orange-400 shadow-[0_4px_16px_rgba(242,106,54,0.25)]'
                : 'w-9 text-zinc-300 hover:text-white'
            }`}
            title={isTimerActive ? `Focus Timer: ${formattedTime}` : 'Focus / Pomodoro Timer'}
            aria-label="Open Focus Timer"
          >
            <Timer
              className={`w-4 h-4 text-orange-400 relative z-10 ${
                timerStatus === 'running' ? 'animate-pulse' : ''
              }`}
            />
            {isTimerActive && (
              <span className="font-mono text-xs font-bold tabular-nums text-white relative z-10">
                {formattedTime}
              </span>
            )}
          </button>

          {/* Live Flame Streak Pill */}
          <button
            type="button"
            onClick={onOpenStreaks}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative before:absolute before:-inset-2 before:content-[''] h-9 px-3 rounded-full flex items-center gap-1.5 pressable cursor-pointer touch-manipulation glass-expo-interactive border-amber-500/30 text-amber-500"
            title="Open Consistency Hall of Fame"
          >
            <Flame className="w-3.5 h-3.5 fill-current text-amber-500 relative z-10" />
            <span className="font-mono text-xs font-bold tabular-nums text-white relative z-10">
              {streakCount}
            </span>
          </button>

          {/* Minimal Inspector Trigger */}
          <button
            type="button"
            onClick={onOpenInspector}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative before:absolute before:-inset-3 before:content-[''] w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white pressable cursor-pointer touch-manipulation glass-expo-interactive"
            aria-label="Open System Inspector"
            title="Inspector & Preferences"
          >
            <Menu className="w-4 h-4 stroke-[2] relative z-10" />
          </button>
        </div>
      </div>
    </header>
  );
};
