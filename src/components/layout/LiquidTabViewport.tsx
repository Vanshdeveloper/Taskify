import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TodayView } from '../today/TodayView';
import { TasksView } from '../tasks/TasksView';
import { HabitsView } from '../habits/HabitsView';
import { FinanceView } from '../finance/FinanceView';
import { feedback } from '../../utils/feedback';
import { projectMomentum } from '../../utils/motion';
import type { ActiveTab } from '../../types';

export const MAIN_SLIDE_TABS: ActiveTab[] = ['today', 'tasks', 'habits', 'finance'];

interface LiquidTabViewportProps {
  openSearchModal: () => void;
}

export const LiquidTabViewport: React.FC<LiquidTabViewportProps> = ({ openSearchModal }) => {
  const { activeTab, setActiveTab } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const currentSlideTab = MAIN_SLIDE_TABS.includes(activeTab) ? activeTab : 'today';
  const activeSlideIndex = MAIN_SLIDE_TABS.indexOf(currentSlideTab);

  // Gesture state stored in refs to prevent ANY React re-rendering during drag
  const isPointerDown = useRef(false);
  const isDragging = useRef(false);
  const isIntentDecided = useRef(false);
  const isSwipeTransitioning = useRef(false);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentOffset = useRef(0);
  const containerWidth = useRef(typeof window !== 'undefined' ? window.innerWidth || 1 : 1);
  const velocityHistory = useRef<{ x: number; t: number }[]>([]);

  // Update track position when activeSlideIndex changes externally (e.g. dock click)
  useEffect(() => {
    // If the transition was already triggered directly by swipe momentum, do not interrupt
    if (isSwipeTransitioning.current) {
      isSwipeTransitioning.current = false;
      return;
    }

    if (trackRef.current && !isDragging.current) {
      // Pure Viscous Oil Glide: Critical viscous damping, flat 2D tape
      trackRef.current.style.willChange = 'transform';
      trackRef.current.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      trackRef.current.style.transform = `translate3d(-${activeSlideIndex * 100}%, 0, 0)`;
    }
  }, [activeSlideIndex]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button (mouse left-click or touch)
    if (e.button !== 0) return;

    // Do not capture drag if user is interacting with form controls or interactive buttons
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, [role="button"], .pressable')) {
      return;
    }

    isPointerDown.current = true;
    isDragging.current = false;
    isIntentDecided.current = false;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentOffset.current = 0;
    containerWidth.current = containerRef.current?.offsetWidth || window.innerWidth || 1;
    velocityHistory.current = [{ x: e.clientX, t: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Disambiguate gesture intent: horizontal swipe vs vertical page scroll
    if (!isIntentDecided.current) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isIntentDecided.current = true;
        if (Math.abs(dx) > Math.abs(dy) * 1.15) {
          // Horizontal swipe confirmed! Capture pointer and track 1:1
          isDragging.current = true;
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          } catch {}
          if (trackRef.current) {
            trackRef.current.style.willChange = 'transform';
          }
        } else {
          // Vertical scroll confirmed! Cancel horizontal tracking immediately
          // Native compositor scrolling handles vertical page scroll with 0 JS latency
          isPointerDown.current = false;
          return;
        }
      }
    }

    if (isDragging.current && trackRef.current) {
      // Record position history for velocity handoff
      const now = performance.now();
      velocityHistory.current.push({ x: e.clientX, t: now });
      if (velocityHistory.current.length > 5) velocityHistory.current.shift();

      // 1:1 Direct Manipulation with Apple boundary rubber-banding
      const isAtLeftBoundary = activeSlideIndex === 0 && dx > 0;
      const isAtRightBoundary = activeSlideIndex === MAIN_SLIDE_TABS.length - 1 && dx < 0;
      const offset = isAtLeftBoundary || isAtRightBoundary ? dx * 0.28 : dx;
      currentOffset.current = offset;

      // Pure flat 2D GPU compositor transform update: zero React re-render, zero raster overhead
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translate3d(calc(-${activeSlideIndex * 100}% + ${offset}px), 0, 0)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    if (isDragging.current && trackRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      const offset = currentOffset.current;
      const width = containerWidth.current;

      // Calculate release velocity in px/s from recent history
      let velocity = 0;
      const history = velocityHistory.current;
      if (history.length >= 2) {
        const last = history[history.length - 1];
        const first = history[0];
        const dt = Math.max(1, last.t - first.t);
        velocity = ((last.x - first.x) / dt) * 1000;
      }

      // Apple WWDC exponential momentum projection
      const projectedOffset = offset + projectMomentum(velocity, 0.992);

      // Determine target tab: quick flick (>160px/s) or dragged >16% of viewport
      let targetIndex = activeSlideIndex;
      if (
        (velocity < -160 || projectedOffset < -width * 0.16 || offset < -width * 0.20) &&
        activeSlideIndex < MAIN_SLIDE_TABS.length - 1
      ) {
        targetIndex = activeSlideIndex + 1;
      } else if (
        (velocity > 160 || projectedOffset > width * 0.16 || offset > width * 0.20) &&
        activeSlideIndex > 0
      ) {
        targetIndex = activeSlideIndex - 1;
      }

      // Mark that a swipe transition is running so useEffect won't reset/restart it
      isSwipeTransitioning.current = true;

      // Critical viscous damping duration scaled by release speed
      const duration = Math.max(0.26, Math.min(0.38, 0.35 - Math.abs(velocity) / 5500));
      const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

      // Settle flat 2D track cleanly into resting position
      trackRef.current.style.transition = `transform ${duration.toFixed(2)}s ${easing}`;
      trackRef.current.style.transform = `translate3d(-${targetIndex * 100}%, 0, 0)`;

      if (targetIndex !== activeSlideIndex) {
        feedback.playClick();
        // Synchronize bottom nav bar tab simultaneously on the exact same frame as the slide
        React.startTransition(() => {
          setActiveTab(MAIN_SLIDE_TABS[targetIndex]);
        });
      }
    }

    isPointerDown.current = false;
    isDragging.current = false;
    isIntentDecided.current = false;
    currentOffset.current = 0;
    pointerId.current = null;
    velocityHistory.current = [];
  };

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === trackRef.current) {
      isSwipeTransitioning.current = false;
      if (trackRef.current) {
        trackRef.current.style.willChange = 'auto';
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="w-full h-full overflow-hidden relative z-10 select-none"
      style={{
        touchAction: 'pan-y',
        overscrollBehaviorX: 'none',
      }}
    >
      <div
        ref={trackRef}
        onTransitionEnd={handleTransitionEnd}
        className="flex w-full h-full"
        style={{
          transform: `translate3d(-${activeSlideIndex * 100}%, 0, 0)`,
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          WebkitPerspective: 1000,
          perspective: 1000,
        }}
      >
        {MAIN_SLIDE_TABS.map((tab, idx) => {
          const isCurrent = idx === activeSlideIndex;
          const isAdjacent = Math.abs(idx - activeSlideIndex) <= 1;

          return (
            <div
              key={tab}
              className="w-full h-full shrink-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 no-scrollbar"
              style={{
                touchAction: 'pan-y',
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch',
                contain: 'layout paint',
                contentVisibility: isAdjacent ? 'visible' : 'auto',
                pointerEvents: isCurrent ? 'auto' : 'none',
              }}
            >
              <div data-tab-content={tab} className="w-full h-full">
                {tab === 'today' && <TodayView onOpenSearch={openSearchModal} />}
                {tab === 'tasks' && <TasksView />}
                {tab === 'habits' && <HabitsView />}
                {tab === 'finance' && <FinanceView />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
