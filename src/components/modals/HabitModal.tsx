import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Repeat, Bell, Sunrise, Sun, Moon, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HabitTimeOfDay } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomTimePicker } from '../ui/CustomTimePicker';
import { feedback } from '../../utils/feedback';
import { generateDefaultReminderTimes, requestNotificationPermission } from '../../utils/reminder';
import { HABIT_ICON_OPTIONS } from '../habits/HabitIconRenderer';
import { getEmptyFieldError } from '../../utils/genz';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose }) => {
  const { addHabit } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Health');
  const [targetCount, setTargetCount] = useState('1');
  const [unit, setUnit] = useState('times');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('morning');
  const [color, setColor] = useState('#f26a36');
  const [selectedIcon, setSelectedIcon] = useState('target');

  // Daily Reminder states (Supporting all 3 configuration styles)
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState(1);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['09:00']);
  const [validationError, setValidationError] = useState<string | null>(null);

  const categories = ['Health', 'Intellect', 'Fitness', 'Productivity', 'Mindset', 'Creative'];

  const colors = [
    { name: 'Terracotta', hex: '#f26a36' },
    { name: 'Ochre', hex: '#e5a42f' },
    { name: 'Matcha', hex: '#7da04a' },
    { name: 'Rose', hex: '#d6798c' },
    { name: 'Cobalt', hex: '#3b82f6' },
  ];

  const handleToggleReminder = async () => {
    feedback.playClick();
    const next = !reminderEnabled;
    setReminderEnabled(next);
    if (next) {
      await requestNotificationPermission();
      if (!reminderTimes.length) {
        setReminderTimes(generateDefaultReminderTimes(reminderFrequency));
      }
    }
  };

  const handleSelectFrequency = (count: number) => {
    feedback.playClick();
    setReminderFrequency(count);
    const defaults = generateDefaultReminderTimes(count);
    setReminderTimes(defaults);
  };

  const handleUpdateTimeSlot = (index: number, newTime: string) => {
    const updated = [...reminderTimes];
    updated[index] = newTime || '09:00';
    setReminderTimes(updated);
  };

  const handleRemoveTimeSlot = (index: number) => {
    feedback.playClick();
    const updated = reminderTimes.filter((_, idx) => idx !== index);
    const finalTimes = updated.length ? updated : ['09:00'];
    setReminderTimes(finalTimes);
    setReminderFrequency(Math.max(1, finalTimes.length));
  };

  const handleAddTimeSlot = () => {
    if (reminderTimes.length >= 5) return;
    feedback.playClick();
    const defaults = ['09:00', '12:00', '15:00', '18:00', '21:00'];
    const nextTime = defaults[reminderTimes.length] || '12:00';
    const updated = [...reminderTimes, nextTime];
    setReminderTimes(updated);
    setReminderFrequency(updated.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      feedback.playClick();
      setValidationError(getEmptyFieldError('habit_name'));
      return;
    }

    const validTimes = reminderTimes.map((t) => t.trim()).filter(Boolean);

    await addHabit({
      name: name.trim(),
      category: category.trim() || 'Health',
      targetCount: Math.max(1, parseInt(targetCount, 10) || 1),
      unit: unit.trim() || 'times',
      frequency: 'daily',
      timeOfDay,
      color,
      icon: selectedIcon,
      reminderEnabled,
      reminderTimes: reminderEnabled
        ? validTimes.length
          ? validTimes
          : ['09:00']
        : undefined,
    });

    feedback.playSuccessChime();
    setName('');
    setReminderEnabled(false);
    setReminderTimes(['09:00']);
    setReminderFrequency(1);
    setValidationError(null);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

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
                <Repeat className="w-4 h-4 text-amber-400" />
                <h3 className="font-display text-base font-bold text-white tracking-tight">
                  New Routine Habit
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="Routine name (e.g. Morning Mindfulness)..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl solid-input text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                      validationError ? 'border-rose-500 ring-1 ring-rose-500/50' : ''
                    }`}
                  />
                  <div className="w-full sm:w-44">
                    <CustomSelect
                      options={categories}
                      value={category}
                      onChange={setCategory}
                    />
                  </div>
                </div>
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

              {/* Daily Target */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-mono uppercase tracking-wider mb-1">
                  Daily Target
                </label>
                <div className="h-10 flex items-center gap-2 bg-black/30 px-3.5 rounded-xl border border-white/8 text-xs">
                  <span className="text-zinc-500 font-medium">Goal:</span>
                  <input
                    type="number"
                    min="1"
                    value={targetCount}
                    onChange={(e) => setTargetCount(e.target.value)}
                    className="w-14 bg-transparent text-white font-mono font-bold focus:outline-none text-center"
                  />
                  <span className="text-zinc-600">•</span>
                  <input
                    type="text"
                    placeholder="unit (times, mins, pages, glasses)"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Time of Day - Apple Segmented Layout with Visual Icons & Time Ranges */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-mono uppercase tracking-wider mb-1.5">
                  Time of Day
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'morning', label: 'Morning', icon: Sunrise, time: '6 AM - 12 PM' },
                    { id: 'afternoon', label: 'Afternoon', icon: Sun, time: '12 PM - 6 PM' },
                    { id: 'evening', label: 'Evening', icon: Moon, time: '6 PM - 11 PM' },
                    { id: 'anytime', label: 'Anytime', icon: Clock, time: 'Flexible' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = timeOfDay === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          feedback.playClick();
                          setTimeOfDay(item.id as HabitTimeOfDay);
                        }}
                        className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 pressable transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white/30 text-white shadow-md'
                            : 'border-white/8 hover:border-white/16 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
                        }}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                        <span className="text-xs font-bold capitalize">
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

              {/* Daily Multi-Reminder Section (1 to 5 times/day) */}
              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/8 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${reminderEnabled ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
                    <span className="text-xs font-bold text-white tracking-tight">
                      Daily Reminders
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
                    className="flex flex-col gap-3 pt-1 hairline-t"
                  >
                    {/* Frequency selector: 1x to 5x daily chips */}
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 block mb-1">
                        Daily Frequency (Times per day)
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((count) => {
                          const isSel = reminderFrequency === count && reminderTimes.length === count;
                          return (
                            <button
                              key={count}
                              type="button"
                              onClick={() => handleSelectFrequency(count)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                  : 'bg-white/[0.03] text-zinc-400 border-white/6 hover:text-white'
                              }`}
                            >
                              {count}x
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Individual Editable Time Slots */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-zinc-400">
                          Scheduled Reminder Times ({reminderTimes.length}/5)
                        </span>
                        {reminderTimes.length < 5 && (
                          <button
                            type="button"
                            onClick={handleAddTimeSlot}
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>Add Time</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {reminderTimes.map((time, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-6 text-[11px] font-mono text-zinc-500 font-bold text-center">
                              #{idx + 1}
                            </span>
                            <div className="flex-1">
                              <CustomTimePicker
                                value={time || '09:00'}
                                onChange={(newTime) => handleUpdateTimeSlot(idx, newTime)}
                                placeholder="09:00 AM"
                                align="right"
                              />
                            </div>
                            {reminderTimes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTimeSlot(idx)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Remove time slot"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Habit Icon Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-zinc-400 font-mono">
                    Habit Icon
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {HABIT_ICON_OPTIONS.find((i) => i.id === selectedIcon)?.label || 'Target'}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth touch-pan-x select-none"
                  style={{ touchAction: 'pan-x' }}
                  onWheel={(e) => {
                    if (e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                >
                  {HABIT_ICON_OPTIONS.map((item) => {
                    const IconC = item.icon;
                    const isSelected = selectedIcon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          feedback.playClick();
                          setSelectedIcon(item.id);
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

              {/* Theme Color Picker */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-mono mb-1.5">
                  Habit Color Identifier
                </label>
                <div
                  className="flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/8 overflow-x-auto no-scrollbar scroll-smooth"
                  style={{ touchAction: 'pan-x' }}
                  onWheel={(e) => {
                    if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
                  }}
                >
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-7 h-7 rounded-full transition-transform pressable cursor-pointer ${
                        color === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  <span className="text-xs text-zinc-400 font-mono ml-auto">
                    {colors.find((c) => c.hex === color)?.name || 'Custom'}
                  </span>
                </div>
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
                  <span>Create Routine</span>
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
