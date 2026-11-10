import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, ListChecks } from 'lucide-react';
import type { Subtask } from '../../types';
import {
  addSubtask,
  toggleSubtaskItem,
  updateSubtaskTitle,
  deleteSubtaskItem,
  calculateSubtaskProgress,
} from '../../utils/subtaskUtils';
import { feedback } from '../../utils/feedback';
import { APPLE_SPRINGS } from '../../utils/motion';

interface SubtaskListProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ subtasks = [], onChange }) => {
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = calculateSubtaskProgress(subtasks);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    feedback.playClick();
    const updated = addSubtask(subtasks, newTitle);
    onChange(updated);
    setNewTitle('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleToggle = (id: string) => {
    feedback.playClick();
    const updated = toggleSubtaskItem(subtasks, id);
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    feedback.playClick();
    const updated = deleteSubtaskItem(subtasks, id);
    onChange(updated);
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const startEditing = (st: Subtask) => {
    setEditingId(st.id);
    setEditingText(st.title);
  };

  const saveEditing = () => {
    if (editingId) {
      if (editingText.trim()) {
        const updated = updateSubtaskTitle(subtasks, editingId, editingText);
        onChange(updated);
      }
      setEditingId(null);
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-black/25 border border-white/8 flex flex-col gap-3">
      {/* Header: Title, Counts & Progress Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold text-white tracking-tight">Checklist</span>
        </div>

        {subtasks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 font-semibold">
              {progress.summary} ({progress.percent}%)
            </span>
            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress.percent}%`,
                  backgroundColor: progress.isAllDone ? '#10b981' : 'var(--accent-primary)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a step (press Enter)..."
          className="flex-1 bg-black/30 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors font-body"
          data-no-swipe="true"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border border-white/10 text-white pressable disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          style={{
            backgroundColor: newTitle.trim() ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
          }}
          title="Add step"
          data-no-swipe="true"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Checklist items */}
      {subtasks.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto no-scrollbar pt-1">
          <AnimatePresence initial={false}>
            {subtasks.map((st) => {
              const isEditing = editingId === st.id;

              return (
                <motion.div
                  key={st.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={APPLE_SPRINGS.snappy}
                  className="group flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  {/* Left: 44px min-touch Checkbox Hitbox */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => handleToggle(st.id)}
                      className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center shrink-0 cursor-pointer"
                      title={st.completed ? 'Mark incomplete' : 'Mark complete'}
                      data-no-swipe="true"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          st.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-white/20 hover:border-white/40 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </motion.button>

                    {/* Middle: Title or inline editing */}
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        data-no-swipe="true"
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(st)}
                        className={`text-xs flex-1 truncate cursor-pointer select-none ${
                          st.completed ? 'line-through text-zinc-500' : 'text-zinc-200 hover:text-white'
                        }`}
                        title="Click to edit title"
                      >
                        {st.title}
                      </span>
                    )}
                  </div>

                  {/* Right: Delete button with 44px touch hitbox */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => handleDelete(st.id)}
                    className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center opacity-40 group-hover:opacity-100 hover:text-rose-400 text-zinc-500 transition-opacity cursor-pointer"
                    title="Delete step"
                    data-no-swipe="true"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
