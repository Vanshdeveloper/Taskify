import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Minus,
  Check,
  Flame,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import type { HabitTimeOfDay } from '../../types';
import { HabitModal } from '../modals/HabitModal';

export const HabitsView: React.FC = () => {
  const {
    habits,
    habitLogs,
    incrementHabit,
    decrementHabit,
    toggleHabit,
    deleteHabit,
    getHabitStreak,
    requestDelete,
  } = useApp();

  const today = getTodayString();

  // Filters
  const [timeFilter, setTimeFilter] = useState<'all' | HabitTimeOfDay>('all');
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  const filteredHabits = habits.filter((h) => {
    if (timeFilter !== 'all' && h.timeOfDay !== timeFilter) return false;
    return true;
  });

  const habitsDoneToday = habits.filter((h) => {
    const log = habitLogs.find((l) => l.habitId === h.id && l.date === today);
    return log?.completed;
  }).length;

  const progressPercent = habits.length > 0 ? Math.round((habitsDoneToday / habits.length) * 100) : 0;

  const handleDeleteHabit = (habitId: string, name: string) => {
    requestDelete({
      title: 'You sure you wanna delete this?',
      message: `Bestie... are we really ghosting "${name}"? Streak gains will be wiped forever fr fr.`,
      confirmText: 'Yep, yeet it',
      cancelText: 'Nope, keep it',
      onConfirm: () => deleteHabit(habitId),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-36 sm:pb-32 select-none relative z-10">
      {/* 1. Header (Cleaned: "HABIT EXECUTION" line removed completely) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Atomic Routines
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Execute atomic daily habits with tactile micro-counters and streak preservation.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsHabitModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs pressable shadow-lg transition-all"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Routine</span>
        </motion.button>
      </div>

      {/* 2. Today's Routine Check-Ins (Responsive & Optimized for Mobile) */}
      <div
        className="solid-card p-4 sm:p-5 flex flex-col gap-2.5 shadow-xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-display font-bold text-white text-sm sm:text-base">
              Today's Routine Check-Ins
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto font-mono">
            <span className="text-xs text-zinc-400">
              {habitsDoneToday} of {habits.length} Completed
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
              style={{
                backgroundColor: 'rgba(242, 106, 54, 0.15)',
                borderColor: 'rgba(242, 106, 54, 0.3)',
                color: 'var(--accent-primary)',
              }}
            >
              {progressPercent}%
            </span>
          </div>
        </div>

        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        </div>
      </div>

      {/* 3. Segmented Time-of-Day Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="segmented-track flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All Routines' },
              { id: 'morning', label: 'Morning' },
              { id: 'afternoon', label: 'Afternoon' },
              { id: 'evening', label: 'Evening' },
              { id: 'anytime', label: 'Anytime' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTimeFilter(tab.id)}
              className={`px-3.5 py-1 text-xs font-bold pressable transition-all whitespace-nowrap ${
                timeFilter === tab.id
                  ? 'segmented-thumb-active'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-zinc-400 font-mono self-end sm:self-auto">
          {filteredHabits.length} routines active
        </span>
      </div>

      {/* 4. Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredHabits.length === 0 ? (
          <div className="col-span-full solid-card py-16 px-4 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-display text-sm font-semibold text-zinc-300">
              No routines in this time block
            </span>
            <p className="text-xs text-zinc-500 mt-1">Tap "+ New Routine" above to design one.</p>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const todayLog = habitLogs.find(
              (l) => l.habitId === habit.id && l.date === today
            );
            const count = todayLog?.currentCount ?? 0;
            const isCompleted = todayLog?.completed ?? false;
            const streak = getHabitStreak(habit.id);

            return (
              <div
                key={habit.id}
                className={`solid-card p-5 flex flex-col justify-between transition-all ${
                  isCompleted ? 'border-emerald-500/30' : ''
                }`}
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md font-bold text-sm"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: habit.color || 'var(--accent-primary)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                          {habit.name}
                        </span>
                        <span className="text-xs text-zinc-400 mt-0.5 font-mono">
                          Target: {habit.targetCount} {habit.unit} • {habit.timeOfDay}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border"
                        style={{
                          backgroundColor: 'rgba(242, 106, 54, 0.12)',
                          color: 'var(--accent-primary)',
                          borderColor: 'rgba(242, 106, 54, 0.25)',
                        }}
                      >
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>{streak}d</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(habit.id, habit.name)}
                        className="opacity-40 hover:opacity-100 p-1 rounded text-zinc-500 hover:text-rose-400 pressable transition-opacity"
                        title="Delete routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tactile Counter & Check-in Controls */}
                <div className="flex items-center justify-between pt-4 mt-4 hairline-t">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => decrementHabit(habit.id)}
                      disabled={count <= 0}
                      className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-20 text-zinc-300 flex items-center justify-center pressable border border-white/6"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="font-mono text-sm font-bold text-white px-2 min-w-8 text-center">
                      {count}/{habit.targetCount}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => incrementHabit(habit.id, e)}
                      className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center pressable border border-white/8"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => toggleHabit(habit.id, e)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold pressable transition-all border ${
                      isCompleted
                        ? 'shadow-lg ring-2 ring-white/20'
                        : 'hover:border-white/20'
                    }`}
                    style={{
                      backgroundColor: isCompleted ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                      color: isCompleted ? '#ffffff' : 'var(--text-primary)',
                      borderColor: isCompleted ? 'var(--accent-primary)' : 'var(--border-card)',
                    }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isCompleted ? 'Done' : 'Check In'}</span>
                  </motion.button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Routine Creation Modal */}
      <HabitModal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} />
    </div>
  );
};
