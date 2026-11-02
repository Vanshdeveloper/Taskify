import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { getTodayString } from '../../db';
import { feedback } from '../../utils/feedback';

interface CustomDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = getTodayString();

  // Helper calculations for quick presets
  const getPresetDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const tomorrow = getPresetDate(1);
  const in3Days = getPresetDate(3);
  const nextWeek = getPresetDate(7);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatDisplay = (dStr: string) => {
    if (dStr === today) return 'Today';
    if (dStr === tomorrow) return 'Tomorrow';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return dStr;
  };

  const handleSelect = (dateStr: string) => {
    feedback.playClick();
    onChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 px-3.5 rounded-xl solid-input flex items-center justify-between text-xs font-medium text-white pressable gap-2 transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-mono">{formatDisplay(value)}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="absolute left-0 right-0 sm:right-auto sm:w-64 top-full mt-1.5 z-50 solid-card shadow-2xl p-3 flex flex-col gap-2.5 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Quick Schedule
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Today', date: today },
                { label: 'Tomorrow', date: tomorrow },
                { label: '+3 Days', date: in3Days },
                { label: '+1 Week', date: nextWeek },
              ].map((p) => {
                const isSelected = value === p.date;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelect(p.date)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between pressable transition-colors border ${
                      isSelected
                        ? 'text-white border-transparent'
                        : 'bg-white/[0.04] text-zinc-300 border-white/6 hover:bg-white/[0.08]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
                    }}
                  >
                    <span>{p.label}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Native Date Input */}
            <div className="pt-2 hairline-t flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 font-mono">Custom Date</span>
              <input
                type="date"
                value={value}
                onChange={(e) => {
                  if (e.target.value) handleSelect(e.target.value);
                }}
                className="w-full h-9 px-2.5 rounded-lg solid-input text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
