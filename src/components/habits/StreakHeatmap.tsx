import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Flame, X } from 'lucide-react';
import type { HabitLog } from '../../types';
import { getTodayString } from '../../db';
import { useApp } from '../../context/AppContext';
import { feedback } from '../../utils/feedback';
import { FLUID_SPRINGS } from '../../utils/motion';

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
  const { tasks } = useApp();
  const todayStr = getTodayString();
  const today = new Date(todayStr + 'T00:00:00');

  // Selected tile state for custom interactive day info popover
  const [selectedTile, setSelectedTile] = useState<{
    dateStr: string;
    isToday: boolean;
    isFuture: boolean;
  } | null>(null);

  const handleTileClick = (cell: { dateStr: string; isToday: boolean; isFuture: boolean }) => {
    feedback.playClick();
    setSelectedTile((prev) => (prev?.dateStr === cell.dateStr ? null : cell));
  };

  // Day of week in Monday=0 ... Sunday=6 system
  const todayDayOfWeek = (today.getDay() + 6) % 7;

  // Monday of the current week (contains today)
  const currentWeekMonday = new Date(today);
  currentWeekMonday.setDate(today.getDate() - todayDayOfWeek);

  // Start Monday is 13 weeks prior to current week's Monday (14 weeks total = 98 days)
  const startMonday = new Date(currentWeekMonday);
  startMonday.setDate(currentWeekMonday.getDate() - (13 * 7));

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
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      col.push({ dateStr, dayIndex: d, isToday, isFuture });
    }
    weeks.push(col);
  }

  // Row labels Mon - Sun
  const rowLabels = [
    { short: 'M', full: 'Monday' },
    { short: 'T', full: 'Tuesday' },
    { short: 'W', full: 'Wednesday' },
    { short: 'T', full: 'Thursday' },
    { short: 'F', full: 'Friday' },
    { short: 'S', full: 'Saturday' },
    { short: 'S', full: 'Sunday' },
  ];

  const startDateStr = weeks[0]?.[0]?.dateStr ?? '';

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return '';
    const dStart = new Date(start + 'T00:00:00');
    const dEnd = new Date(end + 'T00:00:00');
    const startFmt = dStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endFmt = dEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFmt} – ${endFmt}`;
  };

  // Single-pass O(N) pre-aggregation of completed habit logs into an O(1) date-keyed Map
  const logCountsByDate = React.useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < habitLogs.length; i++) {
      const log = habitLogs[i];
      if (!log.completed) continue;
      if (habitId && log.habitId !== habitId) continue;
      map.set(log.date, (map.get(log.date) ?? 0) + 1);
    }
    return map;
  }, [habitLogs, habitId]);

  const getCellFill = (dateStr: string): number => {
    const count = logCountsByDate.get(dateStr) ?? 0;
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3;
  };

  // Aggregated tasks and habits metrics for the selected interactive tile
  const selectedDayMetrics = useMemo(() => {
    if (!selectedTile) return null;
    const dateStr = selectedTile.dateStr;

    // Tasks completed on this day
    const completedTasksCount = (tasks || []).filter((t) => {
      if (t.status !== 'completed') return false;
      if (t.completedAt) {
        const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
        return completedDate === dateStr;
      }
      return t.dueDate === dateStr;
    }).length;

    // Habits logged on this day
    const loggedHabitsCount = (habitLogs || []).filter((l) => {
      if (!l.completed || l.date !== dateStr) return false;
      if (habitId && l.habitId !== habitId) return false;
      return true;
    }).length;

    const dateObj = new Date(dateStr + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return {
      dateStr,
      formattedDate,
      isToday: selectedTile.isToday,
      isFuture: selectedTile.isFuture,
      completedTasksCount,
      loggedHabitsCount,
    };
  }, [selectedTile, tasks, habitLogs, habitId]);

  return (
    <div
      className="p-4 sm:p-5 rounded-3xl border flex flex-col justify-between shadow-2xl relative overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-tight">
            {habitTitle}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/6 shrink-0">
          14-Week Heatmap
        </span>
      </div>

      {/* Custom Small Info Popover on Tile Click */}
      <AnimatePresence>
        {selectedDayMetrics && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={FLUID_SPRINGS.snappy}
            className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/12 shadow-xl flex items-center justify-between gap-3 text-xs select-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-zinc-300" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white truncate text-xs">
                    {selectedDayMetrics.formattedDate}
                  </span>
                  {selectedDayMetrics.isToday && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                      Today
                    </span>
                  )}
                  {selectedDayMetrics.isFuture && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                      Upcoming
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                    {selectedDayMetrics.completedTasksCount} {selectedDayMetrics.completedTasksCount === 1 ? 'task' : 'tasks'}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Flame className="w-3 h-3 stroke-[2.5]" />
                    {selectedDayMetrics.loggedHabitsCount} {selectedDayMetrics.loggedHabitsCount === 1 ? 'habit' : 'habits'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback.playClick();
                setSelectedTile(null);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Close info"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Canvas with Sticky Day Labels and Hardware-Accelerated Cells */}
      <div className="flex items-center justify-start overflow-x-auto no-scrollbar py-2 px-1 relative z-10 w-full scroll-smooth">
        <div className="flex gap-2 min-w-max">
          {/* Sticky Day Labels on Left */}
          <div
            className="sticky left-0 z-20 flex flex-col gap-1.5 pr-2 shrink-0 hairline-r"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            {rowLabels.map((item, rIdx) => {
              const isTodayRow = todayDayOfWeek === rIdx;
              return (
                <div
                  key={rIdx}
                  className="h-3.5 sm:h-4 flex items-center justify-center gap-0.5"
                  title={`${item.full}${isTodayRow ? ' (Today)' : ''}`}
                >
                  <span
                    className={`w-3.5 text-[10px] font-mono text-center font-bold transition-colors ${
                      isTodayRow ? 'text-white font-black' : 'text-zinc-500'
                    }`}
                  >
                    {item.short}
                  </span>
                  {isTodayRow && (
                    <span
                      className="w-1 h-1 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 14 Week Columns of Cells */}
          <div className="flex flex-col gap-1.5">
            {rowLabels.map((_, rIdx) => {
              const rowCells = weeks.map((w) => w[rIdx]);

              return (
                <div key={rIdx} className="flex items-center gap-1.5">
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
                    } else if (cell.isToday) {
                      bg = 'rgba(255, 255, 255, 0.1)';
                    }

                    const isSelected = selectedTile?.dateStr === cell.dateStr;

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => handleTileClick(cell)}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-transform duration-150 hover:scale-125 shrink-0 cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-primary)] scale-110 z-20'
                            : cell.isToday
                            ? 'ring-2 ring-white shadow-[0_0_10px_rgba(255,255,255,0.7)] z-10'
                            : cell.isFuture
                            ? 'opacity-20 border border-dashed border-white/10'
                            : ''
                        }`}
                        style={{
                          backgroundColor: bg,
                          boxShadow: isFilled
                            ? `0 0 6px color-mix(in srgb, ${accentColor} 40%, transparent)`
                            : undefined,
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend & Date Range Footer: Non-Wrapping, Responsive Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-2 hairline-t text-xs relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono shrink-0 whitespace-nowrap">
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

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 shrink-0 whitespace-nowrap">
          <span>{formatDateRange(startDateStr, todayStr)}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white shrink-0">Today</span>
        </div>
      </div>
    </div>
  );
};
