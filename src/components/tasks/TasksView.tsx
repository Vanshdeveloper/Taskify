import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString, formatDateRelative } from '../../db';
import { SwipeToComplete } from '../ui/SwipeToComplete';
import { TaskModal } from '../modals/TaskModal';
import { CustomSelect } from '../ui/CustomSelect';

export const TasksView: React.FC = () => {
  const { tasks, toggleTask, deleteTask, settings, requestDelete } = useApp();
  const today = getTodayString();

  // View state: Creative Cards Grid vs. Swiss Compact List
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Filters
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'priority' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Statistics calculation for the creative HUD bar
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = totalCount - completedCount;
  const progressRatio = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const rawCategories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)));
  const categoryOptions = [
    { value: 'all', label: 'All Tags' },
    ...rawCategories.map((c) => ({ value: c, label: c })),
  ];

  const filteredTasks = tasks.filter((task) => {
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

  const featuredTask =
    filteredTasks.find((t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')) ||
    filteredTasks.find((t) => t.status !== 'completed');

  const handleDeleteTask = (taskId: string, title: string) => {
    requestDelete({
      title: 'You sure you wanna delete this?',
      message: `No cap, "${title}" will disappear into the void forever fr fr.`,
      confirmText: 'Yep, yeet it',
      cancelText: 'Nope, keep it',
      onConfirm: () => deleteTask(taskId),
    });
  };

  // Helper for category badge styling
  const getCategoryTheme = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('work') || c.includes('office')) {
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
    if (c.includes('fitness') || c.includes('health')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (c.includes('creative') || c.includes('design')) {
      return { bg: 'rgba(214, 121, 140, 0.15)', text: '#f472b6', border: 'rgba(214, 121, 140, 0.3)' };
    }
    if (c.includes('study') || c.includes('learn')) {
      return { bg: 'rgba(229, 164, 47, 0.15)', text: '#fbbf24', border: 'rgba(229, 164, 47, 0.3)' };
    }
    return { bg: 'rgba(255, 255, 255, 0.05)', text: '#d4d4d8', border: 'rgba(255, 255, 255, 0.08)' };
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-36 sm:pb-32 select-none relative z-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            HI {settings.userName}, nice to see you!
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Focus queue, execution milestones, and scheduled deadlines.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsTaskModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold pressable shadow-lg"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
          }}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
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
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider">Completion Velocity</span>
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
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>
                {formatDateRelative(featuredTask.dueDate)}
                {featuredTask.dueTime ? ` • ${featuredTask.dueTime}` : ''}
              </span>
            </div>
          </div>

          <div className="my-4">
            <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight leading-snug text-white">
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

      {/* 4. Filter Pills Bar, Search & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="segmented-track flex items-center gap-1 overflow-x-auto no-scrollbar">
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
                className={`px-3.5 py-1 text-xs font-bold rounded-xl pressable whitespace-nowrap transition-all ${
                  isActive
                    ? 'segmented-thumb-active font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--accent-primary)' : undefined,
                  color: isActive ? '#ffffff' : undefined,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search, CustomSelect & Creative View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter objectives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="w-32 shrink-0">
            <CustomSelect
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>

          {/* View Mode Switcher (Cards vs Compact) */}
          <div className="segmented-track flex items-center gap-0.5 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg pressable transition-all ${
                viewMode === 'cards'
                  ? 'segmented-thumb-active text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{
                backgroundColor: viewMode === 'cards' ? 'var(--accent-primary)' : undefined,
                color: viewMode === 'cards' ? '#fff' : undefined,
              }}
              title="Creative Bento Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg pressable transition-all ${
                viewMode === 'compact'
                  ? 'segmented-thumb-active text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{
                backgroundColor: viewMode === 'compact' ? 'var(--accent-primary)' : undefined,
                color: viewMode === 'compact' ? '#fff' : undefined,
              }}
              title="Minimalist Compact List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Creative Tasks Rendering */}
      {filteredTasks.length === 0 ? (
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
      ) : viewMode === 'cards' ? (
        /* ========================================================
           CREATIVE VIEW 1: INTERACTIVE BENTO MILESTONE CARDS
           ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredTasks.map((task) => {
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
                  className={`solid-card p-5 rounded-3xl flex flex-col justify-between shadow-xl border relative transition-all group hover:border-white/20 ${
                    isDone ? 'opacity-65' : ''
                  }`}
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  {/* Top Row: Category Tag, Deadline Pill & Delete Action */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border"
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono ${
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

                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/30 border border-white/6 text-zinc-400"
                        title="Scheduled Due Date"
                      >
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{formatDateRelative(task.dueDate)}</span>
                        {task.dueTime && <span>• {task.dueTime}</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="opacity-40 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-rose-400 pressable transition-opacity"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Title & Description */}
                  <div className="my-1.5 flex-1">
                    <h4
                      className={`font-display text-base font-bold tracking-tight leading-snug ${
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
                  </div>

                  {/* Bottom: Tactile Interactive Completion Button */}
                  <div className="pt-3.5 mt-3 hairline-t flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {isDone ? 'Status: Completed' : 'Status: In Progress'}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={(e) => toggleTask(task.id, e)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs pressable transition-all border ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'hover:border-white/25 text-white'
                      }`}
                      style={{
                        backgroundColor: isDone ? undefined : 'var(--bg-subtle)',
                        borderColor: isDone ? undefined : 'var(--border-card)',
                      }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isDone ? 'Done' : 'Mark Done'}</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* ========================================================
           CREATIVE VIEW 2: ULTRA-REFINED SWISS COMPACT ROWS
           ======================================================== */
        <div
          className="solid-card divide-y divide-white/[0.06] shadow-xl overflow-hidden border"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {filteredTasks.map((task) => {
            const isDone = task.status === 'completed';

            return (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex items-center justify-between gap-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Quick Check Trigger */}
                  <button
                    type="button"
                    onClick={(e) => toggleTask(task.id, e)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border pressable transition-all ${
                      isDone
                        ? 'shadow-sm text-white'
                        : 'border-white/20 text-transparent hover:border-white/40'
                    }`}
                    style={{
                      backgroundColor: isDone ? 'var(--accent-primary)' : 'transparent',
                      borderColor: isDone ? 'var(--accent-primary)' : undefined,
                    }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="flex flex-col min-w-0 pr-2">
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                        isDone ? 'line-through text-zinc-500' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5 flex-wrap">
                      <span className="text-zinc-400">{task.category}</span>
                      <span>•</span>
                      <span>{formatDateRelative(task.dueDate)}</span>
                      {task.dueTime && (
                        <>
                          <span>•</span>
                          <span>{task.dueTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id, task.title)}
                    className="opacity-40 hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 pressable transition-opacity"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
    </div>
  );
};
