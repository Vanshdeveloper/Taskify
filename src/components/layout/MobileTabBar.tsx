import React from 'react';
import { Sun, CheckSquare, Sparkles, PieChart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';
import { feedback } from '../../utils/feedback';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsQuickCaptureOpen } = useApp();

  const leftTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  const rightTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'habits', label: 'Habits', icon: Sparkles },
    { id: 'finance', label: 'Finance', icon: PieChart },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    feedback.playClick();
    setActiveTab(tabId);
  };

  const handleFabClick = () => {
    feedback.playClick();
    setIsQuickCaptureOpen(true);
  };

  return (
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-40 px-3 pb-[calc(4px+var(--sab))] pointer-events-none select-none">
      <div className="max-w-md mx-auto flex flex-col items-center pointer-events-auto">
        {/* Dynamic Floating Island Dock */}
        <nav
          className="w-full rounded-2xl p-1.5 flex items-center justify-between border shadow-2xl relative overflow-hidden"
          style={{
            backgroundColor: 'var(--dock-bg)',
            borderColor: 'var(--dock-border)',
            boxShadow: '0 20px 48px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Left Wing Tabs */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {leftTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative flex flex-col items-center justify-center py-2 px-3.5 rounded-xl pressable transition-colors flex-1 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileTabIndicator"
                      transition={{ type: 'spring', damping: 25, stiffness: 380 }}
                      className="absolute inset-0 rounded-xl"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                      }}
                    />
                  )}
                  <Icon className="w-4 h-4 stroke-[2] relative z-10" />
                  <span className="text-[10px] mt-0.5 font-bold tracking-tight relative z-10">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center Tactile (+) Quick Capture Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', damping: 20, stiffness: 450 }}
            onClick={handleFabClick}
            className="w-11 h-11 mx-1.5 rounded-xl flex items-center justify-center shadow-lg pressable border border-white/20 shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
            aria-label="Quick capture"
          >
            <Plus className="w-5 h-5 stroke-[2.75]" />
          </motion.button>

          {/* Right Wing Tabs */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {rightTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative flex flex-col items-center justify-center py-2 px-3.5 rounded-xl pressable transition-colors flex-1 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileTabIndicator"
                      transition={{ type: 'spring', damping: 25, stiffness: 380 }}
                      className="absolute inset-0 rounded-xl"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                      }}
                    />
                  )}
                  <Icon className="w-4 h-4 stroke-[2] relative z-10" />
                  <span className="text-[10px] mt-0.5 font-bold tracking-tight relative z-10">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
