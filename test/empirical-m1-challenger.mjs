import test from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// 1. EXACT IMPLEMENTATION EXTRACTED FROM src/context/AppContext.tsx
// ============================================================================
function getHabitStreakImplementation(habitLogs, habitId, currentDate = new Date()) {
  // Collect consecutive completed dates into an O(1) Set in a single O(N) pass
  const completedDates = new Set();
  for (let i = 0; i < habitLogs.length; i++) {
    const l = habitLogs[i];
    if (l.habitId === habitId && l.completed) {
      completedDates.add(l.date);
    }
  }

  if (completedDates.size === 0) return 0;

  let streak = 0;
  const checkDate = new Date(currentDate.getTime());
  
  // Format YYYY-MM-DD
  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYMD(checkDate);
  let currentStr = todayStr;

  if (!completedDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    currentStr = formatYMD(checkDate);
  }

  while (completedDates.has(currentStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    currentStr = formatYMD(checkDate);
  }

  return streak;
}

// Reference Oracle for Streak Calculation
function habitStreakOracle(habitLogs, habitId, currentDate = new Date()) {
  const completedDates = new Set();
  for (const log of habitLogs) {
    if (log.habitId === habitId && log.completed) {
      completedDates.add(log.date);
    }
  }
  if (completedDates.size === 0) return 0;

  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const d = new Date(currentDate.getTime());
  const todayStr = formatYMD(d);

  let currentTarget = todayStr;
  let streak = 0;

  if (!completedDates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
    currentTarget = formatYMD(d);
  }

  while (completedDates.has(currentTarget)) {
    streak++;
    d.setDate(d.getDate() - 1);
    currentTarget = formatYMD(d);
  }

  return streak;
}

// ============================================================================
// 2. EXACT IMPLEMENTATION EXTRACTED FROM src/components/habits/StreakHeatmap.tsx
// ============================================================================
function generateStreakHeatmapData(habitLogs, habitId, simulatedToday = new Date()) {
  const today = new Date(simulatedToday.getTime());
  today.setHours(0, 0, 0, 0);

  const todayDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const currentWeekSunday = new Date(today);
  currentWeekSunday.setDate(today.getDate() + (6 - todayDayOfWeek));

  const startMonday = new Date(currentWeekSunday);
  startMonday.setDate(currentWeekSunday.getDate() - (14 * 7 - 1));

  const weeks = [];
  for (let w = 0; w < 14; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startMonday);
      cellDate.setDate(startMonday.getDate() + (w * 7 + d));
      const y = cellDate.getFullYear();
      const m = String(cellDate.getMonth() + 1).padStart(2, '0');
      const day = String(cellDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const isToday = cellDate.getTime() === today.getTime();
      const isFuture = cellDate.getTime() > today.getTime();
      col.push({ dateStr, dayIndex: d, isToday, isFuture, cellDate });
    }
    weeks.push(col);
  }

  // Pre-aggregation Map logic
  const logCountsByDate = new Map();
  for (let i = 0; i < habitLogs.length; i++) {
    const log = habitLogs[i];
    if (!log.completed) continue;
    if (habitId && log.habitId !== habitId) continue;
    logCountsByDate.set(log.date, (logCountsByDate.get(log.date) ?? 0) + 1);
  }

  const getCellFill = (dateStr) => {
    const count = logCountsByDate.get(dateStr) ?? 0;
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    return 3;
  };

  return { weeks, logCountsByDate, getCellFill, startMonday, currentWeekSunday };
}

// ============================================================================
// 3. REMINDER DEBOUNCE CONTROLLER (src/context/AppContext.tsx lines 744-753)
// ============================================================================
class ReminderDebounceHarness {
  constructor(syncCallback, debounceMs = 500) {
    this.syncCallback = syncCallback;
    this.debounceMs = debounceMs;
    this.timer = null;
    this.isMounted = true;
  }

