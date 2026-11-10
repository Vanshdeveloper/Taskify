import type { Task, Priority } from '../types';

export type TaskSortBy = 'dueDate' | 'priority' | 'title' | 'createdAt';
export type TaskSortOrder = 'asc' | 'desc';

export const SORT_STORAGE_KEY_BY = 'taskify_task_sort_by';
export const SORT_STORAGE_KEY_ORDER = 'taskify_task_sort_order';

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const SORT_OPTIONS: { value: TaskSortBy; label: string }[] = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'createdAt', label: 'Date Added' },
];

/**
 * Pure comparator comparing two tasks by chosen criteria and direction.
 */
export function compareTasks(
  a: Task,
  b: Task,
  sortBy: TaskSortBy,
  sortOrder: TaskSortOrder
): number {
  if (sortBy === 'dueDate') {
    const hasA = Boolean(a.dueDate && a.dueDate.trim());
    const hasB = Boolean(b.dueDate && b.dueDate.trim());
    if (!hasA && !hasB) return 0;
    if (!hasA) return 1; // Undated tasks always at bottom
    if (!hasB) return -1;
    const dtA = `${a.dueDate}T${a.dueTime || '23:59:59'}`;
    const dtB = `${b.dueDate}T${b.dueTime || '23:59:59'}`;
    const cmp = dtA.localeCompare(dtB);
    if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
  } else if (sortBy === 'priority') {
    const wA = PRIORITY_WEIGHTS[a.priority] ?? 0;
    const wB = PRIORITY_WEIGHTS[b.priority] ?? 0;
    const cmp = wA - wB;
    // For priority: 'desc' = Urgent(4) -> High(3) -> Medium(2) -> Low(1)
    //               'asc' = Low(1) -> Medium(2) -> High(3) -> Urgent(4)
    if (cmp !== 0) return sortOrder === 'desc' ? -cmp : cmp;
  } else if (sortBy === 'title') {
    const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
    if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
  } else if (sortBy === 'createdAt') {
    const cA = a.createdAt || 0;
    const cB = b.createdAt || 0;
    const cmp = cA - cB;
    if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
  }

  // Deterministic tie-breaker: createdAt desc, then id
  const tie = (b.createdAt || 0) - (a.createdAt || 0);
  return tie !== 0 ? tie : (a.id || '').localeCompare(b.id || '');
}

/**
 * Returns a new sorted array of tasks.
 */
export function sortTasks(
  tasks: Task[],
  sortBy: TaskSortBy,
  sortOrder: TaskSortOrder
): Task[] {
  return [...tasks].sort((a, b) => compareTasks(a, b, sortBy, sortOrder));
}

/**
 * Read saved sort preferences from localStorage with fallback defaults.
 */
export function loadSavedSortPreferences(): { sortBy: TaskSortBy; sortOrder: TaskSortOrder } {
  let sortBy: TaskSortBy = 'dueDate';
  let sortOrder: TaskSortOrder = 'asc';

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedBy = window.localStorage.getItem(SORT_STORAGE_KEY_BY);
      if (savedBy === 'dueDate' || savedBy === 'priority' || savedBy === 'title' || savedBy === 'createdAt') {
        sortBy = savedBy;
      }
      const savedOrder = window.localStorage.getItem(SORT_STORAGE_KEY_ORDER);
      if (savedOrder === 'asc' || savedOrder === 'desc') {
        sortOrder = savedOrder;
      }
    } catch {}
  }

  return { sortBy, sortOrder };
}

/**
 * Persist sort preferences to localStorage.
 */
export function saveSortPreferences(sortBy: TaskSortBy, sortOrder: TaskSortOrder): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SORT_STORAGE_KEY_BY, sortBy);
      window.localStorage.setItem(SORT_STORAGE_KEY_ORDER, sortOrder);
    } catch {}
  }
}
