import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { LiquidTabViewport } from './components/layout/LiquidTabViewport';
import { ReminderBanner } from './components/ui/ReminderBanner';
import { SplashScreen } from './components/ui/SplashScreen';
import { APPLE_SPRINGS } from './utils/motion';

import { StreaksView } from './components/streaks/StreaksView';
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { UniversalSearchModal } from './components/modals/UniversalSearchModal';
import { TaskModal } from './components/modals/TaskModal';
import { HabitModal } from './components/modals/HabitModal';
import { FinanceModal } from './components/modals/FinanceModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { SlideOverInspector } from './components/layout/SlideOverInspector';
import { SettingsView } from './components/settings/SettingsView';
import { syncAppFavicon } from './utils/favicon';
import { useTheme } from './context/ThemeContext';

// Lazy-loaded secondary heavy screens (Executive Dashboard only)
const ExecutiveDashboardView = React.lazy(() =>
  import('./components/analytics/ExecutiveDashboardView').then((m) => ({ default: m.ExecutiveDashboardView }))
);

// Standalone Favicon Manager: isolates theme changes so MainLayout NEVER re-renders on theme switch
const FaviconManager: React.FC = () => {
  const { theme, themes } = useTheme();
  const { settings } = useApp();
  const currentThemeObj = useMemo(() => themes.find((t) => t.id === theme), [themes, theme]);
  const currentAccent = currentThemeObj ? currentThemeObj.colors[1] : '#f26a36';

  useEffect(() => {
    syncAppFavicon(settings.appAesthetic || 'dynamic-theme', currentAccent);
  }, [settings.appAesthetic, currentAccent]);

  return null;
};

const MainLayout: React.FC = () => {
  const {
    isDbReady,
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

  // Brand Choreographed Splash Screen visibility state
  const [showSplash, setShowSplash] = useState(true);

  // Native mobile status bar setup
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
    }
  }, []);

  // Native notification action listener (Deep linking directly into Tasks, Habits, or Today)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: any = null;
    const registerListener = async () => {
      try {
        handle = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (action) => {
            const extra = action.notification.extra;
            if (extra?.type === 'task') {
              closeStreaks();
              closeInspector();
              closeExecutiveDashboard();
              setActiveTab('tasks');
            } else if (extra?.type === 'habit') {
              closeStreaks();
              closeInspector();
              closeExecutiveDashboard();
              setActiveTab('habits');
            } else if (extra?.type === 'daypart') {
              closeStreaks();
              closeInspector();
              closeExecutiveDashboard();
              setActiveTab('today');
            }
          }
        );
      } catch (err) {
        console.warn('[Notification] Error registering action listener:', err);
      }
    };

    registerListener();

    return () => {
      if (handle?.remove) {
        handle.remove();
      }
    };
  }, [setActiveTab, closeStreaks, closeInspector, closeExecutiveDashboard]);

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
      {/* Floating In-App Apple-Grade Reminder Alert Banner */}
      <ReminderBanner />

      {/* Top Navbar with Live Flame Streak Trigger & Inspector */}
      <Navbar
        streakCount={streakCount}
        onOpenStreaks={openStreaks}
        onOpenInspector={openInspector}
        hideBrand={showSplash}
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
            transition={APPLE_SPRINGS.sheet}
            className="fixed inset-0 z-50 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              paddingTop: 'calc(max(var(--sat, 0px), 0.75rem) + 0.5rem)',
              willChange: 'transform',
              transform: 'translateZ(0)',
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
            transition={APPLE_SPRINGS.sheet}
            className="fixed inset-0 z-50 overflow-y-auto px-3.5 sm:px-6 lg:px-8 pb-20 sm:pb-12 no-scrollbar"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              paddingTop: 'calc(max(var(--sat, 0px), 0.75rem) + 0.5rem)',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
          >
            <Suspense fallback={null}>
              <ExecutiveDashboardView onClose={closeExecutiveDashboard} />
            </Suspense>
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

      {/* Brand Splash Screen with fluid Apple-grade hardware-accelerated choreography */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            key="taskify-splash-screen"
            isReady={isDbReady}
            onFinished={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <FaviconManager />
        <MainLayout />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