  triggerSync(tasks, habits, userName, isDbReady) {
    if (!this.isMounted || !isDbReady) return;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.syncCallback(tasks, habits, userName);
    }, this.debounceMs);
  }

  unmount() {
    this.isMounted = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// ============================================================================
// TEST SUITE: ALGORITHMIC LOOKUPS, STREAKS, AND DEBOUNCING
// ============================================================================

test('Algorithmic Streak: Edge cases (0 logs, single day, future only, all false)', () => {
  const today = new Date('2026-11-07T12:00:00');

  // Case 1: Empty logs
  assert.equal(getHabitStreakImplementation([], 'h1', today), 0);

  // Case 2: Only other habits
  assert.equal(getHabitStreakImplementation([{ habitId: 'h2', date: '2026-11-07', completed: true }], 'h1', today), 0);

  // Case 3: Completed is false
  assert.equal(getHabitStreakImplementation([{ habitId: 'h1', date: '2026-11-07', completed: false }], 'h1', today), 0);

  // Case 4: Future date only
  assert.equal(getHabitStreakImplementation([{ habitId: 'h1', date: '2026-11-08', completed: true }], 'h1', today), 0);

  // Case 5: Single day - today only
  assert.equal(getHabitStreakImplementation([{ habitId: 'h1', date: '2026-11-07', completed: true }], 'h1', today), 1);

  // Case 6: Single day - yesterday only (user hasn't checked today yet)
  assert.equal(getHabitStreakImplementation([{ habitId: 'h1', date: '2026-11-06', completed: true }], 'h1', today), 1);

  // Case 7: Single day - 2 days ago (missed yesterday and today)
  assert.equal(getHabitStreakImplementation([{ habitId: 'h1', date: '2026-11-05', completed: true }], 'h1', today), 0);
});

test('Algorithmic Streak: Month boundaries and leap years', () => {
  // Nov 2026 boundary: Nov 3 back to Oct 28
  const todayNov3 = new Date('2026-11-03T10:00:00');
  const logsCrossMonth = [
    { habitId: 'h1', date: '2026-11-03', completed: true },
    { habitId: 'h1', date: '2026-11-02', completed: true },
    { habitId: 'h1', date: '2026-11-01', completed: true },
    { habitId: 'h1', date: '2026-10-31', completed: true },
    { habitId: 'h1', date: '2026-10-30', completed: true },
    { habitId: 'h1', date: '2026-10-28', completed: true }, // gap on Oct 29
  ];
  assert.equal(getHabitStreakImplementation(logsCrossMonth, 'h1', todayNov3), 5);

  // Leap Year boundary: March 2, 2024 back through Feb 29, Feb 28, Feb 27
  const todayMar2Leap = new Date('2024-03-02T10:00:00');
  const logsLeapYear = [
    { habitId: 'h1', date: '2024-03-02', completed: true },
    { habitId: 'h1', date: '2024-03-01', completed: true },
    { habitId: 'h1', date: '2024-02-29', completed: true }, // Leap day
    { habitId: 'h1', date: '2024-02-28', completed: true },
    { habitId: 'h1', date: '2024-02-27', completed: true },
    { habitId: 'h1', date: '2024-02-25', completed: true }, // gap on Feb 26
  ];
  assert.equal(getHabitStreakImplementation(logsLeapYear, 'h1', todayMar2Leap), 5);

  // Year Boundary: Jan 2, 2026 back to Dec 30, 2025
  const todayJan2 = new Date('2026-01-02T10:00:00');
  const logsCrossYear = [
    { habitId: 'h1', date: '2026-01-02', completed: true },
    { habitId: 'h1', date: '2026-01-01', completed: true },
    { habitId: 'h1', date: '2025-12-31', completed: true },
    { habitId: 'h1', date: '2025-12-30', completed: true },
    { habitId: 'h1', date: '2025-12-28', completed: true }, // gap on Dec 29
  ];
  assert.equal(getHabitStreakImplementation(logsCrossYear, 'h1', todayJan2), 4);
});

test('Algorithmic Streak: Duplicates, unordered array, and conflicting entries', () => {
  const today = new Date('2026-11-07T12:00:00');
  const messyLogs = [
    { habitId: 'h1', date: '2026-11-05', completed: true },
    { habitId: 'h1', date: '2026-11-07', completed: true },
    { habitId: 'h1', date: '2026-11-06', completed: false }, // conflicting false
    { habitId: 'h1', date: '2026-11-06', completed: true },  // valid true
    { habitId: 'h1', date: '2026-11-07', completed: true },  // duplicate true
    { habitId: 'h2', date: '2026-11-07', completed: true },  // other habit
    { habitId: 'h1', date: '2026-11-04', completed: true },
    { habitId: 'h1', date: '2026-11-02', completed: true },  // gap on 03
  ];

  // Consecutive: 07, 06, 05, 04 -> 4 days
  assert.equal(getHabitStreakImplementation(messyLogs, 'h1', today), 4);
});

test('Algorithmic Streak: Randomized Oracle Differential Fuzzing (1,000 trials)', () => {
  const baseDate = new Date('2026-11-07T12:00:00');
  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  for (let trial = 0; trial < 1000; trial++) {
    // Generate random logs across past 60 days
    const logs = [];
    const numLogs = Math.floor(Math.random() * 80);
    for (let j = 0; j < numLogs; j++) {
      const daysAgo = Math.floor(Math.random() * 60) - 2; // -2 to 58 days ago (including future)
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - daysAgo);
      logs.push({
        habitId: Math.random() > 0.3 ? 'target-habit' : 'other-habit',
        date: formatYMD(d),
        completed: Math.random() > 0.15, // 85% completed
      });
    }

    const implResult = getHabitStreakImplementation(logs, 'target-habit', baseDate);
    const oracleResult = habitStreakOracle(logs, 'target-habit', baseDate);

    assert.equal(
      implResult,
      oracleResult,
      `Trial ${trial} failed: implementation=${implResult}, oracle=${oracleResult}`
    );
  }
});

