import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  isReady: boolean;
  onFinished?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isReady, onFinished }) => {
  const [textWidth, setTextWidth] = useState(76);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flightDelta, setFlightDelta] = useState<{ x: number; y: number } | null>(null);
  const [showStartingLoader, setShowStartingLoader] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const lockupRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Safety fallback: auto-yield after 4s in case tab is backgrounded
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      onFinished?.();
    }, 4000);
    return () => clearTimeout(safetyTimer);
  }, [onFinished]);

  // Phase 1: Measure text width on mount to calibrate pixel-perfect reveal
  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.offsetWidth || textRef.current.getBoundingClientRect().width;
      if (width > 0) {
        setTextWidth(width);
      }
    }

    // Direct immediate start (100ms): Dot appears and moves forward as Taskify unveils (NO loading spinner yet)
    const revealTimer = setTimeout(() => {
      setIsRevealing(true);
    }, 100);

    return () => clearTimeout(revealTimer);
  }, []);

  // Phase 2: When reveal completes (420ms duration), mark revealed and prepare flight
  useEffect(() => {
    if (!isRevealing) return;
    const completeTimer = setTimeout(() => {
      setIsRevealed(true);
    }, 420);
    return () => clearTimeout(completeTimer);
  }, [isRevealing]);

  // Phase 3: Launch flight to top-left Navbar logo at 1:1 scale
  useEffect(() => {
    if (!isRevealed || isFlying) return;

    const flightTimer = setTimeout(() => {
      const targetEl = document.getElementById('navbar-brand-target');
      const lockupEl = lockupRef.current;

      if (targetEl && lockupEl) {
        const targetRect = targetEl.getBoundingClientRect();
        const lockupRect = lockupEl.getBoundingClientRect();

        setFlightDelta({
          x: targetRect.left - lockupRect.left,
          y: targetRect.top - lockupRect.top,
        });
      } else {
        // High-precision responsive fallback
        const safeTop =
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0',
            10
          ) || 0;
        const targetLeft = window.innerWidth >= 640 ? 32 : 20;
        const targetTop = safeTop + (window.innerWidth >= 640 ? 20 : 16);

        if (lockupEl) {
          const lockupRect = lockupEl.getBoundingClientRect();
          setFlightDelta({
            x: targetLeft - lockupRect.left,
            y: targetTop - lockupRect.top,
          });
        }
      }

      setIsFlying(true);
      // Once the logo flies up, reveal "Starting Taskify" with the loading circle in the center
      setShowStartingLoader(true);
    }, 120);

    return () => clearTimeout(flightTimer);
  }, [isRevealed, isFlying]);

  // Phase 4: Once "Starting Taskify" has appeared AND isReady is true, smoothly unveil all elements
  useEffect(() => {
    if (!showStartingLoader || !isReady || isExiting) return;

    // Graceful settle duration so the loader doesn't flash if DB is already cached
    const settleTimer = setTimeout(() => {
      setIsExiting(true);
      const finishTimer = setTimeout(() => {
        onFinished?.();
      }, 320);
      return () => clearTimeout(finishTimer);
    }, 380);

    return () => clearTimeout(settleTimer);
  }, [showStartingLoader, isReady, isExiting, onFinished]);

  return (
    <div
      key="taskify-splash-portal"
      className="fixed inset-0 z-[100] select-none overflow-hidden pointer-events-none"
      style={{ contain: 'strict' }}
      aria-label="Loading Taskify"
    >
      {/* Flat canvas backdrop: holds opaque cover until everything is loaded, then dissolves fluidly */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{
          duration: 0.32,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--bg-canvas, #160f0d)',
          willChange: 'opacity',
        }}
      />

      {/* Center Stage: "Starting Taskify" with fluid loading circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {showStartingLoader && !isExiting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center gap-3 select-none"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-white/20 animate-spin"
                style={{
                  borderTopColor: 'var(--accent-primary)',
                }}
              />
              <span className="font-display font-medium text-xs sm:text-sm tracking-tight text-zinc-300">
                Starting Taskify
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Centered stage holding the choreographed brand lockup */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          ref={lockupRef}
          animate={
            flightDelta
              ? {
                  x: flightDelta.x,
                  y: flightDelta.y,
                }
              : {
                  x: 0,
                  y: 0,
                }
          }
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
          transition={
            flightDelta
              ? {
                  type: 'spring',
                  damping: 26,
                  stiffness: 220,
                  mass: 0.85,
                }
              : {
                  duration: 0.42,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
          className="flex items-center select-none relative z-10"
        >
          {/* Hardware-accelerated text reveal container */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: isRevealing ? textWidth : 0,
              opacity: isRevealing ? 1 : 0,
            }}
            transition={{
              width: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.16, delay: 0.03 },
            }}
            className="overflow-hidden whitespace-nowrap flex items-center"
            style={{
              willChange: 'width, opacity',
              transform: 'translateZ(0)',
            }}
          >
            <span
              ref={textRef}
              className="font-display font-black text-lg sm:text-xl text-white tracking-[-0.04em] leading-none block pr-2"
            >
              Taskify
            </span>
          </motion.div>

          {/* Clean Flat Terracotta Dot: Zero glow, zero shadow, dynamic accent */}
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{
              scale: { type: 'spring', damping: 20, stiffness: 380 },
              opacity: { duration: 0.15 },
            }}
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: 'var(--accent-primary)',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
