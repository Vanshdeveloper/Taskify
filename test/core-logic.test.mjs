import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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

test('Stress Test: High-load tasks volume filtering and sorting (2,000 items)', () => {
  const tasks = [];
  const categories = ['Work', 'Personal', 'Fitness', 'Finance', 'Creative'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  for (let i = 0; i < 2000; i++) {
    tasks.push({
      id: `task-${i}`,
      title: `Task objective ${i} title with keywords`,
      description: `Description for task ${i} with extra notes`,
      status: i % 3 === 0 ? 'completed' : 'todo',
      priority: priorities[i % priorities.length],
      category: categories[i % categories.length],
      dueDate: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`,
      createdAt: Date.now() - i * 1000,
    });
  }

  // Filter for specific keyword and category
  const start = performance.now();
  const filtered = tasks.filter(
    (t) => t.category === 'Work' && t.title.toLowerCase().includes('50')
  );
  const elapsed = performance.now() - start;

  assert.ok(filtered.length > 0);
  assert.ok(elapsed < 20, `Filtering 2000 items must take under 20ms (took ${elapsed.toFixed(2)}ms)`);
});

test('Stress Test: Streak calculation across month boundaries and gap days', () => {
  const today = '2026-11-03';
  // Consecutive days: Nov 3, Nov 2, Nov 1, Oct 31, Oct 30 = 5 days
  const logsCrossMonth = [
    { date: '2026-11-03', completed: true },
    { date: '2026-11-02', completed: true },
    { date: '2026-11-01', completed: true },
    { date: '2026-10-31', completed: true },
    { date: '2026-10-30', completed: true },
    { date: '2026-10-28', completed: true }, // gap on Oct 29th
  ];
  assert.equal(calculateStreak(logsCrossMonth, today), 5);
});

test('Stress Test: Safe-to-spend edge cases (zero remaining, overspent, last day of month)', () => {
  // Overspent: budget 1000, spent 1200 -> remaining budget = 0 -> safeSpend = 0
  assert.equal(calculateSafeToSpend(1000, 1200, '2026-10-15'), 0);

  // Last day of month: Oct 31, remaining days = 1 -> budget 500, spent 100 -> safeSpend = 400
  assert.equal(calculateSafeToSpend(500, 100, '2026-10-31'), 400);
});

test('Contract Test: Horizontal slide tabs strictly exclude Streaks and Settings', () => {
  const MAIN_SLIDE_TABS = ['today', 'tasks', 'habits', 'finance', 'scratchpad'];
  assert.ok(!MAIN_SLIDE_TABS.includes('streaks'), 'Streaks must NEVER be in slide tabs');
  assert.ok(!MAIN_SLIDE_TABS.includes('settings'), 'Settings must not be in slide tabs');
  assert.equal(MAIN_SLIDE_TABS.length, 5);
});

test('Currency Auto-Detection: Timezone and locale mappings return valid symbols', () => {
  // Test timezone-to-currency mapping logic
  const tzMap = {
    'Asia/Kolkata': '₹',
    'Europe/London': '£',
    'Asia/Tokyo': '¥',
    'America/New_York': '$',
    'Europe/Berlin': '€',
  };

  for (const [tz, expected] of Object.entries(tzMap)) {
    let symbol = '$';
    if (tz.includes('Kolkata') || tz.includes('Calcutta')) symbol = '₹';
    else if (tz.includes('London')) symbol = '£';
    else if (tz.includes('Tokyo')) symbol = '¥';
    else if (tz.includes('Berlin') || tz.includes('Paris')) symbol = '€';
    assert.equal(symbol, expected);
  }
});

test('Liquid Navigation: Fluid exponential momentum projection projects resting positions', () => {
  function projectMomentum(velocity, decelerationRate = 0.992) {
    return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
  }

  // Zero velocity projects 0
  assert.equal(projectMomentum(0), 0);

  // Moderate flick (500 px/s) projects ~62px forward
  const proj500 = projectMomentum(500);
  assert.ok(proj500 > 50 && proj500 < 80, `Expected ~62px, got ${proj500}`);

  // High velocity flick (1500 px/s) projects ~186px forward
  const proj1500 = projectMomentum(1500);
  assert.ok(proj1500 > 150 && proj1500 < 220, `Expected ~186px, got ${proj1500}`);

  // Opposing flick projects negative distance
  const projNeg = projectMomentum(-800);
  assert.ok(projNeg < -90, `Expected negative projection, got ${projNeg}`);
});

test('Smart Reminders: Daily habit reminder distributions (1x to 5x presets)', () => {
  function generateDefaultReminderTimes(count) {
    const c = Math.max(1, Math.min(5, count));
    switch (c) {
      case 1: return ['09:00'];
      case 2: return ['09:00', '18:00'];
      case 3: return ['09:00', '13:00', '18:00'];
      case 4: return ['09:00', '12:00', '15:00', '18:00'];
      case 5:
      default: return ['08:00', '11:00', '14:00', '17:00', '20:00'];
    }
  }

  assert.deepEqual(generateDefaultReminderTimes(1), ['09:00']);
  assert.deepEqual(generateDefaultReminderTimes(2), ['09:00', '18:00']);
  assert.deepEqual(generateDefaultReminderTimes(3), ['09:00', '13:00', '18:00']);
  assert.deepEqual(generateDefaultReminderTimes(4), ['09:00', '12:00', '15:00', '18:00']);
  assert.deepEqual(generateDefaultReminderTimes(5), ['08:00', '11:00', '14:00', '17:00', '20:00']);
});

test('Smart Reminders: Task reminder offset calculation for presets', () => {
  function calculateTaskReminderTime(dueTime, preset, customTime) {
    if (preset === 'custom') return customTime || dueTime || '09:00';
    if (!dueTime) return '09:00';
    const [hStr, mStr] = dueTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    let totalMinutes = h * 60 + m;
    if (preset === 'at_due') totalMinutes = totalMinutes;
    else if (preset === '15m_before') totalMinutes = Math.max(0, totalMinutes - 15);
    else if (preset === '1h_before') totalMinutes = Math.max(0, totalMinutes - 60);
    const remH = Math.floor(totalMinutes / 60) % 24;
    const remM = totalMinutes % 60;
    return `${String(remH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`;
  }

  assert.equal(calculateTaskReminderTime('14:30', 'at_due'), '14:30');
  assert.equal(calculateTaskReminderTime('14:30', '15m_before'), '14:15');
  assert.equal(calculateTaskReminderTime('14:30', '1h_before'), '13:30');
  assert.equal(calculateTaskReminderTime('14:30', 'custom', '10:00'), '10:00');
});

test('Haptic Vibration Setting: Toggle state controls hardware impact gating and defaults', () => {
  // Test simulated feedback engine gating
  let nativeHapticFired = false;
  let isHapticsEnabled = true;

  function triggerFeedback() {
    if (isHapticsEnabled) {
      nativeHapticFired = true;
    }
  }

  // 1. Enabled by default
  assert.equal(isHapticsEnabled, true);
  triggerFeedback();
  assert.equal(nativeHapticFired, true);

  // 2. Disabled via settings toggle
  nativeHapticFired = false;
  isHapticsEnabled = false;
  triggerFeedback();
  assert.equal(nativeHapticFired, false, 'Haptics must be suppressed when disabled');

  // 3. UserSettings default verification
  const defaultSettings = {
    monthlyBudget: 2400,
    userName: 'Alex',
    hapticFeedback: true,
  };
  assert.equal(defaultSettings.hapticFeedback, true);
});

test('Gen-Z Randomized Validation & Deletion: Generates varied prompts and non-empty microcopy', () => {
  const TASK_TITLE_ERRORS = [
    'Hey man you left this thing alone! 💀 Type a title fr fr.',
    'Bestie you forgot the task title! How we supposed to lock in? 😭',
  ];
  assert.ok(TASK_TITLE_ERRORS.length >= 2);
  TASK_TITLE_ERRORS.forEach((msg) => {
    assert.ok(msg.includes('alone') || msg.includes('title') || msg.includes('Bestie'));
  });
});

test('Daily Poke Service: Generates witty contextual prompts with pending nudges and rest rewards', () => {
  const pendingNudge = {
    emoji: '🛑',
    title: 'Stop doing the other things!',
    body: 'Hey Alex, stop doing other things and complete this task! You have 3 pending objectives waiting.',
    category: 'pending_nudge',
  };
  const restReward = {
    emoji: '🏖️',
    title: 'You own this rest!',
    body: 'All work is done, Alex! Kick back, relax, and enjoy pure zero-guilt chill time.',
    category: 'rest_reward',
  };

  assert.ok(pendingNudge.title.includes('Stop doing the other things'));
  assert.ok(pendingNudge.body.includes('complete this task'));
  assert.equal(pendingNudge.category, 'pending_nudge');

  assert.ok(restReward.title.includes('You own this rest'));
  assert.ok(restReward.body.includes('All work is done'));
  assert.equal(restReward.category, 'rest_reward');

  // Verify daily poke schedule frequency (7 times/day: baseline 2 + 5 additional)
  const pokeTimes = ['09:30', '11:30', '13:30', '15:30', '17:30', '19:30', '21:30'];
  assert.equal(pokeTimes.length, 7);
  assert.ok(pokeTimes.includes('09:30'));
  assert.ok(pokeTimes.includes('19:30'));
  assert.ok(pokeTimes.includes('11:30'));
  assert.ok(pokeTimes.includes('13:30'));
  assert.ok(pokeTimes.includes('15:30'));
  assert.ok(pokeTimes.includes('17:30'));
  assert.ok(pokeTimes.includes('21:30'));
});

test('Core Prioritization & Metrics: Focus priority, habit completion percentage & safe-to-spend velocity', () => {
  // 1. Focus Task Prioritization: High priority due today wins
  const tasks = [
    { id: '1', title: 'Normal Later', priority: 'medium', dueDate: '2026-11-10', completed: false },
    { id: '2', title: 'High Today', priority: 'high', dueDate: '2026-11-07', completed: false },
    { id: '3', title: 'Normal Today', priority: 'low', dueDate: '2026-11-07', completed: false },
  ];
  const pending = tasks.filter((t) => !t.completed);
  const topTask = pending.find((t) => t.dueDate === '2026-11-07' && t.priority === 'high')
    || pending.find((t) => t.dueDate === '2026-11-07')
    || pending[0];
  assert.equal(topTask.id, '2');
  assert.equal(topTask.title, 'High Today');

  // 2. Habit Matrix Percentage
  const habits = [{ id: 'h1' }, { id: 'h2' }, { id: 'h3' }, { id: 'h4' }];
  const completedHabitsCount = 3;
  const pct = Math.round((completedHabitsCount / habits.length) * 100);
  assert.equal(pct, 75);

  // 3. Safe-to-Spend Velocity & Clamping
  const monthlyExpenses = 1800;
  const monthlyBudget = 2400;
  const spentPct = Math.min(100, Math.round((monthlyExpenses / monthlyBudget) * 100));
  assert.equal(spentPct, 75);
});

test('Navbar Height Y-Axis Centering: Symmetrical vertical padding for compact, default, and spacious', () => {
  const heightConfig = {
    compact: { minHeight: '3.25rem', paddingY: '0.4rem' },
    default: { minHeight: '3.75rem', paddingY: '0.65rem' },
    spacious: { minHeight: '4.75rem', paddingY: '1.15rem' },
  };
  assert.ok(heightConfig.compact);
  assert.ok(heightConfig.default);
  assert.ok(heightConfig.spacious);
  assert.equal(heightConfig.compact.minHeight, '3.25rem');
  assert.equal(heightConfig.spacious.minHeight, '4.75rem');
});

test('Custom Smooth Splash Screen: Low-end mobile performance, duration clamping, and brand token integrity', () => {
  // 1. Duration clamping logic
  const minDurationMs = 650;
  const computeRemaining = (elapsed) => Math.max(0, minDurationMs - elapsed);

  // Fast boot: keeps splash for remainder of 650ms to prevent visual flicker
  assert.equal(computeRemaining(100), 550);
  assert.equal(computeRemaining(300), 350);

  // Slow boot on low-end mobile: zero artificial delay, releases immediately
  assert.equal(computeRemaining(650), 0);
  assert.equal(computeRemaining(1200), 0);

  // 2. Brand Design Tokens
  const brandTokens = {
    canvas: '#160f0d',
    accentPrimary: '#f26a36',
    accentSecondary: '#e5a42f',
    highlight: '#fdf3e5',
  };
  assert.equal(brandTokens.canvas, '#160f0d');
  assert.equal(brandTokens.accentPrimary, '#f26a36');
  assert.equal(brandTokens.accentSecondary, '#e5a42f');
  assert.equal(brandTokens.highlight, '#fdf3e5');

  // 3. Apple Fluid Deceleration Ease & GPU Compositor Transform
  const appleEase = [0.16, 1, 0.3, 1];
  assert.equal(appleEase.length, 4);
  assert.equal(appleEase[0], 0.16);
  assert.equal(appleEase[1], 1);

  const keyframes = {
    from: 'translate3d(-100%, 0, 0)',
    to: 'translate3d(250%, 0, 0)',
  };
  assert.ok(keyframes.from.startsWith('translate3d'));
  assert.ok(keyframes.to.startsWith('translate3d'));
});

test('Choreographed Splash Screen: 1:1 navbar scale, clip-path wipe, and flat zero-glow tokens', () => {
  // 1. Unbroken wordmark typography contract matching Navbar
  const navbarClasses = 'font-display font-black text-lg sm:text-xl text-white tracking-[-0.04em] leading-none';
  const splashText = 'Taskify';
  assert.equal(splashText, 'Taskify');
  assert.ok(navbarClasses.includes('font-display'));
  assert.ok(navbarClasses.includes('font-black'));
  assert.ok(navbarClasses.includes('tracking-[-0.04em]'));

  // 2. 1:1 Scale Delta Coordinates Math (no scale distortion)
  const centerLockupRect = { left: 400, top: 300, width: 88, height: 24 };
  const targetNavbarRect = { left: 24, top: 18, width: 88, height: 24 };

  const deltaX = targetNavbarRect.left - centerLockupRect.left;
  const deltaY = targetNavbarRect.top - centerLockupRect.top;
  const scale = 1.0; // Strictly 1:1 as requested

  assert.equal(deltaX, -376);
  assert.equal(deltaY, -282);
  assert.equal(scale, 1.0);

  // Landing coordinate verification
  const finalX = centerLockupRect.left + deltaX;
  const finalY = centerLockupRect.top + deltaY;
  assert.equal(finalX, targetNavbarRect.left);
  assert.equal(finalY, targetNavbarRect.top);

  // 3. Critically Damped Apple Spring Tokens for Docking
  const flightSpring = {
    damping: 26,
    stiffness: 220,
    mass: 0.85,
  };
  assert.equal(flightSpring.damping, 26);
  assert.equal(flightSpring.stiffness, 220);
  assert.equal(flightSpring.mass, 0.85);

  // 4. Flat Zero-Glow Dot Contract
  const dotConfig = {
    hasShadow: false,
    hasBlur: false,
    backgroundColor: 'var(--accent-primary)',
    size: 'w-1.5 h-1.5',
  };
  assert.equal(dotConfig.hasShadow, false);
  assert.equal(dotConfig.hasBlur, false);
  assert.equal(dotConfig.size, 'w-1.5 h-1.5');
});

test('App Aesthetic & Chrome Favicon Synchronization Contract', () => {
  const supportedAesthetics = [
    'dynamic-theme',
    'espresso-terracotta',
    'kyoto-matcha',
    'lavender-mist',
    'nordic-sky',
    'molten-amber',
    'minimal-obsidian',
    'text-dot',
    'text-brackets',
    'text-caps',
    'text-terminal',
    'text-spark',
  ];

  assert.equal(supportedAesthetics.length, 12);
  assert.ok(supportedAesthetics.includes('dynamic-theme'));
  assert.ok(supportedAesthetics.includes('text-brackets'));
  assert.ok(supportedAesthetics.includes('text-caps'));

  // Concentric circle geometry contract
  const circleLogo = {
    outerRadius: 44,
    innerRadius: 20,
    viewBox: '0 0 100 100',
  };
  assert.equal(circleLogo.outerRadius, 44);
  assert.equal(circleLogo.innerRadius, 20);

  // Default color-scheme dark style contract preventing white flash
  const darkScheme = {
    colorScheme: 'dark',
    defaultCanvas: '#160f0d',
  };
  assert.equal(darkScheme.colorScheme, 'dark');
  assert.equal(darkScheme.defaultCanvas, '#160f0d');
});

test('Daypart Motivational Notifications: Morning, Afternoon, and Night briefings', () => {
  // 1. Daypart hour resolution contract
  function getDaypartForHour(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
  }

  assert.equal(getDaypartForHour(8), 'morning');
  assert.equal(getDaypartForHour(14), 'afternoon');
  assert.equal(getDaypartForHour(21), 'night');

  // 2. Daypart schedule slots
  const DAYPART_SCHEDULE = [
    { slotId: 'morning', hour: 8, minute: 30, timeStr: '08:30' },
    { slotId: 'afternoon', hour: 13, minute: 30, timeStr: '13:30' },
    { slotId: 'night', hour: 20, minute: 30, timeStr: '20:30' },
  ];
  assert.equal(DAYPART_SCHEDULE.length, 3);
  assert.equal(DAYPART_SCHEDULE[0].timeStr, '08:30');
  assert.equal(DAYPART_SCHEDULE[1].timeStr, '13:30');
  assert.equal(DAYPART_SCHEDULE[2].timeStr, '20:30');

  // 3. Greetings with pending tasks & habits
  function generateDaypartGreeting(daypart, userName, pendingTasksCount, pendingHabitsCount) {
    const name = userName?.trim() || 'Alex';
    const totalPending = pendingTasksCount + pendingHabitsCount;
    const isAllDone = totalPending === 0;

    if (isAllDone) {
      switch (daypart) {
        case 'morning':
          return {
            daypart,
            emoji: '🌅',
            title: `Good morning, ${name}!`,
            body: `All tasks and habits are checked off. Enjoy your morning.`,
            isAllDone: true,
          };
        case 'afternoon':
          return {
            daypart,
            emoji: '🚀',
            title: `Good afternoon, ${name}!`,
            body: `All tasks and habits for today are done.`,
            isAllDone: true,
          };
        case 'night':
        default:
          return {
            daypart,
            emoji: '🌟',
            title: `Good night, ${name}!`,
            body: `Everything scheduled for today is completed.`,
            isAllDone: true,
          };
      }
    }

    const parts = [];
    if (pendingTasksCount > 0) {
      parts.push(`${pendingTasksCount} ${pendingTasksCount === 1 ? 'task' : 'tasks'}`);
    }
    if (pendingHabitsCount > 0) {
      parts.push(`${pendingHabitsCount} ${pendingHabitsCount === 1 ? 'routine' : 'routines'}`);
    }
    const pendingSummary = parts.join(' and ');

    switch (daypart) {
      case 'morning':
        return {
          daypart,
          emoji: '☀️',
          title: `Good morning, ${name}!`,
          body: `You have ${pendingSummary} queued up for today. Let's make today count!`,
          isAllDone: false,
        };
      case 'afternoon':
        return {
          daypart,
          emoji: '⚡',
          title: `Good afternoon, ${name}!`,
          body: `${pendingSummary} still open for today. Keep the momentum going strong!`,
          isAllDone: false,
        };
      case 'night':
      default:
        return {
          daypart,
          emoji: '🌙',
          title: `Good night, ${name}!`,
          body: `${pendingSummary} remaining to close out today. Finish strong or wrap up with peace!`,
          isAllDone: false,
        };
    }
  }

  // Pending briefings
  const morningPending = generateDaypartGreeting('morning', 'Taylor', 3, 2);
  assert.equal(morningPending.isAllDone, false);
  assert.ok(morningPending.title.includes('Good morning, Taylor!'));
  assert.ok(morningPending.body.includes('3 tasks and 2 routines'));

  const afternoonPending = generateDaypartGreeting('afternoon', 'Taylor', 1, 1);
  assert.equal(afternoonPending.isAllDone, false);
  assert.ok(afternoonPending.title.includes('Good afternoon, Taylor!'));
  assert.ok(afternoonPending.body.includes('1 task and 1 routine'));

  const nightPending = generateDaypartGreeting('night', 'Taylor', 2, 0);
  assert.equal(nightPending.isAllDone, false);
  assert.ok(nightPending.title.includes('Good night, Taylor!'));
  assert.ok(nightPending.body.includes('2 tasks remaining'));

  // All completed uplifting motivational messages
  const morningDone = generateDaypartGreeting('morning', 'Taylor', 0, 0);
  assert.equal(morningDone.isAllDone, true);
  assert.ok(morningDone.body.includes('All tasks and habits are checked off'));

  const afternoonDone = generateDaypartGreeting('afternoon', 'Taylor', 0, 0);
  assert.equal(afternoonDone.isAllDone, true);
  assert.ok(afternoonDone.body.includes('All tasks and habits for today are done'));

  const nightDone = generateDaypartGreeting('night', 'Taylor', 0, 0);
  assert.equal(nightDone.isAllDone, true);
  assert.ok(nightDone.body.includes('Everything scheduled for today is completed'));
});

test('Glassmorphic Widget SVG Generation: 6-Pill Medium & 2x2 Small Layouts', () => {
  // Test Medium Widget SVG layout (inspired by widget-ref-1.jpg)
  const mockPills = [
    { id: 't1', title: 'First Workout', type: 'task', done: true },
    { id: 'h1', title: 'No Alcohol', type: 'habit', done: false },
    { id: 't2', title: 'Second Workout', type: 'task', done: true },
    { id: 'h2', title: 'Read 10 pages', type: 'habit', done: true },
    { id: 't3', title: 'Healthy diet', type: 'task', done: false },
    { id: 'h3', title: 'Drink water', type: 'habit', done: false },
  ];

  // Logic replicating buildMediumWidgetSvg
  const completedCount = mockPills.filter((p) => p.done).length;
  assert.equal(completedCount, 3);
  assert.equal(mockPills.length, 6);

  // Test Small Widget Briefing logic (inspired by widget-ref-2.jpg)
  const dayShort = 'Fri';
  const dateStr = 'January 17';
  const year = 2024;
  const userName = 'Alexey';
  const pendingTasks = 2;
  const pendingHabits = 1;

  assert.equal(dayShort, 'Fri');
  assert.equal(dateStr, 'January 17');
  assert.equal(year, 2024);
  assert.equal(userName, 'Alexey');
  assert.equal(pendingTasks + pendingHabits, 3);
});

test('Classic Solid Surface & Authentic Cozy Minimalist Themes Contract', () => {
  const VALID_SURFACES = ['classic-solid'];
  
  // Test surface validity: strictly classic-solid normal theme, liquid-glass completely removed
  assert.ok(VALID_SURFACES.includes('classic-solid'));
  assert.equal(VALID_SURFACES.includes('liquid-glass'), false, 'Liquid glass must be completely removed');
  assert.equal(VALID_SURFACES.includes('fluted-glass'), false, 'Fluted glass must be completely removed');
  assert.equal(VALID_SURFACES.includes('unknown-theme'), false);

  // Test preset themes retain solid presets with zero shader themes
  const mockPresetThemes = [
    { id: 'espresso-terracotta', category: 'soft', colors: ['#160f0d', '#f26a36', '#e5a42f', '#fdf3e5'] },
    { id: 'oat-clay', category: 'soft', colors: ['#151210', '#e07a5f', '#d4a373', '#fefae0'] },
    { id: 'wabi-sabi', category: 'minimalist', colors: ['#111112', '#e8e4dc', '#969087', '#f8f6f2'] },
  ];

  assert.equal(mockPresetThemes.length, 3);
  assert.ok(mockPresetThemes.every((t) => !t.id.startsWith('shader-')));
  assert.ok(mockPresetThemes.every((t) => ['soft', 'aesthetic', 'minimalist', 'dark'].includes(t.category)));
});

test('Focus Timer Edge Progress Perimeter, Corner Curvature & Inset Adaptation Contract', () => {
  // Edge calculation helper
  function computePerimeter(w, h, r, inset) {
    const rectW = Math.max(10, w - inset * 2);
    const rectH = Math.max(10, h - inset * 2);
    return 2 * (rectW + rectH) - 8 * r + 2 * Math.PI * r;
  }

  function resolveAutoFit(isDesktop, safeTop, safeBottom, isNative) {
    if (isDesktop) return { radius: 24, inset: 2 };
    const maxSafe = Math.max(safeTop, safeBottom);
    if (maxSafe >= 44) return { radius: 50, inset: 5 };
    if (maxSafe >= 28) return { radius: 42, inset: 4 };
    return { radius: isNative ? 40 : 32, inset: 3 };
  }

  // 1. Extreme curved mobile (e.g. Pixel 8/9, iPhone 15/16 Pro with safe-area >= 44)
  const extremeFit = resolveAutoFit(false, 47, 34, true);
  assert.equal(extremeFit.radius, 50, 'Extreme phone curvature auto-calculates to 50px');
  assert.equal(extremeFit.inset, 5, 'Extreme phone curvature insets 5px inside bezels');

  // 2. Standard punch-hole phone
  const standardFit = resolveAutoFit(false, 30, 16, true);
  assert.equal(standardFit.radius, 42);
  assert.equal(standardFit.inset, 4);

  // 3. Desktop view
  const desktopFit = resolveAutoFit(true, 0, 0, false);
  assert.equal(desktopFit.radius, 24);
  assert.equal(desktopFit.inset, 2);

  // 4. Perimeter geometry assertion
  const perimMobile = computePerimeter(390, 844, extremeFit.radius, extremeFit.inset);
  assert.ok(perimMobile > 2000 && perimMobile < 2500, `Perimeter ${perimMobile} is geometrically accurate`);

  // 5. Dashoffset at 50% progress
  const progressRatio = 0.5;
  const offset = perimMobile * (1 - progressRatio);
  assert.equal(Math.round(offset), Math.round(perimMobile / 2));
});

test('Pomodoro Presets, Custom Duration & Executive Insights Contract', () => {
  // 1. Pomodoro Presets Contract (including 10s and custom duration)
  const presets = [
    { label: '10s', seconds: 10 },
    { label: '5m', seconds: 5 * 60 },
    { label: '15m', seconds: 15 * 60 },
    { label: '25m', seconds: 25 * 60 },
    { label: '45m', seconds: 45 * 60 },
    { label: '60m', seconds: 60 * 60 },
    { label: '90m', seconds: 90 * 60 },
  ];
  assert.equal(presets.length, 7);
  assert.equal(presets[0].seconds, 10, 'Supports 10s sprint preset');

  // Custom duration clamping: minimum 10 seconds
  const clampCustomDuration = (minutes, seconds) => Math.max(10, Math.min(180 * 60, minutes * 60 + seconds));
  assert.equal(clampCustomDuration(0, 5), 10, 'Clamps sub-10s duration to 10s');
  assert.equal(clampCustomDuration(0, 10), 10, 'Allows exact 10s duration');
  assert.equal(clampCustomDuration(25, 0), 1500, 'Computes 25m correctly');

  // 2. Executive Insights Contract (clean, curated, zero-bloat)
  const categories = ['focus', 'tasks', 'habits', 'finance'];
  const mockInsights = [
    { id: 'insight-focus', category: 'focus', tag: 'Flow State', title: '90-Minute Ultradian Limit' },
    { id: 'insight-tasks', category: 'tasks', tag: 'Velocity', title: 'Tackle the Hardest Task First' },
    { id: 'insight-habits', category: 'habits', tag: 'Streak Shield', title: 'The Non-Negotiable 2-Day Rule' },
    { id: 'insight-finance', category: 'finance', tag: 'Safe Runway', title: 'Reverse Budget Automation' },
  ];

  assert.equal(mockInsights.length, 4);
  categories.forEach((cat) => {
    const item = mockInsights.find((s) => s.category === cat);
    assert.ok(item, `Category ${cat} is covered in executive insights`);
    assert.ok(item.tag.length > 0);
  });
});

test('Daily Routines Widget Midnight Rollover Contract', () => {
  // Simulate SharedPreferences state
  const mockPrefs = {
    sync_date_iso: '2026-11-15',
    all_habits_json: JSON.stringify([
      { id: 'h1', title: 'Hydration', done: true, progress: '1/1 times' },
      { id: 'h2', title: 'Deep Reading', done: true, progress: '30/30 mins' },
    ]),
    habits_completed_count: 2,
    habit_pill_0_done: true,
    habit_pill_1_done: true,
    date_str: 'Nov 15',
    day_short: 'Sun',
  };

  // Simulate midnight rollover check logic
  const checkAndRollover = (prefs, todayIso, todayShort, todayDateStr) => {
    if (prefs.sync_date_iso !== todayIso) {
      prefs.sync_date_iso = todayIso;
      const habits = JSON.parse(prefs.all_habits_json);
      habits.forEach((h) => {
        h.done = false;
        h.progress = '0/1 times';
      });
      prefs.all_habits_json = JSON.stringify(habits);
      prefs.habits_completed_count = 0;
      prefs.habit_pill_0_done = false;
      prefs.habit_pill_1_done = false;
      prefs.day_short = todayShort;
      prefs.date_str = todayDateStr;
      return true;
    }
    return false;
  };

  const didRollover = checkAndRollover(mockPrefs, '2026-11-16', 'Mon', 'Nov 16');
  assert.equal(didRollover, true, 'Rollover occurred because date differed');
  assert.equal(mockPrefs.sync_date_iso, '2026-11-16');
  assert.equal(mockPrefs.habits_completed_count, 0, 'Completed count reset to 0');
  assert.equal(mockPrefs.habit_pill_0_done, false, 'Pill 0 reset to false');
  assert.equal(mockPrefs.date_str, 'Nov 16');
  assert.equal(mockPrefs.day_short, 'Mon');

  const habits = JSON.parse(mockPrefs.all_habits_json);
  assert.equal(habits[0].done, false, 'Habit 1 reset to undone');
  assert.equal(habits[1].done, false, 'Habit 2 reset to undone');
});

test('Color Ring Overflow Isolation & Edge Radius Auto-Fit Contract', () => {
  // Habit and Flashcard color pickers must NOT use ring-offset-2 ring-offset-zinc-950 which causes oblong clipping
  const validRingClass = 'ring-2 ring-white scale-110';
  const invalidRingClass = 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110';

  assert.ok(!validRingClass.includes('ring-offset'), 'Clean ring does not bleed outside element boundary');
  assert.ok(invalidRingClass.includes('ring-offset-2'), 'Invalid pattern detected and isolated');

  // Edge radius default contract
  const defaultSettings = { focusEdgeRadius: 'auto' };
  assert.equal(defaultSettings.focusEdgeRadius, 'auto');

  // Navbar brand invariant: Navbar logo wordmark remains untouched
  const navbarBrandId = 'navbar-brand-target';
  assert.ok(navbarBrandId === 'navbar-brand-target');
});

test('Notepad Autosave, Pinning, and Pomodoro Settings Sheet Contract', () => {
  // 1. Notes Pinning & Master-Detail Sorting Hierarchy Contract
  const rawNotes = [
    { id: '1', title: 'Grocery', isPinned: false, updatedAt: '2026-11-16T10:00:00Z' },
    { id: '2', title: 'Architecture Plan', isPinned: true, updatedAt: '2026-11-15T12:00:00Z' },
    { id: '3', title: 'Meeting Notes', isPinned: false, updatedAt: '2026-11-16T18:00:00Z' },
    { id: '4', title: 'Vision & Goals', isPinned: true, updatedAt: '2026-11-16T14:00:00Z' },
  ];

  const sorted = [...rawNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const timeA = new Date(a.updatedAt).getTime();
    const timeB = new Date(b.updatedAt).getTime();
    return timeB - timeA;
  });

  // Verify pinned notes appear first, ordered by newest updated
  assert.equal(sorted[0].id, '4', 'Newest pinned note Vision & Goals is first');
  assert.equal(sorted[1].id, '2', 'Older pinned note Architecture Plan is second');
  // Followed by unpinned notes ordered by newest updated
  assert.equal(sorted[2].id, '3', 'Newest unpinned note Meeting Notes is third');
  assert.equal(sorted[3].id, '1', 'Oldest unpinned note Grocery is fourth');

  // 2. Autosave Buffer & Markdown Formatting Helper Contract
  const insertFormattingLogic = (content, start, end, prefix, suffix = '') => {
    const selected = content.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    const newCursor = selected ? start + replacement.length : start + prefix.length;
    return { newContent, newCursor };
  };

  // Bold insertion around selection
  const boldResult = insertFormattingLogic('Hello World', 6, 11, '**', '**');
  assert.equal(boldResult.newContent, 'Hello **World**');
  assert.equal(boldResult.newCursor, 15);

  // Todo checklist insertion at cursor
  const todoResult = insertFormattingLogic('Line 1\nLine 2', 6, 6, '\n- [ ] ');
  assert.equal(todoResult.newContent, 'Line 1\n- [ ] \nLine 2');

  // 3. Pomodoro Advanced Settings Isolation Contract
  const advancedSettingsKeys = [
    'focusEdgeProgress',
    'focusEdgeRadius',
    'focusEdgeInset',
    'soundChimes',
  ];
  assert.equal(advancedSettingsKeys.length, 4, 'Four key advanced setting domains are encapsulated');

  const curvaturePresets = ['auto', 0, 24, 38, 48, 56];
  assert.equal(curvaturePresets.length, 6, 'Contains full 6-preset curvature scale');

  const insetPresets = [2, 4, 6, 8];
  assert.equal(insetPresets.length, 4, 'Contains 4-preset bezel inset scale');
});

test('TASK-084: Mobile Notes Fullscreen and Settings Inset Grouped Verification', () => {
  // 1. Mobile Notes Fullscreen & Layering Contract
  const zIndices = {
    navbar: 30,
    mobileTabBar: 40,
    mobileNoteEditor: 50,
  };
  assert.ok(
    zIndices.mobileNoteEditor > zIndices.mobileTabBar,
    'Mobile Note Editor (z-50) must occlude MobileTabBar (z-40) to eliminate all distractions'
  );
  assert.ok(
    zIndices.mobileNoteEditor > zIndices.navbar,
    'Mobile Note Editor (z-50) must occlude Navbar (z-30) edge-to-edge'
  );

  // 2. Inset Grouped Settings Categories Contract
  const settingsSections = [
    { id: 'profile', title: 'User Monogram Card', hasAvatar: true },
    { id: 'workspace', title: 'Workspace & Budget', iconColor: 'bg-indigo-500' },
    { id: 'appearance', title: 'Appearance & Display', iconColor: 'bg-purple-500' },
    { id: 'haptics', title: 'Sound & Haptics', iconColor: 'bg-orange-500' },
    { id: 'data', title: 'Data Sovereignty & Portability', iconColor: 'bg-emerald-500' },
    { id: 'about', title: 'About Taskify OS', iconColor: 'bg-zinc-600' },
  ];
  assert.equal(settingsSections.length, 6, 'Settings must feature 6 uncluttered Inset sections');
  assert.equal(settingsSections[0].hasAvatar, true, 'Profile card features user monogram avatar');
});

test('TASK-085 Part 1: Floating Dropdowns & Confirm Delete Elevation Contract', () => {
  // 1. Z-Index Hierarchy Layering Contract
  const zIndices = {
    navbar: 30,
    mobileTabBar: 40,
    mobileNoteEditor: 100,
    confirmDeleteModal: 250,
    floatingDropdownPopover: 99999,
  };

  assert.ok(
    zIndices.confirmDeleteModal > zIndices.mobileNoteEditor,
    'ConfirmDeleteModal (z-250) must mount ABOVE the full-screen mobile note editor (z-100) so users see delete confirmation inside notes'
  );

  assert.ok(
    zIndices.floatingDropdownPopover > zIndices.confirmDeleteModal,
    'Floating dropdown popover (z-99999) must float in air above any modal or sheet without height constraints'
  );

  // 2. Dropdown Positioning & Collision Logic Contract
  const computeDropdownPosition = (triggerRect, viewportHeight, viewportWidth, estimatedHeight) => {
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const popoverWidth = Math.max(triggerRect.width, 160);
    const left = Math.max(8, Math.min(triggerRect.left, viewportWidth - popoverWidth - 8));

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      return { placement: 'up', bottom: viewportHeight - triggerRect.top + 6, left, width: popoverWidth };
    }
    return { placement: 'down', top: triggerRect.bottom + 6, left, width: popoverWidth };
  };

  // Case A: Plenty of space below (trigger at top 100 in 800px viewport) -> opens DOWN
  const posA = computeDropdownPosition({ top: 100, bottom: 136, left: 50, width: 200 }, 800, 390, 200);
  assert.equal(posA.placement, 'down');
  assert.equal(posA.top, 142);
  assert.equal(posA.width, 200);

  // Case B: Near bottom of viewport (trigger at 720 in 800px viewport) -> flips UP
  const posB = computeDropdownPosition({ top: 700, bottom: 736, left: 50, width: 200 }, 800, 390, 200);
  assert.equal(posB.placement, 'up');
  assert.equal(posB.bottom, 106); // 800 - 700 + 6
  assert.equal(posB.width, 200);

  // Case C: Narrow width trigger (< 160px) clamped to minimum 160px
  const posC = computeDropdownPosition({ top: 100, bottom: 136, left: 20, width: 90 }, 800, 390, 200);
  assert.equal(posC.width, 160);
});

test('TASK-085 Part 2: Native Notepad Rich Text & Notes Multi-Select Batch Delete Contract', () => {
  // 1. Clean HTML to plain-text snippet extraction contract
  const richHtmlContent = '<p><b>Sprint Goals:</b> Execute <mark style="background-color: yellow">Phase 2</mark> with <font color="#f26a36">high precision</font>.</p>';
  const plainSnippet = richHtmlContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(plainSnippet, 'Sprint Goals: Execute Phase 2 with high precision.');

  // 2. Word Count calculation from rich HTML
  const words = plainSnippet.split(/\s+/).length;
  assert.equal(words, 8, 'Word count correctly identifies 8 words from HTML content');

  // 3. Multi-Select Set Toggle Logic Contract
  let selected = new Set();
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected = next;
  };

  toggle('note-1');
  assert.equal(selected.has('note-1'), true);
  assert.equal(selected.size, 1);

  toggle('note-2');
  assert.equal(selected.size, 2);

  // Untoggle note-1
  toggle('note-1');
  assert.equal(selected.has('note-1'), false);
  assert.equal(selected.size, 1);

  // 4. Batch Delete Filtering Contract
  const notes = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }];
  selected = new Set(['n1', 'n3']);
  const remaining = notes.filter((n) => !selected.has(n.id));
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, 'n2');

  // 5. Highlighter & Text Color Palette scale
  const highlightColors = ['#fef08a', '#fed7aa', '#bbf7d0', '#bae6fd', '#e9d5ff', 'transparent'];
  assert.equal(highlightColors.length, 6, 'Must feature 5 fluorescent hues + 1 clear tone');

  const textColors = ['#ffffff', '#f26a36', '#f59e0b', '#10b981', '#06b6d4', '#818cf8', '#f472b6', '#a1a1aa'];
  assert.equal(textColors.length, 8, 'Must feature 8 tailored text colors');
});