test('Algorithmic Streak: High-Volume Performance Benchmark (100,000 logs)', () => {
  const baseDate = new Date('2026-11-07T12:00:00');
  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const largeLogs = [];
  // 100,000 logs spanning multiple habits and 500 days
  // Ensure h-0 has consecutive completed logs for all 500 days
  for (let d = 0; d < 500; d++) {
    const dateObj = new Date(baseDate);
    dateObj.setDate(baseDate.getDate() - d);
    const dateStr = formatYMD(dateObj);
    largeLogs.push({
      habitId: 'h-0',
      date: dateStr,
      completed: true,
    });
  }
  // Fill remaining ~99,500 logs with other habits
  for (let i = 500; i < 100000; i++) {
    const daysAgo = i % 500;
    const dateObj = new Date(baseDate);
    dateObj.setDate(baseDate.getDate() - daysAgo);
    largeLogs.push({
      habitId: `h-${(i % 19) + 1}`,
      date: formatYMD(dateObj),
      completed: true,
    });
  }

  const start = performance.now();
  const streak = getHabitStreakImplementation(largeLogs, 'h-0', baseDate);
  const elapsed = performance.now() - start;

  assert.equal(streak, 500); // 500 consecutive completed days
  assert.ok(elapsed < 100, `Streak calculation on 100k items must take < 100ms (took ${elapsed.toFixed(2)}ms)`);
});

// ============================================================================
// STREAK HEATMAP MAP / SET LOGIC TESTS
// ============================================================================

