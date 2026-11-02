export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM (e.g. "14:30")
  category: string;
  tags?: string[];
  createdAt: number;
  completedAt?: number;
}

export type HabitTimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  targetCount: number;
  unit: string;
  frequency: HabitFrequency;
  timeOfDay: HabitTimeOfDay;
  color: string;
  icon: string;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  currentCount: number;
  completed: boolean;
  timestamp: number;
}

export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'card' | 'cash' | 'transfer' | 'apple_pay' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  createdAt: number;
}

export interface UserSettings {
  monthlyBudget: number;
  currency: string;
  userName: string;
  darkMode: boolean;
  theme?: AppTheme;
}

export type ActiveTab = 'today' | 'tasks' | 'habits' | 'streaks' | 'finance' | 'settings';
export type AppTheme = 'espresso-terracotta' | 'forest-rose' | 'obsidian-pure';