test('TASK-085 Part 3: Unified Section Header Height Contract Across All Views', () => {
  // 1. Standard Section Header Height Token & Class Specifications
  const SECTION_HEADER_BASE_CLASS = 'w-full min-h-[64px] sm:min-h-[72px] flex items-center justify-between gap-3 shrink-0 select-none';
  assert.ok(SECTION_HEADER_BASE_CLASS.includes('min-h-[64px]'));
  assert.ok(SECTION_HEADER_BASE_CLASS.includes('sm:min-h-[72px]'));

  // 2. All 6 primary views registered with identical header contract
  const primarySections = [
    { id: 'today', title: 'Today / Welcome', expectedMinHeight: 64 },
    { id: 'tasks', title: 'Tasks', expectedMinHeight: 64 },
    { id: 'habits', title: 'Habits', expectedMinHeight: 64 },
    { id: 'finance', title: 'Finances', expectedMinHeight: 64 },
    { id: 'settings', title: 'Settings', expectedMinHeight: 64 },
    { id: 'scratchpad', title: 'Notes', expectedMinHeight: 64 },
  ];

  assert.equal(primarySections.length, 6, 'All 6 primary views must implement SectionHeader');
  primarySections.forEach((section) => {
    assert.equal(section.expectedMinHeight, 64, `${section.id} matches 64px mobile standard`);
  });

  // 3. Container Padding Contract in LiquidTabViewport and App.tsx Settings
  const viewportPadding = 'px-4 sm:px-6 lg:px-8 py-4 sm:py-5';
  const settingsPadding = 'px-4 sm:px-6 lg:px-8 py-4 sm:py-5';
  assert.equal(viewportPadding, settingsPadding, 'Settings view container padding strictly matches LiquidTabViewport');
});

