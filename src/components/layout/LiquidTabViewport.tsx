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
  const tabContentRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Update track position and tab scales whenever activeSlideIndex changes
  useEffect(() => {
    if (trackRef.current && !isDragging.current) {
      trackRef.current.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
      trackRef.current.style.transform = `translate3d(-${activeSlideIndex * 100}%, 0, 0)`;
      slideProgress.set(activeSlideIndex);

      // Settle all tabs: active tab is 1.0 scale & 1.0 opacity; others 0.975 scale & 0.85 opacity
      tabContentRefs.current.forEach((el, idx) => {
        if (!el) return;
        el.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = idx === activeSlideIndex ? 'scale(1) translateZ(0)' : 'scale(0.975) translateZ(0)';
        el.style.opacity = idx === activeSlideIndex ? '1' : '0.85';
      });
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

      // Liquid Glass Parallax & Scale calculation
      const ratio = Math.min(1, Math.abs(offset) / width);
      const incomingIndex = offset < 0 ? activeSlideIndex + 1 : activeSlideIndex - 1;

      // Active outgoing tab: smoothly scales to 0.975 and softens opacity to 0.85
      const activeEl = tabContentRefs.current[activeSlideIndex];
      if (activeEl) {
        const activeScale = 1 - 0.025 * ratio;
        const activeOpacity = 1 - 0.15 * ratio;
        activeEl.style.transition = 'none';
        activeEl.style.transform = `scale(${activeScale}) translateZ(0)`;
        activeEl.style.opacity = `${activeOpacity}`;
      }

      // Incoming tab: smoothly scales from 0.975 up to 1.0 and brightens from 0.85 to 1.0
      if (incomingIndex >= 0 && incomingIndex < MAIN_SLIDE_TABS.length) {
        const incomingEl = tabContentRefs.current[incomingIndex];
        if (incomingEl) {
          const incomingScale = 0.975 + 0.025 * ratio;
          const incomingOpacity = 0.85 + 0.15 * ratio;
          incomingEl.style.transition = 'none';
          incomingEl.style.transform = `scale(${incomingScale}) translateZ(0)`;
          incomingEl.style.opacity = `${incomingOpacity}`;
        }
      }
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

      // Continuous momentum handoff: scale duration smoothly based on release velocity
      const duration = Math.max(0.32, Math.min(0.48, 0.44 - Math.abs(velocity) / 4000));
      const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
      const transitionStyle = `transform ${duration.toFixed(2)}s ${easing}, opacity ${duration.toFixed(2)}s ${easing}`;

      // Execute newly-greased viscous fluid slide transition
      trackRef.current.style.transition = `transform ${duration.toFixed(2)}s ${easing}`;
      trackRef.current.style.transform = `translate3d(-${targetIndex * 100}%, 0, 0)`;
      slideProgress.set(targetIndex);

      // Settle scales and opacities across all tabs
      tabContentRefs.current.forEach((el, idx) => {
        if (!el) return;
        el.style.transition = transitionStyle;
        el.style.transform = idx === targetIndex ? 'scale(1) translateZ(0)' : 'scale(0.975) translateZ(0)';
        el.style.opacity = idx === targetIndex ? '1' : '0.85';
      });

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
        {MAIN_SLIDE_TABS.map((tab, idx) => (
          <div
            key={tab}
            className="w-full h-full shrink-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 no-scrollbar"
            style={{ touchAction: 'pan-y' }}
          >
            <div
              ref={(el) => {
                tabContentRefs.current[idx] = el;
              }}
              data-tab-content={tab}
              className="w-full h-full"
              style={{
                transform: idx === activeSlideIndex ? 'scale(1) translateZ(0)' : 'scale(0.975) translateZ(0)',
                opacity: idx === activeSlideIndex ? 1 : 0.85,
                transformOrigin: '50% 50%',
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {tab === 'today' && <TodayView onOpenSearch={openSearchModal} />}
              {tab === 'tasks' && <TasksView />}
              {tab === 'habits' && <HabitsView />}
              {tab === 'finance' && <FinanceView />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
