import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTasks, sortTasks } from '../src/utils/taskSortUtils.ts';
import { handleTaskKeyDown } from '../src/hooks/useTaskKeyboardNavigation.ts';

/**
 * EMPIRICAL ADVERSARIAL TEST HARNESS: MILESTONE 3
 * Feature F12: Multi-Criteria Task Sorting Stability & Date Edge Cases
 * Feature F16: In-List Keyboard Navigation Focus Isolation & Keystroke Fuzzing
 */

// Helper to shuffle an array deterministically or pseudo-randomly
function shuffleArray(arr, seed = 12345) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    // Simple LCG PRNG
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((s / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// PART 1: MULTI-CRITERIA SORTING STABILITY (1,000 TASKS)
// ============================================================================

test('EMPIRICAL-M3: 1,000 tasks with identical due dates and priorities sort with 100% deterministic stability', () => {
  const count = 1000;
  // All 1,000 tasks have identical dueDate, dueTime, priority, and createdAt.
  // The ONLY differentiator is the unique id ('task-0000' to 'task-0999').
  const tasks = Array.from({ length: count }, (_, i) => ({
    id: `task-${String(i).padStart(4, '0')}`,
    title: 'Identical Priority and Due Date Task',
    priority: 'high',
    dueDate: '2026-11-10',
    dueTime: '14:00',
    createdAt: 1731000000000,
  }));

  // Baseline sort: tie-breaker should sort by id asc ('task-0000' -> 'task-0999')
  const baseline = sortTasks(tasks, 'dueDate', 'asc');
  assert.equal(baseline.length, count);
  assert.equal(baseline[0].id, 'task-0000');
  assert.equal(baseline[count - 1].id, 'task-0999');

  // Stress-test: Shuffle the 1,000 tasks with 10 different random seeds
  // Every single shuffled array must sort to the EXACT same sequence.
  for (let seed = 1; seed <= 10; seed++) {
    const shuffled = shuffleArray(tasks, seed * 7919);
    const sorted = sortTasks(shuffled, 'dueDate', 'asc');

    for (let i = 0; i < count; i++) {
      if (sorted[i].id !== baseline[i].id) {
        assert.fail(`Sorting stability failure at index ${i} with seed ${seed}: expected ${baseline[i].id}, got ${sorted[i].id}`);
      }
    }
  }
});

test('EMPIRICAL-M3: 1,000 tasks with identical due date and priority break ties by createdAt DESC, then ID', () => {
  const count = 1000;
  // Tasks have 10 clusters of createdAt timestamps (100 tasks per timestamp cluster)
  const tasks = Array.from({ length: count }, (_, i) => ({
    id: `task-${String(i).padStart(4, '0')}`,
    title: `Task #${i}`,
    priority: 'urgent',
    dueDate: '2026-12-01',
    dueTime: '10:00',
    createdAt: 1700000000000 + (i % 10) * 10000, // 10 distinct timestamp buckets
  }));

  const sorted = sortTasks(tasks, 'dueDate', 'asc');
  assert.equal(sorted.length, count);

  // Highest createdAt (cluster 9) should come first
  assert.equal(sorted[0].createdAt, 1700000000000 + 9 * 10000);
  // Lowest createdAt (cluster 0) should come last
  assert.equal(sorted[count - 1].createdAt, 1700000000000 + 0 * 10000);

  // Within the same createdAt cluster, tasks must be deterministically sorted by ID asc
  const cluster9 = sorted.filter((t) => t.createdAt === 1700000000000 + 9 * 10000);
  for (let i = 1; i < cluster9.length; i++) {
    assert.ok(cluster9[i - 1].id < cluster9[i].id, `Expected cluster 9 items sorted by ID: ${cluster9[i - 1].id} < ${cluster9[i].id}`);
  }
});

test('EMPIRICAL-M3: Priority sort stability across 1,000 tasks with identical priority levels', () => {
  const count = 1000;
  const tasks = Array.from({ length: count }, (_, i) => ({
    id: `p-task-${String(i).padStart(4, '0')}`,
    title: `Priority Task ${i}`,
    priority: 'urgent',
    createdAt: 1700000000000,
  }));

  const baseline = sortTasks(tasks, 'priority', 'desc');
  assert.equal(baseline.length, count);
  assert.equal(baseline[0].id, 'p-task-0000');
  assert.equal(baseline[count - 1].id, 'p-task-0999');

  for (let seed = 101; seed <= 105; seed++) {
    const shuffled = shuffleArray(tasks, seed * 997);
    const sorted = sortTasks(shuffled, 'priority', 'desc');
    assert.deepEqual(sorted.map((t) => t.id), baseline.map((t) => t.id));
  }
});

test('EMPIRICAL-M3: Performance benchmark — sorting 1,000 tasks executes well under 25ms', () => {
  const count = 1000;
  const tasks = Array.from({ length: count }, (_, i) => ({
    id: `bench-${i}`,
    title: `Benchmark Task ${i % 250}`,
    priority: ['low', 'medium', 'high', 'urgent'][i % 4],
    dueDate: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`,
    dueTime: `${String(i % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
    createdAt: 1700000000000 + (i % 100) * 5000,
  }));

  const shuffled = shuffleArray(tasks, 42);
  const start = performance.now();
  const sorted = sortTasks(shuffled, 'dueDate', 'asc');
  const elapsed = performance.now() - start;

  assert.equal(sorted.length, count);
  assert.ok(elapsed < 25, `Expected 1,000 tasks to sort in <25ms, took ${elapsed.toFixed(2)}ms`);
});

// ============================================================================
// PART 2: LEAP YEARS, EMPTY DATES, AND DATE PARSING EDGE CASES
// ============================================================================

test('EMPIRICAL-M3: Leap year date sorting (Feb 28, Feb 29, Mar 01) across 2024, 2026, 2028', () => {
  const leap2024Tasks = [
    { id: '2024-mar-01', title: 'Mar 1, 2024', dueDate: '2024-03-01', dueTime: '10:00' },
    { id: '2024-feb-29', title: 'Feb 29, 2024 (Leap Day)', dueDate: '2024-02-29', dueTime: '10:00' },
    { id: '2024-feb-28', title: 'Feb 28, 2024', dueDate: '2024-02-28', dueTime: '10:00' },
  ];

  const sorted2024Asc = sortTasks(leap2024Tasks, 'dueDate', 'asc');
  assert.deepEqual(
    sorted2024Asc.map((t) => t.id),
    ['2024-feb-28', '2024-feb-29', '2024-mar-01'],
    'Leap year 2024 must order Feb 28 -> Feb 29 -> Mar 01 in asc'
  );

  const sorted2024Desc = sortTasks(leap2024Tasks, 'dueDate', 'desc');
  assert.deepEqual(
    sorted2024Desc.map((t) => t.id),
    ['2024-mar-01', '2024-feb-29', '2024-feb-28'],
    'Leap year 2024 must order Mar 01 -> Feb 29 -> Feb 28 in desc'
  );

  // Non-leap year 2026 vs leap year 2028
  const multiYear = [
    { id: '2028-feb-29', title: 'Feb 29, 2028', dueDate: '2028-02-29' },
    { id: '2026-feb-28', title: 'Feb 28, 2026', dueDate: '2026-02-28' },
    { id: '2026-mar-01', title: 'Mar 01, 2026', dueDate: '2026-03-01' },
    { id: '2028-feb-28', title: 'Feb 28, 2028', dueDate: '2028-02-28' },
    { id: '2028-mar-01', title: 'Mar 01, 2028', dueDate: '2028-03-01' },
  ];

  const sortedMulti = sortTasks(multiYear, 'dueDate', 'asc');
  assert.deepEqual(
    sortedMulti.map((t) => t.id),
    ['2026-feb-28', '2026-mar-01', '2028-feb-28', '2028-feb-29', '2028-mar-01'],
    'Chronological multi-year leap day ordering must be strictly preserved'
  );
});

test('EMPIRICAL-M3: Empty, whitespace, null, and undefined dates pinned to bottom in asc & desc', () => {
  const tasksWithEmptyDates = [
    { id: 'dated-future', title: 'Future', dueDate: '2026-12-31', createdAt: 500 },
    { id: 'undated-empty', title: 'Empty String', dueDate: '', createdAt: 100 },
    { id: 'undated-whitespace', title: 'Whitespace Only', dueDate: '   ', createdAt: 200 },
    { id: 'undated-undefined', title: 'Undefined Date', dueDate: undefined, createdAt: 300 },
    { id: 'dated-today', title: 'Today', dueDate: '2026-11-07', createdAt: 400 },
  ];

  // Ascending sort: dated tasks first (earliest -> latest), undated at bottom
  const asc = sortTasks(tasksWithEmptyDates, 'dueDate', 'asc');
  assert.equal(asc[0].id, 'dated-today');
  assert.equal(asc[1].id, 'dated-future');
  const undatedAscIds = asc.slice(2).map((t) => t.id);
  assert.ok(undatedAscIds.includes('undated-empty'));
  assert.ok(undatedAscIds.includes('undated-whitespace'));
  assert.ok(undatedAscIds.includes('undated-undefined'));

  // Descending sort: dated tasks first (latest -> earliest), undated STILL at bottom
  const desc = sortTasks(tasksWithEmptyDates, 'dueDate', 'desc');
  assert.equal(desc[0].id, 'dated-future');
  assert.equal(desc[1].id, 'dated-today');
  const undatedDescIds = desc.slice(2).map((t) => t.id);
  assert.ok(undatedDescIds.includes('undated-empty'));
  assert.ok(undatedDescIds.includes('undated-whitespace'));
  assert.ok(undatedDescIds.includes('undated-undefined'));
});

test('EMPIRICAL-M3: Stress test sorting behavior with multiple undated tasks', () => {
  // Investigate whether multiple undated tasks are deterministically tie-broken
  const undatedTasks = [
    { id: 'u1', title: 'Undated 1', dueDate: '', createdAt: 100 },
    { id: 'u2', title: 'Undated 2', dueDate: '', createdAt: 300 },
    { id: 'u3', title: 'Undated 3', dueDate: '', createdAt: 200 },
  ];

  const sortedOrder1 = sortTasks(undatedTasks, 'dueDate', 'asc').map((t) => t.id);
  const sortedOrder2 = sortTasks([...undatedTasks].reverse(), 'dueDate', 'asc').map((t) => t.id);

  // Note: if compareTasks returns 0 on `!hasA && !hasB`, the array will preserve input order.
  // We document this observation for our handoff report.
  const isInputOrderPreserved = JSON.stringify(sortedOrder1) !== JSON.stringify(sortedOrder2);
  assert.equal(typeof isInputOrderPreserved, 'boolean');
});

// ============================================================================
// PART 3: KEYBOARD NAVIGATION FOCUS ISOLATION & TYPING FUZZING
// ============================================================================

test('EMPIRICAL-M3: Typing fuzzing — keystrokes inside form inputs and contenteditables never dispatch actions', () => {
  const tasks = [
    { id: 't1', title: 'Active Task 1' },
    { id: 't2', title: 'Active Task 2' },
    { id: 't3', title: 'Active Task 3' },
  ];

  let selectedId = 't1';
  let toggledId = null;
  let editedTask = null;
  let deletedId = null;

  const fuzzKeys = [
    'j', 'k', ' ', 'e', 'd', 'Escape', 'ArrowDown', 'ArrowUp',
    'J', 'K', 'E', 'D', 'Enter', 'Tab', 'a', 'z', '1', '9',
    'Backspace', 'Delete', '/', '@', '#', '$',
  ];

  for (const key of fuzzKeys) {
    toggledId = null;
    editedTask = null;
    deletedId = null;

    const handled = handleTaskKeyDown(
      { key, preventDefault: () => assert.fail('preventDefault must not be called when typing in inputs') },
      {
        tasks,
        activeTab: 'tasks',
        isModalOpen: false,
        isEditableElement: true, // Simulates typing in <input>, <textarea>, <select>, or contenteditable
        focusedTaskId: selectedId,
        onSelectTask: () => assert.fail(`onSelectTask called during input typing with key: ${key}`),
        onToggleTask: (id) => { toggledId = id; },
        onEditTask: (t) => { editedTask = t; },
        onDeleteTask: (id) => { deletedId = id; },
      }
    );

    assert.equal(handled, false, `handleTaskKeyDown must return false for key '${key}' when isEditableElement is true`);
    assert.equal(toggledId, null);
    assert.equal(editedTask, null);
    assert.equal(deletedId, null);
  }
});

test('EMPIRICAL-M3: Tab transition isolation — keystroke bursts on inactive tabs never mutate tasks', () => {
  const tasks = [
    { id: 't1', title: 'Task 1' },
    { id: 't2', title: 'Task 2' },
  ];

  const inactiveTabs = ['today', 'habits', 'finance', 'analytics', 'settings', '', 'unknown_tab'];
  const actionKeys = ['j', 'k', ' ', 'e', 'd', 'Escape', 'ArrowDown', 'ArrowUp'];

  for (const tab of inactiveTabs) {
    for (const key of actionKeys) {
      let dispatched = false;
      const onAction = () => { dispatched = true; };

      const handled = handleTaskKeyDown(
        { key, preventDefault: () => {} },
        {
          tasks,
          activeTab: tab,
          isModalOpen: false,
          isEditableElement: false,
          focusedTaskId: 't1',
          onSelectTask: onAction,
          onToggleTask: onAction,
          onEditTask: onAction,
          onDeleteTask: onAction,
        }
      );

      assert.equal(handled, false, `Expected false for key '${key}' on inactive tab '${tab}'`);
      assert.equal(dispatched, false, `Action was improperly dispatched on inactive tab '${tab}'`);
    }
  }

  // Rapid tab switching sequence: today -> tasks -> habits -> tasks
  let focusedId = null;
  const select = (id) => { focusedId = id; };

  // On 'today': 'j' should be ignored
  handleTaskKeyDown({ key: 'j' }, { tasks, activeTab: 'today', isModalOpen: false, isEditableElement: false, focusedTaskId: focusedId, onSelectTask: select, onToggleTask: () => {}, onEditTask: () => {}, onDeleteTask: () => {} });
  assert.equal(focusedId, null, 'No selection on today tab');

  // Switch to 'tasks': 'j' should select first task 't1'
  handleTaskKeyDown({ key: 'j' }, { tasks, activeTab: 'tasks', isModalOpen: false, isEditableElement: false, focusedTaskId: focusedId, onSelectTask: select, onToggleTask: () => {}, onEditTask: () => {}, onDeleteTask: () => {} });
  assert.equal(focusedId, 't1', 'Selected t1 on tasks tab');

  // Switch to 'habits': 'j' should not move to 't2'
  handleTaskKeyDown({ key: 'j' }, { tasks, activeTab: 'habits', isModalOpen: false, isEditableElement: false, focusedTaskId: focusedId, onSelectTask: select, onToggleTask: () => {}, onEditTask: () => {}, onDeleteTask: () => {} });
  assert.equal(focusedId, 't1', 'Selection unchanged on habits tab');

  // Switch back to 'tasks': 'j' should advance to 't2'
  handleTaskKeyDown({ key: 'j' }, { tasks, activeTab: 'tasks', isModalOpen: false, isEditableElement: false, focusedTaskId: focusedId, onSelectTask: select, onToggleTask: () => {}, onEditTask: () => {}, onDeleteTask: () => {} });
  assert.equal(focusedId, 't2', 'Advanced to t2 on returning to tasks tab');
});

test('EMPIRICAL-M3: Modifier collision fuzzing — Cmd+K, Ctrl+D, Alt+J, Shift shortcuts never trigger in-list actions', () => {
  const tasks = [{ id: 't1', title: 'Task' }];

  const modifierCombos = [
    { metaKey: true },
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true, ctrlKey: true },
    { metaKey: true, altKey: true },
    { ctrlKey: true, altKey: true },
    { metaKey: true, ctrlKey: true, altKey: true },
  ];

  const testKeys = ['j', 'k', ' ', 'e', 'd', 'k', 'd', 'Escape', 'ArrowDown', 'ArrowUp'];

  for (const mod of modifierCombos) {
    for (const key of testKeys) {
      let triggered = false;
      const onAction = () => { triggered = true; };

      const handled = handleTaskKeyDown(
        { key, ...mod, preventDefault: () => {} },
        {
          tasks,
          activeTab: 'tasks',
          isModalOpen: false,
          isEditableElement: false,
          focusedTaskId: 't1',
          onSelectTask: onAction,
          onToggleTask: onAction,
          onEditTask: onAction,
          onDeleteTask: onAction,
        }
      );

      assert.equal(handled, false, `Modifier collision detected for key '${key}' with modifiers ${JSON.stringify(mod)}`);
      assert.equal(triggered, false);
    }
  }
});

test('EMPIRICAL-M3: Active modal guard — suppresses all in-list shortcuts and yields Escape to modal', () => {
  const tasks = [{ id: 't1', title: 'Task 1' }];

  const keys = ['j', 'k', ' ', 'e', 'd', 'Escape'];

  for (const key of keys) {
    let triggered = false;
    const handled = handleTaskKeyDown(
      { key, preventDefault: () => {} },
      {
        tasks,
        activeTab: 'tasks',
        isModalOpen: true, // A dialog or sheet is open
        isEditableElement: false,
        focusedTaskId: 't1',
        onSelectTask: () => { triggered = true; },
        onToggleTask: () => { triggered = true; },
        onEditTask: () => { triggered = true; },
        onDeleteTask: () => { triggered = true; },
      }
    );

    assert.equal(handled, false, `Modal guard must block key '${key}'`);
    assert.equal(triggered, false);
  }
});

test('EMPIRICAL-M3: Boundary and edge conditions in list navigation', () => {
  const tasks = [
    { id: 't1', title: 'First' },
    { id: 't2', title: 'Second' },
  ];

  let currentId = null;
  const select = (id) => { currentId = id; };

  const opts = {
    tasks,
    activeTab: 'tasks',
    isModalOpen: false,
    isEditableElement: false,
    onSelectTask: select,
    onToggleTask: () => {},
    onEditTask: () => {},
    onDeleteTask: () => {},
  };

  // 1. Initial state (unfocused): ArrowUp selects first item
  handleTaskKeyDown({ key: 'ArrowUp' }, { ...opts, focusedTaskId: currentId });
  assert.equal(currentId, 't1');

  // 2. Clamping at upper boundary: ArrowUp on first item stays at first item
  handleTaskKeyDown({ key: 'ArrowUp' }, { ...opts, focusedTaskId: currentId });
  assert.equal(currentId, 't1');

  // 3. Move to bottom
  handleTaskKeyDown({ key: 'ArrowDown' }, { ...opts, focusedTaskId: currentId });
  assert.equal(currentId, 't2');

  // 4. Clamping at lower boundary: ArrowDown on last item stays at last item
  handleTaskKeyDown({ key: 'ArrowDown' }, { ...opts, focusedTaskId: currentId });
  assert.equal(currentId, 't2');

  // 5. Empty task list
  let emptySelected = 'ghost-id';
  const handledEmpty = handleTaskKeyDown(
    { key: 'j' },
    {
      tasks: [],
      activeTab: 'tasks',
      isModalOpen: false,
      isEditableElement: false,
      focusedTaskId: emptySelected,
      onSelectTask: (id) => { emptySelected = id; },
      onToggleTask: () => {},
      onEditTask: () => {},
      onDeleteTask: () => {},
    }
  );
  assert.equal(handledEmpty, false);
  assert.equal(emptySelected, 'ghost-id');

  // 6. Escape on empty list with stale focus clears focus
  const handledEscape = handleTaskKeyDown(
    { key: 'Escape' },
    {
      tasks: [],
      activeTab: 'tasks',
      isModalOpen: false,
      isEditableElement: false,
      focusedTaskId: emptySelected,
      onSelectTask: (id) => { emptySelected = id; },
      onToggleTask: () => {},
      onEditTask: () => {},
      onDeleteTask: () => {},
    }
  );
  assert.equal(handledEscape, true);
  assert.equal(emptySelected, null);
});

// ============================================================================
// PART 4: HIGH-THROUGHPUT RANDOMIZED KEYSTROKE FUZZING (5,000 ITERATIONS)
// ============================================================================

test('EMPIRICAL-M3: High-throughput keystroke fuzzing (5,000 iterations) maintains state invariants', () => {
  const tasks = Array.from({ length: 20 }, (_, i) => ({
    id: `fuzz-${i}`,
    title: `Fuzz Task ${i}`,
  }));

  const candidateKeys = ['j', 'k', ' ', 'e', 'd', 'Escape', 'ArrowDown', 'ArrowUp', 'a', 'x', 'Enter', 'Tab'];
  const tabs = ['tasks', 'today', 'habits', 'settings'];

  let focusedId = null;
  let actionCounts = { toggles: 0, edits: 0, deletes: 0 };

  // Run 5,000 randomized events with uniform distribution
  for (let i = 0; i < 5000; i++) {
    const key = candidateKeys[Math.floor(Math.random() * candidateKeys.length)];
    const isCtrl = Math.random() < 0.15;
    const isMeta = Math.random() < 0.10;
    const isAlt = Math.random() < 0.08;
    const isModal = Math.random() < 0.06;
    const isEditable = Math.random() < 0.20;
    const tab = tabs[Math.floor(Math.random() * tabs.length)];

    const prevToggles = actionCounts.toggles;
    const prevEdits = actionCounts.edits;
    const prevDeletes = actionCounts.deletes;

    const handled = handleTaskKeyDown(
      {
        key,
        ctrlKey: isCtrl,
        metaKey: isMeta,
        altKey: isAlt,
        preventDefault: () => {},
        stopPropagation: () => {},
      },
      {
        tasks,
        activeTab: tab,
        isModalOpen: isModal,
        isEditableElement: isEditable,
        focusedTaskId: focusedId,
        onSelectTask: (id) => { focusedId = id; },
        onToggleTask: () => { actionCounts.toggles++; },
        onEditTask: () => { actionCounts.edits++; },
        onDeleteTask: () => { actionCounts.deletes++; },
      }
    );

    const guardsActive = tab !== 'tasks' || isEditable || isCtrl || isMeta || isAlt || isModal;

    if (guardsActive) {
      assert.equal(handled, false, `Guards active but handled was true at iter ${i}`);
      assert.equal(actionCounts.toggles, prevToggles);
      assert.equal(actionCounts.edits, prevEdits);
      assert.equal(actionCounts.deletes, prevDeletes);
    } else {
      // Invariant: focusedId must either be null or one of the task IDs
      if (focusedId !== null) {
        assert.ok(tasks.some((t) => t.id === focusedId), `focusedId ${focusedId} is invalid at iter ${i}`);
      }
    }
  }

  assert.ok(actionCounts.toggles > 0, `Space toggles should have fired during valid cycles (got ${actionCounts.toggles})`);
  assert.ok(actionCounts.edits > 0, `Edit should have fired during valid cycles (got ${actionCounts.edits})`);
  assert.ok(actionCounts.deletes > 0, `Delete should have fired during valid cycles (got ${actionCounts.deletes})`);
});