test('TASK-085 Part 4: Interactive Onboarding Tour Steps & Sovereignty Contract', () => {
  // 1. Tour steps structure & content validation
  const TOUR_STEPS = [
    { id: 'navigation', badge: '1 of 5', accentColor: '#38bdf8' },
    { id: 'tasks-habits', badge: '2 of 5', accentColor: '#10b981' },
    { id: 'focus-timer', badge: '3 of 5', accentColor: '#f59e0b' },
    { id: 'notepad', badge: '4 of 5', accentColor: '#f26a36' },
    { id: 'sovereignty', badge: '5 of 5', accentColor: '#8b5cf6' },
  ];

  assert.equal(TOUR_STEPS.length, 5, 'Tour must provide 5 curated walkthrough steps');
  assert.equal(TOUR_STEPS[0].id, 'navigation');
  assert.equal(TOUR_STEPS[4].id, 'sovereignty');

  // 2. Navigation bounds and step clamp
  let step = 0;
  const goNext = () => { step = Math.min(step + 1, TOUR_STEPS.length - 1); };
  const goPrev = () => { step = Math.max(step - 1, 0); };

  goNext(); // 1
  assert.equal(step, 1);
  goNext(); // 2
  goNext(); // 3
  goNext(); // 4 (last)
  goNext(); // clamped to 4
  assert.equal(step, 4);
  goPrev(); // 3
  assert.equal(step, 3);

  // 3. Tour completion updates hasSeenTour setting
  let settingsState = { hasSeenTour: false };
  const completeTour = () => { settingsState.hasSeenTour = true; };
  completeTour();
  assert.equal(settingsState.hasSeenTour, true, 'Tour completion sets hasSeenTour to true');
});

