import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import type { Task } from '../../types';
import { exportTasksToCSV, exportTasksToMarkdown } from '../../utils/taskExport';
import { feedback } from '../../utils/feedback';
import { APPLE_SPRINGS } from '../../utils/motion';

interface TaskExportMenuProps {
  tasks: Task[];
  className?: string;
}

export const TaskExportMenu: React.FC<TaskExportMenuProps> = ({ tasks, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExportCSV = () => {
    feedback.playClick();
    exportTasksToCSV(tasks);
    setIsOpen(false);
  };

  const handleExportMarkdown = () => {
    feedback.playClick();
    exportTasksToMarkdown(tasks);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    feedback.playClick();
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={menuRef} className={`relative select-none ${className}`}>
      {/* 44px Minimum Touch Target Ergonomic Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="h-10 min-w-[44px] px-3 rounded-xl border flex items-center justify-center gap-1.5 pressable transition-colors cursor-pointer"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-subtle)',
        }}
        title="Export tasks backlog"
      >
        <Download className="w-3.5 h-3.5 text-zinc-300" />
        <span className="hidden sm:inline text-xs font-medium text-zinc-300">Export</span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </motion.button>

      {/* Floating Spring Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={APPLE_SPRINGS.snappy}
            className="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 border backdrop-blur-2xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            <div className="px-3 py-1.5 border-b border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Export Backlog ({tasks.length})
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full px-2.5 py-2 rounded-xl text-left pressable transition-colors hover:bg-white/[0.06] flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white group-hover:text-[var(--accent-primary)] transition-colors">
                  Export as CSV
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  RFC 4180 spreadsheet table
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="w-full px-2.5 py-2 rounded-xl text-left pressable transition-colors hover:bg-white/[0.06] flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white group-hover:text-[var(--accent-primary)] transition-colors">
                  Export as Markdown
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  Obsidian & GitHub checklist
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
