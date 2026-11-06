import React from 'react';
import { motion } from 'framer-motion';
import type { HabitLog } from '../../types';

interface StreakHeatmapProps {
  habitLogs: HabitLog[];
  habitId?: string;
  habitTitle?: string;
  accentColor?: string;
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({
  habitLogs,
  habitId,
  habitTitle = 'All Habits Consistency',
  accentColor = 'var(--accent-primary)',
}) => {
  // Generate 14 weeks (98 days) strictly aligned Monday through Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  // End date of the 14-week block is this week's Sunday
  const currentWeekSunday = new Date(today);
  currentWeekSunday.setDate(today.getDate() + (6 - todayDayOfWeek));

  // Start date is 14 weeks prior on Monday (14 * 7 - 1 days before current Sunday)
  const startMonday = new Date(currentWeekSunday);
  startMonday.setDate(currentWeekSunday.getDate() - (14 * 7 - 1));

  // Build 14 week columns of 7 days each
  const weeks: { dateStr: string; dayIndex: number; isToday: boolean; isFuture: boolean }[][] = [];
  for (let w = 0; w < 14; w++) {
    const col: { dateStr: string; dayIndex: number; isToday: boolean; isFuture: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startMonday);
      cellDate.setDate(startMonday.getDate() + (w * 7 + d));
      const y = cellDate.getFullYear();
      const m = String(cellDate.getMonth() + 1).padStart(2, '0');
      const day = String(cellDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const isToday = cellDate.getTime() === today.getTime();
      const isFuture = cellDate.getTime() > today.getTime();
      col.push({ dateStr, dayIndex: d, isToday, isFuture });
    }
    weeks.push(col);
  }

  // Row labels Mon - Sun
  const rowLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const startDateStr = weeks[0]?.[0]?.dateStr ?? '';
  const endDateStr = weeks[13]?.[6]?.dateStr ?? '';

  const formatDateLabel = (str: string) => {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCellFill = (dateStr: string) => {
    const relevantLogs = habitLogs.filter((l) =>
      habitId ? l.habitId === habitId && l.date === dateStr && l.completed : l.date === dateStr && l.completed
    );

    if (relevantLogs.length === 0) return 0;
    if (relevantLogs.length === 1) return 1;
    if (relevantLogs.length === 2) return 2;
    return 3;
  };

  return (
    <div
      className="p-4 sm:p-5 rounded-3xl border flex flex-col justify-between shadow-2xl relative overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-tight">
            {habitTitle}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/6">
          14-Week Heatmap
        </span>
      </div>

      {/* Grid Canvas */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar py-2 px-1 relative z-10 w-full">
        <div className="flex flex-col gap-1.5 min-w-max mx-auto sm:mx-0">
          {rowLabels.map((label, rIdx) => {
            const rowCells = weeks.map((w) => w[rIdx]);

            return (
              <div key={rIdx} className="flex items-center gap-1.5">
                <span className="w-3 text-[9px] font-mono text-zinc-500 text-center font-bold shrink-0">
                  {label}
                </span>

                <div className="flex items-center gap-1.5">
                  {rowCells.map((cell) => {
                    const fillLevel = cell.isFuture ? 0 : getCellFill(cell.dateStr);
                    const isFilled = fillLevel > 0;

                    let bg = 'rgba(255, 255, 255, 0.04)';
                    if (cell.isFuture) {
                      bg = 'rgba(255, 255, 255, 0.015)';
                    } else if (fillLevel === 3) {
                      bg = accentColor;
                    } else if (fillLevel === 2) {
                      bg = `color-mix(in srgb, ${accentColor} 70%, transparent)`;
                    } else if (fillLevel === 1) {
                      bg = `color-mix(in srgb, ${accentColor} 40%, transparent)`;
                    }

                    return (
                      <motion.div
                        key={cell.dateStr}
                        whileHover={!cell.isFuture ? { scale: 1.3 } : undefined}
                        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-colors shrink-0 ${
                          cell.isToday
                            ? 'ring-1.5 ring-white shadow-sm'
                            : cell.isFuture
                            ? 'opacity-30'
                            : ''
                        }`}
                        style={{
                          backgroundColor: bg,
                          boxShadow: isFilled
                            ? `0 0 8px color-mix(in srgb, ${accentColor} 50%, transparent)`
                            : 'none',
                        }}
                        title={`${cell.dateStr}${cell.isToday ? ' (Today)' : ''}: ${
                          cell.isFuture
                            ? 'Upcoming'
                            : isFilled
                            ? `${fillLevel} completed`
                            : 'No entries'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Date Range Footer */}
      <div className="flex items-center justify-between pt-3 mt-2 hairline-t text-xs relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.04]" />
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 40%, transparent)` }}
            />
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 70%, transparent)` }}
            />
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: accentColor }}
            />
          </div>
          <span>More</span>
        </div>

        <span className="text-[11px] font-mono text-zinc-400">
          {formatDateLabel(startDateStr)} — {formatDateLabel(endDateStr)}
        </span>
      </div>
    </div>
  );
};
