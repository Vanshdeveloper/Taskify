import Dexie, { type Table } from 'dexie';
import type { Task, Habit, HabitLog, Transaction } from '../types';

export interface SettingItem {
  key: string;
  value: any;
}

export class TaskifyDB extends Dexie {
  tasks!: Table<Task, string>;
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  transactions!: Table<Transaction, string>;
  settings!: Table<SettingItem, string>;

  constructor() {
    super('TaskifyDB');
    this.version(1).stores({
      tasks: 'id, status, priority, dueDate, category, createdAt',
      habits: 'id, frequency, timeOfDay, category, createdAt',
      habitLogs: 'id, [habitId+date], habitId, date, completed',
      transactions: 'id, type, category, date, createdAt',
      settings: 'key',
    });
  }
}

export const db = new TaskifyDB();

// Helper to format date string YYYY-MM-DD
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateRelative(dateStr: string): string {
  const today = getTodayString();
  if (dateStr === today) return 'Today';

  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const diffDays = Math.round((d.getTime() - t.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
