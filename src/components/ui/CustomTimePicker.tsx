import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, Check, X } from 'lucide-react';
import { feedback } from '../../utils/feedback';

interface CustomTimePickerProps {
  value?: string; // HH:MM e.g. "14:30"
  onChange: (timeStr: string) => void;
  className?: string;
  placeholder?: string;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value = '',
  onChange,
  className = '',
  placeholder = 'Add deadline time',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value or default to 09:00 AM
  const parseTime = (val: string) => {
    if (!val) return { hour12: 9, minute: 0, ampm: 'AM' as const };
    const [hStr, mStr] = val.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const ampm = h >= 12 ? ('PM' as const) : ('AM' as const);
    const hour12 = h % 12 || 12;
    return { hour12, minute: m, ampm };
  };

  const parsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(parsed.hour12);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(parsed.ampm);

  // Sync internal state when value or isOpen changes
  useEffect(() => {
    if (isOpen) {
      const p = parseTime(value);
      setSelectedHour(p.hour12);
      setSelectedMinute(p.minute);
      setSelectedAmPm(p.ampm);
    }
  }, [isOpen, value]);

  // Click outside listener
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

  const formatDisplay = (t: string) => {
    if (!t) return placeholder;
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.padStart(2, '0')} ${ampm}`;
  };

  const commitTime = (h12: number, min: number, ampm: 'AM' | 'PM') => {
    feedback.playClick();
    let h24 = h12 % 12;
    if (ampm === 'PM') h24 += 12;
    const timeStr = `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    onChange(timeStr);
  };

  const handleApply = () => {
    commitTime(selectedHour, selectedMinute, selectedAmPm);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    feedback.playClick();
    onChange('');
    setIsOpen(false);
  };

  const presets = [
    { label: '09:00 AM (Morning)', value: '09:00' },
    { label: '12:00 PM (Noon)', value: '12:00' },
    { label: '03:00 PM (Afternoon)', value: '15:00' },
    { label: '06:00 PM (Evening)', value: '18:00' },
    { label: '09:00 PM (Night)', value: '21:00' },
  ];

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 px-3.5 rounded-xl solid-input flex items-center justify-between text-xs font-medium text-white pressable gap-2 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className={`font-mono ${value ? 'text-white font-semibold' : 'text-zinc-500'}`}>
            {formatDisplay(value)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Clear time"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </div>
      </button>

      {/* iOS-Style Drum Dial Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-1.5 z-50 rounded-2xl shadow-2xl p-4 flex flex-col gap-3.5 border backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Quick Presets Bar */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {presets.map((p) => {
                const isSelected = value === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      feedback.playClick();
                      onChange(p.value);
                      setIsOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono shrink-0 pressable transition-all border ${
                      isSelected
                        ? 'text-white font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border-white/5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                      borderColor: isSelected ? 'var(--accent-primary)' : undefined,
                    }}
                  >
                    {p.label.split(' ')[0]} {p.label.split(' ')[1]}
                  </button>
                );
              })}
            </div>

            {/* Time Preview Header & AM/PM Segmented Control */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-baseline gap-1 font-mono text-xl font-black text-white pl-1">
                <span>{String(selectedHour).padStart(2, '0')}</span>
                <span className="text-zinc-500 animate-pulse">:</span>
                <span>{String(selectedMinute).padStart(2, '0')}</span>
              </div>

              {/* AM / PM Segmented Switch */}
              <div className="flex items-center p-0.5 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
                {(['AM', 'PM'] as const).map((period) => {
                  const active = selectedAmPm === period;
                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => {
                        feedback.playClick();
                        setSelectedAmPm(period);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        active
                          ? 'text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      {period}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dial Selectors: Hours & Minutes */}
            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Hours Column */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Hour
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {hours.map((h) => {
                    const isSelected = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          feedback.playClick();
                          setSelectedHour(h);
                        }}
                        className={`h-7 rounded-lg text-xs font-mono font-medium transition-all pressable ${
                          isSelected
                            ? 'text-white font-bold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                        }}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes Column */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Minute
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {minutes.map((m) => {
                    const isSelected = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          feedback.playClick();
                          setSelectedMinute(m);
                        }}
                        className={`h-7 rounded-lg text-xs font-mono font-medium transition-all pressable ${
                          isSelected
                            ? 'text-white font-bold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                        }}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 hairline-t">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-zinc-400 hover:text-rose-400 pressable transition-colors"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md pressable transition-all"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Set Time</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