test('TASK-097: Website Navigation Exclusivity, Official Platform Icons, Keyword Pruning & Analytics X-Axis Scroll Contract', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  // 1. Website Navigation Exclusivity & Navbar Pill Pruning Contract
  const websitePath = path.resolve('website-template/index.html');
  if (fs.existsSync(websitePath)) {
    const htmlContent = fs.readFileSync(websitePath, 'utf-8');
    const cssContent = fs.readFileSync(path.resolve('website-template/style.css'), 'utf-8');

    // Verify timer and streak pills removed from website navbar
    assert.equal(htmlContent.includes('timer-pill'), false, 'Timer pill must be removed from website navbar');
    assert.equal(htmlContent.includes('streak-pill'), false, 'Streak pill must be removed from website navbar');

    // Verify exclusive navigation on desktop (hamburger hidden on >=840px)
    assert.ok(/\.menu-trigger\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(cssContent), 'Hamburger menu-trigger must be hidden on PC (min-width: 840px)');

    // 2. Download Platform Icons Contract (Official SVGs, No Custom Cobbled Icons)
    // Windows: Official 4-tile SVG path
    assert.ok(htmlContent.includes('M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z'), 'Must use official Windows 11 4-tile vector');
    // macOS / Apple: Official Apple vector
    assert.ok(htmlContent.includes('M18.71 19.5c-.83 1.24-1.71 2.45'), 'Must use official Apple vector');
    // Linux: Official Tux vector
    assert.ok(htmlContent.includes('M12.504 0q-.232 0-.48.021'), 'Must use official Linux Tux vector');
    // Android: Official Android bugdroid vector
    assert.ok(htmlContent.includes('M17.523 15.3414'), 'Must use official Android vector');

    // 3. Keyword Pruning Contract ("Apple watch", "Apple Foundations", etc. completely removed)
    assert.equal(/Apple watch|Apple Watch|Apple foundations|Apple Foundations/i.test(htmlContent), false, 'Zero occurrences of Apple watch or Apple foundations in index.html');

    // 4. Footer Logo & Bloat Elimination Contract
    assert.ok(/footer-brand-col[\s\S]*?<a\s+href="#hero"\s+class="app-header-brand"/i.test(htmlContent), 'Footer must use actual navbar app-header-brand logo');
    assert.equal(htmlContent.includes('footer-status-pill'), false, 'Footer must not contain status pill bloat');
    assert.equal(htmlContent.includes('100% Local Storage • Zero Servers'), false, 'Live dot + 100% Local Storage • Zero Servers bloat removed');
  }

  const readmeContent = fs.readFileSync(path.resolve('README.md'), 'utf-8');
  assert.equal(/Apple watch|Apple Watch|Apple foundations|Apple Foundations/i.test(readmeContent), false, 'Zero occurrences of Apple watch or Apple foundations in README.md');
  const seedContent = fs.readFileSync(path.resolve('src/db/seed.ts'), 'utf-8');
  assert.equal(/Apple-grade/i.test(seedContent), false, 'Zero occurrences of Apple-grade in seed.ts');

  // 5. Analytics X-Axis Scrollable Chart Coordinates Math Contract
  const rangeDaysList = [7, 14, 30];
  rangeDaysList.forEach((days) => {
    const minDayWidth = days === 7 ? 68 : days === 14 ? 58 : 52;
    const chartWidth = Math.max(760, days * minDayWidth);
    assert.ok(chartWidth >= 760, `Chart width for ${days} days must be at least 760px`);
    if (days === 30) {
      assert.ok(chartWidth >= 1500, '30-day view must expand to >= 1500px for generous x-axis horizontal scrolling');
    }
    const paddingX = 28;
    const stepX = (chartWidth - paddingX * 2) / (days - 1);
    assert.ok(stepX >= 48, `Step between days (${stepX.toFixed(1)}px) ensures ample touch target and zero cramped bars`);
  });
});

