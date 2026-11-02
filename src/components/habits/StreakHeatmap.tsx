import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HabitLog } from '../../types';

interface StreakHeatmapProps {
  habitLogs: HabitLog[];
  habitId?: string;
  habitTitle?: string;
  accentColor?: string; // e.g. '#f43f5e'
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({
  habitLogs,
  habitId,
  habitTitle = 'All Habits Consistency',
  accentColor = '#f43f5e',
}) => {
  // Generate last 14 weeks (98 days), grouped by day of week (0=Mon .. 6=Sun)
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const days: { dateStr: string; dayIndex: number; isToday: boolean }[] = [];
  const totalDays = 14 * 7; // 14 weeks

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - (i - dayOfWeek));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const dDayIndex = (d.getDay() + 6) % 7;

    days.push({
      dateStr,
      dayIndex: dDayIndex,
      isToday: i === dayOfWeek,
    });
  }

  // Group into 7 rows (Mon-Sun) x 14 columns
  const rows: { label: string; cells: typeof days }[] = [
    { label: 'M', cells: days.filter((d) => d.dayIndex === 0) },
    { label: 'T', cells: days.filter((d) => d.dayIndex === 1) },
    { label: 'W', cells: days.filter((d) => d.dayIndex === 2) },
    { label: 'T', cells: days.filter((d) => d.dayIndex === 3) },
    { label: 'F', cells: days.filter((d) => d.dayIndex === 4) },
    { label: 'S', cells: days.filter((d) => d.dayIndex === 5) },
    { label: 'S', cells: days.filter((d) => d.dayIndex === 6) },
  ];

  const startDateStr = days[0]?.dateStr ?? '';
  const endDateStr = days[days.length - 1]?.dateStr ?? '';

  const formatDateLabel = (str: string) => {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCellFill = (dateStr: string) => {
    const relevantLogs = habitLogs.filter((l) =>
      habitId ? l.habitId === habitId && l.date === dateStr && l.completed : l.date === dateStr && l.completed
    );

    if (relevantLogs.length === 0) return null;
    if (relevantLogs.length === 1) return 'level-1';
    if (relevantLogs.length === 2) return 'level-2';
    return 'level-3';
  };

  return (
    <div className="glass-card-pro p-4 sm:p-5 rounded-3xl border border-white/8 bg-[#12080a]/60 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none">
      {/* Subtle background glow */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">
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
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-1.5">
              <span className="w-4 text-[9px] font-mono text-zinc-500 text-center font-bold">
                {row.label}
              </span>
              <div className="flex items-center gap-1.5">
                {row.cells.map((cell) => {
                  const fill = getCellFill(cell.dateStr);
                  const isFilled = fill !== null;

                  return (
                    <motion.div
                      key={cell.dateStr}
                      whileHover={{ scale: 1.35 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] cursor-pointer transition-colors ${
                        cell.isToday ? 'ring-1 ring-white/60' : ''
                      }`}
                      style={{
                        backgroundColor:
                          fill === 'level-3'
                            ? accentColor
                            : fill === 'level-2'
                            ? `${accentColor}cc`
                            : fill === 'level-1'
                            ? `${accentColor}88`
                            : 'rgba(255, 255, 255, 0.04)',
                        boxShadow: isFilled
                          ? `0 0 10px ${accentColor}80`
                          : 'none',
                      }}
                      title={`${cell.dateStr}: ${isFilled ? 'Completed' : 'No entries'}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range Navigation Footer */}
      <div className="flex items-center justify-between pt-3 mt-2 hairline-t text-xs relative z-10">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 flex items-center justify-center pressable"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 flex items-center justify-center pressable"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-400">
          {formatDateLabel(startDateStr)} — {formatDateLabel(endDateStr)}
        </span>
      </div>
    </div>
  );
};
