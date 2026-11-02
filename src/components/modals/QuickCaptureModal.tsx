import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, DollarSign, Sparkles, X, ArrowRight, Calendar, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import type { Priority, HabitTimeOfDay } from '../../types';

export const QuickCaptureModal: React.FC = () => {
  const { isQuickCaptureOpen, setIsQuickCaptureOpen, addTask, addTransaction, addHabit, settings } = useApp();
  const [activeType, setActiveType] = useState<'task' | 'expense' | 'habit'>('task');
  const inputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState(getTodayString());
  const [habitUnit, setHabitUnit] = useState('times');
  const [habitTarget, setHabitTarget] = useState('1');
  const [habitTime, setHabitTime] = useState<HabitTimeOfDay>('anytime');

  useEffect(() => {
    if (isQuickCaptureOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle('');
      setAmount('');
      setCategory('');
    }
  }, [isQuickCaptureOpen]);

  // Smart input parser on typing
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (val.startsWith('$') || /^\d+(\.\d+)?\s*(spent|for|lunch|coffee|dinner|uber|groceries)/i.test(val)) {
      if (activeType !== 'expense') {
        setActiveType('expense');
        const match = val.match(/\$?(\d+(?:\.\d+)?)/);
        if (match) {
          setAmount(match[1]);
          setTitle(val.replace(/\$?\d+(?:\.\d+)?/, '').trim());
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && (activeType !== 'expense' || !amount)) return;

    if (activeType === 'task') {
      await addTask({
        title: title.trim(),
        status: 'todo',
        priority,
        dueDate: dueDate || getTodayString(),
        category: category.trim() || 'General',
      });
    } else if (activeType === 'expense') {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return;
      await addTransaction({
        type: 'expense',
        amount: numAmount,
        category: category.trim() || 'Food & Dining',
        description: title.trim() || 'Quick Expense',
        date: getTodayString(),
        paymentMethod: 'card',
      });
    } else if (activeType === 'habit') {
      await addHabit({
        name: title.trim(),
        targetCount: parseInt(habitTarget) || 1,
        unit: habitUnit.trim() || 'times',
        frequency: 'daily',
        timeOfDay: habitTime,
        category: category.trim() || 'Health',
        color: '#6366f1',
        icon: 'sparkles',
      });
    }

    setIsQuickCaptureOpen(false);
  };

  return (
    <AnimatePresence>
      {isQuickCaptureOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
          {/* Dimmed backdrop with Apple blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsQuickCaptureOpen(false)}
          />

          {/* Floating Command Palette with Apple spring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative w-full max-w-lg solid-card shadow-2xl overflow-hidden z-10 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Header with Segmented Control */}
            <div className="flex items-center justify-between px-4 py-3 hairline-b bg-white/[0.01]">
              <div className="segmented-track flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveType('task')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium pressable transition-all ${
                    activeType === 'task'
                      ? 'segmented-thumb-active'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveType('expense')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium pressable transition-all ${
                    activeType === 'expense'
                      ? 'segmented-thumb-active'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveType('habit')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium pressable transition-all ${
                    activeType === 'habit'
                      ? 'segmented-thumb-active'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Habit</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                {activeType === 'expense' && (
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-base">
                      {settings.currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl glass-input text-lg font-semibold text-white placeholder-zinc-500 focus:outline-none font-mono tabular-nums"
                      autoFocus
                    />
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    activeType === 'task'
                      ? 'What needs to be done?'
                      : activeType === 'expense'
                      ? 'Description (e.g. Lunch with team)'
                      : 'Habit routine (e.g. Read 20 pages)'
                  }
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* Contextual Options */}
              {activeType === 'task' && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-white/8 text-zinc-300">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-transparent text-zinc-200 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-white/8 text-zinc-300">
                    <Tag className="w-3 h-3 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Category..."
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none text-xs w-24"
                    />
                  </div>

                  <div className="flex items-center gap-0.5 bg-zinc-900/60 p-0.5 rounded-lg border border-white/8">
                    {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-2 py-0.5 rounded capitalize text-[11px] transition-colors ${
                          priority === p
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeType === 'expense' && (
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={category || 'Food & Dining'}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-zinc-900/80 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="Food & Dining" className="bg-zinc-900">Food & Dining</option>
                    <option value="Groceries" className="bg-zinc-900">Groceries</option>
                    <option value="Transport" className="bg-zinc-900">Transport</option>
                    <option value="Utilities" className="bg-zinc-900">Utilities</option>
                    <option value="Entertainment" className="bg-zinc-900">Entertainment</option>
                    <option value="Health" className="bg-zinc-900">Health</option>
                    <option value="Shopping" className="bg-zinc-900">Shopping</option>
                    <option value="Other" className="bg-zinc-900">Other</option>
                  </select>
                </div>
              )}

              {activeType === 'habit' && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-white/8">
                    <span className="text-zinc-500">Target:</span>
                    <input
                      type="number"
                      min="1"
                      value={habitTarget}
                      onChange={(e) => setHabitTarget(e.target.value)}
                      className="w-10 bg-transparent text-zinc-200 focus:outline-none text-xs text-center font-mono"
                    />
                    <input
                      type="text"
                      placeholder="unit"
                      value={habitUnit}
                      onChange={(e) => setHabitUnit(e.target.value)}
                      className="w-16 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-0.5 bg-zinc-900/60 p-0.5 rounded-lg border border-white/8">
                    {(['anytime', 'morning', 'afternoon', 'evening'] as HabitTimeOfDay[]).map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setHabitTime(time)}
                        className={`px-2 py-0.5 rounded capitalize text-[11px] transition-colors ${
                          habitTime === time
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Row */}
              <div className="flex items-center justify-between pt-2 hairline-t text-xs">
                <div className="hidden sm:flex items-center gap-2 text-zinc-500 text-[11px]">
                  <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono">↵</kbd> to save</span>
                  <span>•</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono">ESC</kbd> to dismiss</span>
                </div>

                <div className="sm:hidden text-[11px] text-zinc-500 font-mono">
                  Quick Capture
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white font-bold text-xs pressable shadow-lg"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>Create</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
