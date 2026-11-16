import React from 'react';
import { Home, CheckSquare, Repeat, PieChart, NotebookPen, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';
import { feedback } from '../../utils/feedback';
import { SPRING_DOCK_LIQUID } from '../../utils/motion';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab, setIsQuickCaptureOpen, closeStreaks } = useApp();

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'habits', label: 'Habits', icon: Repeat },
    { id: 'finance', label: 'Finance', icon: PieChart },
    { id: 'scratchpad', label: 'Notes', icon: NotebookPen },
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
      <div className="max-w-md mx-auto flex items-center justify-center gap-2.5 pointer-events-auto">
        {/* Main Floating Navigation Capsule (Inspiration: bottom-navbar-inspo.jpg) */}
        <nav
          className="flex-1 rounded-full p-1.5 flex items-center justify-between border shadow-2xl relative overflow-hidden glass-expo"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--dock-bg) 80%, transparent)',
            borderColor: 'rgba(255, 255, 255, 0.16)',
            boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.24), 0 20px 48px -8px rgba(0, 0, 0, 0.85)',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                onPointerDown={(e) => e.stopPropagation()}
                className={`relative flex flex-col items-center justify-center min-h-[46px] py-1 px-2 rounded-full pressable transition-all flex-1 cursor-pointer touch-manipulation active:scale-95 ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileTabIndicator"
                    transition={SPRING_DOCK_LIQUID}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.35), 0 4px 16px rgba(0, 0, 0, 0.45)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  />
                )}
                <Icon className="w-4 h-4 stroke-[2] relative z-10" />
                <span className="text-[9px] mt-0.5 font-bold tracking-tight relative z-10 leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Detached Circular (+) Add Trigger (Inspiration: bottom-navbar-inspo.jpg search replacement) */}
        <button
          type="button"
          onClick={handleFabClick}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl pressable shrink-0 cursor-pointer touch-manipulation active:scale-95 transition-transform border glass-expo"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--dock-bg) 80%, transparent)',
            borderColor: 'rgba(255, 255, 255, 0.22)',
            boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.32), 0 16px 36px -6px rgba(0, 0, 0, 0.85)',
          }}
          aria-label="Quick capture"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-inner"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Plus className="w-4 h-4 stroke-[2.75] text-white" />
          </div>
        </button>
      </div>
    </div>
  );
};
