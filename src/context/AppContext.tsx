import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getTodayString } from '../db';
import { seedInitialDataIfNeeded } from '../db/seed';
import type { Task, Habit, HabitLog, Transaction, UserSettings, ActiveTab, ReminderAlert, TaskTemplate, Subtask, ScratchCard } from '../types';
import type { DeleteConfirmOptions } from '../components/modals/ConfirmDeleteModal';
import { feedback, triggerCompletionConfetti } from '../utils/feedback';
import { formatTime12Hour, sendNativeNotification, requestNotificationPermission, syncNativeScheduledReminders } from '../utils/reminder';
import { autodetectCurrency } from '../utils/currency';
import { getPokeNotification, DAILY_POKE_TIMES } from '../utils/pokeMessages';
import { DAYPART_SCHEDULE, generateDaypartGreeting } from '../utils/daypartGreetings';
import { BUILTIN_TASK_TEMPLATES, duplicateTaskData, createTaskFromTemplateData } from '../utils/taskTemplates';
import { syncWidgetData, pollWidgetEvents } from '../utils/widgetSync';
import { focusTimerStore } from '../utils/focusTimer';

interface FinanceStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  todaySpend: number;
  dailySafeToSpend: number;
  monthlyBudget: number;
}

interface AppContextType {
  isDbReady: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  slideProgress: MotionValue<number>;
  isQuickCaptureOpen: boolean;
  setIsQuickCaptureOpen: (open: boolean) => void;

