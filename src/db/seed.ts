import { db, getTodayString } from './index';
import type { Task, Habit, Transaction } from '../types';
import { autodetectCurrency } from '../utils/currency';

export async function seedInitialDataIfNeeded() {
  const taskCount = await db.tasks.count();
  const habitLogCount = await db.habitLogs.count();

  // If already seeded tasks, but missing historical habit logs, backfill them
  if (taskCount > 0) {
    if (habitLogCount <= 3) {
      const backfillLogs: {
        id: string;
        habitId: string;
        date: string;
        currentCount: number;
        completed: boolean;
        timestamp: number;
      }[] = [];
      const habits = await db.habits.toArray();
      const habitIds = habits.length ? habits.map((h) => h.id) : ['h-1', 'h-2', 'h-3', 'h-4'];

      for (let i = 0; i <= 35; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        const ts = d.getTime();

        habitIds.forEach((hId, idx) => {
          if ((i + idx) % 3 !== 0) {
            backfillLogs.push({
              id: `hl-${hId}-${dateStr}`,
              habitId: hId,
              date: dateStr,
              currentCount: 1,
              completed: true,
              timestamp: ts,
            });
          }
        });
      }
      await db.habitLogs.bulkPut(backfillLogs);
    }

    // Backfill starter scratchcards if missing
    const cardCount = await db.scratchcards.count();
    if (cardCount === 0) {
      await db.scratchcards.bulkAdd([
        {
          id: 'sc-1',
          title: 'Welcome to Scratchpad',
          content: 'Jot down quick thoughts, ideas, or study flashcards. Tap any card to open the fullscreen presentation swiper.',
          backContent: 'Tip: You can add an optional flip side to test your memory or review concepts!',
          isTwoSided: true,
          category: 'General',
          color: '#f26a36',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sc-2',
          title: 'Product Vision 2026',
          content: '• Zero-latency local storage\n• Apple-grade fluid spring animations\n• High-contrast minimal typography',
          isTwoSided: false,
          category: 'Ideas',
          color: '#38bdf8',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sc-3',
          title: 'Active Recall: Spaced Repetition',
          content: 'What is the most effective way to retain new knowledge?',
          backContent: 'Testing yourself with flashcards rather than passive re-reading.',
          isTwoSided: true,
          category: 'Study',
          color: '#84cc16',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
    const txCount = await db.transactions.count();
    if (txCount <= 4) {
      const backfillTx: Transaction[] = [];
      const pastExpenses = [
        { daysAgo: 1, amount: 18.5, category: 'Food & Dining', desc: 'Lunch Bistro', type: 'expense' as const },
        { daysAgo: 1, amount: 4.2, category: 'Food & Dining', desc: 'Cold Brew Coffee', type: 'expense' as const },
        { daysAgo: 2, amount: 64.3, category: 'Groceries', desc: 'Weekly Organic Market', type: 'expense' as const },
        { daysAgo: 3, amount: 12.0, category: 'Transport', desc: 'Metro Transit Card', type: 'expense' as const },
        { daysAgo: 4, amount: 28.0, category: 'Food & Dining', desc: 'Dinner with Colleagues', type: 'expense' as const },
        { daysAgo: 5, amount: 45.0, category: 'Utilities', desc: 'Cloud Storage & Workspace', type: 'expense' as const },
        { daysAgo: 6, amount: 82.5, category: 'Shopping', desc: 'Ergonomic Desk Accessories', type: 'expense' as const },
        { daysAgo: 8, amount: 15.0, category: 'Transport', desc: 'Rideshare to Airport', type: 'expense' as const },
        { daysAgo: 9, amount: 38.4, category: 'Food & Dining', desc: 'Weekend Brunch', type: 'expense' as const },
        { daysAgo: 10, amount: 72.0, category: 'Groceries', desc: 'Pantry Restock', type: 'expense' as const },
        { daysAgo: 12, amount: 22.0, category: 'Entertainment', desc: 'Cinema Tickets', type: 'expense' as const },
        { daysAgo: 13, amount: 14.5, category: 'Food & Dining', desc: 'Artisan Bakery', type: 'expense' as const },
      ];

      for (const item of pastExpenses) {
        const d = new Date();
        d.setDate(d.getDate() - item.daysAgo);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        const ts = d.getTime();

        backfillTx.push({
          id: `tx-hist-${item.daysAgo}-${item.category.toLowerCase().replace(/\s+/g, '-')}`,
          type: item.type,
          amount: item.amount,
          category: item.category,
          description: item.desc,
          date: dateStr,
          paymentMethod: 'card',
          createdAt: ts,
        });
      }
      await db.transactions.bulkPut(backfillTx);
    }
    return;
  }

  const today = getTodayString();
  const now = Date.now();

  // Initial Tasks
  const sampleTasks: Task[] = [
    {
      id: 't-1',
      title: 'Review quarterly project roadmap & goals',
      description: 'Align priorities with Q4 deliverable milestones',
      status: 'todo',
      priority: 'high',
      dueDate: today,
      dueTime: '14:30',
      reminderEnabled: true,
      reminderPreset: 'at_due',
      reminderTime: '14:30',
      category: 'Work',
      tags: ['planning', 'strategy'],
      createdAt: now - 3600000 * 5,
    },
    {
      id: 't-2',
      title: 'Complete 30 min cardio workout',
      description: 'Zone 2 running or brisk incline walk',
      status: 'completed',
      priority: 'medium',
      dueDate: today,
      category: 'Health',
      tags: ['fitness'],
      createdAt: now - 3600000 * 8,
      completedAt: now - 3600000 * 2,
    },
    {
      id: 't-3',
      title: 'Inspect weekly grocery & utility expenses',
      description: 'Audit card statements and reconcile categories',
      status: 'todo',
      priority: 'medium',
      dueDate: today,
      category: 'Finance',
      tags: ['budget'],
      createdAt: now - 3600000 * 4,
    },
    {
      id: 't-4',
      title: 'Prepare presentation deck for client demo',
      description: 'Include prototype walkthrough and sprint metrics',
      status: 'todo',
      priority: 'urgent',
      dueDate: today,
      dueTime: '14:30',
      reminderEnabled: true,
      reminderPreset: 'at_due',
      reminderTime: '14:30',
      category: 'Work',
      tags: ['client', 'demo'],
      createdAt: now - 3600000 * 3,
    },
  ];

  // Initial Habits
  const sampleHabits: Habit[] = [
    {
      id: 'h-1',
      name: 'Hydration Target',
      description: 'Maintain peak mental clarity',
      category: 'Health',
      targetCount: 8,
      unit: 'glasses',
      frequency: 'daily',
      timeOfDay: 'anytime',
      reminderEnabled: true,
      reminderTimes: ['09:00', '13:00', '18:00'],
      color: '#38bdf8', // sky-400
      icon: 'droplet',
      createdAt: now - 86400000 * 7,
    },
    {
      id: 'h-2',
      name: 'Deep Work Session',
      description: '90-minute distraction-free focus block',
      category: 'Growth',
      targetCount: 2,
      unit: 'blocks',
      frequency: 'weekdays',
      timeOfDay: 'morning',
      color: '#a855f7', // purple-500
      icon: 'code',
      createdAt: now - 86400000 * 14,
    },
    {
      id: 'h-3',
      name: 'Read Technical Book',
      description: 'Continuous architectural learning',
      category: 'Growth',
      targetCount: 20,
      unit: 'pages',
      frequency: 'daily',
      timeOfDay: 'evening',
      color: '#34d399', // emerald-400
      icon: 'book',
      createdAt: now - 86400000 * 10,
    },
    {
      id: 'h-4',
      name: 'Posture & Mobility Stretch',
      description: '5-minute physical reset between meetings',
      category: 'Health',
      targetCount: 3,
      unit: 'times',
      frequency: 'daily',
      timeOfDay: 'afternoon',
      color: '#f59e0b', // amber-500
      icon: 'dumbbell',
      createdAt: now - 86400000 * 5,
    },
  ];

  // Generate authentic historical logs for the past 35 days so heatmaps & streaks thrive
  const sampleHabitLogs: {
    id: string;
    habitId: string;
    date: string;
    currentCount: number;
    completed: boolean;
    timestamp: number;
  }[] = [];

  for (let i = 0; i <= 35; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const ts = d.getTime();

    // h-1: Hydration target (high consistency, completed most days)
    if (i !== 3 && i !== 12 && i !== 22) {
      sampleHabitLogs.push({
        id: `hl-h-1-${dateStr}`,
        habitId: 'h-1',
        date: dateStr,
        currentCount: 8,
        completed: true,
        timestamp: ts,
      });
    }

    // h-2: Deep Work Session (weekdays)
    const dayOfWeek = d.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && i !== 8 && i !== 19) {
      sampleHabitLogs.push({
        id: `hl-h-2-${dateStr}`,
        habitId: 'h-2',
        date: dateStr,
        currentCount: 2,
        completed: true,
        timestamp: ts,
      });
    }

    // h-3: Read Technical Book
    if (i % 2 === 0 || i < 7) {
      sampleHabitLogs.push({
        id: `hl-h-3-${dateStr}`,
        habitId: 'h-3',
        date: dateStr,
        currentCount: 20,
        completed: true,
        timestamp: ts,
      });
    }

    // h-4: Mobility stretch
    if (i % 3 !== 0) {
      sampleHabitLogs.push({
        id: `hl-h-4-${dateStr}`,
        habitId: 'h-4',
        date: dateStr,
        currentCount: 3,
        completed: true,
        timestamp: ts,
      });
    }
  }

  // Initial Transactions
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 4200,
      category: 'Salary',
      description: 'Primary Direct Deposit',
      date: today,
      paymentMethod: 'transfer',
      createdAt: now - 3600000 * 12,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 48.75,
      category: 'Groceries',
      description: 'Fresh Produce & Pantry Essentials',
      date: today,
      paymentMethod: 'apple_pay',
      createdAt: now - 3600000 * 4,
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 6.5,
      category: 'Food & Dining',
      description: 'Morning Espresso & Pastry',
      date: today,
      paymentMethod: 'card',
      createdAt: now - 3600000 * 6,
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 14.99,
      category: 'Utilities',
      description: 'Music Streaming & Cloud Sync',
      date: today,
      paymentMethod: 'card',
      createdAt: now - 3600000 * 2,
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 18.5,
      category: 'Food & Dining',
      description: 'Lunch Bistro',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })(),
      paymentMethod: 'card',
      createdAt: now - 86400000 * 1,
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 64.3,
      category: 'Groceries',
      description: 'Weekly Organic Market',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split('T')[0]; })(),
      paymentMethod: 'card',
      createdAt: now - 86400000 * 2,
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 28.0,
      category: 'Food & Dining',
      description: 'Dinner with Colleagues',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 4); return d.toISOString().split('T')[0]; })(),
      paymentMethod: 'card',
      createdAt: now - 86400000 * 4,
    },
    {
      id: 'tx-8',
      type: 'expense',
      amount: 45.0,
      category: 'Utilities',
      description: 'Cloud Storage & Workspace',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 5); return d.toISOString().split('T')[0]; })(),
      paymentMethod: 'card',
      createdAt: now - 86400000 * 5,
    },
    {
      id: 'tx-9',
      type: 'expense',
      amount: 82.5,
      category: 'Shopping',
      description: 'Ergonomic Desk Accessories',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]; })(),
      paymentMethod: 'card',
      createdAt: now - 86400000 * 6,
    },
    {
      id: 'tx-10',
      type: 'expense',
      amount: 72.0,
      category: 'Groceries',
      description: 'Pantry Restock',
      date: (() => { const d = new Date(); d.setDate(d.getDate() - 10); return d.toISOString().split('T')[0]; })(),
      paymentMethod: 'card',
      createdAt: now - 86400000 * 10,
    },
  ];

  await db.tasks.bulkAdd(sampleTasks);
  await db.habits.bulkAdd(sampleHabits);
  await db.habitLogs.bulkAdd(sampleHabitLogs);
  await db.transactions.bulkAdd(sampleTransactions);
  await db.scratchcards.bulkAdd([
    {
      id: 'sc-1',
      title: 'Welcome to Scratchpad',
      content: 'Jot down quick thoughts, ideas, or study flashcards. Tap any card to open the fullscreen presentation swiper.',
      backContent: 'Tip: You can add an optional flip side to test your memory or review concepts!',
      isTwoSided: true,
      category: 'General',
      color: '#f26a36',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sc-2',
      title: 'Product Vision 2026',
      content: '• Zero-latency local storage\n• Apple-grade fluid spring animations\n• High-contrast minimal typography',
      isTwoSided: false,
      category: 'Ideas',
      color: '#38bdf8',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sc-3',
      title: 'Active Recall: Spaced Repetition',
      content: 'What is the most effective way to retain new knowledge?',
      backContent: 'Testing yourself with flashcards rather than passive re-reading.',
      isTwoSided: true,
      category: 'Study',
      color: '#84cc16',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const detected = autodetectCurrency();
  await db.settings.bulkPut([
    { key: 'monthlyBudget', value: 2400 },
    { key: 'currency', value: detected.symbol || '$' },
    { key: 'currencyExplicit', value: false },
    { key: 'userName', value: 'Alex' },
    { key: 'darkMode', value: true },
  ]);
}