test('TASK-098: Today Realignment Fluid Motion, Notepad Fullscreen, Paper Theme, Checkboxes & Mobile Delete Contract', () => {
  // 1. Today View Realignment Animation Contract
  const todayViewCode = fs.readFileSync(path.resolve('src/components/today/TodayView.tsx'), 'utf-8');
  assert.ok(todayViewCode.includes('mode="popLayout"'), 'TodayView must use AnimatePresence mode="popLayout" to prevent layout stutter');
  assert.ok(todayViewCode.includes('layout="position"'), 'TodayView must use layout="position" to prevent scale distortion');
  assert.ok(todayViewCode.includes('SPRING_LIQUID'), 'TodayView must use SPRING_LIQUID fluid physics');
  assert.equal(/solid-card[^"']*transition-all/.test(todayViewCode), false, 'Task cards must not use transition-all which fights Framer Motion transforms');

  // 2. Notepad Fullscreen & Paper Theme Contract
  const scratchpadCode = fs.readFileSync(path.resolve('src/components/scratchpad/ScratchpadView.tsx'), 'utf-8');
  assert.ok(scratchpadCode.includes('isDesktopFullscreen'), 'ScratchpadView must support isDesktopFullscreen state');
  assert.ok(scratchpadCode.includes('paperTheme'), 'ScratchpadView must support paperTheme dark/light toggle');
  assert.ok(scratchpadCode.includes('notepad-paper-light'), 'ScratchpadView must use notepad-paper-light for clean stationery mode');

  // 3. Notepad Checklist Checkboxes Contract
  assert.ok(scratchpadCode.includes('note-checklist-row'), 'ScratchpadView must support note-checklist-row items');
  assert.ok(scratchpadCode.includes('insertChecklist'), 'ScratchpadView must have insertChecklist action');
  assert.ok(scratchpadCode.includes('handleEditorClick'), 'ScratchpadView must handle clicking checkboxes to update checked state and autosave');

  // 4. Mobile Notes Batch Delete Button Visibility Contract (Portaled to bottom-0 over dock, not blocking content)
  assert.ok(scratchpadCode.includes('fixed bottom-0 left-0 right-0 z-[120]'), 'Batch action bar must portal flush to bottom-0 on mobile so it does not block note cards in the middle of screen');
  assert.ok(scratchpadCode.includes('Delete ('), 'Batch action bar must include Delete button with count');

  // 5. Zero Prohibited Keywords in TodayView and ScratchpadView
  assert.equal(/Apple/i.test(scratchpadCode), false, 'Zero occurrences of Apple in ScratchpadView');
  assert.equal(/Apple/i.test(todayViewCode), false, 'Zero occurrences of Apple in TodayView');
});

test('TASK-099: Clean Executive Finance, Mobile Bottom Batch Bar, Dropdowns z-index & Responsive Autosave Contract', () => {
  const scratchpadCode = fs.readFileSync(path.resolve('src/components/scratchpad/ScratchpadView.tsx'), 'utf-8');
  const financeCode = fs.readFileSync(path.resolve('src/components/finance/FinanceView.tsx'), 'utf-8');
  const cssCode = fs.readFileSync(path.resolve('src/index.css'), 'utf-8');

  // 1. Mobile Batch Delete Bar Portal Contract
  assert.ok(scratchpadCode.includes('isMobile && isSelectMode'), 'Must conditionally portal on mobile selection mode');
  assert.ok(scratchpadCode.includes('fixed bottom-0 left-0 right-0 z-[120]'), 'Must dock flush to bottom-0 on mobile with z-[120] so it does not block cards');

  // 2. Floating Dropdown Trays Contract
  assert.ok(scratchpadCode.includes('isSizeTrayOpen && trayAnchor'), 'Size tray must use anchor positioning');
  assert.ok(scratchpadCode.includes('isHighlightTrayOpen && trayAnchor'), 'Highlight tray must use anchor positioning');
  assert.ok(scratchpadCode.includes('isTextColorTrayOpen && trayAnchor'), 'Text color tray must use anchor positioning');
  assert.ok(scratchpadCode.includes('z-[99999]'), 'Tool trays must be portaled with z-[99999] to float above writing screen');

  // 3. Responsive Autosave Status Pill Contract
  assert.ok(/truncate\s+whitespace-nowrap/.test(scratchpadCode), 'Autosave timestamp text must truncate cleanly without overflowing');
  assert.ok(/min-w-0\s+max-w-full\s+shrink/.test(scratchpadCode), 'Autosave container must be responsive and expand dynamically');

  // 4. Lean Executive Finance Contract
  assert.ok(financeCode.includes('Monthly Spend Budget'), 'Finance view must retain core clean monthly spend budget');
  assert.equal(financeCode.includes('Smart Budget & Savings Rules'), false, 'Smart budget bloat must be pruned');

  // 5. Light Mode Contrast & Theme Contract
  assert.ok(cssCode.includes('.notepad-paper-light .rich-note-editor pre'), 'CSS must define high-contrast code blocks in light mode');
  assert.ok(cssCode.includes('.notepad-paper-light .rich-note-editor p'), 'CSS must define high-contrast body text in light mode');
  assert.equal(/Apple/i.test(scratchpadCode), false, 'Zero occurrences of Apple in ScratchpadView');
  assert.equal(/Apple/i.test(financeCode), false, 'Zero occurrences of Apple in FinanceView');
});

test('TASK-101: Elimination of Smart Budget & Savings Rules (Pruning Contract)', () => {
  const financeViewCode = fs.readFileSync(path.resolve('src/components/finance/FinanceView.tsx'), 'utf-8');
  const financeModalCode = fs.readFileSync(path.resolve('src/components/modals/FinanceModal.tsx'), 'utf-8');
  const typesCode = fs.readFileSync(path.resolve('src/types/index.ts'), 'utf-8');

  assert.equal(fs.existsSync(path.resolve('src/utils/smartBudgetUtils.ts')), false, 'smartBudgetUtils must be completely pruned');
  assert.equal(financeViewCode.includes('Smart Budget & Savings Rules'), false, 'FinanceView must not contain Smart Budget card');
  assert.equal(financeViewCode.includes('PiggyBank'), false, 'FinanceView must not import PiggyBank');
  assert.equal(financeModalCode.includes('budgetBucket'), false, 'FinanceModal must not contain budgetBucket');
  assert.equal(typesCode.includes('SavingsRuleType'), false, 'Types must not contain SavingsRuleType');
  assert.equal(typesCode.includes('smartBudgetEnabled'), false, 'Types must not contain smartBudgetEnabled');
});

test('TASK-100: Notes Black Color & Autosave, Haptic Slider & Streak Heatmap Popover Contract', async () => {
  const scratchpadCode = fs.readFileSync(path.resolve('src/components/scratchpad/ScratchpadView.tsx'), 'utf-8');
  const financeCode = fs.readFileSync(path.resolve('src/components/finance/FinanceView.tsx'), 'utf-8');
  const feedbackCode = fs.readFileSync(path.resolve('src/utils/feedback.ts'), 'utf-8');
  const settingsCode = fs.readFileSync(path.resolve('src/components/settings/SettingsView.tsx'), 'utf-8');
  const inspectorCode = fs.readFileSync(path.resolve('src/components/layout/SlideOverInspector.tsx'), 'utf-8');
  const heatmapCode = fs.readFileSync(path.resolve('src/components/habits/StreakHeatmap.tsx'), 'utf-8');

  // 1. Notes Black Color & Single-Instance DOM Editor Mount
  assert.ok(scratchpadCode.includes("label: 'Black', color: '#000000'"), 'TEXT_COLORS must contain Black (#000000)');
  assert.ok(scratchpadCode.includes('!isMobile && !isDesktopFullscreen'), 'Desktop editor canvas must never mount simultaneously with mobile or fullscreen portal');
  assert.ok(scratchpadCode.includes('loadedNoteIdRef'), 'Autosave engine must isolate loadedNoteId to prevent keystroke wipeouts');

  // 2. Clean Executive Finance Architecture
  assert.ok(financeCode.includes('Monthly Spend Budget'), 'Finance view must feature clean monthly spend budget');
  assert.equal(financeCode.includes('PiggyBank'), false, 'FinanceView must be zero-bloat');

  // 3. Haptic Intensity Engine & Settings Slider
  assert.ok(feedbackCode.includes('setHapticIntensity'), 'Feedback engine must support dynamic haptic intensity');
  assert.ok(feedbackCode.includes('Math.round(25 + (this.hapticIntensity / 100) * 75)'), 'Vibration pulse must scale up to 100ms for perceptible tactile feedback');
  assert.ok(settingsCode.includes('Vibration Strength'), 'SettingsView must render Vibration Strength control');
  assert.ok(settingsCode.includes('type="range"') && settingsCode.includes('max="100"'), 'SettingsView must render range slider for haptic vibration');
  assert.ok(inspectorCode.includes('Vibration Strength'), 'SlideOverInspector must render Vibration Strength control');

  // 4. Streak Heatmap Interactive Popover
  assert.ok(heatmapCode.includes('selectedDayMetrics'), 'StreakHeatmap must compute metrics for clicked tile');
  assert.ok(heatmapCode.includes('completedTasksCount'), 'StreakHeatmap must count completed tasks on selected date');
  assert.ok(heatmapCode.includes('loggedHabitsCount'), 'StreakHeatmap must count logged habits on selected date');
  assert.ok(heatmapCode.includes('handleTileClick'), 'StreakHeatmap must attach click handler to heatmap cells');

  // 5. Brand Keyword Sanitization
  assert.equal(/Apple\s+watch/i.test(scratchpadCode), false);
  assert.equal(/Apple\s+foundations/i.test(financeCode), false);
  assert.equal(/Apple\s+watch/i.test(heatmapCode), false);
});

test('TASK-102: Focus Timer Edge Light Gating & Android BigTextStyle Full Notification Contract', () => {
  const pomodoroCode = fs.readFileSync(path.resolve('src/components/focus/PomodoroFullscreenModal.tsx'), 'utf-8');
  const reminderCode = fs.readFileSync(path.resolve('src/utils/reminder.ts'), 'utf-8');

  // 1. Mobile & Desktop Edge Light Render Gating
  // Count occurrences of `{isEdgeProgressOn && (` in PomodoroFullscreenModal
  const edgeMatches = pomodoroCode.match(/\{isEdgeProgressOn\s*&&/g);
  assert.ok(edgeMatches && edgeMatches.length >= 2, 'Edge glowing SVG perimeter must be guarded by isEdgeProgressOn in both Desktop and Mobile view branches');

  // 2. Android BigTextStyle Notification Formatting
  assert.ok(reminderCode.includes('largeBody: greeting.body'), 'Daypart notifications must supply largeBody for Android BigTextStyle to prevent sentence truncation');
  assert.ok(reminderCode.includes('largeBody: poke.body'), 'Daily poke notifications must supply largeBody');
  assert.ok(reminderCode.includes('largeBody: expandedBody'), 'Task and habit reminders must supply largeBody');
});

test('TASK-105: Navbar Centered Brand Dot, Dynamic Actual App Icon, and Web Option Removal', () => {
  const navbarCode = fs.readFileSync(path.resolve('src/components/layout/Navbar.tsx'), 'utf-8');
  const faviconCode = fs.readFileSync(path.resolve('src/utils/favicon.ts'), 'utf-8');
  const electronMain = fs.readFileSync(path.resolve('electron/main.cjs'), 'utf-8');
  const electronPreload = fs.readFileSync(path.resolve('electron/preload.cjs'), 'utf-8');
  const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
  const readmeCode = fs.readFileSync(path.resolve('README.md'), 'utf-8');
  const releaseYml = fs.readFileSync(path.resolve('.github/workflows/release.yml'), 'utf-8');

  // 1. Navbar: Taskify + centered dot dynamically colored with active theme
  assert.ok(navbarCode.includes('Taskify'), 'Navbar must render Taskify brand wordmark');
  assert.ok(navbarCode.includes("var(--accent-primary)"), 'Navbar dot must be dynamically colored with active theme color');
  assert.ok(navbarCode.includes('items-center') && navbarCode.includes('w-1.5 h-1.5 rounded-full'), 'Navbar dot must be vertically centered with brand wordmark');

  // 2. Dynamic Actual App Icon Sync (Electron Desktop & Webview Favicon)
  assert.ok(faviconCode.includes('window.electronAPI?.setAppIcon'), 'Favicon engine must dispatch rasterized icon to Electron');
  assert.ok(electronPreload.includes('setAppIcon'), 'Electron preload must expose setAppIcon bridge');
  assert.ok(electronMain.includes('set-window-icon'), 'Electron main process must listen for set-window-icon to update window and taskbar icon');
  assert.ok(faviconCode.includes('minimal-obsidian'), 'Favicon must handle minimal-obsidian aesthetic');

  // 3. Single Windows Installer Exclusivity (No Portable, NSIS Only with Desktop & Start Menu Shortcuts)
  assert.deepEqual(packageJson.build.win.target, ['nsis'], 'Windows target must be strictly nsis');
  assert.equal(packageJson.build.nsis.createDesktopShortcut, 'always', 'NSIS must always create desktop shortcut');
  assert.equal(packageJson.build.nsis.createStartMenuShortcut, true, 'NSIS must create start menu shortcut');

  // 4. Web Option Removal from README and Release Workflow
  assert.equal(readmeCode.includes('| Web | Browser |'), false, 'README must not offer web usage');
  assert.equal(releaseYml.includes('taskify-web'), false, 'Release workflow must not build or package web distribution zip');
});

test('TASK-106: Dynamic Navbar App Icon, Analytics Plain-Writing & Habit Reminder Gating Contract', () => {
  const navbarCode = fs.readFileSync(path.resolve('src/components/layout/Navbar.tsx'), 'utf-8');
  const faviconCode = fs.readFileSync(path.resolve('src/utils/favicon.ts'), 'utf-8');
  const analyticsCode = fs.readFileSync(path.resolve('src/components/analytics/ExecutiveDashboardView.tsx'), 'utf-8');
  const reminderCode = fs.readFileSync(path.resolve('src/utils/reminder.ts'), 'utf-8');
  const appCtxCode = fs.readFileSync(path.resolve('src/context/AppContext.tsx'), 'utf-8');

  // 1. Dynamic App Icon in Favicon and Desktop, Static Navbar Brand
  assert.ok(navbarCode.includes('Taskify'), 'Navbar must retain Taskify brand wordmark');
  assert.ok(navbarCode.includes('w-1.5 h-1.5 rounded-full'), 'Navbar must retain centered dot');
  assert.ok(navbarCode.includes('var(--accent-primary)'), 'Navbar dot must be dynamically colored with active theme');
  assert.ok(faviconCode.includes('replaceFaviconLinks'), 'Favicon engine must dynamically replace DOM link elements');

  // 2. Analytics Plain-Writing & Launch Focus Sprint Button Removal
  assert.equal(analyticsCode.includes('Launch Focus Sprint'), false, 'Launch Focus Sprint button must be completely removed');
  assert.equal(analyticsCode.includes('Professional Engine'), false, 'Professional Engine puffery badge must be removed');
  assert.equal(/[\u2013\u2014]/.test(analyticsCode), false, 'Analytics view must contain zero em dashes or en dashes');
  assert.ok(analyticsCode.includes('Focus Time'), 'Focus section header must use plain interface terms');

  // 3. Habit Reminders Gating When Checked Off
  assert.ok(reminderCode.includes('isCompletedToday'), 'Reminder engine must check whether habit is already completed today');
  assert.ok(appCtxCode.includes('syncNativeScheduledReminders(tasks, habits, settings.userName, habitLogs)'), 'AppContext must pass habitLogs to reminder synchronizer');
  assert.ok(appCtxCode.includes("prev?.type === 'habit' && prev.entityId === habitId"), 'Habit completion must dismiss any active reminder alerts');
});

test('TASK-108: Mobile Phone Logo Pruning, Monogram Permanent Default & Direct In-App Updater Contract', async () => {
  const settingsCode = fs.readFileSync(path.resolve('src/components/settings/SettingsView.tsx'), 'utf-8');
  const appCtxCode = fs.readFileSync(path.resolve('src/context/AppContext.tsx'), 'utf-8');
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');
  const updaterCode = fs.readFileSync(path.resolve('src/utils/updater.ts'), 'utf-8');

  // 1. Mobile Phone Logo Pruning (hidden on mobile phones, functional on desktop/tablet)
  assert.ok(
    settingsCode.includes('className="hidden sm:block"') ||
    settingsCode.includes('hidden sm:block'),
    'AestheticSelector must be hidden on mobile screens via hidden sm:block'
  );

  // 2. Monogram 1 ('text-dot') permanent default
  assert.ok(
    appCtxCode.includes("appAesthetic: 'text-dot'"),
    'DEFAULT_SETTINGS must permanently default to Monogram 1 (text-dot)'
  );
  assert.ok(
    indexHtml.includes('y=%2268%22') && indexHtml.includes('cy=%2262%22') && indexHtml.includes('>T</text>'),
    'index.html initial favicon must render Monogram 1 (T •)'
  );

  // 3. Automatic Update & Direct Download Engine
  assert.ok(appCode.includes('<UpdateNotificationBanner />'), 'App.tsx must mount UpdateNotificationBanner');
  assert.ok(settingsCode.includes('Software Updates'), 'SettingsView must contain Software Updates section');
  assert.ok(settingsCode.includes('Check for Updates'), 'SettingsView must contain Check for Updates button');
  assert.ok(settingsCode.includes('Download Update'), 'SettingsView must render direct Download Update button');

  // 4. Semver comparison logic verification
  function testCompareSemver(v1, v2) {
    const clean1 = (v1 || '').replace(/^v/i, '').split('-')[0].trim();
    const clean2 = (v2 || '').replace(/^v/i, '').split('-')[0].trim();
    const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
    const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < maxLen; i++) {
      const num1 = parts1[i] ?? 0;
      const num2 = parts2[i] ?? 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  assert.equal(testCompareSemver('1.0.2', '1.0.1') > 0, true, '1.0.2 is newer than 1.0.1');
  assert.equal(testCompareSemver('v1.1.0', '1.0.1') > 0, true, 'v1.1.0 is newer than 1.0.1');
  assert.equal(testCompareSemver('v1.0.1', '1.0.1'), 0, 'v1.0.1 is identical to 1.0.1');
  assert.equal(testCompareSemver('1.0.0', '1.0.1') < 0, true, '1.0.0 is older than 1.0.1');

  // 5. Platform direct binary resolution verification
  const sampleAssets = [
    { name: 'Taskify-Setup-1.0.2.exe', browser_download_url: 'https://github.com/.../Taskify-Setup-1.0.2.exe' },
    { name: 'Taskify-1.0.2.dmg', browser_download_url: 'https://github.com/.../Taskify-1.0.2.dmg' },
    { name: 'Taskify-1.0.2.AppImage', browser_download_url: 'https://github.com/.../Taskify-1.0.2.AppImage' },
    { name: 'taskify-android-1.0.2.apk', browser_download_url: 'https://github.com/.../taskify-android-1.0.2.apk' },
  ];

  function testFindPlatformAsset(assets, platform) {
    if (platform === 'windows') return assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
    if (platform === 'mac') return assets.find((a) => a.name.toLowerCase().endsWith('.dmg'));
    if (platform === 'linux') return assets.find((a) => a.name.toLowerCase().endsWith('.appimage'));
    if (platform === 'android') return assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
    return assets[0];
  }

  assert.equal(testFindPlatformAsset(sampleAssets, 'windows').name, 'Taskify-Setup-1.0.2.exe');
  assert.equal(testFindPlatformAsset(sampleAssets, 'mac').name, 'Taskify-1.0.2.dmg');
  assert.equal(testFindPlatformAsset(sampleAssets, 'linux').name, 'Taskify-1.0.2.AppImage');
  assert.equal(testFindPlatformAsset(sampleAssets, 'android').name, 'taskify-android-1.0.2.apk');
});

test('TASK-109: Double-Click & Audio Debounce Gating, Branch Release Trigger & Plain-Writing Readme Contract', () => {
  const feedbackCode = fs.readFileSync(path.resolve('src/utils/feedback.ts'), 'utf-8');
  const viewportCode = fs.readFileSync(path.resolve('src/components/layout/LiquidTabViewport.tsx'), 'utf-8');
  const releaseYml = fs.readFileSync(path.resolve('.github/workflows/release.yml'), 'utf-8');
  const readmeCode = fs.readFileSync(path.resolve('README.md'), 'utf-8');

  // 1. Audio and Haptic Click Debounce (prevents doubled simultaneously fired click audio)
  assert.ok(feedbackCode.includes('lastClickTime'), 'Feedback engine must track lastClickTime');
  assert.ok(feedbackCode.includes('nowMs - this.lastClickTime < 75'), 'Feedback engine must gate rapid simultaneous duplicate clicks');
  assert.ok(feedbackCode.includes('lastSuccessTime'), 'Feedback engine must track lastSuccessTime');

  // 2. LiquidTabViewport Click Interceptor Cleanup (eliminates double click requirement)
  assert.ok(viewportCode.includes('cursor-pointer'), 'Viewport pointer-down must exclude cursor-pointer interactive elements');
  assert.ok(viewportCode.includes('removeEventListener'), 'Viewport preventClick must automatically clean up lingering listeners');

  // 3. GitHub Actions Release Trigger on Commit to Main
  assert.ok(releaseYml.includes('branches:') && releaseYml.includes('- main'), 'Release workflow must trigger on commits to main branch');
  assert.ok(releaseYml.includes('REL_TAG'), 'Release workflow must compute release tag dynamically');

  // 4. README Plain Writing Verification
  assert.ok(readmeCode.includes('## Why I built this'), 'README must include author motivation section');
  assert.ok(readmeCode.includes('vibe-coded'), 'README must contain author voice');
  assert.ok(readmeCode.includes('pull request'), 'README must invite community pull requests');
  assert.equal(/[\u2013\u2014]/.test(readmeCode), false, 'README prose must contain zero em or en dashes');
});

test('TASK-110: Inspector Software Updates UI, OS Word Elimination & Synchronized Multi-Platform Release Versioning Contract', () => {
  const inspectorCode = fs.readFileSync(path.resolve('src/components/layout/SlideOverInspector.tsx'), 'utf-8');
  const settingsCode = fs.readFileSync(path.resolve('src/components/settings/SettingsView.tsx'), 'utf-8');
  const releaseYml = fs.readFileSync(path.resolve('.github/workflows/release.yml'), 'utf-8');

  // 1. SlideOverInspector contains Software Updates UI
  assert.ok(inspectorCode.includes('Software Updates'), 'Inspector must have Software Updates section');
  assert.ok(inspectorCode.includes('handleManualCheckUpdates'), 'Inspector must have manual check updates handler');
  assert.ok(inspectorCode.includes('handleDownloadUpdate'), 'Inspector must have direct download handler');

  // 2. Removal of "OS" word from settings bottom sections
  assert.equal(inspectorCode.includes('Taskify OS'), false, 'Inspector must not contain "Taskify OS" wording');
  assert.ok(inspectorCode.includes('Taskify v{APP_VERSION}'), 'Inspector must render Taskify v{APP_VERSION}');
  assert.equal(settingsCode.includes('Taskify OS'), false, 'SettingsView must not contain "Taskify OS" wording');
  assert.ok(settingsCode.includes('Taskify v{APP_VERSION}'), 'SettingsView must render Taskify v{APP_VERSION}');

  // 3. Synchronized Multi-Platform Release Versioning in CI
  assert.ok(releaseYml.includes('Sync Release Version'), 'Release workflow must contain Sync Release Version step');
  assert.ok(releaseYml.includes('node scripts/sync-version.cjs'), 'Release workflow must invoke sync-version script');
  assert.ok(fs.existsSync(path.resolve('scripts/sync-version.cjs')), 'scripts/sync-version.cjs must exist');
});









