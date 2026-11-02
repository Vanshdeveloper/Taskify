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
    return `${h12}:${m} ${ampm}`;
  };

  const presets = [
    { label: '09:00 AM (Morning)', value: '09:00' },
    { label: '12:00 PM (Noon)', value: '12:00' },
    { label: '03:00 PM (Afternoon)', value: '15:00' },
    { label: '06:00 PM (Evening)', value: '18:00' },
    { label: '09:00 PM (Night)', value: '21:00' },
  ];

  const handleSelect = (t: string) => {
    feedback.playClick();
    onChange(t);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    feedback.playClick();
    onChange('');
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
          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className={`font-mono ${value ? 'text-white font-semibold' : 'text-zinc-500'}`}>
            {formatDisplay(value)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white"
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
              Deadline Time Presets
            </div>

            {/* Presets List */}
            <div className="flex flex-col gap-1">
              {presets.map((p) => {
                const isSelected = value === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelect(p.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between pressable transition-colors border ${
                      isSelected
                        ? 'text-white border-transparent'
                        : 'bg-white/[0.03] text-zinc-300 border-white/6 hover:bg-white/[0.08]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
                    }}
                  >
                    <span className="font-mono">{p.label}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="pt-2 hairline-t flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 font-mono">Custom Time</span>
              <input
                type="time"
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
