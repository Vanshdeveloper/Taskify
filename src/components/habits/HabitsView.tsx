import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Repeat,
  Plus,
  Minus,
  Check,
  Flame,
  Trash2,
  CheckCircle2,
  LayoutGrid,
  List,
  Bell,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import type { HabitTimeOfDay } from '../../types';
import { SPRING_PILL } from '../../utils/motion';
import { HabitIconRenderer } from './HabitIconRenderer';
import { getRandomDeletePrompt } from '../../utils/genz';

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
    openHabitModal,
  } = useApp();

  const today = getTodayString();

  // View state: Bento Cards vs Swiss Compact
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Filters
  const [timeFilter, setTimeFilter] = useState<'all' | HabitTimeOfDay>('all');

  const filteredHabits = useMemo(() => {
    if (timeFilter === 'all') return habits;
    return habits.filter((h) => h.timeOfDay === timeFilter);
  }, [habits, timeFilter]);

  const completedHabitIdSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < habitLogs.length; i++) {
      const l = habitLogs[i];
      if (l.date === today && l.completed) {
        set.add(l.habitId);
      }
    }
    return set;
  }, [habitLogs, today]);

  const habitsDoneToday = useMemo(() => {
    return habits.filter((h) => completedHabitIdSet.has(h.id)).length;
  }, [habits, completedHabitIdSet]);

  const progressPercent = habits.length > 0 ? Math.round((habitsDoneToday / habits.length) * 100) : 0;

  const handleDeleteHabit = (habitId: string, name: string) => {
    const prompt = getRandomDeletePrompt('habit', name);
    requestDelete({
      title: prompt.title,
      message: prompt.message,
      confirmText: prompt.confirmText,
      cancelText: prompt.cancelText,
      onConfirm: () => deleteHabit(habitId),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-64 sm:pb-56 select-none relative z-10">
      {/* 1. Header */}
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
          onClick={openHabitModal}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs pressable shadow-lg transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Routine</span>
        </motion.button>
      </div>

      {/* 2. Today's Routine Check-Ins */}
      <div
        className="solid-card p-4 sm:p-5 flex flex-col gap-2.5 shadow-xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-amber-400 shrink-0" />
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

      {/* 3. Segmented Time-of-Day Filter Bar & View Switcher */}
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
          ).map((tab) => {
            const isActive = timeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeFilter(tab.id)}
                className={`relative px-3.5 py-1.5 text-xs font-bold rounded-xl pressable whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="habitFilterActiveChip"
                    transition={SPRING_PILL}
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
            {filteredHabits.length} routines active
          </span>

          {/* View Mode Switcher (Cards vs Compact) */}
          <div
            className="h-10 px-1 rounded-xl flex items-center gap-0.5 shrink-0 border"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`relative w-8 h-8 rounded-lg flex items-center justify-center pressable transition-colors ${
                viewMode === 'cards' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Creative Bento Cards View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="habitViewModePill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
              <LayoutGrid className="w-4 h-4 relative z-10" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`relative w-8 h-8 rounded-lg flex items-center justify-center pressable transition-colors ${
                viewMode === 'compact' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Ultra-Refined Swiss Compact Rows"
            >
              {viewMode === 'compact' && (
                <motion.div
                  layoutId="habitViewModePill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
              <List className="w-4 h-4 relative z-10" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Habit Items (Dual Modes: Bento Cards vs Swiss Compact) */}
      {filteredHabits.length === 0 ? (
        <div className="solid-card py-16 px-4 text-center flex flex-col items-center justify-center">
          <CheckCircle2 className="w-10 h-10 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
          <span className="font-display text-sm font-semibold text-zinc-300">
            No routines in this time block
          </span>
          <p className="text-xs text-zinc-500 mt-1">Tap "+ New Routine" above to design one.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'cards' ? (
            <motion.div
              key="habits-cards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
            >
              <AnimatePresence>
                {filteredHabits.map((habit) => {
                  const todayLog = habitLogs.find(
                    (l) => l.habitId === habit.id && l.date === today
                  );
                  const count = todayLog?.currentCount ?? 0;
                  const isCompleted = todayLog?.completed ?? false;
                  const streak = getHabitStreak(habit.id);

                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
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
                              <HabitIconRenderer icon={habit.icon} className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                                {habit.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 font-mono flex-wrap">
                                <span>Target: {habit.targetCount} {habit.unit} • {habit.timeOfDay}</span>
                                {habit.reminderEnabled && habit.reminderTimes && habit.reminderTimes.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                                      <Bell className="w-3 h-3 inline" /> {habit.reminderTimes.length}x/day
                                    </span>
                                  </>
                                )}
                              </div>
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
                              className="opacity-40 hover:opacity-100 p-1 rounded text-zinc-500 hover:text-rose-400 pressable transition-opacity cursor-pointer"
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
                            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-20 text-zinc-300 flex items-center justify-center pressable border border-white/6 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="font-mono text-sm font-bold text-white px-2 min-w-8 text-center tabular-nums">
                            {count}/{habit.targetCount}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => incrementHabit(habit.id, e)}
                            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center pressable border border-white/8 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={(e) => toggleHabit(habit.id, e)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold pressable transition-all border cursor-pointer ${
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* ========================================================
               CREATIVE VIEW 2: APPLE ATOMIC ROUTINE LIST CARDS
               (Rich Apple Health / Fitness style progressive cards)
               ======================================================== */
            <motion.div
              key="habits-compact"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col gap-3"
            >
              {filteredHabits.map((habit) => {
                const todayLog = habitLogs.find(
                  (l) => l.habitId === habit.id && l.date === today
                );
                const count = todayLog?.currentCount ?? 0;
                const isCompleted = todayLog?.completed ?? false;
                const streak = getHabitStreak(habit.id);
                const habitPct = Math.min(100, Math.round((count / Math.max(1, habit.targetCount)) * 100));

                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`solid-card p-4 sm:p-4.5 rounded-2xl border transition-all flex flex-col gap-3 ${
                      isCompleted ? 'border-emerald-500/30' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-card)',
                    }}
                  >
                    {/* Top Row: Circular Progress Ring, Title & Badges, Streak & Delete */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Circular Progress Ring with Tactile Check-In */}
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={(e) => toggleHabit(habit.id, e)}
                          className="relative w-11 h-11 shrink-0 rounded-full flex items-center justify-center cursor-pointer group"
                          title={isCompleted ? 'Completed! Click to reset' : 'Click to complete routine'}
                        >
                          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                            <circle
                              cx="22"
                              cy="22"
                              r="18"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              fill="transparent"
                              className="text-white/[0.08]"
                            />
                            <circle
                              cx="22"
                              cy="22"
                              r="18"
                              stroke={isCompleted ? '#10b981' : habit.color || 'var(--accent-primary)'}
                              strokeWidth="3.5"
                              strokeDasharray={113.1}
                              strokeDashoffset={113.1 - (113.1 * (isCompleted ? 100 : habitPct)) / 100}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-500 ease-out"
                            />
                          </svg>

                          <div className="absolute inset-0 flex items-center justify-center">
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                            ) : (
                              <span
                                className="font-mono text-[10px] font-bold"
                                style={{ color: habit.color || 'var(--accent-primary)' }}
                              >
                                {habitPct}%
                              </span>
                            )}
                          </div>
                        </motion.button>

                        {/* Title & Metadata Badges */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                              isCompleted ? 'line-through text-zinc-400' : 'text-white'
                            }`}
                          >
                            {habit.name}
                          </span>

                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mt-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/6 text-zinc-300">
                              {habit.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/6 capitalize">
                              {habit.timeOfDay}
                            </span>
                            <span className="text-zinc-500 hidden sm:inline">•</span>
                            <span className="font-bold text-zinc-300">
                              Goal: {habit.targetCount} {habit.unit}
                            </span>
                            {habit.reminderEnabled && habit.reminderTimes && habit.reminderTimes.length > 0 && (
                              <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                                <Bell className="w-2.5 h-2.5" />
                                {habit.reminderTimes.length}x/day
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Streak Flame & Delete Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border shadow-sm"
                          style={{
                            backgroundColor: 'rgba(242, 106, 54, 0.12)',
                            color: 'var(--accent-primary)',
                            borderColor: 'rgba(242, 106, 54, 0.25)',
                          }}
                        >
                          <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                          <span>{streak}d</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHabit(habit.id, habit.name)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 pressable transition-all cursor-pointer opacity-50 hover:opacity-100"
                          title="Delete routine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Health Progress Bar */}
                    <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{ width: `${isCompleted ? 100 : habitPct}%` }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: isCompleted ? '#10b981' : habit.color || 'var(--accent-primary)',
                        }}
                      />
                    </div>

                    {/* Bottom Row: Stepper Controls & Quick Check-in Button */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Tactile Micro-Stepper */}
                      <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/8 shadow-inner">
                        <button
                          type="button"
                          onClick={() => decrementHabit(habit.id)}
                          disabled={count <= 0}
                          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-20 text-zinc-300 flex items-center justify-center pressable cursor-pointer transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="px-2 min-w-16 text-center">
                          <span className="font-mono text-xs font-bold text-white tabular-nums">
                            {count}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500 mx-1">/</span>
                          <span className="font-mono text-xs text-zinc-400 tabular-nums">
                            {habit.targetCount} {habit.unit}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => incrementHabit(habit.id, e)}
                          className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white flex items-center justify-center pressable cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Check-In / Completed Action */}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={(e) => toggleHabit(habit.id, e)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold pressable transition-all border cursor-pointer ${
                          isCompleted
                            ? 'shadow-md border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                            : 'hover:border-white/20 text-white'
                        }`}
                        style={{
                          backgroundColor: isCompleted ? undefined : 'var(--bg-subtle)',
                          borderColor: isCompleted ? undefined : 'var(--border-card)',
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isCompleted ? 'Completed' : 'Check In'}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
