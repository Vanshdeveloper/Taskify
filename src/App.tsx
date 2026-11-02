import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { SlideOverInspector } from './components/layout/SlideOverInspector';
import { TodayView } from './components/today/TodayView';
import { TasksView } from './components/tasks/TasksView';
import { HabitsView } from './components/habits/HabitsView';
import { StreaksView } from './components/streaks/StreaksView';
import { FinanceView } from './components/finance/FinanceView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { UniversalSearchModal } from './components/modals/UniversalSearchModal';
import { TaskModal } from './components/modals/TaskModal';
import { HabitModal } from './components/modals/HabitModal';
import { FinanceModal } from './components/modals/FinanceModal';
import { AmbientLighting } from './components/effects/AmbientLighting';
import type { ActiveTab } from './types';
import { feedback } from './utils/feedback';

// Horizontal sliding carousel tabs (STREAKS IS EXCLUDED: Streaks opens ONLY via streak flame icon)
const MAIN_SLIDE_TABS: ActiveTab[] = ['today', 'tasks', 'habits', 'finance'];

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    habits,
    getHabitStreak,
    isDeleteConfirmOpen,
    deleteConfirmOptions,
    closeDeleteConfirm,
    isTaskModalOpen,
    openTaskModal,
    closeTaskModal,
    isHabitModalOpen,
    openHabitModal,
    closeHabitModal,
    isFinanceModalOpen,
    openFinanceModal,
    closeFinanceModal,
    isSearchModalOpen,
    openSearchModal,
    closeSearchModal,
    isStreaksOpen,
    openStreaks,
    closeStreaks,
  } = useApp();

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Active slide tab index (defaults to 'today' if settings is active)
  const currentSlideTab = MAIN_SLIDE_TABS.includes(activeTab) ? activeTab : 'today';
  const activeSlideIndex = MAIN_SLIDE_TABS.indexOf(currentSlideTab);

  // Maximum active streak for live navbar flame counter
  const streakCount = useMemo(() => {
    if (!habits.length) return 0;
    return habits.reduce((max, h) => Math.max(max, getHabitStreak(h.id)), 0);
  }, [habits, getHabitStreak]);

  // Native mobile status bar setup
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#160f0d' }).catch(() => {});
    }
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, /, 1-5, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
        return;
      }

      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '1') {
        closeStreaks();
        setActiveTab('today');
      } else if (e.key === '2') {
        closeStreaks();
        setActiveTab('tasks');
      } else if (e.key === '3') {
        closeStreaks();
        setActiveTab('habits');
      } else if (e.key === '4') {
        openStreaks();
      } else if (e.key === '5') {
        closeStreaks();
        setActiveTab('finance');
      } else if (e.key === '6') {
        closeStreaks();
        setActiveTab('settings');
      } else if (e.key === '/') {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape') {
        if (isStreaksOpen) closeStreaks();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, openSearchModal, openStreaks, closeStreaks, isStreaksOpen]);

  // Instant Apple-grade Drag & Velocity Flick Gesture
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 45;
    const velocityThreshold = 250;

    if (
      (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) &&
      activeSlideIndex < MAIN_SLIDE_TABS.length - 1
    ) {
      feedback.playClick();
      setActiveTab(MAIN_SLIDE_TABS[activeSlideIndex + 1]);
    } else if (
      (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) &&
      activeSlideIndex > 0
    ) {
      feedback.playClick();
      setActiveTab(MAIN_SLIDE_TABS[activeSlideIndex - 1]);
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-[var(--text-primary)] relative select-none"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Interactive Cursor Spotlight & Tab-Reactive Ambient Lighting */}
      <AmbientLighting />

      {/* Top Navbar with Live Flame Streak Trigger & Inspector */}
      <Navbar
        streakCount={streakCount}
        onOpenStreaks={openStreaks}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        {/* Liquid Horizontal Sliding Viewport: Strictly MAIN_SLIDE_TABS ('today', 'tasks', 'habits', 'finance') */}
        <main
          className="flex-1 overflow-hidden relative z-10 w-full h-full"
          style={{ touchAction: 'pan-y' }}
        >
          {activeTab === 'settings' ? (
            <div className="w-full h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 no-scrollbar" style={{ touchAction: 'pan-y' }}>
              <SettingsView />
            </div>
          ) : (
            <motion.div
              className="flex w-full h-full cursor-grab active:cursor-grabbing"
              animate={{ x: `-${activeSlideIndex * 100}%` }}
              transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.65 }}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={handleDragEnd}
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
            </motion.div>
          )}
        </main>
      </div>

      {/* Dedicated Streaks Presentation: Opened ONLY by clicking the flame icon */}
      <AnimatePresence>
        {(isStreaksOpen || activeTab === 'streaks') && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6"
            style={{ backgroundColor: 'var(--bg-canvas)' }}
          >
            <StreaksView onClose={closeStreaks} />
          </motion.div>
        )}
      </AnimatePresence>

      <MobileTabBar />
      <QuickCaptureModal />
      <UniversalSearchModal
        isOpen={isSearchModalOpen}
        onClose={closeSearchModal}
        onOpenTaskModal={openTaskModal}
        onOpenHabitModal={openHabitModal}
        onOpenFinanceModal={openFinanceModal}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
      />
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={closeHabitModal}
      />
      <FinanceModal
        isOpen={isFinanceModalOpen}
        onClose={closeFinanceModal}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        options={deleteConfirmOptions}
        onClose={closeDeleteConfirm}
      />
      <SlideOverInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
