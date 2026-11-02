import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getTodayString } from '../db';
import { seedInitialDataIfNeeded } from '../db/seed';
import type { Task, Habit, HabitLog, Transaction, UserSettings, ActiveTab } from '../types';
import type { DeleteConfirmOptions } from '../components/modals/ConfirmDeleteModal';
import { feedback, triggerCompletionConfetti } from '../utils/feedback';

interface FinanceStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  todaySpend: number;
  dailySafeToSpend: number;
  monthlyBudget: number;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  slideProgress: MotionValue<number>;
  isQuickCaptureOpen: boolean;
  setIsQuickCaptureOpen: (open: boolean) => void;

  // Tasks
  tasks: Task[];
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => Promise<string>;
  toggleTask: (id: string, event?: React.MouseEvent) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Habits
  habits: Habit[];
  habitLogs: HabitLog[];
  addHabit: (data: Omit<Habit, 'id' | 'createdAt'>) => Promise<string>;
  incrementHabit: (id: string, event?: React.MouseEvent) => Promise<void>;
  decrementHabit: (id: string) => Promise<void>;
  toggleHabit: (id: string, event?: React.MouseEvent) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  getHabitTodayLog: (id: string) => HabitLog | undefined;
  getHabitStreak: (id: string) => number;

  // Finance
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
  deleteTransaction: (id: string) => Promise<void>;
  financeStats: FinanceStats;

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

  // Shared Modals
  isTaskModalOpen: boolean;
  openTaskModal: () => void;
  closeTaskModal: () => void;
  isHabitModalOpen: boolean;
  openHabitModal: () => void;
  closeHabitModal: () => void;
  isFinanceModalOpen: boolean;
  openFinanceModal: () => void;
  closeFinanceModal: () => void;
  isSearchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  isStreaksOpen: boolean;
  openStreaks: () => void;
  closeStreaks: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_SETTINGS: UserSettings = {
  monthlyBudget: 2400,
  currency: '$',
  userName: 'Alex',
  darkMode: true,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const slideProgress = useMotionValue(0);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  // Gen-Z Delete Confirmation state
  const [deleteConfirmOptions, setDeleteConfirmOptions] = useState<DeleteConfirmOptions | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Shared Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isStreaksOpen, setIsStreaksOpen] = useState(false);

  const openTaskModal = () => setIsTaskModalOpen(true);
  const closeTaskModal = () => setIsTaskModalOpen(false);

  const openHabitModal = () => setIsHabitModalOpen(true);
  const closeHabitModal = () => setIsHabitModalOpen(false);

  const openFinanceModal = () => setIsFinanceModalOpen(true);
  const closeFinanceModal = () => setIsFinanceModalOpen(false);

  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  const openStreaks = () => setIsStreaksOpen(true);
  const closeStreaks = () => setIsStreaksOpen(false);

  const requestDelete = (options: DeleteConfirmOptions) => {
    setDeleteConfirmOptions(options);
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmOptions(null);
  };

  // Initialize DB and sample data
  useEffect(() => {
    seedInitialDataIfNeeded().then(() => {
      setIsDbReady(true);
    });
  }, []);

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
    };
  }, [settingsEntries]);

  // Tasks actions
  const addTask = async (data: Omit<Task, 'id' | 'createdAt'>): Promise<string> => {
    const id = 't-' + Math.random().toString(36).substring(2, 9);
    const newTask: Task = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    await db.tasks.add(newTask);
    feedback.playClick();
    return id;
  };

  const toggleTask = async (id: string, event?: React.MouseEvent) => {
    const task = await db.tasks.get(id);
    if (!task) return;

    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    const completedAt = nextStatus === 'completed' ? Date.now() : undefined;

    await db.tasks.update(id, { status: nextStatus, completedAt });

    if (nextStatus === 'completed') {
      const x = event ? event.clientX / window.innerWidth : 0.5;
      const y = event ? event.clientY / window.innerHeight : 0.5;
      triggerCompletionConfetti(x, y);
    } else {
      feedback.playClick();
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await db.tasks.update(id, updates);
    feedback.playClick();
  };

  const deleteTask = async (id: string) => {
    await db.tasks.delete(id);
    feedback.playClick();
  };

  // Habits actions
  const addHabit = async (data: Omit<Habit, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'h-' + Math.random().toString(36).substring(2, 9);
    const newHabit: Habit = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    await db.habits.add(newHabit);
    feedback.playClick();
    return id;
  };

  const getHabitTodayLog = (habitId: string): HabitLog | undefined => {
    const today = getTodayString();
    return habitLogs.find((l) => l.habitId === habitId && l.date === today);
  };

  const incrementHabit = async (habitId: string, event?: React.MouseEvent) => {
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
      const x = event ? event.clientX / window.innerWidth : 0.5;
      const y = event ? event.clientY / window.innerHeight : 0.5;
      triggerCompletionConfetti(x, y);
    } else {
      feedback.playClick();
    }
  };

  const decrementHabit = async (habitId: string) => {
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
  };

  const toggleHabit = async (habitId: string, event?: React.MouseEvent) => {
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
      feedback.playClick();
    } else {
      await db.habitLogs.put({
        id: logId,
        habitId,
        date: today,
        currentCount: habit.targetCount,
        completed: true,
        timestamp: Date.now(),
      });
      const x = event ? event.clientX / window.innerWidth : 0.5;
      const y = event ? event.clientY / window.innerHeight : 0.5;
      triggerCompletionConfetti(x, y);
    }
  };

  const deleteHabit = async (habitId: string) => {
    await db.habits.delete(habitId);
    await db.habitLogs.where('habitId').equals(habitId).delete();
    feedback.playClick();
  };

  const getHabitStreak = (habitId: string): number => {
    // Calculate consecutive completed days going backward from yesterday or today
    const logs = habitLogs
      .filter((l) => l.habitId === habitId && l.completed)
      .map((l) => l.date)
      .sort()
      .reverse();

    if (logs.length === 0) return 0;

    let streak = 0;
    const checkDate = new Date();
    // Allow today to count if completed, or start from yesterday
    const todayStr = getTodayString();
    let currentStr = todayStr;

    if (!logs.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      currentStr = `${y}-${m}-${d}`;
    }

    while (logs.includes(currentStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      currentStr = `${y}-${m}-${d}`;
    }

    return streak;
  };

  // Finance actions
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'tx-' + Math.random().toString(36).substring(2, 9);
    const newTx: Transaction = {
      ...data,
      id,
      createdAt: Date.now(),
    };
    await db.transactions.add(newTx);
    feedback.playClick();
    return id;
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
    feedback.playClick();
  };

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
  const updateSettings = async (updates: Partial<UserSettings>) => {
    for (const [k, v] of Object.entries(updates)) {
      await db.settings.put({ key: k, value: v });
    }
    feedback.playClick();
  };

  const exportDataAsJson = async (): Promise<string> => {
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
  };

  const importDataFromJson = async (jsonString: string): Promise<boolean> => {
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
  };

  const resetToDefaults = async () => {
    await db.tasks.clear();
    await db.habits.clear();
    await db.habitLogs.clear();
    await db.transactions.clear();
    await db.settings.clear();
    await seedInitialDataIfNeeded();
    feedback.playClick();
  };

  if (!isDbReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm font-medium tracking-wide">Starting Taskify...</span>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
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
        habits,
        habitLogs,
        addHabit,
        incrementHabit,
        decrementHabit,
        toggleHabit,
        deleteHabit,
        getHabitTodayLog,
        getHabitStreak,
        transactions,
        addTransaction,
        deleteTransaction,
        financeStats,
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
        openTaskModal,
        closeTaskModal,
        isHabitModalOpen,
        openHabitModal,
        closeHabitModal,
        isFinanceModalOpen,
        openFinanceModal,
        closeFinanceModal,
        isSearchModalOpen,
        openSearchModal,
        closeSearchModal,
        isStreaksOpen,
        openStreaks,
        closeStreaks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
