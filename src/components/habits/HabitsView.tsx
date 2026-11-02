import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import type { HabitTimeOfDay, HabitFrequency } from '../../types';

export const HabitsView: React.FC = () => {
  const {
    habits,
    habitLogs,
    addHabit,
    incrementHabit,
    decrementHabit,
    toggleHabit,
    deleteHabit,
    getHabitStreak,
  } = useApp();

  const today = getTodayString();

  // Filters
  const [timeFilter, setTimeFilter] = useState<'all' | HabitTimeOfDay>('all');

  // Form Drawer state
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Health');
  const [targetCount, setTargetCount] = useState('1');
  const [unit, setUnit] = useState('times');
  const frequency: HabitFrequency = 'daily';
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('morning');
  const [color, setColor] = useState('#f26a36');

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addHabit({
      name: name.trim(),
      category: category.trim() || 'Health',
      targetCount: Math.max(1, parseInt(targetCount) || 1),
      unit: unit.trim() || 'times',
      frequency,
      timeOfDay,
      color,
      icon: 'sparkles',
    });

    setName('');
    setIsAdding(false);
  };

  const filteredHabits = habits.filter((h) => {
    if (timeFilter !== 'all' && h.timeOfDay !== timeFilter) return false;
    return true;
  });

  const habitsDoneToday = habits.filter((h) => {
    const log = habitLogs.find((l) => l.habitId === h.id && l.date === today);
    return log?.completed;
  }).length;

  const progressPercent = habits.length > 0 ? Math.round((habitsDoneToday / habits.length) * 100) : 0;

  const colors = [
    { name: 'Terracotta', hex: '#f26a36' },
    { name: 'Ochre', hex: '#e5a42f' },
    { name: 'Matcha', hex: '#7da04a' },
    { name: 'Rose', hex: '#d6798c' },
    { name: 'Cobalt', hex: '#3b82f6' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-28 select-none relative z-10">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              HABIT EXECUTION
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            />
          </div>
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
          onClick={() => setIsAdding((prev) => !prev)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs pressable shadow-lg transition-all"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isAdding ? 'Close Composer' : 'New Routine'}</span>
        </motion.button>
      </div>

      {/* 2. Daily Execution Progress Pulse Card */}
      <div
        className="solid-card p-5 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-display font-bold text-white">
              Today's Routine Check-Ins
            </span>
          </div>
          <span className="font-mono font-bold text-white">
            {habitsDoneToday} of {habits.length} Completed ({progressPercent}%)
          </span>
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
            <CheckCircle2 className="w-10 h-10 text-zinc-600 stroke-[1.5] mb-2" />
            <span className="text-sm font-semibold text-zinc-300">
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
                        onClick={() => deleteHabit(habit.id)}
                        className="opacity-40 hover:opacity-100 p-1 rounded text-zinc-500 hover:text-rose-400 pressable transition-opacity"
                        title="Delete routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tactile Pebble Counter Controls & Completion */}
                <div className="flex items-center justify-between mt-4 pt-3 hairline-t">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => decrementHabit(habit.id)}
                      disabled={count <= 0}
                      className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-20 text-zinc-300 flex items-center justify-center pressable border border-white/8"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-sm font-bold px-2 text-white min-w-8 text-center tabular-nums">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => incrementHabit(habit.id, e)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center pressable shadow-md text-white font-bold"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => toggleHabit(habit.id, e)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs pressable transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-zinc-950 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isCompleted ? 'Done' : 'Mark Complete'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Expandable Compose Drawer */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="overflow-hidden"
          >
            <div className="solid-card p-5 flex flex-col gap-3.5 shadow-2xl" style={{ backgroundColor: 'var(--bg-card)' }}>
              <form onSubmit={handleCreateHabit} className="flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="Routine name (e.g. Morning Mindfulness)..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl solid-input text-sm text-white placeholder-zinc-500 focus:outline-none"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g. Health, Intellect)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full sm:w-44 px-3 py-2.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl border border-white/8 text-xs">
                    <span className="text-zinc-500">Target:</span>
                    <input
                      type="number"
                      min="1"
                      value={targetCount}
                      onChange={(e) => setTargetCount(e.target.value)}
                      className="w-12 bg-transparent text-white font-mono font-bold focus:outline-none text-center"
                    />
                    <input
                      type="text"
                      placeholder="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-0.5 bg-black/30 p-1 rounded-xl border border-white/8">
                    {(['morning', 'afternoon', 'evening', 'anytime'] as HabitTimeOfDay[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimeOfDay(t)}
                        className={`flex-1 py-1 rounded-lg text-[11px] capitalize font-bold transition-colors ${
                          timeOfDay === t
                            ? 'text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        style={{
                          backgroundColor: timeOfDay === t ? 'var(--accent-primary)' : 'transparent',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-around bg-black/30 p-1.5 rounded-xl border border-white/8">
                    {colors.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        className={`w-6 h-6 rounded-full transition-transform pressable ${
                          color === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2 hairline-t">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold text-xs pressable shadow-lg"
                    style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
                  >
                    Save Routine
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
