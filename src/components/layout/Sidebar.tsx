import React from 'react';
import { Sun, CheckSquare, Repeat, Flame, PieChart, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';
import { getTodayString } from '../../db';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    tasks,
    habits,
    habitLogs,
    financeStats,
    settings,
    openStreaks,
    closeStreaks,
    isStreaksOpen,
  } = useApp();
  const today = getTodayString();

  const pendingTodayTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate === today
  ).length;

  const habitsDoneToday = habitLogs.filter(
    (l) => l.date === today && l.completed
  ).length;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; shortcut: string }[] = [
    {
      id: 'today',
      label: 'Today',
      icon: Sun,
      badge: pendingTodayTasks > 0 ? pendingTodayTasks : undefined,
      shortcut: '1',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: tasks.filter((t) => t.status !== 'completed').length,
      shortcut: '2',
    },
    {
      id: 'habits',
      label: 'Habits',
      icon: Repeat,
      badge: `${habitsDoneToday}/${habits.length}`,
      shortcut: '3',
    },
    {
      id: 'streaks',
      label: 'Streaks',
      icon: Flame,
      badge: 'Hall',
      shortcut: '4',
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: PieChart,
      badge: `${settings.currency}${Math.round(financeStats.netBalance).toLocaleString()}`,
      shortcut: '5',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      shortcut: '6',
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 hairline-r p-4 justify-between h-[calc(100vh-57px)] select-none relative z-10 transition-colors"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      <div className="flex flex-col gap-6">
        {/* Workspace Card */}
        <div
          className="flex items-center gap-3 p-3 rounded-2xl border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
          >
            {settings.userName.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white tracking-tight truncate">
              {settings.userName}'s Space
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Offline Storage
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1 relative">
          <div className="px-2 pb-1.5 font-display text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'streaks' ? isStreaksOpen : activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'streaks') {
                    openStreaks();
                  } else {
                    closeStreaks();
                    setActiveTab(item.id);
                  }
                }}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold pressable transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {/* Active Indicator Spring Background */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                    className="absolute inset-0 rounded-xl"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                <div className="relative z-10 flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums font-bold"
                      style={{
                        backgroundColor: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  <span className="text-[10px] font-mono opacity-40 text-zinc-400">
                    {item.shortcut}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Safe Velocity Progress Card */}
      <div
        className="p-3.5 rounded-2xl border flex flex-col gap-2.5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Safe Velocity</span>
          <span className="font-bold font-mono tabular-nums text-emerald-400">
            {settings.currency}{financeStats.dailySafeToSpend.toFixed(0)}/d
          </span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden relative">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  5,
                  ((financeStats.monthlyBudget - financeStats.monthlyExpenses) /
                    (financeStats.monthlyBudget || 1)) *
                    100
                )
              )}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono tabular-nums">
          <span>Spent: {settings.currency}{financeStats.monthlyExpenses.toFixed(0)}</span>
          <span>Budget: {settings.currency}{financeStats.monthlyBudget.toFixed(0)}</span>
        </div>
      </div>
    </aside>
  );
};
