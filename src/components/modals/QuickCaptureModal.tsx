import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Wallet,
  Repeat,
  X,
  ArrowRight,
  Bell,
  Plus,
  Trash2,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import type { Priority, HabitTimeOfDay, ReminderPreset, TransactionType, PaymentMethod } from '../../types';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { CustomTimePicker } from '../ui/CustomTimePicker';
import { CustomSelect } from '../ui/CustomSelect';
import { feedback } from '../../utils/feedback';
import {
  calculateTaskReminderTime,
  generateDefaultReminderTimes,
  requestNotificationPermission,
} from '../../utils/reminder';
import { HABIT_ICON_OPTIONS } from '../habits/HabitIconRenderer';
import { getEmptyFieldError } from '../../utils/genz';

export const QuickCaptureModal: React.FC = () => {
  const { isQuickCaptureOpen, setIsQuickCaptureOpen, addTask, addHabit, addTransaction, tasks, settings } = useApp();
  const [activeType, setActiveType] = useState<'task' | 'habit' | 'finance'>('task');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = getTodayString();

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(today);
  const [taskDueTime, setTaskDueTime] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskCategory, setTaskCategory] = useState('Work');
  const [taskReminderEnabled, setTaskReminderEnabled] = useState(false);
  const [taskReminderPreset, setTaskReminderPreset] = useState<ReminderPreset>('at_due');
  const [taskReminderTime, setTaskReminderTime] = useState('');

  // Habit form state
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('Health');
  const [habitTarget, setHabitTarget] = useState('1');
  const [habitUnit, setHabitUnit] = useState('times');
  const [habitTimeOfDay, setHabitTimeOfDay] = useState<HabitTimeOfDay>('morning');
  const [habitColor, setHabitColor] = useState('#f26a36');
  const [habitIcon, setHabitIcon] = useState('target');
  const [habitReminderEnabled, setHabitReminderEnabled] = useState(false);
  const [habitReminderFreq, setHabitReminderFreq] = useState(1);
  const [habitReminderTimes, setHabitReminderTimes] = useState<string[]>(['09:00']);

  // Finance form state
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txCategory, setTxCategory] = useState('Food & Dining');
  const [txDate, setTxDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Categories & Options
  const taskCategories = Array.from(
    new Set(['Work', 'Personal', 'Study', 'Fitness', ...tasks.map((t) => t.category)])
  ).filter(Boolean);

  const habitCategories = ['Health', 'Intellect', 'Fitness', 'Productivity', 'Mindset', 'Creative'];

  const habitColors = [
    { name: 'Terracotta', hex: '#f26a36' },
    { name: 'Ochre', hex: '#e5a42f' },
    { name: 'Matcha', hex: '#7da04a' },
    { name: 'Rose', hex: '#d6798c' },
    { name: 'Cobalt', hex: '#3b82f6' },
  ];

  const expenseCategories = [
    'Food & Dining',
    'Groceries',
    'Transport',
    'Housing',
    'Utilities',
    'Entertainment',
    'Health',
    'Shopping',
    'Other',
  ];

  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

  const paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'apple_pay', label: 'Apple Pay' },
    { value: 'cash', label: 'Cash' },
    { value: 'transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
  ];

  // Reset state on modal close
  useEffect(() => {
    if (!isQuickCaptureOpen) {
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueTime('');
      setTaskReminderEnabled(false);
      setTaskReminderTime('');
      setHabitName('');
      setHabitReminderEnabled(false);
      setHabitReminderFreq(1);
      setHabitReminderTimes(['09:00']);
      setTxAmount('');
      setTxDescription('');
    }
  }, [isQuickCaptureOpen]);

  // Task reminder handlers
  const handleToggleTaskReminder = async () => {
    feedback.playClick();
    const next = !taskReminderEnabled;
    setTaskReminderEnabled(next);
    if (next) {
      await requestNotificationPermission();
      if (!taskReminderTime && taskDueTime) {
        setTaskReminderTime(taskDueTime);
      }
    }
  };

  const handleTaskPresetSelect = (preset: ReminderPreset) => {
    feedback.playClick();
    setTaskReminderPreset(preset);
    const computed = calculateTaskReminderTime(taskDueTime, preset, taskReminderTime);
    setTaskReminderTime(computed);
  };

  // Habit reminder handlers
  const handleToggleHabitReminder = async () => {
    feedback.playClick();
    const next = !habitReminderEnabled;
    setHabitReminderEnabled(next);
    if (next) {
      await requestNotificationPermission();
      if (!habitReminderTimes.length) {
        setHabitReminderTimes(generateDefaultReminderTimes(habitReminderFreq));
      }
    }
  };

  const handleSelectHabitFreq = (count: number) => {
    feedback.playClick();
    setHabitReminderFreq(count);
    setHabitReminderTimes(generateDefaultReminderTimes(count));
  };

  const handleUpdateHabitTimeSlot = (index: number, newTime: string) => {
    const updated = [...habitReminderTimes];
    updated[index] = newTime || '09:00';
    setHabitReminderTimes(updated);
  };

  const handleRemoveHabitTimeSlot = (index: number) => {
    feedback.playClick();
    const updated = habitReminderTimes.filter((_, idx) => idx !== index);
    const finalTimes = updated.length ? updated : ['09:00'];
    setHabitReminderTimes(finalTimes);
    setHabitReminderFreq(Math.max(1, finalTimes.length));
  };

  const handleAddHabitTimeSlot = () => {
    if (habitReminderTimes.length >= 5) return;
    feedback.playClick();
    const defaults = ['09:00', '12:00', '15:00', '18:00', '21:00'];
    const nextTime = defaults[habitReminderTimes.length] || '12:00';
    const updated = [...habitReminderTimes, nextTime];
    setHabitReminderTimes(updated);
    setHabitReminderFreq(updated.length);
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'task') {
      if (!taskTitle.trim()) {
        feedback.playClick();
        setValidationError(getEmptyFieldError('task_title'));
        return;
      }
      const computedReminderTime = taskReminderEnabled
        ? calculateTaskReminderTime(taskDueTime, taskReminderPreset, taskReminderTime)
        : undefined;

      await addTask({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        dueDate: taskDueDate || today,
        dueTime: taskDueTime || undefined,
        priority: taskPriority,
        category: taskCategory.trim() || 'General',
        status: 'todo',
        reminderEnabled: taskReminderEnabled,
        reminderPreset: taskReminderEnabled ? taskReminderPreset : undefined,
        reminderTime: computedReminderTime,
      });
      feedback.playSuccessChime();
    } else if (activeType === 'habit') {
      if (!habitName.trim()) {
        feedback.playClick();
        setValidationError(getEmptyFieldError('habit_name'));
        return;
      }
      const validTimes = habitReminderTimes
        .map((t) => t.trim())
        .filter(Boolean);
      await addHabit({
        name: habitName.trim(),
        targetCount: parseInt(habitTarget, 10) || 1,
        unit: habitUnit.trim() || 'times',
        frequency: 'daily',
        timeOfDay: habitTimeOfDay,
        category: habitCategory.trim() || 'Health',
        color: habitColor,
        icon: habitIcon,
        reminderEnabled: habitReminderEnabled,
        reminderTimes: habitReminderEnabled
          ? validTimes.length
            ? validTimes
            : ['09:00']
          : undefined,
      });
      feedback.playSuccessChime();
      setHabitName('');
      setHabitReminderEnabled(false);
      setHabitReminderFreq(1);
      setHabitReminderTimes(['09:00']);
    } else if (activeType === 'finance') {
      const numAmount = parseFloat(txAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        feedback.playClick();
        setValidationError(getEmptyFieldError('finance_amount'));
        return;
      }
      await addTransaction({
        type: txType,
        amount: numAmount,
        description: txDescription.trim() || txCategory,
        category: txCategory,
        date: txDate || today,
        paymentMethod,
      });
      feedback.playSuccessChime();
    }

    setValidationError(null);
    setIsQuickCaptureOpen(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isQuickCaptureOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => setIsQuickCaptureOpen(false)}
          />

          {/* Unified Quick Capture Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative w-full max-w-lg solid-card shadow-2xl overflow-hidden z-10 border max-h-[90vh] flex flex-col"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Header: Segmented Type Switcher & Close */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 hairline-b bg-white/[0.02] shrink-0">
              <div className="segmented-track flex items-center gap-1 p-1">
                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setActiveType('task');
                    setValidationError(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all cursor-pointer ${
                    activeType === 'task'
                      ? 'text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: activeType === 'task' ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Objective</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setActiveType('habit');
                    setValidationError(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all cursor-pointer ${
                    activeType === 'habit'
                      ? 'text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: activeType === 'habit' ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Routine</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setActiveType('finance');
                    setValidationError(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold pressable transition-all cursor-pointer ${
                    activeType === 'finance'
                      ? 'text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={{
                    backgroundColor: activeType === 'finance' ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Cashflow</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen(false)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] pressable transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar">
              {/* ============================================================ */}
              {/* 1. OBJECTIVE (TASK) COMPLETE FORM                           */}
              {/* ============================================================ */}
              {activeType === 'task' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Objective Title
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="e.g., Deliver Quarterly Roadmap Brief"
                      value={taskTitle}
                      onChange={(e) => {
                        setTaskTitle(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none transition-all ${
                        validationError && activeType === 'task' ? 'border-rose-500 ring-1 ring-rose-500/50' : ''
                      }`}
                    />
                    <AnimatePresence>
                      {validationError && activeType === 'task' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="mt-1 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="shrink-0 text-sm">💀</span>
                          <span>{validationError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Description / Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Add key deliverables, links, or context..."
                      rows={2}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="w-full p-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Target Date
                      </label>
                      <CustomDatePicker value={taskDueDate} onChange={setTaskDueDate} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Deadline Time
                      </label>
                      <CustomTimePicker
                        value={taskDueTime}
                        onChange={setTaskDueTime}
                        placeholder="Add deadline time"
                        align="right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Priority Level
                      </label>
                      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/6">
                        {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              feedback.playClick();
                              setTaskPriority(p);
                            }}
                            className={`py-1.5 rounded-lg capitalize text-[11px] font-bold transition-all ${
                              taskPriority === p
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Category
                      </label>
                      <CustomSelect
                        options={taskCategories}
                        value={taskCategory}
                        onChange={setTaskCategory}
                      />
                    </div>
                  </div>

                  {/* Task Reminder Configuration */}
                  <div className="solid-card p-3 rounded-xl flex flex-col gap-2.5 border bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className={`w-4 h-4 ${taskReminderEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
                        <span className="text-xs font-bold text-zinc-200">Task Reminder Alert</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleTaskReminder}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          taskReminderEnabled
                            ? 'text-white shadow-md'
                            : 'bg-white/[0.05] text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={{
                          backgroundColor: taskReminderEnabled ? 'var(--accent-primary)' : undefined,
                        }}
                      >
                        {taskReminderEnabled ? 'Enabled' : 'Off'}
                      </button>
                    </div>

                    {taskReminderEnabled && (
                      <div className="pt-2 hairline-t flex flex-col gap-2">
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                          {(
                            [
                              { id: 'at_due', label: 'At Due' },
                              { id: '15m_before', label: '15m Prior' },
                              { id: '1h_before', label: '1h Prior' },
                              { id: '1d_before', label: '1d Prior' },
                              { id: 'custom', label: 'Custom' },
                            ] as const
                          ).map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleTaskPresetSelect(preset.id)}
                              className={`py-1 rounded-md text-[10px] font-bold transition-colors ${
                                taskReminderPreset === preset.id
                                  ? 'bg-white/10 text-white border border-white/20'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        {taskReminderPreset === 'custom' && (
                          <div className="pt-1">
                            <CustomTimePicker
                              value={taskReminderTime}
                              onChange={setTaskReminderTime}
                              placeholder="Set specific reminder time"
                              align="right"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ============================================================ */}
              {/* 2. ROUTINE (HABIT) COMPLETE FORM                             */}
              {/* ============================================================ */}
              {activeType === 'habit' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Routine Name
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="e.g., Deep Focus Meditation"
                      value={habitName}
                      onChange={(e) => {
                        setHabitName(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      className={`w-full h-10 px-3.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none transition-all ${
                        validationError && activeType === 'habit' ? 'border-rose-500 ring-1 ring-rose-500/50' : ''
                      }`}
                    />
                    <AnimatePresence>
                      {validationError && activeType === 'habit' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="mt-1 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="shrink-0 text-sm">💀</span>
                          <span>{validationError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Category
                      </label>
                      <CustomSelect
                        options={habitCategories}
                        value={habitCategory}
                        onChange={setHabitCategory}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Daily Target & Unit
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={habitTarget}
                          onChange={(e) => setHabitTarget(e.target.value)}
                          className="w-20 h-10 px-2.5 rounded-xl solid-input text-xs font-mono font-bold text-white text-center focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="unit (e.g. pages, km)"
                          value={habitUnit}
                          onChange={(e) => setHabitUnit(e.target.value)}
                          className="flex-1 h-10 px-3.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Time of Day
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'morning', label: 'Morning', icon: Sunrise, time: '6 AM - 12 PM' },
                        { id: 'afternoon', label: 'Afternoon', icon: Sun, time: '12 PM - 6 PM' },
                        { id: 'evening', label: 'Evening', icon: Moon, time: '6 PM - 11 PM' },
                        { id: 'anytime', label: 'Anytime', icon: Sparkles, time: 'Flexible' },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = habitTimeOfDay === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              feedback.playClick();
                              setHabitTimeOfDay(item.id as HabitTimeOfDay);
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 pressable transition-all cursor-pointer ${
                              isSelected
                                ? 'border-white/30 text-white shadow-md'
                                : 'border-white/8 hover:border-white/16 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
                            }}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                            <span className="text-[11px] font-bold capitalize">
                              {item.label}
                            </span>
                            <span className={`text-[9px] font-mono ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                              {item.time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Habit Icon Selection */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Habit Icon
                      </label>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {HABIT_ICON_OPTIONS.find((i) => i.id === habitIcon)?.label || 'Target'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {HABIT_ICON_OPTIONS.map((item) => {
                        const IconC = item.icon;
                        const isSelected = habitIcon === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              feedback.playClick();
                              setHabitIcon(item.id);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'text-white border-white/40 shadow-sm'
                                : 'text-zinc-400 hover:text-white border-white/6 hover:border-white/20 bg-white/[0.02]'
                            }`}
                            style={{
                              backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
                            }}
                          >
                            <IconC className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Habit Color Swatches */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2.5">
                      {habitColors.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => {
                            feedback.playClick();
                            setHabitColor(c.hex);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            habitColor === c.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Habit Daily Reminders Configuration */}
                  <div className="solid-card p-3 rounded-xl flex flex-col gap-2.5 border bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className={`w-4 h-4 ${habitReminderEnabled ? 'text-amber-400' : 'text-zinc-500'}`} />
                        <span className="text-xs font-bold text-zinc-200">Daily Reminders</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleHabitReminder}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          habitReminderEnabled
                            ? 'text-white shadow-md'
                            : 'bg-white/[0.05] text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={{
                          backgroundColor: habitReminderEnabled ? 'var(--accent-primary)' : undefined,
                        }}
                      >
                        {habitReminderEnabled ? 'Enabled' : 'Off'}
                      </button>
                    </div>

                    {habitReminderEnabled && (
                      <div className="pt-2 hairline-t flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-400 font-mono">Daily Frequency:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((freq) => (
                              <button
                                key={freq}
                                type="button"
                                onClick={() => handleSelectHabitFreq(freq)}
                                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                  habitReminderFreq === freq
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/6'
                                }`}
                              >
                                {freq}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Configured Time Slots */}
                        <div className="flex flex-col gap-2">
                          {habitReminderTimes.map((timeStr, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-7 text-[11px] font-mono text-zinc-400 font-bold text-center shrink-0">
                                #{idx + 1}
                              </span>
                              <div className="flex-1">
                                <CustomTimePicker
                                  value={timeStr || '09:00'}
                                  onChange={(newTime) => handleUpdateHabitTimeSlot(idx, newTime)}
                                  placeholder="09:00 AM"
                                  align="right"
                                />
                              </div>
                              {habitReminderTimes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHabitTimeSlot(idx)}
                                  className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Remove slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {habitReminderTimes.length < 5 && (
                          <button
                            type="button"
                            onClick={handleAddHabitTimeSlot}
                            className="self-start flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer py-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Daily Alert Slot ({habitReminderTimes.length}/5)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ============================================================ */}
              {/* 3. CASHFLOW (FINANCE) COMPLETE FORM                          */}
              {/* ============================================================ */}
              {activeType === 'finance' && (
                <>
                  {/* Expense vs Income Switch */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Transaction Type
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/6">
                      <button
                        type="button"
                        onClick={() => {
                          feedback.playClick();
                          setTxType('expense');
                          setTxCategory('Food & Dining');
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          txType === 'expense'
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Expense (-)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          feedback.playClick();
                          setTxType('income');
                          setTxCategory('Salary');
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          txType === 'income'
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Income (+)
                      </button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Amount ({settings.currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-base font-bold">
                        {settings.currency}
                      </span>
                      <input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={txAmount}
                        onChange={(e) => {
                          setTxAmount(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        className={`w-full h-11 pl-8 pr-3.5 rounded-xl solid-input text-base font-mono font-bold text-white placeholder-zinc-500 focus:outline-none transition-all ${
                          validationError && activeType === 'finance' ? 'border-rose-500 ring-1 ring-rose-500/50' : ''
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {validationError && activeType === 'finance' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="mt-1 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="shrink-0 text-sm">💀</span>
                          <span>{validationError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Description / Memo */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Description / Merchant
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Grocery run at Whole Foods"
                      value={txDescription}
                      onChange={(e) => setTxDescription(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Category
                      </label>
                      <CustomSelect
                        options={txType === 'expense' ? expenseCategories : incomeCategories}
                        value={txCategory}
                        onChange={setTxCategory}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        Payment Method
                      </label>
                      <CustomSelect
                        options={paymentMethods.map((m) => m.label)}
                        value={paymentMethods.find((m) => m.value === paymentMethod)?.label || 'Credit/Debit Card'}
                        onChange={(lbl) => {
                          const found = paymentMethods.find((m) => m.label === lbl);
                          if (found) setPaymentMethod(found.value as PaymentMethod);
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Transaction Date
                    </label>
                    <CustomDatePicker value={txDate} onChange={setTxDate} />
                  </div>
                </>
              )}

              {/* Bottom Footer Actions */}
              <div className="flex items-center justify-between pt-3 hairline-t shrink-0">
                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                  ESC to dismiss
                </span>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs pressable shadow-lg ml-auto cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>
                    {activeType === 'task'
                      ? 'Create Objective'
                      : activeType === 'habit'
                      ? 'Establish Routine'
                      : 'Log Record'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