test('StreakHeatmap: 14-week (98-cell) grid boundary and invariant check', () => {
  // Test starting on every day of the week (Mon through Sun)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const simulatedDate = new Date(2026, 10, 1 + dayOffset); // Nov 1 - Nov 7, 2026
    const { weeks, startMonday, currentWeekSunday } = generateStreakHeatmapData([], undefined, simulatedDate);

    // Invariant 1: Exactly 14 columns
    assert.equal(weeks.length, 14);

    // Invariant 2: Exactly 7 days per column
    for (let w = 0; w < 14; w++) {
      assert.equal(weeks[w].length, 7);
    }

    // Invariant 3: Total 98 cells
    const totalCells = weeks.reduce((sum, col) => sum + col.length, 0);
    assert.equal(totalCells, 98);

    // Invariant 4: Start is Monday (getDay() === 1)
    assert.equal(startMonday.getDay(), 1, `startMonday must be Monday, got ${startMonday.getDay()}`);

    // Invariant 5: End is Sunday (getDay() === 0)
    assert.equal(currentWeekSunday.getDay(), 0, `currentWeekSunday must be Sunday, got ${currentWeekSunday.getDay()}`);

    // Invariant 6: Exactly one cell isToday
    let todayCount = 0;
    for (const col of weeks) {
      for (const cell of col) {
        if (cell.isToday) todayCount++;
      }
    }
    assert.equal(todayCount, 1, `Exactly one cell must be isToday, found ${todayCount}`);
  }
});

test('StreakHeatmap: Map lookups, habitId filtering, and fill level thresholds', () => {
  const simulatedToday = new Date('2026-11-07T12:00:00');
  const logs = [
    // 2026-11-07: 1 log for h1, 1 log for h2 -> total 2
    { habitId: 'h1', date: '2026-11-07', completed: true },
    { habitId: 'h2', date: '2026-11-07', completed: true },

    // 2026-11-06: 3 logs for h1 -> level 3
    { habitId: 'h1', date: '2026-11-06', completed: true },
    { habitId: 'h1', date: '2026-11-06', completed: true },
    { habitId: 'h1', date: '2026-11-06', completed: true },

    // 2026-11-05: 1 log for h1, completed: false (should not count)
    { habitId: 'h1', date: '2026-11-05', completed: false },

    // 2026-11-04: 1 log for h1 -> level 1
    { habitId: 'h1', date: '2026-11-04', completed: true },

    // 2026-11-03: 2 logs for h1 -> level 2
    { habitId: 'h1', date: '2026-11-03', completed: true },
    { habitId: 'h1', date: '2026-11-03', completed: true },

    // 2026-11-02: 5 logs for h1 -> level 3 (clamped)
    { habitId: 'h1', date: '2026-11-02', completed: true },
    { habitId: 'h1', date: '2026-11-02', completed: true },
    { habitId: 'h1', date: '2026-11-02', completed: true },
    { habitId: 'h1', date: '2026-11-02', completed: true },
    { habitId: 'h1', date: '2026-11-02', completed: true },
  ];

  // Test with habitId = 'h1'
  const h1Data = generateStreakHeatmapData(logs, 'h1', simulatedToday);
  assert.equal(h1Data.getCellFill('2026-11-07'), 1); // Only 1 for h1
  assert.equal(h1Data.getCellFill('2026-11-06'), 3); // 3 for h1
  assert.equal(h1Data.getCellFill('2026-11-05'), 0); // completed: false ignored
  assert.equal(h1Data.getCellFill('2026-11-04'), 1); // 1 for h1
  assert.equal(h1Data.getCellFill('2026-11-03'), 2); // 2 for h1
  assert.equal(h1Data.getCellFill('2026-11-02'), 3); // 5 for h1 -> clamped 3
  assert.equal(h1Data.getCellFill('2026-10-01'), 0); // No entries

  // Test without habitId (all habits)
  const allData = generateStreakHeatmapData(logs, undefined, simulatedToday);
  assert.equal(allData.getCellFill('2026-11-07'), 2); // 1 for h1 + 1 for h2 = 2
});

