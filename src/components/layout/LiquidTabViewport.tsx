import React, { useRef, useEffect } from 'react';
import { motion, useTransform, animate, type PanInfo } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { TodayView } from '../today/TodayView';
import { TasksView } from '../tasks/TasksView';
import { HabitsView } from '../habits/HabitsView';
import { FinanceView } from '../finance/FinanceView';
import { SPRING_VISCOUS_FLUID, projectMomentum } from '../../utils/motion';
import { feedback } from '../../utils/feedback';
import type { ActiveTab } from '../../types';

export const MAIN_SLIDE_TABS: ActiveTab[] = ['today', 'tasks', 'habits', 'finance'];

interface LiquidTabItemProps {
  tab: ActiveTab;
  index: number;
  openSearchModal: () => void;
}

const LiquidTabItem: React.FC<LiquidTabItemProps> = ({ tab, index, openSearchModal }) => {
  const { slideProgress } = useApp();

  // Apple-grade dynamic scale (1.0 -> 0.975) & opacity (1.0 -> 0.85)
  // Computes on GPU compositor loop without triggering component re-renders
  const scale = useTransform(
    slideProgress,
    [index - 1, index, index + 1],
    [0.975, 1.0, 0.975],
    { clamp: true }
  );

  const opacity = useTransform(
    slideProgress,
    [index - 1, index, index + 1],
    [0.85, 1.0, 0.85],
    { clamp: true }
  );

  return (
    <div
      className="w-full h-full shrink-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 no-scrollbar"
      style={{ touchAction: 'pan-y' }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          willChange: 'transform, opacity',
          transformOrigin: '50% 50%',
        }}
        className="w-full h-full"
      >
        {tab === 'today' && <TodayView onOpenSearch={openSearchModal} />}
        {tab === 'tasks' && <TasksView />}
        {tab === 'habits' && <HabitsView />}
        {tab === 'finance' && <FinanceView />}
      </motion.div>
    </div>
  );
};

interface LiquidTabViewportProps {
  openSearchModal: () => void;
}

export const LiquidTabViewport: React.FC<LiquidTabViewportProps> = ({ openSearchModal }) => {
  const { activeTab, setActiveTab, slideProgress, setIsSwiping } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSlideTab = MAIN_SLIDE_TABS.includes(activeTab) ? activeTab : 'today';
  const activeSlideIndex = MAIN_SLIDE_TABS.indexOf(currentSlideTab);

  // Synchronize continuous slideProgress when activeTab changes (e.g. from dock/keyboard)
  useEffect(() => {
    animate(slideProgress, activeSlideIndex, {
      ...SPRING_VISCOUS_FLUID,
    });
  }, [activeSlideIndex, slideProgress]);

  const handleDragStart = () => {
    setIsSwiping(true);
  };

  const handleDrag = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const width = containerRef.current?.offsetWidth || window.innerWidth || 1;
    // Map drag offset directly into continuous slide index space
    const dynamicProgress = activeSlideIndex - info.offset.x / width;
    slideProgress.set(dynamicProgress);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSwiping(false);
    const width = containerRef.current?.offsetWidth || window.innerWidth || 1;

    // Apple WWDC exponential momentum projection
    const projectedDeltaX = info.offset.x + projectMomentum(info.velocity.x, 0.992);
    const projectedIndex = activeSlideIndex - projectedDeltaX / width;

    // Nearest snap point with threshold hysteresis
    let targetIndex = activeSlideIndex;
    if (projectedIndex > activeSlideIndex + 0.35 && activeSlideIndex < MAIN_SLIDE_TABS.length - 1) {
      targetIndex = activeSlideIndex + 1;
    } else if (projectedIndex < activeSlideIndex - 0.35 && activeSlideIndex > 0) {
      targetIndex = activeSlideIndex - 1;
    }

    if (targetIndex !== activeSlideIndex) {
      feedback.playClick();
      setActiveTab(MAIN_SLIDE_TABS[targetIndex]);
    } else {
      // Snap back smoothly with velocity handoff
      animate(slideProgress, activeSlideIndex, {
        velocity: -info.velocity.x / width,
        ...SPRING_VISCOUS_FLUID,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative z-10"
      style={{ touchAction: 'pan-y' }}
    >
      <motion.div
        className="flex w-full h-full cursor-grab active:cursor-grabbing"
        animate={{ x: `-${activeSlideIndex * 100}%` }}
        transition={SPRING_VISCOUS_FLUID}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          willChange: 'transform',
        }}
      >
        {MAIN_SLIDE_TABS.map((tab, idx) => (
          <LiquidTabItem
            key={tab}
            tab={tab}
            index={idx}
            openSearchModal={openSearchModal}
          />
        ))}
      </motion.div>
    </div>
  );
};
