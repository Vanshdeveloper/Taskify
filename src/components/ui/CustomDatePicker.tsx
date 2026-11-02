import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Internal viewing year and month for calendar navigation
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Sync view when opened with current value
  useEffect(() => {
    if (isOpen && value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [isOpen, value]);

  // Click outside to close
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    feedback.playClick();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    feedback.playClick();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar grid days for current viewing month
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0, Sunday is 6 (standard ISO/European calendar style)
    const startOffset = (firstDayIndex + 6) % 7;

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Empty offset slots
    for (let i = 0; i < startOffset; i++) {
      days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${viewYear}-${mStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Quick preset dates
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

  const formatDisplay = (dStr: string) => {
    if (!dStr) return 'Select date';
    if (dStr === today) return 'Today';
    if (dStr === tomorrow) return 'Tomorrow';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return dStr;
  };

  const handleSelectDate = (dateStr: string) => {
    feedback.playClick();
    onChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button with matched rounded-xl */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 px-3.5 rounded-xl solid-input flex items-center justify-between text-xs font-medium text-white pressable gap-2 transition-colors cursor-pointer"
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

      {/* iOS-Style Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="absolute left-0 right-0 sm:right-auto sm:w-72 top-full mt-1.5 z-50 rounded-2xl shadow-2xl p-3.5 flex flex-col gap-3 border backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Quick Presets Bar */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { label: 'Today', date: today },
                { label: 'Tomorrow', date: tomorrow },
                { label: '+3 Days', date: in3Days },
                { label: 'Next Wk', date: nextWeek },
              ].map((p) => {
                const isSelected = value === p.date;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectDate(p.date)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium shrink-0 pressable transition-all border ${
                      isSelected
                        ? 'text-white font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border-white/5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                      borderColor: isSelected ? 'var(--accent-primary)' : undefined,
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Month & Year Navigation Header */}
            <div className="flex items-center justify-between px-1">
              <span className="font-display text-xs font-bold text-white tracking-tight">
                {monthNames[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 pressable transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 pressable transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 text-center font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }
                const isSelected = value === cell.dateStr;
                const isToday = cell.dateStr === today;

                return (
                  <motion.button
                    key={cell.dateStr}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleSelectDate(cell.dateStr)}
                    className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs font-mono transition-all pressable ${
                      isSelected
                        ? 'font-bold text-white shadow-md'
                        : isToday
                        ? 'border border-amber-500/50 text-white font-semibold hover:bg-white/10'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
                    }}
                  >
                    {cell.dayNum}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
