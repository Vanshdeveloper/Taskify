import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  CheckSquare,
  Repeat,
  PieChart,
  Flame,
  Plus,
  Sliders,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { feedback } from '../../utils/feedback';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModal: () => void;
  onOpenHabitModal: () => void;
  onOpenFinanceModal: () => void;
  onOpenInspector: () => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenTaskModal,
  onOpenHabitModal,
  onOpenFinanceModal,
  onOpenInspector,
}) => {
  const {
    tasks,
    toggleTask,
    habits,
    incrementHabit,
    transactions,
    setActiveTab,
    openStreaks,
    settings,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Aggregate results based on query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Default quick action suggestions when query is empty
    if (!q) {
      return [
        {
          id: 'action-task',
          type: 'action' as const,
          title: 'Create New Task',
          subtitle: 'Add objective with priority and deadline',
          icon: Plus,
          badge: 'Task',
          onSelect: () => {
            onClose();
            onOpenTaskModal();
          },
        },
        {
          id: 'action-habit',
          type: 'action' as const,
          title: 'Create New Habit',
          subtitle: 'Track daily routine & build consistency',
          icon: Repeat,
          badge: 'Habit',
          onSelect: () => {
            onClose();
            onOpenHabitModal();
          },
        },
        {
          id: 'action-tx',
          type: 'action' as const,
          title: 'Log Expense or Income',
          subtitle: 'Update cashflow & daily safe-to-spend',
          icon: PieChart,
          badge: 'Finance',
          onSelect: () => {
            onClose();
            onOpenFinanceModal();
          },
        },
        {
          id: 'action-streaks',
          type: 'action' as const,
          title: 'Consistency Hall of Fame',
          subtitle: 'View active streaks, heatmap & ranks',
          icon: Flame,
          badge: 'Streaks',
          onSelect: () => {
            onClose();
            openStreaks();
          },
        },
        {
          id: 'action-inspector',
          type: 'action' as const,
          title: 'Preferences & System Inspector',
          subtitle: 'Change solid themes, backup or export data',
          icon: Sliders,
          badge: 'System',
          onSelect: () => {
            onClose();
            onOpenInspector();
          },
        },
      ];
    }

    const matchedTasks = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((t) => ({
        id: `task-${t.id}`,
        type: 'task' as const,
        title: t.title,
        subtitle: `${t.category} • ${t.dueDate}${t.dueTime ? ` at ${t.dueTime}` : ''}`,
        icon: CheckSquare,
        badge: t.status === 'completed' ? 'Done' : t.priority,
        isCompleted: t.status === 'completed',
        onSelect: () => {
          onClose();
          setActiveTab('tasks');
        },
        onToggle: (e: React.MouseEvent) => {
          e.stopPropagation();
          toggleTask(t.id);
        },
      }));

    const matchedHabits = habits
      .filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          (h.description && h.description.toLowerCase().includes(q)) ||
          h.category.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((h) => ({
        id: `habit-${h.id}`,
        type: 'habit' as const,
        title: h.name,
        subtitle: `${h.category} • ${h.frequency} • Target ${h.targetCount} ${h.unit}`,
        icon: Repeat,
        badge: 'Habit',
        onSelect: () => {
          onClose();
          setActiveTab('habits');
        },
        onToggle: (e: React.MouseEvent) => {
          e.stopPropagation();
          incrementHabit(h.id);
        },
      }));

    const matchedTransactions = transactions
      .filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((tx) => ({
        id: `tx-${tx.id}`,
        type: 'finance' as const,
        title: tx.description,
        subtitle: `${tx.category} • ${tx.date}`,
        icon: PieChart,
        badge: `${tx.type === 'expense' ? '-' : '+'}${settings.currency}${tx.amount.toFixed(2)}`,
        onSelect: () => {
          onClose();
          setActiveTab('finance');
        },
      }));

    return [...matchedTasks, ...matchedHabits, ...matchedTransactions];
  }, [
    query,
    tasks,
    habits,
    transactions,
    settings.currency,
    onClose,
    onOpenTaskModal,
    onOpenHabitModal,
    onOpenFinanceModal,
    onOpenInspector,
    setActiveTab,
    toggleTask,
    incrementHabit,
  ]);

  // Handle keyboard navigation: Esc, Up, Down, Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          feedback.playClick();
          filteredResults[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Spotlight Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: 'spring', damping: 28, stiffness: 420 }}
            className="relative w-full max-w-xl rounded-2xl shadow-2xl flex flex-col border z-10 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 hairline-b">
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search tasks, habits, finance, or jump to..."
                className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-zinc-500 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white pressable"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 border border-white/10 bg-white/5">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 flex flex-col gap-1 no-scrollbar">
              {filteredResults.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <p className="font-display text-sm font-bold text-zinc-300">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 font-body">
                    Try searching for title, category, or type a single keyword.
                  </p>
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        feedback.playClick();
                        item.onSelect();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'border-white/20 bg-white/[0.08]'
                          : 'border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: 'var(--bg-subtle)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {item.type === 'task' && (
                          <button
                            type="button"
                            onClick={(item as any).onToggle}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border pressable ${
                              (item as any).isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'text-zinc-300 hover:text-white border-white/10 bg-white/5'
                            }`}
                          >
                            {(item as any).isCompleted ? '✓ Done' : 'Check'}
                          </button>
                        )}
                        <span
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: 'var(--bg-subtle)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Hint Bar */}
            <div className="px-4 py-2.5 hairline-t flex items-center justify-between text-[11px] font-mono text-zinc-500 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
              </div>
              <span>Taskify Spotlight</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
