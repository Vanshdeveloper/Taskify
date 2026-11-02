import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Swipe navigation touch state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  // Keyboard navigation 1-6 when not focused in input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  // Touch Swipe Handlers for horizontal swipe between tabs (Requirement 5)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Horizontal swipe threshold: dx > 55px and predominantly horizontal
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex === -1) return;

      if (dx < 0 && currentIndex < TAB_ORDER.length - 1) {
        // Swiped left (finger right to left) -> Go to next tab
        feedback.playClick();
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      } else if (dx > 0 && currentIndex > 0) {
        // Swiped right (finger left to right) -> Go to prev tab
        feedback.playClick();
        setActiveTab(TAB_ORDER[currentIndex - 1]);
      }
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
        onOpenStreaks={() => setActiveTab('streaks')}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        {/* Main View Area with Touch Swipe Support */}
        <main
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 relative z-10 scroll-smooth"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {activeTab === 'today' && <TodayView />}
              {activeTab === 'tasks' && <TasksView />}
              {activeTab === 'habits' && <HabitsView />}
              {activeTab === 'streaks' && <StreaksView />}
              {activeTab === 'finance' && <FinanceView />}
              {activeTab === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileTabBar />
      <QuickCaptureModal />
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
