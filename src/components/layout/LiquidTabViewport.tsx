import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TodayView } from '../today/TodayView';
import { TasksView } from '../tasks/TasksView';
import { HabitsView } from '../habits/HabitsView';
import { FinanceView } from '../finance/FinanceView';
import { feedback } from '../../utils/feedback';
import type { ActiveTab } from '../../types';

export const MAIN_SLIDE_TABS: ActiveTab[] = ['today', 'tasks', 'habits', 'finance'];

interface LiquidTabViewportProps {
  openSearchModal: () => void;
}

export const LiquidTabViewport: React.FC<LiquidTabViewportProps> = ({ openSearchModal }) => {
  const { activeTab, setActiveTab, slideProgress } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const currentSlideTab = MAIN_SLIDE_TABS.includes(activeTab) ? activeTab : 'today';
  const activeSlideIndex = MAIN_SLIDE_TABS.indexOf(currentSlideTab);

  // Gesture state stored in refs to prevent ANY React re-rendering during drag
  const isPointerDown = useRef(false);
  const isDragging = useRef(false);
  const isIntentDecided = useRef(false);
  const pointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentOffset = useRef(0);
  const velocityHistory = useRef<{ x: number; t: number }[]>([]);

  // Update track position whenever activeSlideIndex changes
  useEffect(() => {
    if (trackRef.current && !isDragging.current) {
      trackRef.current.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
      trackRef.current.style.transform = `translate3d(-${activeSlideIndex * 100}%, 0, 0)`;
      slideProgress.set(activeSlideIndex);
    }
  }, [activeSlideIndex, slideProgress]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button (mouse left-click or touch)
    if (e.button !== 0) return;

    // Do not capture drag if user is clicking interactive elements
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
    velocityHistory.current = [{ x: e.clientX, t: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Disambiguate gesture intent: horizontal swipe vs vertical page scroll
    if (!isIntentDecided.current) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isIntentDecided.current = true;
        if (Math.abs(dx) > Math.abs(dy) * 1.1) {
          // Horizontal swipe confirmed! Capture pointer and track 1:1
          isDragging.current = true;
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          } catch {}
        } else {
          // Vertical scroll confirmed! Cancel horizontal tracking
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

      // Pure GPU compositor transform update with zero React re-render overhead
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translate3d(calc(-${activeSlideIndex * 100}% + ${offset}px), 0, 0)`;

      // Real-time floating dock pill tracking
      const width = containerRef.current?.offsetWidth || window.innerWidth || 1;
      slideProgress.set(activeSlideIndex - offset / width);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    if (isDragging.current && trackRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      const offset = currentOffset.current;
      const width = containerRef.current?.offsetWidth || window.innerWidth || 1;

      // Calculate release velocity in px/s from recent history
      let velocity = 0;
      const history = velocityHistory.current;
      if (history.length >= 2) {
        const last = history[history.length - 1];
        const first = history[0];
        const dt = Math.max(1, last.t - first.t);
        velocity = ((last.x - first.x) / dt) * 1000;
      }

      // Apple WWDC momentum projection
      const projectedOffset = offset + velocity * 0.22;

      // Determine target tab: quick flick (>240px/s) or dragged >22% of viewport
      let targetIndex = activeSlideIndex;
      if (
        (velocity < -240 || projectedOffset < -width * 0.22 || offset < -width * 0.28) &&
        activeSlideIndex < MAIN_SLIDE_TABS.length - 1
      ) {
        targetIndex = activeSlideIndex + 1;
      } else if (
        (velocity > 240 || projectedOffset > width * 0.22 || offset > width * 0.28) &&
        activeSlideIndex > 0
      ) {
        targetIndex = activeSlideIndex - 1;
      }

      // Execute newly-greased viscous fluid slide transition
      trackRef.current.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
      trackRef.current.style.transform = `translate3d(-${targetIndex * 100}%, 0, 0)`;
      slideProgress.set(targetIndex);

      if (targetIndex !== activeSlideIndex) {
        feedback.playClick();
        setActiveTab(MAIN_SLIDE_TABS[targetIndex]);
      }
    }

    isPointerDown.current = false;
    isDragging.current = false;
    isIntentDecided.current = false;
    currentOffset.current = 0;
    pointerId.current = null;
    velocityHistory.current = [];
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="w-full h-full overflow-hidden relative z-10 cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'pan-y' }}
    >
      <div
        ref={trackRef}
        className="flex w-full h-full"
        style={{
          transform: `translate3d(-${activeSlideIndex * 100}%, 0, 0)`,
          willChange: 'transform',
        }}
      >
        {MAIN_SLIDE_TABS.map((tab) => (
          <div
            key={tab}
            className="w-full h-full shrink-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 no-scrollbar"
            style={{ touchAction: 'pan-y' }}
          >
            {tab === 'today' && <TodayView onOpenSearch={openSearchModal} />}
            {tab === 'tasks' && <TasksView />}
            {tab === 'habits' && <HabitsView />}
            {tab === 'finance' && <FinanceView />}
          </div>
        ))}
      </div>
    </div>
  );
};
