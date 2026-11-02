import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { getTodayString } from '../../db';

interface CalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  taskDates?: string[]; // dates that have tasks
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
  taskDates = [],
}) => {
  const todayStr = getTodayString();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Generate 14 days centered starting from 2 days before today up to 11 days ahead
  // This guarantees Today is near the front/center immediately visible without scrolling
  const todayDate = new Date(todayStr + 'T00:00:00');

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - 2 + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    return {
      dateStr,
      dayNum: d.getDate(),
      dayLabel: d.toLocaleDateString(undefined, { weekday: 'short' }),
      isToday: dateStr === todayStr,
      hasTasks: taskDates.includes(dateStr),
    };
  });

  const selectedObj = new Date(selectedDate + 'T00:00:00');
  const monthYearLabel = selectedObj.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // Auto-scroll selected button into center view smoothly on mount and date change
  useEffect(() => {
    if (activeButtonRef.current && scrollContainerRef.current) {
      activeButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${day}`);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full select-none">
      {/* Month Header with Navigation and Today reset */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 rounded-lg text-zinc-500 hover:text-white pressable"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-zinc-200 tracking-tight font-display">
            {monthYearLabel}
          </span>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 rounded-lg text-zinc-500 hover:text-white pressable"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {selectedDate !== todayStr && (
          <button
            type="button"
            onClick={() => onSelectDate(todayStr)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold pressable transition-colors border"
            style={{
              backgroundColor: 'rgba(242, 106, 54, 0.15)',
              borderColor: 'rgba(242, 106, 54, 0.3)',
              color: 'var(--accent-primary)',
            }}
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Back to Today</span>
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Day Strip with Auto-centering */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth"
      >
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <motion.button
              key={item.dateStr}
              ref={isSelected ? activeButtonRef : undefined}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectDate(item.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[3.35rem] py-2.5 px-2 rounded-2xl pressable transition-all relative shrink-0 ${
                isSelected
                  ? 'text-white font-bold shadow-md'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 border border-white/6'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
              }}
            >
              <span
                className={`text-[10px] tracking-tight uppercase font-medium ${
                  isSelected ? 'text-white/80' : 'text-zinc-500'
                }`}
              >
                {item.dayLabel}
              </span>
              <span className="text-sm font-bold tracking-tight mt-0.5 font-mono">
                {item.dayNum}
              </span>

              {/* Task Indicator Dot */}
              {item.hasTasks && (
                <span
                  className={`w-1 h-1 rounded-full mt-1 ${
                    isSelected ? 'bg-white' : 'bg-emerald-400'
                  }`}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
