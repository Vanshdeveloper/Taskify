import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HabitTimeOfDay } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { feedback } from '../../utils/feedback';

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

  const categories = ['Health', 'Intellect', 'Fitness', 'Productivity', 'Mindset', 'Creative'];

  const colors = [
    { name: 'Terracotta', hex: '#f26a36' },
    { name: 'Ochre', hex: '#e5a42f' },
    { name: 'Matcha', hex: '#7da04a' },
    { name: 'Rose', hex: '#d6798c' },
    { name: 'Cobalt', hex: '#3b82f6' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addHabit({
      name: name.trim(),
      category: category.trim() || 'Health',
      targetCount: Math.max(1, parseInt(targetCount, 10) || 1),
      unit: unit.trim() || 'times',
      frequency: 'daily',
      timeOfDay,
      color,
      icon: 'sparkles',
    });

    feedback.playSuccessChime();
    setName('');
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
            className="relative w-full max-w-lg solid-card p-6 shadow-2xl flex flex-col gap-4 border z-10"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 hairline-b">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-display text-base font-bold text-white tracking-tight">
                  New Routine Habit
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-500 hover:text-white pressable"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Routine name (e.g. Morning Mindfulness)..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl solid-input text-sm text-white placeholder-zinc-500 focus:outline-none"
                  autoFocus
                />
                <div className="w-full sm:w-44">
                  <CustomSelect
                    options={categories}
                    value={category}
                    onChange={setCategory}
                  />
                </div>
              </div>

              {/* Target & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Daily Target
                  </label>
                  <div className="h-10 flex items-center gap-2 bg-black/30 px-3 rounded-xl border border-white/8 text-xs">
                    <span className="text-zinc-500">Goal:</span>
                    <input
                      type="number"
                      min="1"
                      value={targetCount}
                      onChange={(e) => setTargetCount(e.target.value)}
                      className="w-12 bg-transparent text-white font-mono font-bold focus:outline-none text-center"
                    />
                    <input
                      type="text"
                      placeholder="unit (times/mins)"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono mb-1">
                    Time of Day
                  </label>
                  <div className="h-10 flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/8">
                    {(['morning', 'afternoon', 'evening', 'anytime'] as HabitTimeOfDay[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTimeOfDay(t)}
                        className={`flex-1 h-full rounded-lg text-[11px] capitalize font-bold transition-colors ${
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
                </div>
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="block text-[10px] text-zinc-400 font-mono mb-1.5">
                  Habit Color Identifier
                </label>
                <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/8">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-7 h-7 rounded-full transition-transform pressable ${
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white pressable"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs pressable shadow-lg flex items-center gap-1.5"
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