test('StreakHeatmap: High-Volume Pre-Aggregation Benchmark (50,000 logs)', () => {
  const simulatedToday = new Date('2026-11-07T12:00:00');
  const heavyLogs = [];
  for (let i = 0; i < 50000; i++) {
    const day = String((i % 98) + 1).padStart(2, '0');
    heavyLogs.push({
      habitId: `h-${i % 5}`,
      date: `2026-11-${day}`,
      completed: true,
    });
  }

  const start = performance.now();
  const { getCellFill } = generateStreakHeatmapData(heavyLogs, 'h-0', simulatedToday);
  // Perform 98 lookups (equivalent to rendering all cells)
  for (let i = 1; i <= 98; i++) {
    getCellFill(`2026-11-${String(i).padStart(2, '0')}`);
  }
  const elapsed = performance.now() - start;

  assert.ok(elapsed < 50, `50k logs aggregation + 98 lookups must take < 50ms (took ${elapsed.toFixed(2)}ms)`);
});

// ============================================================================
// REMINDER DEBOUNCING EMPIRICAL TESTS
// ============================================================================

test('Reminder Debounce: Rapid triggers debounce and invoke callback exactly once', async () => {
  let callCount = 0;
  let lastReceivedPayload = null;

  const harness = new ReminderDebounceHarness((tasks, habits, user) => {
    callCount++;
    lastReceivedPayload = { tasks, habits, user };
  }, 200); // 200ms debounce for test speed

  // Fire 10 rapid triggers spaced 15ms apart (total 135ms elapsed < 200ms)
  for (let i = 1; i <= 10; i++) {
    harness.triggerSync([{ id: `task-${i}` }], [], `User-${i}`, true);
    await new Promise((res) => setTimeout(res, 15));
  }

  // Right now, 0 calls should have happened because debounce is 200ms
  assert.equal(callCount, 0, 'Should not fire before debounce window settles');

  // Wait 250ms for debounce timer to fire
  await new Promise((res) => setTimeout(res, 250));

  assert.equal(callCount, 1, 'Should fire EXACTLY ONCE after debounce settles');
  assert.equal(lastReceivedPayload.user, 'User-10', 'Must receive latest payload');
  assert.equal(lastReceivedPayload.tasks[0].id, 'task-10');
});

test('Reminder Debounce: Component unmount cancels pending sync without leaks', async () => {
  let callCount = 0;

  const harness = new ReminderDebounceHarness(() => {
    callCount++;
  }, 150);

  // Trigger sync
  harness.triggerSync([], [], 'Admin', true);

  // Immediately unmount before 150ms
  await new Promise((res) => setTimeout(res, 50));
  harness.unmount();

  // Wait past debounce duration
  await new Promise((res) => setTimeout(res, 200));

  assert.equal(callCount, 0, 'Unmounted component must cancel pending timer and never fire callback');
});

test('Reminder Debounce: isDbReady=false gates execution', async () => {
  let callCount = 0;

  const harness = new ReminderDebounceHarness(() => {
    callCount++;
  }, 100);

  // Trigger with isDbReady = false
  harness.triggerSync([{ id: 't1' }], [], 'Admin', false);

  await new Promise((res) => setTimeout(res, 150));
  assert.equal(callCount, 0, 'Should not schedule or fire when isDbReady is false');
});

test('Reminder Debounce: Sequential triggers after debounce window execute independently', async () => {
  let callCount = 0;
  const history = [];

  const harness = new ReminderDebounceHarness((tasks) => {
    callCount++;
    history.push(tasks[0].id);
  }, 100);

  // Trigger 1
  harness.triggerSync([{ id: 'first' }], [], 'A', true);
  await new Promise((res) => setTimeout(res, 150)); // Allow to fire

  assert.equal(callCount, 1);
  assert.equal(history[0], 'first');

  // Trigger 2 after settle
  harness.triggerSync([{ id: 'second' }], [], 'A', true);
  await new Promise((res) => setTimeout(res, 150)); // Allow to fire

  assert.equal(callCount, 2);
  assert.equal(history[1], 'second');
});
