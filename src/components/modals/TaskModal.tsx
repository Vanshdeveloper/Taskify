import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString } from '../../db';
import type { Priority, ReminderPreset } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { CustomTimePicker } from '../ui/CustomTimePicker';
import { feedback } from '../../utils/feedback';
import { calculateTaskReminderTime, requestNotificationPermission } from '../../utils/reminder';
import { getEmptyFieldError } from '../../utils/genz';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose }) => {
  const { addTask, tasks } = useApp();
  const today = getTodayString();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(today);
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Work');

  // Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderPreset, setReminderPreset] = useState<ReminderPreset>('at_due');
  const [reminderTime, setReminderTime] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const categories = Array.from(
    new Set(['Work', 'Personal', 'Study', 'Fitness', ...tasks.map((t) => t.category)])
  ).filter(Boolean);

  const handleToggleReminder = async () => {
    feedback.playClick();
    const next = !reminderEnabled;
    setReminderEnabled(next);
    if (next) {
      await requestNotificationPermission();
      if (!reminderTime && dueTime) {
        setReminderTime(dueTime);
      }
    }
  };

  const handlePresetSelect = (preset: ReminderPreset) => {
    feedback.playClick();
    setReminderPreset(preset);
    const computed = calculateTaskReminderTime(dueTime, preset, reminderTime);
    setReminderTime(computed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      feedback.playClick();
      setValidationError(getEmptyFieldError('task_title'));
      return;
    }

    const computedReminderTime = reminderEnabled
      ? calculateTaskReminderTime(dueTime, reminderPreset, reminderTime)
      : undefined;

    await addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || today,
      dueTime: dueTime || undefined,
      priority,
      category: category.trim() || 'General',
      status: 'todo',
      reminderEnabled,
      reminderPreset: reminderEnabled ? reminderPreset : undefined,
      reminderTime: computedReminderTime,
    });

    feedback.playSuccessChime();
    setTitle('');
    setDescription('');
    setDueTime('');
    setReminderEnabled(false);
    setReminderTime('');
    setValidationError(null);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 27, stiffness: 380 }}
            className="relative w-full max-w-lg solid-card p-6 shadow-2xl flex flex-col gap-4 border z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 hairline-b">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
                <h3 className="font-display text-base font-bold text-white tracking-tight">
                  New Task Objective
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-500 hover:text-white pressable cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <input
                  type="text"
                  placeholder="Objective title (e.g. Prepare deck for investors)..."
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl solid-input text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                    validationError ? 'border-rose-500 ring-1 ring-rose-500/50' : ''
                  }`}
                />
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      className="mt-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="shrink-0 text-sm">💀</span>
                      <span>{validationError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <textarea
                placeholder="Optional notes or deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
              />

              {/* Due Date & Deadline Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Due Date
                  </label>
                  <CustomDatePicker value={dueDate} onChange={setDueDate} />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Deadline Time
                  </label>
                  <CustomTimePicker value={dueTime} onChange={setDueTime} />
                </div>
              </div>

              {/* Category Dropdown & Priority Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Category Tag
                  </label>
                  <CustomSelect
                    options={categories}
                    value={category}
                    onChange={setCategory}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Priority Level
                  </label>
                  <div className="h-10 flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/8">
                    {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 h-full rounded-lg capitalize text-[11px] font-bold transition-colors cursor-pointer ${
                          priority === p
                            ? 'text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        style={{
                          backgroundColor: priority === p ? 'var(--accent-primary)' : 'transparent',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reminder Section */}
              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/8 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${reminderEnabled ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
                    <span className="text-xs font-bold text-white tracking-tight">
                      Remind Me
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={handleToggleReminder}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                      reminderEnabled ? 'bg-amber-500' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      animate={{ x: reminderEnabled ? 20 : 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    />
                  </button>
                </div>

                {reminderEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2.5 pt-1 hairline-t"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(
                        [
                          { id: 'at_due', label: 'At due time' },
                          { id: '15m_before', label: '15m before' },
                          { id: '1h_before', label: '1h before' },
                          { id: '1d_before', label: '1d before' },
                          { id: 'custom', label: 'Custom' },
                        ] as const
                      ).map((preset) => {
                        const isSel = reminderPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePresetSelect(preset.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                              isSel
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                : 'bg-white/[0.03] text-zinc-400 border-white/6 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {reminderPreset === 'custom' && (
                      <div className="pt-1">
                        <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                          Custom Reminder Time
                        </label>
                        <CustomTimePicker
                          value={reminderTime}
                          onChange={setReminderTime}
                          placeholder="Select reminder time"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 hairline-t mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white pressable cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs pressable shadow-lg flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Objective</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
