import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  Clock,
  LayoutGrid,
  List,
  Check,
  Calendar,
  Target,
  Copy,
  ArrowUp,
  ListChecks,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString, formatDateRelative } from '../../db';
import { calculateSubtaskProgress } from '../../utils/subtaskUtils';
import { SwipeToComplete } from '../ui/SwipeToComplete';
import { CustomSelect } from '../ui/CustomSelect';
import { SPRING_PILL } from '../../utils/motion';
import { getCategoryTheme } from '../../utils/category';
import { getRandomDeletePrompt } from '../../utils/genz';
import {
  sortTasks,
  SORT_OPTIONS,
  loadSavedSortPreferences,
  saveSortPreferences,
  type TaskSortBy,
  type TaskSortOrder,
} from '../../utils/taskSortUtils';
import { useTaskKeyboardNavigation } from '../../hooks/useTaskKeyboardNavigation';

export const TasksView: React.FC = () => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    duplicateTask,
    requestDelete,
    openTaskModal,
    openEditTaskModal,
    activeTab,
    isTaskModalOpen,
    isHabitModalOpen,
    isFinanceModalOpen,
    isSearchModalOpen,
    isStreaksOpen,
    isInspectorOpen,
    isExecutiveDashboardOpen,
    isDeleteConfirmOpen,
    isQuickCaptureOpen,
  } = useApp();

  const today = getTodayString();

  // View state: Creative Cards Grid vs. Swiss Compact List
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Filters
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'priority' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Multi-Criteria Sort State (Feature F12 with localStorage persistence)
  const [sortBy, setSortBy] = useState<TaskSortBy>(() => loadSavedSortPreferences().sortBy);
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>(() => loadSavedSortPreferences().sortOrder);

  const handleSortByChange = (val: string) => {
    const next = val as TaskSortBy;
    setSortBy(next);
    saveSortPreferences(next, sortOrder);
  };

  const handleToggleSortOrder = () => {
    const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(nextOrder);
    saveSortPreferences(sortBy, nextOrder);
  };

  // Statistics calculation for the creative HUD bar
  const totalCount = tasks.length;
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);
  const pendingCount = totalCount - completedCount;
  const progressRatio = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const categoryOptions = useMemo(() => {
    const rawCategories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)));
    return [
      { value: 'all', label: 'All Tags' },
      ...rawCategories.map((c) => ({ value: c, label: c })),
    ];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchCat = task.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      if (filterTab === 'today') return task.dueDate === today;
      if (filterTab === 'upcoming') return task.dueDate > today && task.status !== 'completed';
      if (filterTab === 'priority') return (task.priority === 'high' || task.priority === 'urgent') && task.status !== 'completed';
      if (filterTab === 'completed') return task.status === 'completed';
      return true;
    });
  }, [tasks, searchQuery, selectedCategory, filterTab, today]);

  // Apply Multi-Criteria Sorting (Feature F12)
  const sortedTasks = useMemo(() => {
    return sortTasks(filteredTasks, sortBy, sortOrder);
  }, [filteredTasks, sortBy, sortOrder]);

  const featuredTask =
    sortedTasks.find((t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')) ||
    sortedTasks.find((t) => t.status !== 'completed');

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

  // Modal active check for keyboard focus isolation (Feature F16)
  const isAnyModalActive =
    Boolean(isTaskModalOpen) ||
    Boolean(isHabitModalOpen) ||
    Boolean(isFinanceModalOpen) ||
    Boolean(isSearchModalOpen) ||
    Boolean(isStreaksOpen) ||
    Boolean(isInspectorOpen) ||
    Boolean(isExecutiveDashboardOpen) ||
    Boolean(isDeleteConfirmOpen) ||
    Boolean(isQuickCaptureOpen) ||
    (typeof document !== 'undefined' && Boolean(document.querySelector('[role="dialog"], .backdrop-blur-md')));

  // In-List Keyboard Navigation (Feature F16: J / K / Space / E / D / Esc)
  const { focusedTaskId } = useTaskKeyboardNavigation({
    tasks: sortedTasks,
    activeTab,
    isModalOpen: isAnyModalActive,
    onToggleTask: (id) => toggleTask(id),
    onEditTask: (task) => openEditTaskModal(task),
    onDeleteTask: (id, title) => handleDeleteTask(id, title),
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-28 sm:pb-20 md:pb-12 select-none relative z-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Tasks & Objectives
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Focus queue, execution milestones, and scheduled deadlines.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={openTaskModal}
          className="self-start sm:self-auto flex items-center gap-1.5 h-9 px-3.5 rounded-xl font-semibold text-xs pressable shadow-sm transition-all cursor-pointer"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
          }}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Objective</span>
        </motion.button>
      </div>

      {/* 2. Creative Metrics HUD Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className="solid-card p-3.5 sm:p-4 flex items-center justify-between shadow-md"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(242, 106, 54, 0.15)',
                color: 'var(--accent-primary)',
                borderColor: 'rgba(242, 106, 54, 0.3)',
              }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                Active Focus
              </span>
              <span className="font-display font-black text-xl text-white">
                {pendingCount} Objectives
              </span>
            </div>
          </div>
        </div>

        <div
          className="solid-card p-3.5 sm:p-4 flex items-center justify-between shadow-md"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                Completed
              </span>
              <span className="font-display font-black text-xl text-white">
                {completedCount} Done
              </span>
            </div>
          </div>
        </div>

        <div
          className="solid-card p-3.5 sm:p-4 flex flex-col justify-between shadow-md"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider">Completion Rate</span>
            <span className="font-bold text-white">{progressRatio}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressRatio}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Featured Focus Hero Card */}
      {featuredTask && (
        <div
          className="solid-card p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px] border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-card)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                }}
              >
                ^ {featuredTask.priority}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/30 text-zinc-300 text-[11px] font-mono border border-white/6">
                {featuredTask.category}
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border shrink-0 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span className="whitespace-nowrap">
                {formatDateRelative(featuredTask.dueDate)}
                {featuredTask.dueTime ? ` • ${featuredTask.dueTime}` : ''}
              </span>
            </div>
          </div>

          <div
            className="my-4 cursor-pointer group/hero"
            onClick={() => openEditTaskModal(featuredTask)}
            title="Click to edit objective"
          >
            <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight leading-snug text-white group-hover/hero:text-[var(--accent-primary)] transition-colors">
              {featuredTask.title}
            </h3>
            {featuredTask.description && (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-1 font-body">
                {featuredTask.description}
              </p>
            )}
          </div>

          <div className="w-full max-w-md">
            <SwipeToComplete
              isCompleted={featuredTask.status === 'completed'}
              onComplete={() => toggleTask(featuredTask.id)}
            />
          </div>
        </div>
      )}

      {/* 4. Filter Pills Bar, Search, Category, Multi-Criteria Sort & Export Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div
            className="segmented-track flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
            style={{ touchAction: 'pan-x' }}
            onWheel={(e) => {
              if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
            }}
          >
            {(
              [
                { id: 'all', label: `All ${tasks.length}` },
                { id: 'today', label: `Today ${tasks.filter((t) => t.dueDate === today).length}` },
                { id: 'upcoming', label: 'Weekly' },
                { id: 'priority', label: 'High Priority' },
                { id: 'completed', label: 'Done' },
              ] as const
            ).map((tab) => {
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`relative px-3.5 py-1.5 text-xs font-bold rounded-xl pressable whitespace-nowrap transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="taskFilterActiveChip"
                      transition={SPRING_PILL}
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search, Category, Sorting (F12) & View Switcher - Harmonized H-9 Apple Standard */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-44 h-9 min-w-[140px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter objectives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            {/* Category Select */}
            <div className="w-28 sm:w-32 shrink-0 h-9">
              <CustomSelect
                options={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
            </div>

            {/* Feature F12: Multi-Criteria Sort Selector */}
            <div className="w-32 sm:w-36 shrink-0 h-9">
              <CustomSelect
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={handleSortByChange}
                placeholder="Sort by"
              />
            </div>

            {/* Feature F12: Asc/Desc Direction Spring Toggle */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleSortOrder}
              className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center solid-input text-zinc-300 hover:text-white pressable transition-colors border cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
              title={`Sort: ${sortOrder === 'asc' ? 'Ascending (tap to invert)' : 'Descending (tap to invert)'}`}
              aria-label={`Toggle sort order, current: ${sortOrder}`}
            >
              <motion.div
                animate={{ rotate: sortOrder === 'desc' ? 180 : 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 320 }}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </motion.div>
            </motion.button>

            {/* View Mode Switcher (Cards vs Compact) */}
            <div
              className="h-9 px-1 rounded-xl flex items-center gap-1 shrink-0 border"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`relative w-7 h-7 rounded-lg flex items-center justify-center pressable transition-colors ${
                  viewMode === 'cards' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Card View"
              >
                {viewMode === 'cards' && (
                  <motion.div
                    layoutId="taskViewModePill"
                    transition={SPRING_PILL}
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
                <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`relative w-7 h-7 rounded-lg flex items-center justify-center pressable transition-colors ${
                  viewMode === 'compact' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Minimalist Compact List View"
              >
                {viewMode === 'compact' && (
                  <motion.div
                    layoutId="taskViewModePill"
                    transition={SPRING_PILL}
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
                <List className="w-3.5 h-3.5 relative z-10" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Creative Tasks Rendering */}
      {sortedTasks.length === 0 ? (
        <div
          className="solid-card py-16 px-4 text-center flex flex-col items-center justify-center border shadow-xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <CheckCircle2 className="w-10 h-10 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
          <span className="font-display text-sm font-semibold text-zinc-300">
            No tasks in this section
          </span>
          <p className="text-xs text-zinc-500 mt-1">Tap "+ New Objective" above to create one.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'cards' ? (
            /* ========================================================
               CREATIVE VIEW 1: INTERACTIVE BENTO MILESTONE CARDS
               ======================================================== */
            <motion.div
              key="cards-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {sortedTasks.map((task) => {
                  const isDone = task.status === 'completed';
                  const isFocused = focusedTaskId === task.id;
                  const catTheme = getCategoryTheme(task.category);

                  return (
                    <motion.div
                      key={task.id}
                      layout="position"
                      id={`task-item-${task.id}`}
                      tabIndex={0}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        scale: isFocused ? 1.005 : 1,
                      }}
                      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                      transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                      onClick={() => openEditTaskModal(task)}
                      className={`solid-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between shadow-xl border relative transition-all group cursor-pointer ${
                        isDone ? 'opacity-65' : ''
                      } ${
                        isFocused
                          ? 'ring-2 ring-white/30 border-white/35 bg-white/[0.04] shadow-2xl z-20'
                          : 'hover:border-white/20'
                      }`}
                      style={{ backgroundColor: 'var(--bg-card)' }}
                    >
                      {/* Top Row: Category Tag, Deadline Pill, Duplicate Action & Delete Action */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border shrink-0"
                            style={{
                              backgroundColor: catTheme.bg,
                              color: catTheme.text,
                              borderColor: catTheme.border,
                            }}
                          >
                            {task.category}
                          </span>

                          {/* Priority Pip */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono shrink-0 ${
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

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div
                            className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/30 border border-white/6 text-zinc-400 shrink-0 whitespace-nowrap"
                            title="Scheduled Due Date"
                          >
                            <Calendar className="w-2.5 h-2.5 shrink-0" />
                            <span className="whitespace-nowrap">{formatDateRelative(task.dueDate)}</span>
                            {task.dueTime && <span className="whitespace-nowrap"> • {task.dueTime}</span>}
                          </div>

                          {/* 1-click Duplicate Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateTask(task.id);
                            }}
                            className="opacity-40 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-[var(--accent-primary)] hover:bg-white/[0.06] pressable transition-all cursor-pointer"
                            title="Duplicate objective (clone)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id, task.title);
                            }}
                            className="opacity-40 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 pressable transition-opacity cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Title & Description */}
                      <div className="my-1.5 flex-1">
                        <h4
                          className={`font-display text-sm sm:text-base font-bold tracking-tight leading-snug ${
                            isDone ? 'line-through text-zinc-500' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-body leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Checklist Progress Strip */}
                        {task.subtasks && task.subtasks.length > 0 && (() => {
                          const metrics = calculateSubtaskProgress(task.subtasks);
                          const isFinished = isDone || metrics.isAllDone;
                          return (
                            <div className="mt-2.5 pt-2 hairline-t flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ListChecks className={`w-3.5 h-3.5 shrink-0 ${isFinished ? 'text-emerald-400' : 'text-zinc-400'}`} />
                                <span className={`text-[11px] font-mono font-medium truncate ${isFinished ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                                  {isFinished ? `✓ All ${metrics.total} steps complete` : `${metrics.completed}/${metrics.total} steps done`}
                                </span>
                              </div>
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden shrink-0">
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

                      {/* Bottom: Tactile Interactive Completion Button */}
                      <div className="pt-3 mt-2.5 hairline-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {isDone ? 'Completed' : 'In Progress'}
                          </span>
                          {task.reminderEnabled && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1"
                              title={task.reminderTime ? `Reminder: ${task.reminderTime}` : 'Reminder set'}
                            >
                              🔔 {task.reminderTime && task.reminderTime !== task.dueTime ? task.reminderTime : 'Reminder'}
                            </span>
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id, e);
                          }}
                          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg font-semibold text-xs pressable transition-colors border cursor-pointer ${
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
            </motion.div>
          ) : (
            /* ========================================================
               CREATIVE VIEW 2: ULTRA-REFINED SWISS COMPACT ROWS
               ======================================================== */
            <motion.div
              key="compact-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="solid-card divide-y divide-white/[0.06] shadow-xl overflow-hidden border"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <AnimatePresence mode="popLayout">
                {sortedTasks.map((task) => {
                  const isDone = task.status === 'completed';
                  const isFocused = focusedTaskId === task.id;

                  return (
                    <motion.div
                      layout="position"
                      key={task.id}
                      id={`task-item-${task.id}`}
                      tabIndex={0}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                      onClick={() => openEditTaskModal(task)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3.5 transition-all cursor-pointer ${
                        isFocused
                          ? 'bg-white/[0.06] ring-1 ring-white/25 scale-[1.005] rounded-xl relative z-10 shadow-lg'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Quick Check Trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id, e);
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border pressable transition-all cursor-pointer ${
                            isDone
                              ? 'shadow-sm text-white'
                              : 'border-white/20 text-transparent hover:border-white/40'
                          }`}
                          style={{
                            backgroundColor: isDone ? 'var(--accent-primary)' : 'transparent',
                            borderColor: isDone ? 'var(--accent-primary)' : undefined,
                          }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>

                        <div className="flex flex-col min-w-0 pr-2">
                          <span
                            className={`text-xs sm:text-sm font-semibold tracking-tight truncate ${
                              isDone ? 'line-through text-zinc-500' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                            <span className="text-zinc-400 shrink-0">{task.category}</span>
                            <span className="text-zinc-600 shrink-0">•</span>
                            <span className="shrink-0">{formatDateRelative(task.dueDate)}</span>
                            {task.dueTime && (
                              <>
                                <span className="text-zinc-600 shrink-0">•</span>
                                <span className="shrink-0">{task.dueTime}</span>
                              </>
                            )}
                            {task.reminderEnabled && (
                              <>
                                <span className="text-zinc-600 shrink-0">•</span>
                                <span
                                  className="text-amber-400 shrink-0 inline-flex items-center gap-1"
                                  title={task.reminderTime ? `Reminder: ${task.reminderTime}` : 'Reminder set'}
                                >
                                  🔔{task.reminderTime && task.reminderTime !== task.dueTime ? ` ${task.reminderTime}` : ''}
                                </span>
                              </>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (() => {
                              const metrics = calculateSubtaskProgress(task.subtasks);
                              const isFinished = isDone || metrics.isAllDone;
                              return (
                                <>
                                  <span className="text-zinc-600 shrink-0">•</span>
                                  <span
                                    className={`shrink-0 inline-flex items-center gap-1 font-mono text-[10px] ${
                                      isFinished ? 'text-emerald-400 font-bold' : 'text-zinc-400'
                                    }`}
                                    title={`Checklist: ${metrics.completed} of ${metrics.total} completed`}
                                  >
                                    <ListChecks className="w-3 h-3" />
                                    <span>{isFinished ? `✓ ${metrics.total} steps` : `${metrics.completed}/${metrics.total}`}</span>
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            task.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300'
                              : task.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-black/20 text-zinc-400'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* 1-click Duplicate Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateTask(task.id);
                          }}
                          className="opacity-40 hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-[var(--accent-primary)] hover:bg-white/[0.06] pressable transition-all cursor-pointer"
                          title="Duplicate objective (clone)"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id, task.title);
                          }}
                          className="opacity-40 hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 pressable transition-opacity cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
