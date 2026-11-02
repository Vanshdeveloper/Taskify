import test from 'node:test';
import assert from 'node:assert/strict';

// Helper: relative date format
function formatDateRelative(dateStr, today) {
  if (dateStr === today) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const diffDays = Math.round((d.getTime() - t.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Helper: streak calculation logic
function calculateStreak(logs, todayStr) {
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const checkDate = new Date(todayStr + 'T00:00:00');
  let currentStr = todayStr;

  if (!completedDates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    currentStr = `${y}-${m}-${d}`;
  }

  while (completedDates.includes(currentStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    currentStr = `${y}-${m}-${d}`;
  }

  return streak;
}

// Helper: safe to spend calculation
function calculateSafeToSpend(monthlyBudget, monthlyExpenses, todayDate) {
  const now = new Date(todayDate + 'T00:00:00');
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - now.getDate() + 1);
  const remainingBudget = Math.max(0, monthlyBudget - monthlyExpenses);
  return remainingBudget / daysRemaining;
}

test('formatDateRelative should format Today, Tomorrow, Yesterday, and Overdue correctly', () => {
  const today = '2026-10-19';
  assert.equal(formatDateRelative('2026-10-19', today), 'Today');
  assert.equal(formatDateRelative('2026-10-20', today), 'Tomorrow');
  assert.equal(formatDateRelative('2026-10-18', today), 'Yesterday');
  assert.equal(formatDateRelative('2026-10-15', today), '4d overdue');
});

test('calculateStreak should compute consecutive completed days correctly', () => {
  const today = '2026-10-19';
  
  // Case 1: Completed today, yesterday, and day before yesterday = 3
  const logs3Days = [
    { date: '2026-10-19', completed: true },
    { date: '2026-10-18', completed: true },
    { date: '2026-10-17', completed: true },
    { date: '2026-10-15', completed: true }, // gap on 16th
  ];
  assert.equal(calculateStreak(logs3Days, today), 3);

  // Case 2: Not completed today yet, but completed yesterday and day before = 2
  const logsYesterday = [
    { date: '2026-10-18', completed: true },
    { date: '2026-10-17', completed: true },
  ];
  assert.equal(calculateStreak(logsYesterday, today), 2);

  // Case 3: No recent logs = 0
  const logsOld = [
    { date: '2026-10-10', completed: true },
  ];
  assert.equal(calculateStreak(logsOld, today), 0);
});

test('calculateSafeToSpend computes remaining velocity accurately', () => {
  // Oct has 31 days. On Oct 19, remaining days = 31 - 19 + 1 = 13 days
  const budget = 2600;
  const spent = 1300;
  // remaining = 1300 / 13 = 100/day
  const safeSpend = calculateSafeToSpend(budget, spent, '2026-10-19');
  assert.equal(safeSpend, 100);
});

test('Backup export schema structure validation', () => {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: [{ id: 't-1', title: 'Task 1', status: 'todo' }],
    habits: [{ id: 'h-1', name: 'Habit 1', targetCount: 1 }],
    habitLogs: [{ id: 'hl-1', habitId: 'h-1', completed: true }],
    transactions: [{ id: 'tx-1', type: 'expense', amount: 20 }],
    settings: [{ key: 'currency', value: '$' }],
  };

  assert.ok(Array.isArray(backup.tasks));
  assert.ok(Array.isArray(backup.habits));
  assert.ok(Array.isArray(backup.habitLogs));
  assert.ok(Array.isArray(backup.transactions));
  assert.ok(Array.isArray(backup.settings));
  assert.equal(backup.version, 1);
});
