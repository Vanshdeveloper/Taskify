import { useState, useEffect } from 'react';
import type { Task } from '../types';

export interface UseTaskKeyboardNavigationOptions {
  tasks: Task[];
  activeTab: string;
  isModalOpen: boolean;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string, title: string) => void;
}

export function handleTaskKeyDown(
  e: { key: string; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; preventDefault?: () => void; stopPropagation?: () => void },
  options: {
    tasks: Task[];
    activeTab: string;
    isModalOpen: boolean;
    isEditableElement: boolean;
    focusedTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
    onToggleTask: (taskId: string) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string, title: string) => void;
  }
): boolean {
  // 1. Guard against firing when active tab is not 'tasks'
  if (options.activeTab !== 'tasks') return false;

  // 2. Guard against typing inside input, textarea, select, or contenteditable
  if (options.isEditableElement) return false;

  // 3. Guard against system/app modifier combinations (e.g. Cmd+K, Ctrl+D, Alt+Tab)
  if (e.metaKey || e.ctrlKey || e.altKey) return false;

  // 4. Guard against any modal or sheet overlay being open
  if (options.isModalOpen) return false;

  const { tasks, focusedTaskId, onSelectTask, onToggleTask, onEditTask, onDeleteTask } = options;
  if (!tasks || tasks.length === 0) {
    if (e.key === 'Escape' && focusedTaskId !== null) {
      onSelectTask(null);
      return true;
    }
    return false;
  }

  const currentIndex = focusedTaskId ? tasks.findIndex((t) => t.id === focusedTaskId) : -1;
  const currentTask = currentIndex >= 0 ? tasks[currentIndex] : null;

  const keyLower = (e.key || '').toLowerCase();

  // Next task: J or ArrowDown
  if (keyLower === 'j' || e.key === 'ArrowDown') {
    e.preventDefault?.();
    if (currentIndex === -1) {
      onSelectTask(tasks[0].id);
    } else {
      const nextIndex = Math.min(tasks.length - 1, currentIndex + 1);
      onSelectTask(tasks[nextIndex].id);
    }
    return true;
  }

  // Previous task: K or ArrowUp
  if (keyLower === 'k' || e.key === 'ArrowUp') {
    e.preventDefault?.();
    if (currentIndex === -1) {
      onSelectTask(tasks[0].id);
    } else {
      const prevIndex = Math.max(0, currentIndex - 1);
      onSelectTask(tasks[prevIndex].id);
    }
    return true;
  }

  // Toggle complete: Space
  if (e.key === ' ') {
    if (currentTask) {
      e.preventDefault?.();
      onToggleTask(currentTask.id);
      return true;
    }
    return false;
  }

  // Edit task: E
  if (keyLower === 'e') {
    if (currentTask) {
      e.preventDefault?.();
      onEditTask(currentTask);
      return true;
    }
    return false;
  }

  // Delete task: D
  if (keyLower === 'd') {
    if (currentTask) {
      e.preventDefault?.();
      onDeleteTask(currentTask.id, currentTask.title);
      return true;
    }
    return false;
  }

  // Deselect: Escape
  if (e.key === 'Escape') {
    if (focusedTaskId !== null) {
      e.preventDefault?.();
      e.stopPropagation?.();
      onSelectTask(null);
      return true;
    }
    return false;
  }

  return false;
}

export function useTaskKeyboardNavigation({
  tasks,
  activeTab,
  isModalOpen,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: UseTaskKeyboardNavigationOptions) {
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  // Auto-prune focusedTaskId if it gets filtered out or deleted
  useEffect(() => {
    if (focusedTaskId && !tasks.some((t) => t.id === focusedTaskId)) {
      setFocusedTaskId(null);
    }
  }, [tasks, focusedTaskId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditableElement = Boolean(
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable
      );

      handleTaskKeyDown(e, {
        tasks,
        activeTab,
        isModalOpen,
        isEditableElement,
        focusedTaskId,
        onSelectTask: (id) => {
          setFocusedTaskId(id);
          if (id) {
            requestAnimationFrame(() => {
              const el = document.getElementById(`task-item-${id}`);
              el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            });
          }
        },
        onToggleTask,
        onEditTask,
        onDeleteTask,
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tasks, activeTab, isModalOpen, focusedTaskId, onToggleTask, onEditTask, onDeleteTask]);

  return {
    focusedTaskId,
    setFocusedTaskId,
  };
}
