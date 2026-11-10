import type { Subtask } from '../types';

/**
 * Feature F13: Lightweight Task Subtasks / Checklist
 * Pure functional calculations and immutable array manipulation helpers.
 */

/**
 * Generate a unique ID for a subtask
 */
export function generateSubtaskId(): string {
  return 'st-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Validates and sanitizes a subtask title.
 * Returns trimmed non-empty string, or null if empty/whitespace.
 */
export function validateSubtaskTitle(title?: string | null): string | null {
  if (typeof title !== 'string') return null;
  const trimmed = title.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export interface SubtaskProgressMetrics {
  total: number;
  count: number;
  completed: number;
  completedCount: number;
  percent: number;
  isAllDone: boolean;
  isAllCompleted: boolean;
  summary: string;
}

/**
 * Calculate progress metrics for a list of subtasks.
 * Safely guards against empty or undefined arrays without NaN or division by zero.
 */
export function calculateSubtaskProgress(subtasks?: Subtask[] | null): SubtaskProgressMetrics {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return {
      total: 0,
      count: 0,
      completed: 0,
      completedCount: 0,
      percent: 0,
      isAllDone: false,
      isAllCompleted: false,
      summary: '0/0',
    };
  }

  const total = subtasks.length;
  const completed = subtasks.filter((s) => Boolean(s.completed)).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = total > 0 && completed === total;

  return {
    total,
    count: total,
    completed,
    completedCount: completed,
    percent,
    isAllDone,
    isAllCompleted: isAllDone,
    summary: `${completed}/${total}`,
  };
}

/**
 * Create a new subtask object
 */
export function createSubtask(
  title: string,
  idGenerator: () => string = generateSubtaskId
): Subtask | null {
  const sanitized = validateSubtaskTitle(title);
  if (!sanitized) return null;

  return {
    id: idGenerator(),
    title: sanitized,
    completed: false,
  };
}

/**
 * Append a new subtask immutably
 */
export function addSubtask(
  subtasks: Subtask[] = [],
  title?: string | null,
  idGenerator: () => string = generateSubtaskId
): Subtask[] {
  const sanitized = validateSubtaskTitle(title);
  if (!sanitized) {
    return subtasks ? [...subtasks] : [];
  }

  const newItem: Subtask = {
    id: idGenerator(),
    title: sanitized,
    completed: false,
  };

  return [...(subtasks || []), newItem];
}

/**
 * Toggle the completion status of a subtask immutably
 */
export function toggleSubtaskItem(subtasks: Subtask[] = [], subtaskId: string): Subtask[] {
  if (!Array.isArray(subtasks)) return [];

  return subtasks.map((st) => {
    if (st.id === subtaskId) {
      return {
        ...st,
        completed: !st.completed,
      };
    }
    return st;
  });
}

export const toggleSubtask = toggleSubtaskItem;

/**
 * Update a subtask's title inline immutably
 */
export function updateSubtaskTitle(
  subtasks: Subtask[] = [],
  subtaskId: string,
  newTitle: string
): Subtask[] {
  if (!Array.isArray(subtasks)) return [];
  const sanitized = validateSubtaskTitle(newTitle);
  if (!sanitized) return [...subtasks];

  return subtasks.map((st) => {
    if (st.id === subtaskId) {
      return {
        ...st,
        title: sanitized,
      };
    }
    return st;
  });
}

/**
 * Delete a subtask by ID immutably
 */
export function deleteSubtaskItem(subtasks: Subtask[] = [], subtaskId: string): Subtask[] {
  if (!Array.isArray(subtasks)) return [];
  return subtasks.filter((st) => st.id !== subtaskId);
}

export const deleteSubtask = deleteSubtaskItem;
export const removeSubtask = deleteSubtaskItem;

/**
 * Reorder subtasks by moving an item fromIndex to toIndex immutably
 */
export function reorderSubtasks(subtasks: Subtask[] = [], fromIndex: number, toIndex: number): Subtask[] {
  if (!Array.isArray(subtasks)) return [];
  if (fromIndex < 0 || fromIndex >= subtasks.length) return [...subtasks];
  if (toIndex < 0 || toIndex >= subtasks.length) return [...subtasks];
  if (fromIndex === toIndex) return [...subtasks];

  const clone = [...subtasks];
  const [removed] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, removed);
  return clone;
}

/**
 * Deep clone subtasks with completion reset to false (for duplication and templates)
 */
export function cloneSubtasks(
  subtasks?: Array<{ id?: string; title: string; completed?: boolean }>,
  idGenerator: () => string = generateSubtaskId
): Subtask[] | undefined {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return undefined;
  return subtasks.map((st) => ({
    id: idGenerator(),
    title: st.title,
    completed: false,
  }));
}
