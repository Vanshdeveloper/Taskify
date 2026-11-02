import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayString, formatDateRelative } from '../../db';
import { SwipeToComplete } from '../ui/SwipeToComplete';
import { TaskModal } from '../modals/TaskModal';
import { CustomSelect } from '../ui/CustomSelect';

export const TasksView: React.FC = () => {
  const { tasks, toggleTask, deleteTask, settings, requestDelete } = useApp();
  const today = getTodayString();

  // Filters
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'priority' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-24 select-none relative z-10">
      {/* 1. Header (Cleaned: "Workspace and besides it the name" removed completely) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            HI {settings.userName}, nice to see you!
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Here are your scheduled milestones and focused objectives.
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

      {/* 2. Featured Interactive Card */}
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
              <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
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

      {/* 3. Filter Pills Bar & Search with CustomSelect */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="segmented-track flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: `All ${tasks.length}` },
              { id: 'today', label: `Today ${tasks.filter((t) => t.dueDate === today).length}` },
              { id: 'upcoming', label: 'Weekly' },
              { id: 'priority', label: 'High priority' },
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

        {/* Search & CustomSelect Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="w-36 shrink-0">
            <CustomSelect
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      {/* 4. Task List with Circular Action Buttons */}
      <div
        className="solid-card divide-y divide-white/[0.06] shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {filteredTasks.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-display text-sm font-semibold text-zinc-300">
              No tasks in this section
            </span>
            <p className="text-xs text-zinc-500 mt-1">Tap "+ New Objective" above to create one.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed';

            return (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  {/* Badges: Priority + Time + Due date + Category + Done */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                          : task.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                          : 'bg-black/30 text-zinc-400 border border-white/5'
                      }`}
                    >
                      ^ {task.priority}
                    </span>

                    {task.dueTime ? (
                      <span className="text-[10px] font-mono text-zinc-300 bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/8 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {task.dueTime}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5">
                        50 min
                      </span>
                    )}

                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatDateRelative(task.dueDate)}
                    </span>
                    <span className="text-[10px] text-zinc-500 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5">
                      {task.category}
                    </span>
                    {isDone && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: 'rgba(102, 124, 62, 0.2)',
                          color: 'var(--accent-primary)',
                          borderColor: 'rgba(102, 124, 62, 0.3)',
                        }}
                      >
                        ✓ done
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                      isDone ? 'line-through text-zinc-500' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Circular Action Button (start / done) */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={(e) => toggleTask(task.id, e)}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs pressable transition-all border ${
                      isDone
                        ? 'shadow-lg ring-2 ring-white/20'
                        : 'hover:border-white/30'
                    }`}
                    style={{
                      backgroundColor: isDone ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                      color: isDone ? '#ffffff' : 'var(--text-primary)',
                      borderColor: isDone ? 'var(--accent-primary)' : 'var(--border-card)',
                    }}
                  >
                    {isDone ? '✓' : 'start'}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id, task.title)}
                    className="opacity-40 hover:opacity-100 p-2 rounded-lg text-zinc-500 hover:text-rose-400 pressable transition-opacity"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Task Creation Modal */}
      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
    </div>
  );
};