  // Tasks
  tasks: Task[];
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => Promise<string>;
  toggleTask: (id: string, event?: React.MouseEvent, options?: { silent?: boolean }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<string>;
  createTaskFromTemplate: (templateIdOrData: string | TaskTemplate) => Promise<string>;
  updateTaskSubtasks: (taskId: string, subtasks: Subtask[]) => Promise<void>;


  // Habits
  habits: Habit[];
  habitLogs: HabitLog[];
  addHabit: (data: Omit<Habit, 'id' | 'createdAt'>) => Promise<string>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  incrementHabit: (id: string, event?: React.MouseEvent, options?: { silent?: boolean }) => Promise<void>;
  decrementHabit: (id: string) => Promise<void>;
  toggleHabit: (id: string, event?: React.MouseEvent) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  getHabitTodayLog: (id: string) => HabitLog | undefined;
  getHabitStreak: (id: string) => number;

  // Finance
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  financeStats: FinanceStats;

  // Scratchpad & Flashcards
  scratchCards: ScratchCard[];
  addScratchCard: (data: Omit<ScratchCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateScratchCard: (id: string, updates: Partial<ScratchCard>) => Promise<void>;
  deleteScratchCard: (id: string) => Promise<void>;

  // Settings & Storage
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  exportDataAsJson: () => Promise<string>;
  importDataFromJson: (jsonString: string) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;

  // Gen-Z Delete Confirmation
  isDeleteConfirmOpen: boolean;
  deleteConfirmOptions: DeleteConfirmOptions | null;
  requestDelete: (options: DeleteConfirmOptions) => void;
  closeDeleteConfirm: () => void;

  // Reminders & Notifications
  activeReminderAlert: ReminderAlert | null;
  dismissReminderAlert: () => void;
  completeReminderAlert: (alert: ReminderAlert) => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;

  // Shared Modals & Editing
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  openTaskModal: () => void;
  openEditTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
  isHabitModalOpen: boolean;
  editingHabit: Habit | null;
  openHabitModal: () => void;
  openEditHabitModal: (habit: Habit) => void;
  closeHabitModal: () => void;
  isFinanceModalOpen: boolean;
  editingTransaction: Transaction | null;
  openFinanceModal: () => void;
  openEditFinanceModal: (tx: Transaction) => void;
  closeFinanceModal: () => void;
  isSearchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  isStreaksOpen: boolean;
  openStreaks: () => void;
  closeStreaks: () => void;
  isPomodoroOpen: boolean;
  openPomodoro: () => void;
  closePomodoro: () => void;
  isInspectorOpen: boolean;
  openInspector: () => void;
  closeInspector: () => void;
  isExecutiveDashboardOpen: boolean;
  openExecutiveDashboard: () => void;
  closeExecutiveDashboard: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SETTINGS: UserSettings = {
  monthlyBudget: 2400,
  currency: typeof window !== 'undefined' ? autodetectCurrency().symbol : '$',
  userName: 'Alex',
  darkMode: true,
  appAesthetic: 'dynamic-theme',
  navbarHeight: 'default',
  navbarGlass: 'solid',
  hapticFeedback: true,
  hapticSound: 'precision',
  focusEdgeProgress: typeof window !== 'undefined' ? localStorage.getItem('taskify_pc_edge_progress') !== 'false' : true,
  focusEdgeRadius: 'auto',
  focusEdgeInset: 4,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const slideProgress = useMotionValue(0);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  // Gen-Z Delete Confirmation state
  const [deleteConfirmOptions, setDeleteConfirmOptions] = useState<DeleteConfirmOptions | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Reminders & Notifications state
  const [activeReminderAlert, setActiveReminderAlert] = useState<ReminderAlert | null>(null);
  const firedReminderKeysRef = useRef<Set<string>>(new Set());

  const dismissReminderAlert = useCallback(() => {
    setActiveReminderAlert(null);
  }, []);

  // Shared Modals & Editing state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isStreaksOpen, setIsStreaksOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isExecutiveDashboardOpen, setIsExecutiveDashboardOpen] = useState(false);

  const openTaskModal = useCallback(() => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  }, []);
  const openEditTaskModal = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);
  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  const openHabitModal = useCallback(() => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  }, []);
  const openEditHabitModal = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  }, []);
  const closeHabitModal = useCallback(() => {
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  }, []);

  const openFinanceModal = useCallback(() => {
    setEditingTransaction(null);
    setIsFinanceModalOpen(true);
  }, []);
  const openEditFinanceModal = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsFinanceModalOpen(true);
  }, []);
  const closeFinanceModal = useCallback(() => {
    setIsFinanceModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const openSearchModal = useCallback(() => setIsSearchModalOpen(true), []);
  const closeSearchModal = useCallback(() => setIsSearchModalOpen(false), []);

  const openStreaks = useCallback(() => setIsStreaksOpen(true), []);
  const closeStreaks = useCallback(() => {
    setIsStreaksOpen(false);
    setActiveTab((prev) => (prev === 'streaks' ? 'today' : prev));
  }, []);

  const openPomodoro = useCallback(() => setIsPomodoroOpen(true), []);
  const closePomodoro = useCallback(() => setIsPomodoroOpen(false), []);

  const openInspector = useCallback(() => setIsInspectorOpen(true), []);
  const closeInspector = useCallback(() => setIsInspectorOpen(false), []);

  const openExecutiveDashboard = useCallback(() => setIsExecutiveDashboardOpen(true), []);
  const closeExecutiveDashboard = useCallback(() => setIsExecutiveDashboardOpen(false), []);

  const requestDelete = useCallback((options: DeleteConfirmOptions) => {
    setDeleteConfirmOptions(options);
    setIsDeleteConfirmOpen(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmOptions(null);
  }, []);

  // Initialize DB and sample data
  useEffect(() => {
    seedInitialDataIfNeeded()
      .then(() => {
        setIsDbReady(true);
      })
      .catch((err) => {
        console.error('Failed to seed DB:', err);
        setIsDbReady(true);
      });
  }, []);

  // Auto-adapt to user's device currency if not explicitly overridden
  useEffect(() => {
    if (!isDbReady) return;
    const checkCurrencyAdaptation = async () => {
      try {
        const explicitEntry = await db.settings.get('currencyExplicit');
        if (!explicitEntry || !explicitEntry.value) {
          const detected = autodetectCurrency();
          if (detected.symbol) {
            await db.settings.put({ key: 'currency', value: detected.symbol });
          }
        }
      } catch {}
    };
    checkCurrencyAdaptation();
  }, [isDbReady]);

  // Keyboard shortcut listener for universal Quick Capture (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reactive Live Queries via Dexie
  const tasks = useLiveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray(), [], []) || [];
  const habits = useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), [], []) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), [], []) || [];
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [], []) || [];
  const scratchCards = useLiveQuery(() => db.scratchcards.orderBy('createdAt').reverse().toArray(), [], []) || [];
  const settingsEntries = useLiveQuery(() => db.settings.toArray(), [], []) || [];

  // Reconstruct user settings object
  const settings = useMemo<UserSettings>(() => {
    const map: Record<string, any> = {};
    settingsEntries.forEach((s) => {
      map[s.key] = s.value;
    });
    return {
      monthlyBudget: map.monthlyBudget ?? DEFAULT_SETTINGS.monthlyBudget,
      currency: map.currency ?? DEFAULT_SETTINGS.currency,
      userName: map.userName ?? DEFAULT_SETTINGS.userName,
      darkMode: map.darkMode ?? DEFAULT_SETTINGS.darkMode,
      appAesthetic: map.appAesthetic ?? DEFAULT_SETTINGS.appAesthetic,
      navbarHeight: map.navbarHeight ?? DEFAULT_SETTINGS.navbarHeight,
      navbarGlass: map.navbarGlass ?? DEFAULT_SETTINGS.navbarGlass,
      hapticFeedback: map.hapticFeedback ?? DEFAULT_SETTINGS.hapticFeedback,
      hapticSound: map.hapticSound ?? DEFAULT_SETTINGS.hapticSound,
      focusEdgeProgress: map.focusEdgeProgress ?? DEFAULT_SETTINGS.focusEdgeProgress,
      focusEdgeRadius: map.focusEdgeRadius ?? DEFAULT_SETTINGS.focusEdgeRadius,
      focusEdgeInset: map.focusEdgeInset ?? DEFAULT_SETTINGS.focusEdgeInset,
    };
  }, [settingsEntries]);

  // Synchronize haptics user preference with the feedback engine
  useEffect(() => {
    feedback.setHapticsEnabled(settings.hapticFeedback ?? true);
    feedback.setHapticSound(settings.hapticSound ?? 'precision');
  }, [settings.hapticFeedback, settings.hapticSound]);

  // Tasks actions
  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt'>): Promise<string> => {
    const id = 't-' + Math.random().toString(36).substring(2, 9);
    const newTask: Task = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    await db.tasks.add(newTask);
    feedback.playClick();
    return id;
  }, []);

  const toggleTask = useCallback(
    async (id: string, event?: React.MouseEvent, options?: { silent?: boolean }) => {
      const task = await db.tasks.get(id);
      if (!task) return;

      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      const completedAt = nextStatus === 'completed' ? Date.now() : undefined;

      // Auto-mark all subtasks complete when parent task is completed
      let updatedSubtasks = task.subtasks;
      if (nextStatus === 'completed' && task.subtasks && task.subtasks.length > 0) {
        updatedSubtasks = task.subtasks.map((st) => ({ ...st, completed: true }));
      }

      await db.tasks.update(id, {
        status: nextStatus,
        completedAt,
        ...(updatedSubtasks ? { subtasks: updatedSubtasks } : {}),
      });

      if (nextStatus === 'completed') {
        if (!options?.silent) {
          const x = event ? event.clientX / window.innerWidth : 0.5;
          const y = event ? event.clientY / window.innerHeight : 0.5;
          triggerCompletionConfetti(x, y);
        }
      } else {
        if (!options?.silent) {
          feedback.playClick();
        }
      }
    },
    []
  );

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await db.tasks.update(id, updates);
    feedback.playClick();
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await db.tasks.delete(id);
    feedback.playClick();
  }, []);

  const duplicateTask = useCallback(async (id: string): Promise<string> => {
    const source = await db.tasks.get(id);
    if (!source) throw new Error(`Task with id ${id} not found`);

    const duplicated = duplicateTaskData(source);
    await db.tasks.add(duplicated);
    feedback.playClick();
    return duplicated.id;
  }, []);

  const createTaskFromTemplate = useCallback(async (templateIdOrData: string | TaskTemplate): Promise<string> => {
    const template = typeof templateIdOrData === 'string'
      ? BUILTIN_TASK_TEMPLATES.find((t) => t.id === templateIdOrData)
      : templateIdOrData;

    if (!template) throw new Error(`Template not found: ${templateIdOrData}`);

    const todayStr = getTodayString();
    const newTask = createTaskFromTemplateData(template, { today: todayStr });
    await db.tasks.add(newTask);
    feedback.playSuccessChime();
    return newTask.id;
  }, []);

  const updateTaskSubtasks = useCallback(async (taskId: string, subtasks: Subtask[]): Promise<void> => {
    await db.tasks.update(taskId, { subtasks });
    feedback.playClick();
  }, []);


  // Habits actions
  const addHabit = useCallback(async (data: Omit<Habit, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'h-' + Math.random().toString(36).substring(2, 9);
    const newHabit: Habit = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    await db.habits.add(newHabit);
    feedback.playClick();
    return id;
  }, []);

  const getHabitTodayLog = useCallback((habitId: string): HabitLog | undefined => {
    const today = getTodayString();
    return habitLogs.find((l) => l.habitId === habitId && l.date === today);
  }, [habitLogs]);

  const incrementHabit = useCallback(
    async (habitId: string, event?: React.MouseEvent, options?: { silent?: boolean }) => {
      const today = getTodayString();
      const habit = await db.habits.get(habitId);
      if (!habit) return;

      const logId = `hl-${habitId}-${today}`;
      const existing = await db.habitLogs.get(logId);
      const current = existing ? existing.currentCount : 0;
      const nextCount = current + 1;
      const isCompleted = nextCount >= habit.targetCount;

      await db.habitLogs.put({
        id: logId,
        habitId,
        date: today,
        currentCount: nextCount,
        completed: isCompleted,
        timestamp: Date.now(),
      });

      if (isCompleted && (!existing || !existing.completed)) {
        if (!options?.silent) {
          const x = event ? event.clientX / window.innerWidth : 0.5;
          const y = event ? event.clientY / window.innerHeight : 0.5;
          triggerCompletionConfetti(x, y);
        }
      } else {
        if (!options?.silent) {
          feedback.playClick();
        }
      }
    },
    []
  );

  const decrementHabit = useCallback(async (habitId: string) => {
    const today = getTodayString();
    const habit = await db.habits.get(habitId);
    if (!habit) return;

    const logId = `hl-${habitId}-${today}`;
    const existing = await db.habitLogs.get(logId);
    if (!existing || existing.currentCount <= 0) return;

    const nextCount = existing.currentCount - 1;
    await db.habitLogs.put({
      id: logId,
      habitId,
      date: today,
      currentCount: nextCount,
      completed: nextCount >= habit.targetCount,
      timestamp: Date.now(),
    });
    feedback.playClick();
  }, []);

  const toggleHabit = useCallback(
    async (habitId: string, event?: React.MouseEvent, options?: { silent?: boolean }) => {
      const today = getTodayString();
      const habit = await db.habits.get(habitId);
      if (!habit) return;

      const logId = `hl-${habitId}-${today}`;
      const existing = await db.habitLogs.get(logId);
      const isCurrentlyDone = existing?.completed ?? false;

      if (isCurrentlyDone) {
        await db.habitLogs.put({
          id: logId,
          habitId,
          date: today,
          currentCount: 0,
          completed: false,
          timestamp: Date.now(),
        });
        if (!options?.silent) {
          feedback.playClick();
        }
      } else {
        await db.habitLogs.put({
          id: logId,
          habitId,
          date: today,
          currentCount: habit.targetCount,
          completed: true,
          timestamp: Date.now(),
        });
        if (!options?.silent) {
          const x = event ? event.clientX / window.innerWidth : 0.5;
          const y = event ? event.clientY / window.innerHeight : 0.5;
          triggerCompletionConfetti(x, y);
        }
      }
    },
    []
  );

  const deleteHabit = useCallback(async (habitId: string) => {
    await db.habits.delete(habitId);
    await db.habitLogs.where('habitId').equals(habitId).delete();
    feedback.playClick();
  }, []);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    await db.habits.update(id, updates);
    feedback.playClick();
  }, []);

  const getHabitStreak = useCallback((habitId: string): number => {
    // Collect consecutive completed dates into an O(1) Set in a single O(N) pass
    const completedDates = new Set<string>();
    for (let i = 0; i < habitLogs.length; i++) {
      const l = habitLogs[i];
      if (l.habitId === habitId && l.completed) {
        completedDates.add(l.date);
      }
    }

    if (completedDates.size === 0) return 0;

    let streak = 0;
    const checkDate = new Date();
    // Allow today to count if completed, or start from yesterday
    const todayStr = getTodayString();
    let currentStr = todayStr;

    if (!completedDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      currentStr = `${y}-${m}-${d}`;
    }

    while (completedDates.has(currentStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      currentStr = `${y}-${m}-${d}`;
    }

    return streak;
  }, [habitLogs]);

  // Finance actions
  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'tx-' + Math.random().toString(36).substring(2, 9);
    const newTx: Transaction = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    await db.transactions.add(newTx);
    feedback.playClick();
    return id;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await db.transactions.delete(id);
    feedback.playClick();
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    await db.transactions.update(id, updates);
    feedback.playClick();
  }, []);

  // Scratchpad actions
  const addScratchCard = useCallback(async (data: Omit<ScratchCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = 'sc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newCard: ScratchCard = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await db.scratchcards.add(newCard);
    feedback.playClick();
    return id;
  }, []);

  const updateScratchCard = useCallback(async (id: string, updates: Partial<ScratchCard>): Promise<void> => {
    await db.scratchcards.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    feedback.playClick();
  }, []);

  const deleteScratchCard = useCallback(async (id: string): Promise<void> => {
    await db.scratchcards.delete(id);
    feedback.playClick();
  }, []);

  // Finance statistics
  const financeStats = useMemo<FinanceStats>(() => {
    const today = getTodayString();
    const currentMonthPrefix = today.substring(0, 7); // YYYY-MM

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let todaySpend = 0;

    transactions.forEach((tx) => {
      const isThisMonth = tx.date.startsWith(currentMonthPrefix);
      if (isThisMonth) {
        if (tx.type === 'income') {
          monthlyIncome += tx.amount;
        } else {
          monthlyExpenses += tx.amount;
        }
      }
      if (tx.date === today && tx.type === 'expense') {
        todaySpend += tx.amount;
      }
    });

    const netBalance = monthlyIncome - monthlyExpenses;
    const monthlyBudget = settings.monthlyBudget || 2400;

    // Remaining days in month
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, lastDayOfMonth - now.getDate() + 1);

    const remainingBudget = Math.max(0, monthlyBudget - monthlyExpenses);
    const dailySafeToSpend = remainingBudget / daysRemaining;

    return {
      monthlyIncome,
      monthlyExpenses,
      netBalance,
      todaySpend,
      dailySafeToSpend,
      monthlyBudget,
    };
  }, [transactions, settings.monthlyBudget]);

  // Settings & Storage actions
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (updates.focusEdgeProgress !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('taskify_pc_edge_progress', String(updates.focusEdgeProgress));
    }
    if (updates.focusEdgeRadius !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('taskify_edge_radius', String(updates.focusEdgeRadius));
    }
    if (updates.focusEdgeInset !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('taskify_edge_inset', String(updates.focusEdgeInset));
    }
    for (const [k, v] of Object.entries(updates)) {
      await db.settings.put({ key: k, value: v });
    }
    feedback.playClick();
  }, []);

  const exportDataAsJson = useCallback(async (): Promise<string> => {
    const allTasks = await db.tasks.toArray();
    const allHabits = await db.habits.toArray();
    const allLogs = await db.habitLogs.toArray();
    const allTxs = await db.transactions.toArray();
    const allSettings = await db.settings.toArray();

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: allTasks,
      habits: allHabits,
      habitLogs: allLogs,
      transactions: allTxs,
      settings: allSettings,
    };

    return JSON.stringify(data, null, 2);
  }, []);

  const importDataFromJson = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.tasks || !data.habits || !data.transactions) {
        throw new Error('Invalid backup schema');
      }

      await db.transaction('rw', [db.tasks, db.habits, db.habitLogs, db.transactions, db.settings], async () => {
        await db.tasks.clear();
        await db.habits.clear();
        await db.habitLogs.clear();
        await db.transactions.clear();
        await db.settings.clear();

        if (data.tasks.length) await db.tasks.bulkAdd(data.tasks);
        if (data.habits.length) await db.habits.bulkAdd(data.habits);
        if (data.habitLogs.length) await db.habitLogs.bulkAdd(data.habitLogs);
        if (data.transactions.length) await db.transactions.bulkAdd(data.transactions);
        if (data.settings?.length) await db.settings.bulkAdd(data.settings);
      });

      feedback.playSuccessChime();
      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  }, []);

  const resetToDefaults = useCallback(async () => {
    await db.tasks.clear();
    await db.habits.clear();
    await db.habitLogs.clear();
    await db.transactions.clear();
    await db.settings.clear();
    await seedInitialDataIfNeeded();
    feedback.playClick();
  }, []);

  const completeReminderAlert = useCallback(async (alert: ReminderAlert) => {
    if (alert.type === 'task') {
      await toggleTask(alert.entityId);
    } else if (alert.type === 'habit') {
      await incrementHabit(alert.entityId);
    } else if (alert.type === 'poke' || alert.type === 'daypart') {
      feedback.playSuccessChime();
    }
    setActiveReminderAlert(null);
  }, [toggleTask, incrementHabit]);

  // Background / Foreground scheduled reminder checker
  useEffect(() => {
    if (!isDbReady) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHH = String(now.getHours()).padStart(2, '0');
      const currentMM = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${currentHH}:${currentMM}`;
      const todayStr = getTodayString();

      // Check tasks due today with reminder enabled
      tasks.forEach((t) => {
        if (t.status === 'completed' || !t.reminderEnabled) return;
        if (t.dueDate !== todayStr) return;

        const targetTimes = t.reminderTimes && t.reminderTimes.length > 0
          ? t.reminderTimes
          : (t.reminderTime || t.dueTime ? [t.reminderTime || t.dueTime!] : []);

        targetTimes.forEach((targetTime) => {
          const key = `task-${t.id}-${todayStr}-${targetTime}`;
          if (targetTime === currentHHMM && !firedReminderKeysRef.current.has(key)) {
            firedReminderKeysRef.current.add(key);

            if (typeof document !== 'undefined' && !document.hidden) {
              setActiveReminderAlert({
                id: key,
                type: 'task',
                entityId: t.id,
                title: t.title,
                subtitle: `Due today at ${formatTime12Hour(t.dueTime || targetTime)}`,
                time: targetTime,
              });
              feedback.playSuccessChime();
            } else {
              sendNativeNotification(`Task Reminder: ${t.title}`, {
                body: `Scheduled for today at ${formatTime12Hour(t.dueTime || targetTime)} • ${t.category}`,
                tag: key,
              });
            }
          }
        });
      });

      // Check daily habits with reminderTimes
      habits.forEach((h) => {
        if (!h.reminderEnabled || !h.reminderTimes || !h.reminderTimes.length) return;

        const todayLog = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr);
        if (todayLog?.completed) return;

        h.reminderTimes.forEach((time) => {
          const key = `habit-${h.id}-${todayStr}-${time}`;
          if (time === currentHHMM && !firedReminderKeysRef.current.has(key)) {
            firedReminderKeysRef.current.add(key);

            if (typeof document !== 'undefined' && !document.hidden) {
              setActiveReminderAlert({
                id: key,
                type: 'habit',
                entityId: h.id,
                title: h.name,
                subtitle: `Daily routine check-in (${todayLog?.currentCount || 0}/${h.targetCount} ${h.unit})`,
                time,
              });
              feedback.playSuccessChime();
            } else {
              sendNativeNotification(`Daily Routine: ${h.name}`, {
                body: `Time for your daily routine: ${h.targetCount} ${h.unit} • ${h.timeOfDay}`,
                tag: key,
              });
            }
          }
        });
      });

      // Check daily recurring pokes (7 times/day spaced every 2 hours: 09:30 AM to 09:30 PM)
      if (DAILY_POKE_TIMES.includes(currentHHMM)) {
        const pokeKey = `daily-poke-${todayStr}-${currentHHMM}`;
        if (!firedReminderKeysRef.current.has(pokeKey)) {
          firedReminderKeysRef.current.add(pokeKey);
          const pendingTasks = tasks.filter((t) => t.status !== 'completed');
          const poke = getPokeNotification(settings.userName || 'Alex', pendingTasks.length, pendingTasks[0]?.title);

          if (typeof document !== 'undefined' && !document.hidden) {
            setActiveReminderAlert({
              id: pokeKey,
              type: 'poke',
              entityId: poke.id,
              title: `${poke.emoji} ${poke.title}`,
              subtitle: poke.body,
              time: currentHHMM,
            });
            feedback.playSuccessChime();
          } else {
            sendNativeNotification(`${poke.emoji} ${poke.title}`, {
              body: poke.body,
              tag: pokeKey,
            });
          }
        }
      }

      // Check contextual Daypart Motivational Notifications (08:30, 13:30, 20:30)
      const daypartMatch = DAYPART_SCHEDULE.find((s) => s.timeStr === currentHHMM);
      if (daypartMatch) {
        const daypartKey = `daypart-${daypartMatch.slotId}-${todayStr}`;
        if (!firedReminderKeysRef.current.has(daypartKey)) {
          firedReminderKeysRef.current.add(daypartKey);

          const pendingTasksCount = tasks.filter(
            (t) => t.status !== 'completed' && t.dueDate === todayStr
          ).length;

          const pendingHabitsCount = habits.filter((h) => {
            const todayLog = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr);
            return !todayLog?.completed;
          }).length;

          const greeting = generateDaypartGreeting(
            daypartMatch.slotId,
            settings.userName || 'Alex',
            pendingTasksCount,
            pendingHabitsCount
          );

          if (typeof document !== 'undefined' && !document.hidden) {
            setActiveReminderAlert({
              id: daypartKey,
              type: 'daypart',
              entityId: daypartMatch.slotId,
              title: `${greeting.emoji} ${greeting.title}`,
              subtitle: greeting.body,
              time: currentHHMM,
            });
            feedback.playSuccessChime();
          } else {
            sendNativeNotification(`${greeting.emoji} ${greeting.title}`, {
              body: greeting.body,
              tag: daypartKey,
            });
          }
        }
      }
    };

    checkReminders();
    const timer = setInterval(checkReminders, 20000);

    const handleVisibility = () => {
      if (!document.hidden) {
        checkReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isDbReady, tasks, habits, habitLogs, settings.userName]);

  // Synchronize system-level native background alarms and Home-Screen WidgetKit
  // Ensures notifications fire on schedule and home-screen widgets remain fresh
  useEffect(() => {
    if (!isDbReady) return;
    const timer = setTimeout(() => {
      syncNativeScheduledReminders(tasks, habits, settings.userName);
      const timerSnap = focusTimerStore.getSnapshot();
      syncWidgetData({
        tasks,
        habits,
        habitLogs,
        transactions,
        currency: settings.currency,
        monthlyBudget: settings.monthlyBudget,
        userName: settings.userName,
        timerRunning: timerSnap.status === 'running',
        timerDurationMs: timerSnap.durationSeconds * 1000,
        timerRemainingMs: timerSnap.remainingMs,
      });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [isDbReady, tasks, habits, habitLogs, transactions, settings.currency, settings.monthlyBudget, settings.userName]);

  // Synchronize incoming widget actions (e.g. check-off task or habit from home screen)
  useEffect(() => {
    if (!isDbReady) return;

    const checkWidgetActions = () => {
      pollWidgetEvents({
        onToggleTask: async (taskId) => {
          await toggleTask(taskId, undefined, { silent: true });
        },
        onIncrementHabit: async (habitId) => {
          await incrementHabit(habitId, undefined, { silent: true });
        },
        onToggleHabit: async (habitId, done) => {
          const today = getTodayString();
          const habit = await db.habits.get(habitId);
          if (!habit) return;
          const logId = `hl-${habitId}-${today}`;

          if (done === false) {
            await db.habitLogs.put({
              id: logId,
              habitId,
              date: today,
              currentCount: 0,
              completed: false,
              timestamp: Date.now(),
            });
          } else if (done === true) {
            await db.habitLogs.put({
              id: logId,
              habitId,
              date: today,
              currentCount: habit.targetCount,
              completed: true,
              timestamp: Date.now(),
            });
          } else {
            await toggleHabit(habitId, undefined, { silent: true });
          }
        },
        onAddTask: async (title) => {
          await addTask({
            title,
            priority: 'medium',
            status: 'todo',
            category: 'General',
            dueDate: new Date().toISOString().slice(0, 10),
          });
        },
        onAddHabit: async (name) => {
          await addHabit({
            name,
            category: 'General',
            targetCount: 1,
            unit: 'times',
            frequency: 'daily',
            timeOfDay: 'anytime',
            color: '#F26A36',
            icon: 'target',
          });
        },
        onAddExpense: async (amount, note) => {
          await addTransaction({
            type: 'expense',
            amount,
            category: 'General',
            description: note || 'Quick expense',
            paymentMethod: 'card',
            date: new Date().toISOString().slice(0, 10),
          });
        },
        onTimerAction: async (action, minutes) => {
          const snap = focusTimerStore.getSnapshot();
          if (action === 'start') {
            if (snap.status !== 'running') {
              focusTimerStore.start();
            }
          } else if (action === 'pause') {
            if (snap.status === 'running') {
              focusTimerStore.pause();
            }
          } else if (action === 'reset') {
            focusTimerStore.reset();
          } else if (action === 'preset' && typeof minutes === 'number' && minutes > 0) {
            focusTimerStore.setCustomDuration(minutes * 60);
          } else if (action === 'complete') {
            if (snap.status === 'running') {
              focusTimerStore.completeSession();
            }
          }
        },
        onQuickAction: (action) => {
          if (action === 'task') {
            setIsQuickCaptureOpen(true);
            setActiveTab('tasks');
          } else if (action === 'habit' || action === 'routine') {
            setActiveTab('habits');
          } else if (action === 'expense') {
            setActiveTab('finance');
          } else if (action === 'focus') {
            setActiveTab('today');
            openPomodoro();
          } else if (action === 'finance') {
            setActiveTab('finance');
          }
        },
      });
    };

    checkWidgetActions();
    const pollInterval = setInterval(checkWidgetActions, 2000);
    const handleVis = () => {
      if (!document.hidden) {
        checkWidgetActions();
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('focus', handleVis);
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('focus', handleVis);
    };
  }, [isDbReady, toggleTask, incrementHabit, toggleHabit, addTask, addHabit, addTransaction, setIsQuickCaptureOpen, setActiveTab, openPomodoro]);

  const contextValue = useMemo<AppContextType>(
    () => ({
      isDbReady,
      activeTab,
      setActiveTab,
      slideProgress,
      isQuickCaptureOpen,
      setIsQuickCaptureOpen,
      tasks,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      duplicateTask,
      createTaskFromTemplate,
      updateTaskSubtasks,
      habits,
      habitLogs,
      addHabit,
      incrementHabit,
      decrementHabit,
      toggleHabit,
      deleteHabit,
      updateHabit,
      getHabitTodayLog,
      getHabitStreak,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      financeStats,
      scratchCards,
      addScratchCard,
      updateScratchCard,
      deleteScratchCard,
      settings,
      updateSettings,
      exportDataAsJson,
      importDataFromJson,
      resetToDefaults,
      isDeleteConfirmOpen,
      deleteConfirmOptions,
      requestDelete,
      closeDeleteConfirm,
      isTaskModalOpen,
      editingTask,
      openTaskModal,
      openEditTaskModal,
      closeTaskModal,
      isHabitModalOpen,
      editingHabit,
      openHabitModal,
      openEditHabitModal,
      closeHabitModal,
      isFinanceModalOpen,
      editingTransaction,
      openFinanceModal,
      openEditFinanceModal,
      closeFinanceModal,
      isSearchModalOpen,
      openSearchModal,
      closeSearchModal,
      isStreaksOpen,
      openStreaks,
      closeStreaks,
      isPomodoroOpen,
      openPomodoro,
      closePomodoro,
      isInspectorOpen,
      openInspector,
      closeInspector,
      isExecutiveDashboardOpen,
      openExecutiveDashboard,
      closeExecutiveDashboard,
      activeReminderAlert,
      dismissReminderAlert,
      completeReminderAlert,
      requestNotificationPermission,
    }),
    [
      isDbReady,
      activeTab,
      slideProgress,
      isQuickCaptureOpen,
      tasks,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      duplicateTask,
      createTaskFromTemplate,
      updateTaskSubtasks,
      habits,
      habitLogs,
      addHabit,
      incrementHabit,
      decrementHabit,
      toggleHabit,
      deleteHabit,
      updateHabit,
      getHabitTodayLog,
      getHabitStreak,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      financeStats,
      scratchCards,
      addScratchCard,
      updateScratchCard,
      deleteScratchCard,
      settings,
      updateSettings,
      exportDataAsJson,
      importDataFromJson,
      resetToDefaults,
      isDeleteConfirmOpen,
      deleteConfirmOptions,
      requestDelete,
      closeDeleteConfirm,
      isTaskModalOpen,
      editingTask,
      openTaskModal,
      openEditTaskModal,
      closeTaskModal,
      isHabitModalOpen,
      editingHabit,
      openHabitModal,
      openEditHabitModal,
      closeHabitModal,
      isFinanceModalOpen,
      editingTransaction,
      openFinanceModal,
      openEditFinanceModal,
      closeFinanceModal,
      isSearchModalOpen,
      openSearchModal,
      closeSearchModal,
      isStreaksOpen,
      openStreaks,
      closeStreaks,
      isPomodoroOpen,
      openPomodoro,
      closePomodoro,
      isInspectorOpen,
      openInspector,
      closeInspector,
      isExecutiveDashboardOpen,
      openExecutiveDashboard,
      closeExecutiveDashboard,
      activeReminderAlert,
      dismissReminderAlert,
      completeReminderAlert,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
