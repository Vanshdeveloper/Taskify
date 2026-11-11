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
    openEditHabitModal,
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-28 sm:pb-20 md:pb-12 select-none relative z-10">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Atomic Routines
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track daily routines, build lasting streaks, and achieve consistency.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={openHabitModal}
          className="self-start sm:self-auto flex items-center gap-1.5 h-9 px-3.5 rounded-xl font-semibold text-xs pressable shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
        <div
          className="segmented-track flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth no-tab-swipe"
          data-no-swipe="true"
          style={{ touchAction: 'pan-x' }}
          onWheel={(e) => {
            if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
          }}
        >
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
                data-no-swipe="true"
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
            className="h-9 px-1 rounded-xl flex items-center gap-1 shrink-0 border"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`relative w-7 h-7 rounded-lg flex items-center justify-center pressable transition-colors ${
                viewMode === 'cards' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Card View"
            >
              {viewMode === 'cards' && (
                <motion.div
                  layoutId="habitViewModePill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`relative w-7 h-7 rounded-lg flex items-center justify-center pressable transition-colors ${
                viewMode === 'compact' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Compact List View"
            >
              {viewMode === 'compact' && (
                <motion.div
                  layoutId="habitViewModePill"
                  transition={SPRING_PILL}
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
              <List className="w-3.5 h-3.5 relative z-10" />
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
              key={`habits-cards-${timeFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
            >
              {filteredHabits.map((habit) => {
                const todayLog = habitLogs.find(
                  (l) => l.habitId === habit.id && l.date === today
                );
                const count = todayLog?.currentCount ?? 0;
                const isCompleted = todayLog?.completed ?? false;
                const streak = getHabitStreak(habit.id);
                const progressPct = Math.min(100, Math.round((count / Math.max(1, habit.targetCount)) * 100));
                const accentColor = habit.color || 'var(--accent-primary)';

                return (
                  <div
                    key={habit.id}
                    onClick={() => openEditHabitModal(habit)}
                    className={`solid-card p-4 sm:p-5 flex flex-col justify-between gap-3.5 rounded-2xl sm:rounded-3xl border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                      isCompleted ? 'border-emerald-500/35 ring-1 ring-emerald-500/20' : 'hover:border-white/20'
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      boxShadow: isCompleted
                        ? '0 12px 32px -10px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                        : '0 8px 24px -8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                    }}
                  >
                      {/* Top Row: Habit Icon Badge, Title, Badges & Discreet Delete */}
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Colored Habit Icon Token */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-md border"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
                              borderColor: `color-mix(in srgb, ${accentColor} 32%, transparent)`,
                              color: accentColor,
                            }}
                          >
                            <HabitIconRenderer icon={habit.icon} className="w-4 h-4 stroke-[2.2]" />
                          </div>

                          {/* Title & Metadata Badges */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              className={`text-sm sm:text-base font-bold tracking-tight truncate block ${
                                isCompleted ? 'line-through text-zinc-400' : 'text-white'
                              }`}
                            >
                              {habit.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/6 text-zinc-300">
                                {habit.category}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/6 capitalize">
                                {habit.timeOfDay}
                              </span>
                              {habit.reminderEnabled && habit.reminderTimes && habit.reminderTimes.length > 0 && (
                                <span className="flex items-center gap-0.5 text-amber-400 font-bold px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                                  <Bell className="w-2.5 h-2.5" />
                                  {habit.reminderTimes.length}x
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Live Flame Streak Pill & Delete Button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border shadow-sm"
                            style={{
                              backgroundColor: 'rgba(242, 106, 54, 0.12)',
                              color: 'var(--accent-primary)',
                              borderColor: 'rgba(242, 106, 54, 0.25)',
                            }}
                          >
                            <Flame className="w-3 h-3 fill-current text-amber-500 animate-pulse" />
                            <span>{streak}d</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHabit(habit.id, habit.name);
                            }}
                            className="opacity-30 hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 pressable transition-all cursor-pointer"
                            title="Delete routine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Compact Minimalist Typography Counter & Hairline Progress Track */}
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-baseline justify-between gap-2 font-mono">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white tabular-nums">
                              {String(count).padStart(2, '0')}
                            </span>
                            <span className="text-xs sm:text-sm text-zinc-400 font-medium tracking-tight">
                              / {String(habit.targetCount).padStart(2, '0')} {habit.unit}
                            </span>
                          </div>

                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color: isCompleted ? '#10b981' : accentColor }}
                          >
                            {progressPct}%
                          </span>
                        </div>

                        {/* Subtle Apple Hairline Progress Track */}
                        <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={false}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: isCompleted ? '#10b981' : accentColor,
                              boxShadow: `0 0 10px ${isCompleted ? '#10b981' : accentColor}`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Bottom: Discreet Stepper Buttons & Primary Quick Tap Action */}
                      <div className="flex items-center justify-between pt-2.5 hairline-t">
                        {/* Discreet Micro-Stepper Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              decrementHabit(habit.id);
                            }}
                            disabled={count <= 0}
                            className="w-7.5 h-7.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-20 text-zinc-400 hover:text-white flex items-center justify-center pressable border border-white/6 cursor-pointer transition-colors"
                            title="Decrement counter"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              incrementHabit(habit.id, e);
                            }}
                            className="w-7.5 h-7.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white flex items-center justify-center pressable border border-white/8 cursor-pointer transition-colors"
                            title="Increment counter"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Primary Tactile Check-In / Done Pill */}
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              toggleHabit(habit.id, e);
                            } else {
                              incrementHabit(habit.id, e);
                            }
                          }}
                          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold pressable transition-colors border cursor-pointer shadow-sm ${
                            isCompleted
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10'
                              : 'text-white border-white/15'
                          }`}
                          style={{
                            backgroundColor: isCompleted ? undefined : accentColor,
                          }}
                          title={isCompleted ? 'Completed! Tap to reset' : 'Tap to log +1 check-in'}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{isCompleted ? 'Conquered' : '+1 Check-In'}</span>
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
            </motion.div>
          ) : (
            /* ========================================================
               CREATIVE VIEW 2: APPLE ATOMIC ROUTINE LIST CARDS
               (Rich Apple Health / Fitness style progressive cards)
               ======================================================== */
            <motion.div
              key={`habits-compact-${timeFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
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
                  <div
                    key={habit.id}
                    onClick={() => openEditHabitModal(habit)}
                    className={`solid-card p-4 sm:p-4.5 rounded-2xl border transition-all flex flex-col gap-3 cursor-pointer hover:border-white/20 ${
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
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabit(habit.id, e);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHabit(habit.id, habit.name);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            decrementHabit(habit.id);
                          }}
                          disabled={count <= 0}
                          className="w-7.5 h-7.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-20 text-zinc-300 flex items-center justify-center pressable cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
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
                          onClick={(e) => {
                            e.stopPropagation();
                            incrementHabit(habit.id, e);
                          }}
                          className="w-7.5 h-7.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white flex items-center justify-center pressable cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Check-In / Completed Action */}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHabit(habit.id, e);
                        }}
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold pressable transition-colors border cursor-pointer ${
                          isCompleted
                            ? 'shadow-md border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                            : 'hover:border-white/20 text-white'
                        }`}
                        style={{
                          backgroundColor: isCompleted ? undefined : 'var(--bg-subtle)',
                          borderColor: isCompleted ? undefined : 'var(--border-card)',
                        }}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>{isCompleted ? 'Completed' : 'Check In'}</span>
                      </motion.button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
