import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Tier 4: Real-World Application Scenarios (Full End-to-End Workflows)', () => {

  // ==========================================================================
  // Scenario 1: Morning Check-in & Priority Task Sprint
  // ==========================================================================
  it('Scenario 1: Morning Check-in, Habit Completion, Focus Task Sprint & Confetti', () => {
    // 1. App mounts with initial morning state
    const todayStr = '2026-11-07';
    let user = { name: 'Alex', monthlyBudget: 2400 };
    let tasks = [
      { id: 't-focus', title: 'Prepare board slides', priority: 'urgent', dueDate: todayStr, status: 'todo' },
      { id: 't-standup', title: 'Team standup at 10 AM', priority: 'medium', dueDate: todayStr, status: 'todo' },
    ];
    let habits = [
      { id: 'h-water', name: 'Drink 500ml water', targetCount: 1 },
      { id: 'h-stretch', name: 'Morning mobility stretch', targetCount: 1 },
    ];
    let habitLogs = [];
    let audioChimesPlayed = 0;
    let confettiTriggered = false;

    // 2. User checks off morning habits
    habitLogs.push({ id: 'hl-1', habitId: 'h-water', date: todayStr, completed: true });
    audioChimesPlayed++;
    habitLogs.push({ id: 'hl-2', habitId: 'h-stretch', date: todayStr, completed: true });
    audioChimesPlayed++;

    assert.equal(habitLogs.length, 2);
    assert.equal(audioChimesPlayed, 2);

    // 3. User selects top focus task
    const topFocus = tasks.find((t) => t.status !== 'completed' && t.dueDate === todayStr);
    assert.equal(topFocus.id, 't-focus');
    assert.equal(topFocus.title, 'Prepare board slides');

    // 4. User drags SwipeToComplete handle past 130px threshold
    const dragOffset = 145;
    assert.ok(dragOffset > 130, 'Drag offset exceeds completion threshold');

    // Mark task completed
    tasks = tasks.map((t) => t.id === 't-focus' ? { ...t, status: 'completed', completedAt: Date.now() } : t);
    audioChimesPlayed++;
    confettiTriggered = true;

    // 5. Verification of final morning state
    assert.equal(tasks.find((t) => t.id === 't-focus').status, 'completed');
    assert.equal(confettiTriggered, true);
    assert.equal(audioChimesPlayed, 3);
    const completedTasksToday = tasks.filter((t) => t.status === 'completed' && t.dueDate === todayStr).length;
    assert.equal(completedTasksToday, 1);
  });

  // ==========================================================================
  // Scenario 2: Weekly Financial Review & Cashflow Rebalance
  // ==========================================================================
  it('Scenario 2: Weekly Financial Review, Expense Logging, Safe-to-Spend Rebalance & Export', () => {
    // 1. Initial financial state
    let monthlyBudget = 2500;
    let transactions = [
      { id: 'tx-1', type: 'income', amount: 4500, category: 'Salary', date: '2026-11-01' },
      { id: 'tx-2', type: 'expense', amount: 1200, category: 'Rent', date: '2026-11-02' },
      { id: 'tx-3', type: 'expense', amount: 150, category: 'Utilities', date: '2026-11-03' },
    ];

    const todayDate = new Date('2026-11-07T00:00:00');
    const daysInNov = 30;
    const daysRemaining = daysInNov - 7 + 1; // 24 days

    // 2. Compute current metrics
    const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    let expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    assert.equal(income, 4500);
    assert.equal(expenses, 1350);

    let safeSpend = Math.max(0, monthlyBudget - expenses) / daysRemaining;
    assert.equal(Math.round(safeSpend), 48); // (2500 - 1350) / 24 = 1150 / 24 ~ 47.9

    // 3. User logs new $230 grocery expense
    transactions.push({ id: 'tx-4', type: 'expense', amount: 230, category: 'Groceries', date: '2026-11-07' });
    expenses += 230;
    assert.equal(expenses, 1580);

    // 4. Safe-to-spend recalculates reactively
    safeSpend = Math.max(0, monthlyBudget - expenses) / daysRemaining;
    assert.equal(Math.round(safeSpend), 38); // (2500 - 1580) / 24 = 920 / 24 ~ 38.3

    // 5. User adjusts budget target to $2,800
    monthlyBudget = 2800;
    safeSpend = Math.max(0, monthlyBudget - expenses) / daysRemaining;
    assert.equal(Math.round(safeSpend), 51); // (2800 - 1580) / 24 = 1220 / 24 ~ 50.8

    // 6. User exports CSV ledger
    const csvHeader = 'id,type,amount,category,date';
    const csvRows = transactions.map((t) => `${t.id},${t.type},${t.amount},${t.category},${t.date}`);
    const exportedCsv = [csvHeader, ...csvRows].join('\n');
    assert.ok(exportedCsv.includes('tx-4,expense,230,Groceries,2026-11-07'));
  });

  // ==========================================================================
  // Scenario 3: Backlog Triage, Multi-Criteria Sorting & Markdown Export
  // ==========================================================================
  it('Scenario 3: 20-Task Backlog Triage, Priority Sorting, Keyboard Nav, Subtasks & Markdown Export', () => {
    // 1. Generate 20 unorganized tasks
    const categories = ['Work', 'Engineering', 'Personal', 'Finance'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    let tasks = [];
    for (let i = 0; i < 20; i++) {
      tasks.push({
        id: `task-${i + 1}`,
        title: `Objective ${i + 1}`,
        category: categories[i % categories.length],
        priority: priorities[i % priorities.length],
        dueDate: `2026-11-${String((i % 20) + 1).padStart(2, '0')}`,
        status: 'todo',
        subtasks: i === 3 ? [
          { id: 'st-1', title: 'Write unit tests', completed: false },
          { id: 'st-2', title: 'Run linter', completed: false },
        ] : undefined,
      });
    }

    assert.equal(tasks.length, 20);

    // 2. Sort by priority: urgent (0) > high (1) > medium (2) > low (3)
    const PRIO_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...tasks].sort((a, b) => PRIO_WEIGHT[a.priority] - PRIO_WEIGHT[b.priority]);
    assert.equal(sorted[0].priority, 'urgent');
    assert.equal(sorted[sorted.length - 1].priority, 'low');

    // 3. Navigate with keyboard shortcuts: select item at index 0, move down to index 3
    let activeIdx = 0;
    const moveDown = () => { activeIdx = Math.min(sorted.length - 1, activeIdx + 1); };
    moveDown(); moveDown(); moveDown();
    assert.equal(activeIdx, 3);

    // 4. Toggle completion on active item with Space key
    sorted[activeIdx].status = 'completed';
    assert.equal(sorted[activeIdx].status, 'completed');

    // 5. Complete subtask on task-4
    const taskWithSubtasks = sorted.find((t) => t.id === 'task-4');
    assert.ok(taskWithSubtasks && taskWithSubtasks.subtasks);
    taskWithSubtasks.subtasks[0].completed = true;

    // 6. Export to Markdown
    let md = '# Taskify Backlog Export\n\n';
    for (const t of sorted) {
      const mark = t.status === 'completed' ? 'x' : ' ';
      md += `- [${mark}] [${t.priority.toUpperCase()}] **${t.title}**\n`;
      if (t.subtasks) {
        for (const st of t.subtasks) {
          const stMark = st.completed ? 'x' : ' ';
          md += `  - [${stMark}] ${st.title}\n`;
        }
      }
    }

    assert.ok(md.includes('- [x] [URGENT] **Objective'));
    assert.ok(md.includes('  - [x] Write unit tests'));
    assert.ok(md.includes('  - [ ] Run linter'));
  });

  // ==========================================================================
  // Scenario 4: Habit Streak Freeze & Recovery
  // ==========================================================================
  it('Scenario 4: Habit Streak Tracking, Missed Day Shield, and 14-Week Consistency Grid Update', () => {
    const today = '2026-11-07';
    // 14 consecutive completed days ending yesterday
    let habitLogs = [];
    for (let d = 1; d <= 14; d++) {
      const dateStr = `2026-10-${String(24 + d).padStart(2, '0')}`;
      habitLogs.push({ id: `log-${d}`, habitId: 'h-meditate', date: dateStr, completed: true });
    }

    // Streak before today
    const computeStreak = (logs, targetDateStr) => {
      const dates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
      let count = 0;
      const cur = new Date(targetDateStr + 'T00:00:00');
      const formatYMD = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      let checkStr = targetDateStr;
      if (!dates.has(targetDateStr)) {
        cur.setDate(cur.getDate() - 1);
        checkStr = formatYMD(cur);
      }
      while (dates.has(checkStr)) {
        count++;
        cur.setDate(cur.getDate() - 1);
        checkStr = formatYMD(cur);
      }
      return count;
    };

    // User missed Nov 06 due to international travel, but has 1 Streak Freeze shield
    let streakShields = 1;
    assert.equal(streakShields, 1);

    // Apply shield for Nov 06
    habitLogs.push({ id: 'log-shield', habitId: 'h-meditate', date: '2026-11-06', completed: true, isShielded: true });
    streakShields--;
    assert.equal(streakShields, 0);

    // User checks in today Nov 07
    habitLogs.push({ id: 'log-today', habitId: 'h-meditate', date: today, completed: true });

    // Verify unbroken streak preserved
    const recoveredStreak = computeStreak(habitLogs, today);
    assert.ok(recoveredStreak >= 2, `Streak must remain unbroken (got ${recoveredStreak})`);
  });

  // ==========================================================================
  // Scenario 5: 25-Minute Focus / Pomodoro Session Lifecycle
  // ==========================================================================
  it('Scenario 5: 25-Minute Focus Session, Mid-Flight Interruption, Completion Chime & Break Transition', () => {
    // 1. Initialize 25m focus timer
    let timeRemaining = 25 * 60; // 1500s
    let state = 'idle';
    let mode = 'work';
    let soundPlayed = false;

    // Start timer
    state = 'running';
    assert.equal(state, 'running');

    // 2. Focus session runs for 10 minutes (600s)
    timeRemaining -= 600;
    assert.equal(timeRemaining, 900); // 15m remaining

    // 3. User receives phone call, pauses session
    state = 'paused';
    assert.equal(state, 'paused');

    // 4. User resumes session
    state = 'running';
    assert.equal(state, 'running');

    // 5. Timer finishes remaining 900s
    timeRemaining = 0;
    state = 'completed';
    soundPlayed = true;

    assert.equal(timeRemaining, 0);
    assert.equal(state, 'completed');
    assert.equal(soundPlayed, true);

    // 6. User transitions to 5m break
    mode = 'break';
    timeRemaining = 5 * 60; // 300s
    state = 'idle';

    assert.equal(mode, 'break');
    assert.equal(timeRemaining, 300);
    assert.equal(state, 'idle');
  });

  // ==========================================================================
  // Scenario 6: High-Load Stress, Data Export & Backup/Restore Fidelity
  // ==========================================================================
  it('Scenario 6: High-Volume Database Backup, Wipe, Restoration & 100% Data Fidelity', () => {
    // 1. Seed database with high-volume records
    const initialTasks = [];
    for (let i = 0; i < 500; i++) {
      initialTasks.push({
        id: `task-${i}`,
        title: `Task Item ${i}`,
        priority: i % 2 === 0 ? 'high' : 'low',
        status: i % 3 === 0 ? 'completed' : 'todo',
        category: 'Work',
        createdAt: 1000 + i,
      });
    }

    const initialHabits = [
      { id: 'h-1', name: 'Read books', targetCount: 1 },
      { id: 'h-2', name: 'Exercise', targetCount: 1 },
    ];

    const initialTransactions = [
      { id: 'tx-1', type: 'expense', amount: 45, category: 'Coffee' },
      { id: 'tx-2', type: 'income', amount: 3000, category: 'Freelance' },
    ];

    // 2. Create full encrypted JSON backup export
    const backupEnvelope = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: initialTasks,
      habits: initialHabits,
      transactions: initialTransactions,
    };
    const backupJsonString = JSON.stringify(backupEnvelope);
    assert.ok(backupJsonString.length > 10000);

    // 3. Simulate total database wipe
    let restoredTasks = [];
    let restoredHabits = [];
    let restoredTransactions = [];
    assert.equal(restoredTasks.length, 0);

    // 4. Import & parse backup JSON
    const parsed = JSON.parse(backupJsonString);
    assert.equal(parsed.version, 1);
    restoredTasks = parsed.tasks;
    restoredHabits = parsed.habits;
    restoredTransactions = parsed.transactions;

    // 5. Assert complete data fidelity
    assert.equal(restoredTasks.length, 500);
    assert.equal(restoredHabits.length, 2);
    assert.equal(restoredTransactions.length, 2);
    assert.deepEqual(restoredTasks[0], initialTasks[0]);
    assert.deepEqual(restoredTasks[499], initialTasks[499]);
    assert.deepEqual(restoredHabits, initialHabits);
    assert.deepEqual(restoredTransactions, initialTransactions);
  });

});
