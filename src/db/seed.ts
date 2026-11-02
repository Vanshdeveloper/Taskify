import { db, getTodayString } from './index';
import type { Task, Habit, Transaction } from '../types';

export async function seedInitialDataIfNeeded() {
  const taskCount = await db.tasks.count();
  if (taskCount > 0) return; // already seeded

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
      color: '#38bdf8', // sky-400
      icon: 'droplets',
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
      icon: 'sparkles',
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
      icon: 'book-open',
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
      icon: 'activity',
      createdAt: now - 86400000 * 5,
    },
  ];

  // Initial habit logs for today to demonstrate functionality
  const sampleHabitLogs = [
    {
      id: `hl-h-1-${today}`,
      habitId: 'h-1',
      date: today,
      currentCount: 5,
      completed: false,
      timestamp: now,
    },
    {
      id: `hl-h-2-${today}`,
      habitId: 'h-2',
      date: today,
      currentCount: 2,
      completed: true,
      timestamp: now,
    },
    {
      id: `hl-h-3-${today}`,
      habitId: 'h-3',
      date: today,
      currentCount: 15,
      completed: false,
      timestamp: now,
    },
  ];

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
  ];

  await db.tasks.bulkAdd(sampleTasks);
  await db.habits.bulkAdd(sampleHabits);
  await db.habitLogs.bulkAdd(sampleHabitLogs);
  await db.transactions.bulkAdd(sampleTransactions);

  await db.settings.bulkPut([
    { key: 'monthlyBudget', value: 2400 },
    { key: 'currency', value: '$' },
    { key: 'userName', value: 'Alex' },
    { key: 'darkMode', value: true },
  ]);
}
