import React from 'react';
import { Sun, CheckSquare, Repeat, PieChart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';
import { feedback } from '../../utils/feedback';
import { SPRING_DOCK_LIQUID } from '../../utils/motion';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsQuickCaptureOpen, closeStreaks } = useApp();

  const leftTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  const rightTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'habits', label: 'Habits', icon: Repeat },
    { id: 'finance', label: 'Finance', icon: PieChart },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    feedback.playClick();
    closeStreaks();
    setActiveTab(tabId);
  };

  const handleFabClick = () => {
    feedback.playClick();
    setIsQuickCaptureOpen(true);
  };

  return (
    <div className="sm:hidden fixed bottom-3 left-0 right-0 z-40 px-3 pb-[calc(4px+var(--sab))] pointer-events-none select-none">
      <div className="max-w-md mx-auto flex flex-col items-center pointer-events-auto">
        {/* Dynamic Floating Island Dock */}
        <nav
          className="w-full rounded-2xl p-1.5 flex items-center justify-between border shadow-2xl relative overflow-hidden glass-expo"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--dock-bg) 75%, transparent)',
            borderColor: 'rgba(255, 255, 255, 0.16)',
            boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.28), 0 20px 48px -8px rgba(0, 0, 0, 0.85)',
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
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`relative flex flex-col items-center justify-center min-h-[44px] py-1.5 px-3.5 rounded-xl pressable transition-all flex-1 cursor-pointer touch-manipulation active:scale-95 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileTabIndicator"
                      transition={SPRING_DOCK_LIQUID}
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 4px 14px rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
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
          <button
            type="button"
            onClick={handleFabClick}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative before:absolute before:-inset-2.5 before:content-[''] w-11 h-11 mx-1.5 rounded-full flex items-center justify-center shadow-lg pressable shrink-0 cursor-pointer touch-manipulation active:scale-95 transition-transform"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            aria-label="Quick capture"
          >
            <Plus className="w-5 h-5 stroke-[2.75] text-white relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
          </button>

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
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`relative flex flex-col items-center justify-center min-h-[44px] py-1.5 px-3.5 rounded-xl pressable transition-all flex-1 cursor-pointer touch-manipulation active:scale-95 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileTabIndicator"
                      transition={SPRING_DOCK_LIQUID}
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 4px 14px rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
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
