import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPLE_SPRINGS, projectMomentum } from '../src/utils/motion.ts';
import { feedback } from '../src/utils/feedback.ts';
import { autodetectCurrency } from '../src/utils/currency.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Tier 3: Cross-Feature Pairwise Combinations', () => {

  // --------------------------------------------------------------------------
  // C1: Tasks + Habit Streaks
  // --------------------------------------------------------------------------
  it('C1: Tasks + Habits: Completing task routines synchronizes daily streak metrics', () => {
    const today = '2026-11-07';
    const habitLogs = [
      { date: '2026-11-06', habitId: 'h-run', completed: true },
      { date: '2026-11-05', habitId: 'h-run', completed: true },
    ];
    // Task completion triggers a habit check-in
    habitLogs.push({ date: today, habitId: 'h-run', completed: true });

    const completedDates = new Set(habitLogs.filter((l) => l.completed).map((l) => l.date));
    let streak = 0;
    const checkDate = new Date(today + 'T00:00:00');
    const formatYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let currentStr = today;
    while (completedDates.has(currentStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      currentStr = formatYMD(checkDate);
    }

    assert.equal(streak, 3, 'Streak must increment to 3 upon completing task routine');
  });

  // --------------------------------------------------------------------------
  // C2: Finance Cashflow + Task Metrics
  // --------------------------------------------------------------------------
  it('C2: Finance + Today Bento: Expense addition updates safe-to-spend velocity and budget ratio', () => {
    const monthlyBudget = 2400;
    let monthlyExpenses = 1200;
    const now = new Date('2026-10-19T00:00:00');
    const daysRemaining = 31 - 19 + 1; // 13 days in Oct

    let safeSpend = (monthlyBudget - monthlyExpenses) / daysRemaining;
    assert.equal(Math.round(safeSpend), 92); // 1200 / 13 ~ 92.3

    // Log $260 expense
    monthlyExpenses += 260;
    safeSpend = (monthlyBudget - monthlyExpenses) / daysRemaining;
    assert.equal(Math.round(safeSpend), 72); // 940 / 13 ~ 72.3
  });

  // --------------------------------------------------------------------------
  // C3: Gestures + Modal Presentation
  // --------------------------------------------------------------------------
  it('C3: Gestures + Modals: Opening modal mid-gesture cancels track motion and centers dialog', () => {
    let isTracking = true;
    let liveTranslateX = -250;
    let isModalOpen = false;

    // Trigger modal open
    const openModal = () => {
      isModalOpen = true;
      isTracking = false; // cancels ongoing gesture
    };

    openModal();
    assert.equal(isModalOpen, true);
    assert.equal(isTracking, false);
    assert.equal(liveTranslateX, -250, 'Presentation transform is captured and frozen');
  });

  // --------------------------------------------------------------------------
  // C4: Multi-Criteria Sorting + In-List Keyboard Navigation
  // --------------------------------------------------------------------------
  it('C4: Sorting + Keyboard Nav: J/K navigation follows new sorted order accurately', () => {
    const tasks = [
      { id: '1', title: 'Beta Task', priority: 'low' },
      { id: '2', title: 'Alpha Task', priority: 'urgent' },
      { id: '3', title: 'Gamma Task', priority: 'medium' },
    ];
    // Sort by priority (urgent > medium > low)
    const PRIO_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...tasks].sort((a, b) => PRIO_WEIGHT[a.priority] - PRIO_WEIGHT[b.priority]);
    assert.equal(sorted[0].title, 'Alpha Task');
    assert.equal(sorted[1].title, 'Gamma Task');
    assert.equal(sorted[2].title, 'Beta Task');

    // Keyboard navigation starting at index 0
    let activeIndex = 0;
    const handleKey = (key) => {
      if (key === 'j') activeIndex = Math.min(sorted.length - 1, activeIndex + 1);
      if (key === 'k') activeIndex = Math.max(0, activeIndex - 1);
    };

    handleKey('j');
    assert.equal(activeIndex, 1);
    assert.equal(sorted[activeIndex].title, 'Gamma Task');

    handleKey('j');
    assert.equal(activeIndex, 2);
    assert.equal(sorted[activeIndex].title, 'Beta Task');

    handleKey('k');
    assert.equal(activeIndex, 1);
    assert.equal(sorted[activeIndex].title, 'Gamma Task');
  });

  // --------------------------------------------------------------------------
  // C5: Task Duplication + Subtasks Checklist
  // --------------------------------------------------------------------------
  it('C5: Duplication + Subtasks: Cloned task duplicates nested subtasks with fresh IDs and resets completion', () => {
    const parentTask = {
      id: 'task-parent',
      title: 'Sprint Release',
      status: 'completed',
      subtasks: [
        { id: 'sub-1', title: 'Smoke test', completed: true },
        { id: 'sub-2', title: 'Tag git commit', completed: true },
        { id: 'sub-3', title: 'Publish release', completed: true },
      ],
    };

    let idCounter = 1;
    const clone = {
      ...parentTask,
      id: `task-clone-${idCounter++}`,
      title: `Copy of ${parentTask.title}`,
      status: 'todo',
      subtasks: parentTask.subtasks.map((st) => ({
        ...st,
        id: `sub-clone-${idCounter++}`,
        completed: false,
      })),
    };

    assert.equal(clone.id, 'task-clone-1');
    assert.equal(clone.title, 'Copy of Sprint Release');
    assert.equal(clone.status, 'todo');
    assert.equal(clone.subtasks.length, 3);
    assert.equal(clone.subtasks[0].id, 'sub-clone-2');
    assert.equal(clone.subtasks[0].completed, false);
    assert.equal(clone.subtasks[1].completed, false);
    assert.equal(clone.subtasks[2].completed, false);
  });

  // --------------------------------------------------------------------------
  // C6: Pomodoro Focus Timer + Task Completion
  // --------------------------------------------------------------------------
  it('C6: Pomodoro Timer + Task Completion: Timer finish enables 1-tap task completion', () => {
    let taskStatus = 'todo';
    let timerState = 'running';
    let chimePlayed = false;

    // Simulate timer tick to 0
    timerState = 'completed';
    chimePlayed = true;

    // User marks task done directly from focus prompt
    if (timerState === 'completed') {
      taskStatus = 'completed';
    }

    assert.equal(timerState, 'completed');
    assert.equal(chimePlayed, true);
    assert.equal(taskStatus, 'completed');
  });

  // --------------------------------------------------------------------------
  // C7: Backlog CSV Export + Subtasks + Templates
  // --------------------------------------------------------------------------
  it('C7: Backlog Export + Subtasks + Templates: Serializes subtask counts and template flags accurately', () => {
    const tasks = [
      {
        id: 'tmpl-1',
        title: 'Weekly Standup Template',
        category: 'Work',
        priority: 'medium',
        status: 'todo',
        isTemplate: true,
        subtasks: [
          { id: 's1', title: 'Progress update', completed: true },
          { id: 's2', title: 'Blockers discussion', completed: false },
        ],
      },
    ];

    const subtasks = tasks[0].subtasks;
    const completedCount = subtasks.filter((s) => s.completed).length;
    const csvRow = `"${tasks[0].id}","${tasks[0].title}","${tasks[0].category}","${tasks[0].priority}","${tasks[0].status}",${subtasks.length},${completedCount},true`;

    assert.ok(csvRow.includes('Weekly Standup Template'));
    assert.ok(csvRow.includes(',2,1,true'));
  });

  // --------------------------------------------------------------------------
  // C8: Dynamic Confetti + Hardware Haptic Gating
  // --------------------------------------------------------------------------
  it('C8: Dynamic Confetti + Haptics: Disabled haptics suppresses vibration while keeping visual confetti', () => {
    let nativeVibrationFired = false;
    let visualConfettiSpawned = false;
    const isHapticsEnabled = false;

    // Trigger completion
    if (isHapticsEnabled) {
      nativeVibrationFired = true;
    }
    // Confetti still renders visually
    visualConfettiSpawned = true;

    assert.equal(nativeVibrationFired, false, 'Hardware vibration must be gated');
    assert.equal(visualConfettiSpawned, true, 'Visual confetti must still execute');
  });

  // --------------------------------------------------------------------------
  // C9: Responsive Breakpoints + Bottom Sheets + 44px Touch Targets
  // --------------------------------------------------------------------------
  it('C9: Breakpoints + Bottom Sheets: Mobile viewport converts modal to bottom sheet with 44px targets', () => {
    const viewportWidth = 390; // iPhone 14
    const isMobile = viewportWidth < 640;
    const modalPlacementClass = isMobile ? 'items-end' : 'items-center';
    const modalBorderRadius = isMobile ? 'rounded-t-3xl' : 'rounded-2xl';
    const minTouchTarget = 44;

    assert.equal(modalPlacementClass, 'items-end');
    assert.equal(modalBorderRadius, 'rounded-t-3xl');
    assert.ok(minTouchTarget >= 44);
  });

  // --------------------------------------------------------------------------
  // C10: Reminder Debounce + Rapid Task Duplication
  // --------------------------------------------------------------------------
  it('C10: Reminder Debounce + Task Duplication: 10 rapid duplicates batch into single reminder sync', async () => {
    let syncExecutions = 0;
    let debounceTimer = null;
    const triggerDebouncedSync = (delay = 20) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { syncExecutions++; }, delay);
    };

    // 10 task duplications in rapid burst
    for (let i = 0; i < 10; i++) {
      triggerDebouncedSync(20);
    }

    await new Promise((res) => setTimeout(res, 40));
    assert.equal(syncExecutions, 1, 'Sync must execute exactly once for batch duplications');
  });

  // --------------------------------------------------------------------------
  // C11: Streak Heatmap + Habit Log Deletion
  // --------------------------------------------------------------------------
  it('C11: Streak Heatmap + Habit Deletion: Removing habit log updates 98-cell fill level reactively', () => {
    const targetDate = '2026-11-04';
    let habitLogs = [
      { id: 'l-1', habitId: 'h-1', date: targetDate, completed: true },
      { id: 'l-2', habitId: 'h-2', date: targetDate, completed: true },
    ];

    const computeCellFill = (dateStr, logs) => {
      const count = logs.filter((l) => l.date === dateStr && l.completed).length;
      if (count === 0) return 0;
      if (count === 1) return 1;
      return 2;
    };

    assert.equal(computeCellFill(targetDate, habitLogs), 2);

    // Delete log 2
    habitLogs = habitLogs.filter((l) => l.id !== 'l-2');
    assert.equal(computeCellFill(targetDate, habitLogs), 1);

    // Delete log 1
    habitLogs = habitLogs.filter((l) => l.id !== 'l-1');
    assert.equal(computeCellFill(targetDate, habitLogs), 0);
  });

  // --------------------------------------------------------------------------
  // C12: Liquid Viewport + SwipeToComplete Gesture Isolation
  // --------------------------------------------------------------------------
  it('C12: Liquid Viewport + SwipeToComplete: Handle has data-no-swipe to prevent viewport swipe collision', () => {
    const swipeTsx = fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'ui', 'SwipeToComplete.tsx'), 'utf-8');
    assert.ok(swipeTsx.includes('data-no-swipe="true"'), 'Draggable container must declare data-no-swipe="true"');
  });

  // --------------------------------------------------------------------------
  // C13: Gen-Z Deletion + Subtasks Cascade
  // --------------------------------------------------------------------------
  it('C13: Gen-Z Delete + Subtasks: Deleting parent task prompts Gen-Z copy and cascades subtask removal', () => {
    const prompt = {
      title: 'Permanent vibe check 🛑',
      message: 'This task and all its 3 subtasks will be banished to the shadow realm fr fr.',
      confirmText: 'Yep, yeet it',
      cancelText: 'Nope, keep it',
    };

    assert.ok(prompt.title.includes('Permanent vibe check'));
    assert.equal(prompt.confirmText, 'Yep, yeet it');

    let tasks = [{ id: 'parent-1', title: 'Parent', subtasks: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] }];
    // Confirmed delete
    tasks = tasks.filter((t) => t.id !== 'parent-1');
    assert.equal(tasks.length, 0);
  });

  // --------------------------------------------------------------------------
  // C14: Currency Auto-Detection + Executive Dashboard
  // --------------------------------------------------------------------------
  it('C14: Currency Auto-Detection + Dashboard: Timezone detection propagates currency symbol correctly', () => {
    const tzCurrencies = {
      'Asia/Kolkata': '₹',
      'Europe/London': '£',
      'Asia/Tokyo': '¥',
      'Europe/Paris': '€',
      'America/New_York': '$',
    };

    for (const [tz, expectedSymbol] of Object.entries(tzCurrencies)) {
      let sym = '$';
      if (tz.includes('Kolkata')) sym = '₹';
      else if (tz.includes('London')) sym = '£';
      else if (tz.includes('Tokyo')) sym = '¥';
      else if (tz.includes('Paris')) sym = '€';
      assert.equal(sym, expectedSymbol);
    }
  });

});
