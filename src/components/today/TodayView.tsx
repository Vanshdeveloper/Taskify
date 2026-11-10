import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Plus,
  Flame,
  DollarSign,
  Clock,
  ArrowUpRight,
  Trash2,
  Edit3,
  Search,
  Check,
  ListChecks,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString, formatDateRelative } from '../../db';
import { calculateSubtaskProgress } from '../../utils/subtaskUtils';
import { CalendarStrip } from '../ui/CalendarStrip';
import { DotProgressMatrix } from '../ui/DotProgressMatrix';
import { SwipeToComplete } from '../ui/SwipeToComplete';
import { getCategoryTheme } from '../../utils/category';
import { getRandomDeletePrompt } from '../../utils/genz';

interface TodayViewProps {
  onOpenSearch?: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ onOpenSearch }) => {
  const {
    tasks,
    toggleTask,
    openEditTaskModal,
    habits,
    habitLogs,
    financeStats,
    settings,
    setActiveTab,
    openStreaks,
    requestDelete,
    deleteTask,
    setIsQuickCaptureOpen,
  } = useApp();

  const todayStr = getTodayString();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Filter tasks for selected date
  const dateTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.dueDate === selectedDate || (t.status !== 'completed' && t.dueDate < selectedDate)
    );
  }, [tasks, selectedDate]);

  const completedDateCount = useMemo(() => {
    return dateTasks.filter((t) => t.status === 'completed').length;
  }, [dateTasks]);

  // Active top focus task for the interactive hero card
  const topFocusTask = useMemo(() => {
    return dateTasks.find((t) => t.status !== 'completed') || dateTasks[0];
  }, [dateTasks]);

  // Limit to ONLY 3 tasks for Home/Today section as requested
  const displayedTasks = useMemo(() => dateTasks.slice(0, 3), [dateTasks]);

  const habitsDoneToday = useMemo(() => {
    return habitLogs.filter((l) => l.date === selectedDate && l.completed).length;
  }, [habitLogs, selectedDate]);

  const handleDeleteTask = (taskId: string, title: string) => {
    const prompt = getRandomDeletePrompt('task', title);
    requestDelete({
      title: prompt.title,
      message: prompt.message,
      confirmText: prompt.confirmText,
      cancelText: prompt.cancelText,
      onConfirm: () => deleteTask(taskId),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-28 sm:pb-20 md:pb-12 select-none relative z-10">
      {/* 1. Header (Cleaned: "TASKIFY, and Daily Nexus" removed completely) */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-light text-zinc-400">
            Welcome Back,
          </h1>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-0.5">
            {settings.userName}
          </h2>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mt-2 pressable font-mono"
          >
            <span>Today, {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span style={{ color: 'var(--accent-primary)' }}>→</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenSearch || (() => setActiveTab('tasks'))}
            className="w-9 h-9 rounded-xl flex items-center justify-center pressable border transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-secondary)',
            }}
            title="Universal Search & Command (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsQuickCaptureOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md pressable cursor-pointer font-bold"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
            title="Quick Capture (+)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </div>
      </div>

      {/* 2. Interactive Calendar Strip (Autoselected Today, Zero Required Scroll) */}
      <div className="solid-card p-3.5 sm:p-4 shadow-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
        <CalendarStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          taskDates={tasks.filter((t) => t.status !== 'completed').map((t) => t.dueDate)}
        />
      </div>

      {/* 3. Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Top Focus Task Hero Card (7 cols on desktop & tablet) */}
        <div className="md:col-span-7 flex flex-col">
          {topFocusTask ? (
            <div
              className="solid-card p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between flex-1 min-h-[270px] border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
              }}
            >
              {/* Top Row: User Avatar, Category & Time Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      borderColor: 'var(--border-subtle)',
                      color: '#ffffff',
                    }}
                  >
                    {settings.userName.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {topFocusTask.category}
                  </span>
                </div>

                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{topFocusTask.dueTime ? topFocusTask.dueTime : '02:00 PM'}</span>
                </div>
              </div>

              {/* Title & Priority Badge */}
              <div className="my-4">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 shadow-sm"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                  }}
                >
                  {topFocusTask.priority}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight leading-snug text-white">
                  {topFocusTask.title}
                </h3>
                {topFocusTask.description && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                    {topFocusTask.description}
                  </p>
                )}
              </div>

              {/* Bottom Row: Interactive Swipe-to-Complete Slider */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SwipeToComplete
                    key={topFocusTask.id}
                    isCompleted={topFocusTask.status === 'completed'}
                    onComplete={() => toggleTask(topFocusTask.id)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openEditTaskModal(topFocusTask)}
                  className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg pressable shrink-0 border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-highlight)',
                    color: '#160f0d',
                    borderColor: 'var(--border-card)',
                  }}
                  title="Edit Objective"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="solid-card p-6 flex flex-col items-center justify-center flex-1 min-h-[270px] text-center"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <CheckCircle2 className="w-10 h-10 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-display text-sm font-semibold text-white">All clear for today!</span>
              <p className="text-xs text-zinc-400 mt-1">Enjoy the mental space or plan ahead.</p>
            </div>
          )}
        </div>

        {/* Right Bento Column: 10-Dot Progress Matrix & Safe Spend + Habits (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between gap-3.5">
          {/* Dot Progress Matrix */}
          <DotProgressMatrix
            completed={completedDateCount}
            total={dateTasks.length || 1}
            label="today's tasks goal"
            dotColor="var(--accent-primary)"
          />

          {/* Safe Spend & Daily Habit Streaks Side-by-Side in 2-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
            {/* Safe Spend & Daily Cashflow */}
            <div
              onClick={() => setActiveTab('finance')}
              className="solid-card p-4 sm:p-4.5 cursor-pointer flex flex-col justify-between h-full pressable min-w-0 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center justify-between text-xs text-zinc-400 gap-1 min-w-0">
                <span className="font-display font-medium text-zinc-300 truncate">Safe Spend</span>
                <DollarSign className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="mt-2 flex flex-col font-mono tabular-nums min-w-0">
                {(() => {
                  const valStr = `${settings.currency}${financeStats.dailySafeToSpend.toFixed(0)}`;
                  const fontSize =
                    valStr.length > 14
                      ? 'text-sm sm:text-base'
                      : valStr.length > 11
                      ? 'text-base sm:text-lg'
                      : valStr.length > 8
                      ? 'text-lg sm:text-xl'
                      : 'text-2xl sm:text-3xl';
                  return (
                    <span
                      className={`font-display font-bold truncate block min-w-0 max-w-full ${fontSize}`}
                      style={{ color: 'var(--accent-primary)' }}
                      title={valStr}
                    >
                      {valStr}
                    </span>
                  );
                })()}
                {(() => {
                  const spentStr = `Spent: ${settings.currency}${financeStats.todaySpend.toFixed(2)}`;
                  return (
                    <span
                      className="text-[11px] text-zinc-500 mt-0.5 truncate block max-w-full"
                      title={spentStr}
                    >
                      {spentStr}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Daily Habit Streaks Quick Pulse */}
            <div
              onClick={openStreaks}
              className="solid-card p-4 sm:p-4.5 cursor-pointer flex flex-col justify-between h-full pressable min-w-0 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center justify-between text-xs text-zinc-400 gap-1 min-w-0">
                <span className="font-display font-medium text-zinc-300 truncate">Habit Streaks</span>
                <Flame className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500" />
              </div>
              <div className="mt-2 flex flex-col font-mono tabular-nums min-w-0">
                <span className="font-display text-2xl sm:text-3xl font-bold truncate block" style={{ color: 'var(--accent-secondary)' }}>
                  {habitsDoneToday}/{habits.length || 0}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5 truncate block">
                  {habits.length > 0 && habitsDoneToday === habits.length
                    ? 'All routines logged'
                    : 'routines checked'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Creative Task Management Block (Capped at 3 tasks, with "View all" redirection) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-white tracking-tight">
              Task Management
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 font-mono border border-white/6">
              Showing {displayedTasks.length} of {dateTasks.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-1 pressable"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Creative Bento Milestone Cards for Today's Tasks */}
        {displayedTasks.length === 0 ? (
          <div
            className="solid-card p-8 text-center flex flex-col items-center justify-center border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <CheckCircle2 className="w-8 h-8 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-display text-sm font-semibold text-white">No tasks scheduled for today</span>
            <p className="text-xs text-zinc-400 mt-1">Tap + to add a quick objective or enjoy your day.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <AnimatePresence>
              {displayedTasks.map((task) => {
                const isDone = task.status === 'completed';
                const catTheme = getCategoryTheme(task.category);

                return (
                  <motion.div
                    layout
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                    onClick={() => openEditTaskModal(task)}
                    className={`solid-card p-4 rounded-2xl flex flex-col justify-between shadow-xl border relative transition-all group hover:border-white/20 cursor-pointer ${
                      isDone ? 'opacity-65' : ''
                    }`}
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border"
                            style={{
                              backgroundColor: catTheme.bg,
                              color: catTheme.text,
                              borderColor: catTheme.border,
                            }}
                          >
                            {task.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border font-mono ${
                              task.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : task.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-black/30 text-zinc-400 border-white/6'
                            }`}
                          >
                            ^ {task.priority}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id, task.title);
                          }}
                          className="opacity-40 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-rose-400 pressable transition-opacity cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <h4
                        className={`font-display text-sm font-bold tracking-tight leading-snug line-clamp-2 ${
                          isDone ? 'line-through text-zinc-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 font-body">
                          {task.description}
                        </p>
                      )}

                      {/* Checklist Progress Indicator */}
                      {task.subtasks && task.subtasks.length > 0 && (() => {
                        const metrics = calculateSubtaskProgress(task.subtasks);
                        const isFinished = isDone || metrics.isAllDone;
                        return (
                          <div className="mt-2 pt-1.5 hairline-t flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <ListChecks className={`w-3 h-3 shrink-0 ${isFinished ? 'text-emerald-400' : 'text-zinc-400'}`} />
                              <span className={`text-[10px] font-mono font-medium truncate ${isFinished ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                                {isFinished ? `✓ All ${metrics.total} steps done` : `${metrics.completed}/${metrics.total} steps`}
                              </span>
                            </div>
                            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden shrink-0">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: isFinished ? '100%' : `${metrics.percent}%`,
                                  backgroundColor: isFinished ? '#34d399' : 'var(--accent-primary)',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom Row */}
                    <div className="pt-3 mt-3 hairline-t flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>
                          {formatDateRelative(task.dueDate)}
                          {task.dueTime ? ` • ${task.dueTime}` : ''}
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id, e);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] pressable transition-colors border cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'hover:border-white/25 text-white'
                        }`}
                        style={{
                          backgroundColor: isDone ? undefined : 'var(--bg-subtle)',
                          borderColor: isDone ? undefined : 'var(--border-card)',
                        }}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>{isDone ? 'Done' : 'Mark Done'}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
};
