import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  // Generate 14 days around the selected date (7 past, 7 future)
  const current = new Date(selectedDate + 'T00:00:00');

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(current);
    d.setDate(current.getDate() - (6 - i));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    return {
      dateStr,
      dayNum: d.getDate(),
      dayLabel: d.toLocaleDateString(undefined, { weekday: 'short' }).toLowerCase(),
      isToday: dateStr === new Date().toISOString().split('T')[0],
      hasTasks: taskDates.includes(dateStr),
    };
  });

  const monthYearLabel = current.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  }).toLowerCase();

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
      {/* Month Header with Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1 rounded-lg text-zinc-500 hover:text-white pressable"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold text-zinc-200 tracking-tight lowercase">
          {monthYearLabel}
        </span>

        <button
          type="button"
          onClick={handleNextDay}
          className="p-1 rounded-lg text-zinc-500 hover:text-white pressable"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scrollable Day Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <motion.button
              key={item.dateStr}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectDate(item.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[3.25rem] py-2 px-2 rounded-2xl pressable transition-all relative ${
                isSelected
                  ? 'text-white font-bold shadow-md'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 border border-white/6'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--accent-primary)' : undefined,
              }}
            >
              <span className={`text-[10px] tracking-tight uppercase ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
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
