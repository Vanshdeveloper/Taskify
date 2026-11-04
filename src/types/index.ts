export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type ReminderPreset = 'at_due' | '15m_before' | '1h_before' | '1d_before' | 'custom';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM (e.g. "14:30")
  reminderEnabled?: boolean;
  reminderPreset?: ReminderPreset;
  reminderTime?: string; // HH:MM (e.g. "14:15")
  reminderTimes?: string[]; // Multiple reminder times (e.g. ["13:45", "14:00"])
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
  reminderEnabled?: boolean;
  reminderTimes?: string[]; // Array of "HH:MM", e.g. ["09:00", "13:00", "18:00"]
  createdAt: number;
}

export interface ReminderAlert {
  id: string;
  type: 'task' | 'habit';
  entityId: string;
  title: string;
  subtitle: string;
  time: string;
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

export type NavbarHeight = 'compact' | 'default' | 'spacious';
export type NavbarGlass = 'solid' | 'glass' | 'vibrant';

export interface UserSettings {
  monthlyBudget: number;
  currency: string;
  currencyExplicit?: boolean;
  userName: string;
  darkMode: boolean;
  theme?: AppTheme;
  navbarHeight?: NavbarHeight;
  navbarGlass?: NavbarGlass;
}

export type ActiveTab = 'today' | 'tasks' | 'habits' | 'streaks' | 'finance' | 'settings';
export type ThemeCategory = 'all' | 'soft' | 'dark' | 'minimalist' | 'custom';

export type AppTheme =
  | 'espresso-terracotta'
  | 'forest-rose'
  | 'pistachio-cream'
  | 'velvet-burgundy'
  | 'obsidian-pure'
  | 'nordic-frost'
  | 'tokyo-neon'
  | 'kyoto-matcha'
  | 'amber-dune'
  | (string & {});
