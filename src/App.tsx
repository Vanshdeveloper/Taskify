import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
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

const TAB_ORDER: ActiveTab[] = ['today', 'tasks', 'habits', 'streaks', 'finance', 'settings'];

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    habits,
    getHabitStreak,
    isDeleteConfirmOpen,
    deleteConfirmOptions,
    closeDeleteConfirm,
  } = useApp();

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  // Swipe navigation touch state with 1:1 direct manipulation tracking
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Calculate current maximum active habit streak for the top navbar live fire badge
  const streakCount = useMemo(() => {
    if (!habits.length) return 0;
    return habits.reduce((max, h) => Math.max(max, getHabitStreak(h.id)), 0);
  }, [habits, getHabitStreak]);

  // Native status bar setup on mobile device launch
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#160f0d' }).catch(() => {});
    }
  }, []);

  // Global keyboard shortcut listeners (Cmd+K / Ctrl+K for Universal Search, 1-6 for tabs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '1') setActiveTab('today');
      if (e.key === '2') setActiveTab('tasks');
      if (e.key === '3') setActiveTab('habits');
      if (e.key === '4') setActiveTab('streaks');
      if (e.key === '5') setActiveTab('finance');
      if (e.key === '6') setActiveTab('settings');
      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  // 1:1 Interactive Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy) * 1.3;
      }
    }

    if (isHorizontalSwipe.current) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      const isAtLeftBoundary = currentIndex === 0 && dx > 0;
      const isAtRightBoundary = currentIndex === TAB_ORDER.length - 1 && dx < 0;
      const factor = isAtLeftBoundary || isAtRightBoundary ? 0.22 : 1;
      setDragOffset(dx * factor);
    }
  };

  const handleTouchEnd = () => {
    if (isHorizontalSwipe.current && Math.abs(dragOffset) > 55) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (dragOffset < -55 && currentIndex < TAB_ORDER.length - 1) {
        feedback.playClick();
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      } else if (dragOffset > 55 && currentIndex > 0) {
        feedback.playClick();
        setActiveTab(TAB_ORDER[currentIndex - 1]);
      }
    }
    setDragOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  const activeIndex = TAB_ORDER.indexOf(activeTab);

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
        onOpenStreaks={() => setActiveTab('streaks')}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        {/* Liquid Sliding Viewport: All tabs preloaded, zero opacity blank flash */}
        <main
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-hidden relative z-10 w-full h-full"
        >
          <motion.div
            className="flex w-full h-full"
            animate={{ x: `calc(-${activeIndex * 100}% + ${dragOffset}px)` }}
            transition={
              dragOffset !== 0
                ? { type: 'tween', duration: 0 }
                : { type: 'spring', damping: 30, stiffness: 280, mass: 0.75 }
            }
          >
            {TAB_ORDER.map((tab) => (
              <div
                key={tab}
                className="w-full h-full shrink-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 no-scrollbar"
              >
                {tab === 'today' && <TodayView onOpenSearch={() => setIsSearchOpen(true)} />}
                {tab === 'tasks' && <TasksView />}
                {tab === 'habits' && <HabitsView />}
                {tab === 'streaks' && <StreaksView />}
                {tab === 'finance' && <FinanceView />}
                {tab === 'settings' && <SettingsView />}
              </div>
            ))}
          </motion.div>
        </main>
      </div>

      <MobileTabBar />
      <QuickCaptureModal />
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenHabitModal={() => setIsHabitModalOpen(true)}
        onOpenFinanceModal={() => setIsFinanceModalOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
      />
      <FinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
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
