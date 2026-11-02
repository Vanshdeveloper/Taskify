import React, { useEffect, useState } from 'react';
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
import { AmbientLighting } from './components/effects/AmbientLighting';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

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

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-[var(--text-primary)] relative select-none"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Interactive Cursor Spotlight & Tab-Reactive Ambient Lighting */}
      <AmbientLighting />

      <Navbar onOpenInspector={() => setIsInspectorOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 relative z-10">
          {activeTab === 'today' && <TodayView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'habits' && <HabitsView />}
          {activeTab === 'streaks' && <StreaksView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      <MobileTabBar />
      <QuickCaptureModal />
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
