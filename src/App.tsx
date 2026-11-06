import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { SlideOverInspector } from './components/layout/SlideOverInspector';
import { LiquidTabViewport } from './components/layout/LiquidTabViewport';
import { StreaksView } from './components/streaks/StreaksView';
import { ExecutiveDashboardView } from './components/analytics/ExecutiveDashboardView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { UniversalSearchModal } from './components/modals/UniversalSearchModal';
import { TaskModal } from './components/modals/TaskModal';
import { HabitModal } from './components/modals/HabitModal';
import { FinanceModal } from './components/modals/FinanceModal';
import { AmbientLighting } from './components/effects/AmbientLighting';
import { ReminderBanner } from './components/ui/ReminderBanner';

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
    isInspectorOpen,
    openInspector,
    closeInspector,
    isExecutiveDashboardOpen,
    closeExecutiveDashboard,
  } = useApp();

  // Maximum active streak for live navbar flame counter
  const streakCount = useMemo(() => {
    if (!habits.length) return 0;
    return habits.reduce((max, h) => Math.max(max, getHabitStreak(h.id)), 0);
  }, [habits, getHabitStreak]);

  // Native mobile status bar setup
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
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
        openInspector();
      } else if (e.key === '/') {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape') {
        if (isStreaksOpen) closeStreaks();
        if (isInspectorOpen) closeInspector();
        if (isExecutiveDashboardOpen) closeExecutiveDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveTab,
    openSearchModal,
    openStreaks,
    closeStreaks,
    isStreaksOpen,
    openInspector,
    closeInspector,
    isInspectorOpen,
    isExecutiveDashboardOpen,
    closeExecutiveDashboard,
  ]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-[var(--text-primary)] relative select-none"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Interactive Cursor Spotlight & Tab-Reactive Ambient Lighting */}
      <AmbientLighting />

      {/* Floating In-App Apple-Grade Reminder Alert Banner */}
      <ReminderBanner />

      {/* Top Navbar with Live Flame Streak Trigger & Inspector */}
      <Navbar
        streakCount={streakCount}
        onOpenStreaks={openStreaks}
        onOpenInspector={openInspector}
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
            <LiquidTabViewport openSearchModal={openSearchModal} />
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
            className="fixed inset-0 z-50 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              paddingTop: 'calc(max(var(--sat, 0px), 0.75rem) + 0.5rem)',
            }}
          >
            <StreaksView onClose={closeStreaks} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dedicated Full-Screen Analytics Dashboard */}
      <AnimatePresence>
        {isExecutiveDashboardOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 overflow-y-auto px-3.5 sm:px-6 lg:px-8 pb-20 sm:pb-12 no-scrollbar"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              paddingTop: 'calc(max(var(--sat, 0px), 0.75rem) + 0.5rem)',
            }}
          >
            <ExecutiveDashboardView onClose={closeExecutiveDashboard} />
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
        onOpenInspector={openInspector}
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
        onClose={closeInspector}
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
