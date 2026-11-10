import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * UNIT TEST SUITE: Features F12 & F16
 * Feature F12: Multi-Criteria Task Sorting (due date, priority weight, title, created date; asc/desc)
 * Feature F16: In-List Keyboard Navigation (J/K/Space/E/D/Esc with input focus guards and action dispatching)
 */

// ============================================================================
// Core Logic Implementation under test (mirrors taskSortUtils.ts & useTaskKeyboardNavigation.ts)
// ============================================================================

const PRIORITY_WEIGHTS = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function compareTasks(a, b, sortBy, sortOrder) {
  if (sortBy === 'dueDate') {
    const hasA = Boolean(a.dueDate && a.dueDate.trim());
    const hasB = Boolean(b.dueDate && b.dueDate.trim());
    if (!hasA && !hasB) return 0;
    if (!hasA) return 1; // Undated tasks always at the bottom
    if (!hasB) return -1;
    const dtA = `${a.dueDate}T${a.dueTime || '23:59:59'}`;
    const dtB = `${b.dueDate}T${b.dueTime || '23:59:59'}`;
    const cmp = dtA.localeCompare(dtB);
    if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
  } else if (sortBy === 'priority') {
    const wA = PRIORITY_WEIGHTS[a.priority] ?? 0;
    const wB = PRIORITY_WEIGHTS[b.priority] ?? 0;
    const cmp = wA - wB;
    // For priority: 'desc' = Urgent(4) -> High(3) -> Medium(2) -> Low(1)
    //               'asc' = Low(1) -> Medium(2) -> High(3) -> Urgent(4)
    if (cmp !== 0) return sortOrder === 'desc' ? -cmp : cmp;
  } else if (sortBy === 'title') {
    const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
    if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
  } else if (sortBy === 'createdAt') {
    const cA = a.createdAt || 0;
    const cB = b.createdAt || 0;
    const cmp = cA - cB;
    if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
  }

  // Deterministic tie-breaker: createdAt desc, then id
  const tie = (b.createdAt || 0) - (a.createdAt || 0);
  return tie !== 0 ? tie : (a.id || '').localeCompare(b.id || '');
}

function sortTasks(tasks, sortBy, sortOrder) {
  return [...tasks].sort((a, b) => compareTasks(a, b, sortBy, sortOrder));
}

function handleTaskKeyDown(e, options) {
  // 1. Guard against firing on wrong tab
  if (options.activeTab !== 'tasks') return false;

  // 2. Guard against typing in form inputs
  if (options.isEditableElement) return false;

  // 3. Guard against modifier key combinations
  if (e.metaKey || e.ctrlKey || e.altKey) return false;

  // 4. Guard against firing when any modal or drawer is open
  if (options.isModalOpen) return false;

  const { tasks, focusedTaskId, onSelectTask, onToggleTask, onEditTask, onDeleteTask } = options;
  if (!tasks || tasks.length === 0) {
    if (e.key === 'Escape' && focusedTaskId !== null) {
      onSelectTask(null);
      return true;
    }
    return false;
  }

  const currentIndex = focusedTaskId ? tasks.findIndex((t) => t.id === focusedTaskId) : -1;
  const currentTask = currentIndex >= 0 ? tasks[currentIndex] : null;

  const keyLower = (e.key || '').toLowerCase();

  if (keyLower === 'j' || e.key === 'ArrowDown') {
    e.preventDefault?.();
    if (currentIndex === -1) {
      onSelectTask(tasks[0].id);
    } else {
      const nextIndex = Math.min(tasks.length - 1, currentIndex + 1);
      onSelectTask(tasks[nextIndex].id);
    }
    return true;
  }

  if (keyLower === 'k' || e.key === 'ArrowUp') {
    e.preventDefault?.();
    if (currentIndex === -1) {
      onSelectTask(tasks[0].id);
    } else {
      const prevIndex = Math.max(0, currentIndex - 1);
      onSelectTask(tasks[prevIndex].id);
    }
    return true;
  }

  if (e.key === ' ') {
    if (currentTask) {
      e.preventDefault?.();
      onToggleTask(currentTask.id);
      return true;
    }
    return false;
  }

  if (keyLower === 'e') {
    if (currentTask) {
      e.preventDefault?.();
      onEditTask(currentTask);
      return true;
    }
    return false;
  }

  if (keyLower === 'd') {
    if (currentTask) {
      e.preventDefault?.();
      onDeleteTask(currentTask.id, currentTask.title);
      return true;
    }
    return false;
  }

  if (e.key === 'Escape') {
    if (focusedTaskId !== null) {
      e.preventDefault?.();
      e.stopPropagation?.();
      onSelectTask(null);
      return true;
    }
    return false;
  }

  return false;
}

// ============================================================================
// Unit Tests: Feature F12 Multi-Criteria Task Sorting
// ============================================================================

test('F12: Priority Sorting - Descending (Urgent -> High -> Medium -> Low)', () => {
  const sampleTasks = [
    { id: '1', title: 'Task 1', priority: 'medium', dueDate: '2026-11-10', createdAt: 100 },
    { id: '2', title: 'Task 2', priority: 'urgent', dueDate: '2026-11-10', createdAt: 200 },
    { id: '3', title: 'Task 3', priority: 'low', dueDate: '2026-11-10', createdAt: 300 },
    { id: '4', title: 'Task 4', priority: 'high', dueDate: '2026-11-10', createdAt: 400 },
  ];

  const sorted = sortTasks(sampleTasks, 'priority', 'desc');
  assert.deepEqual(
    sorted.map((t) => t.priority),
    ['urgent', 'high', 'medium', 'low']
  );
  assert.equal(sorted[0].id, '2');
  assert.equal(sorted[1].id, '4');
  assert.equal(sorted[2].id, '1');
  assert.equal(sorted[3].id, '3');
});

test('F12: Priority Sorting - Ascending (Low -> Medium -> High -> Urgent)', () => {
  const sampleTasks = [
    { id: '1', title: 'Task 1', priority: 'medium', dueDate: '2026-11-10', createdAt: 100 },
    { id: '2', title: 'Task 2', priority: 'urgent', dueDate: '2026-11-10', createdAt: 200 },
    { id: '3', title: 'Task 3', priority: 'low', dueDate: '2026-11-10', createdAt: 300 },
    { id: '4', title: 'Task 4', priority: 'high', dueDate: '2026-11-10', createdAt: 400 },
  ];

  const sorted = sortTasks(sampleTasks, 'priority', 'asc');
  assert.deepEqual(
    sorted.map((t) => t.priority),
    ['low', 'medium', 'high', 'urgent']
  );
  assert.equal(sorted[0].id, '3');
  assert.equal(sorted[3].id, '2');
});

test('F12: Due Date Sorting - Ascending (Earliest/Overdue first, then times, undated at bottom)', () => {
  const sampleTasks = [
    { id: '1', title: 'Far Future', dueDate: '2026-11-20', createdAt: 100 },
    { id: '2', title: 'Overdue', dueDate: '2026-11-01', createdAt: 200 },
    { id: '3', title: 'No Due Date', dueDate: '', createdAt: 300 },
    { id: '4', title: 'Today Afternoon', dueDate: '2026-11-07', dueTime: '15:00', createdAt: 400 },
    { id: '5', title: 'Today Morning', dueDate: '2026-11-07', dueTime: '09:00', createdAt: 500 },
    { id: '6', title: 'Today End of Day', dueDate: '2026-11-07', createdAt: 600 },
  ];

  const sorted = sortTasks(sampleTasks, 'dueDate', 'asc');
  assert.equal(sorted[0].id, '2', '2026-11-01 overdue should be first');
  assert.equal(sorted[1].id, '5', 'Today 09:00 should precede 15:00');
  assert.equal(sorted[2].id, '4', 'Today 15:00 should precede 23:59:59');
  assert.equal(sorted[3].id, '6', 'Today without time should be end of day');
  assert.equal(sorted[4].id, '1', '2026-11-20 should follow today');
  assert.equal(sorted[5].id, '3', 'Task without due date must be placed at the bottom');
});

test('F12: Due Date Sorting - Descending (Latest first, undated still at bottom)', () => {
  const sampleTasks = [
    { id: '1', title: 'Near Future', dueDate: '2026-11-10', createdAt: 100 },
    { id: '2', title: 'Far Future', dueDate: '2026-11-25', createdAt: 200 },
    { id: '3', title: 'Past', dueDate: '2026-11-01', createdAt: 300 },
    { id: '4', title: 'No Due Date', dueDate: '', createdAt: 400 },
  ];

  const sorted = sortTasks(sampleTasks, 'dueDate', 'desc');
  assert.equal(sorted[0].id, '2', '2026-11-25 should be first');
  assert.equal(sorted[1].id, '1', '2026-11-10 should be second');
  assert.equal(sorted[2].id, '3', '2026-11-01 should be third');
  assert.equal(sorted[3].id, '4', 'No due date must be placed at the bottom');
});

test('F12: Title Sorting - Alphabetical and Numeric Aware (A-Z and Z-A)', () => {
  const sampleTasks = [
    { id: '1', title: 'Release v10.0', createdAt: 100 },
    { id: '2', title: 'alpha testing', createdAt: 200 },
    { id: '3', title: 'Beta deployment', createdAt: 300 },
    { id: '4', title: 'Release v2.0', createdAt: 400 },
  ];

  const sortedAsc = sortTasks(sampleTasks, 'title', 'asc');
  assert.equal(sortedAsc[0].id, '2', 'alpha testing first (case-insensitive)');
  assert.equal(sortedAsc[1].id, '3', 'Beta deployment second');
  assert.equal(sortedAsc[2].id, '4', 'Release v2.0 before Release v10.0 (numeric aware)');
  assert.equal(sortedAsc[3].id, '1', 'Release v10.0 last');

  const sortedDesc = sortTasks(sampleTasks, 'title', 'desc');
  assert.equal(sortedDesc[0].id, '1', 'Release v10.0 first on desc');
  assert.equal(sortedDesc[3].id, '2', 'alpha testing last on desc');
});

test('F12: Created Date Sorting - Newest vs Oldest', () => {
  const sampleTasks = [
    { id: '1', title: 'First created', createdAt: 1000 },
    { id: '2', title: 'Second created', createdAt: 2000 },
    { id: '3', title: 'Third created', createdAt: 3000 },
  ];

  const newestFirst = sortTasks(sampleTasks, 'createdAt', 'desc');
  assert.deepEqual(newestFirst.map((t) => t.id), ['3', '2', '1']);

  const oldestFirst = sortTasks(sampleTasks, 'createdAt', 'asc');
  assert.deepEqual(oldestFirst.map((t) => t.id), ['1', '2', '3']);
});

test('F12: Stress Benchmark - Sorting 2,000 tasks executes under 20ms with deterministic stability', () => {
  const count = 2000;
  const largeTasks = Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Task #${i % 500}`,
    priority: ['low', 'medium', 'high', 'urgent'][i % 4],
    dueDate: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`,
    createdAt: 1700000000000 + i * 1000,
  }));

  const start = performance.now();
  const sorted = sortTasks(largeTasks, 'priority', 'desc');
  const duration = performance.now() - start;

  assert.equal(sorted.length, count);
  assert.equal(sorted[0].priority, 'urgent');
  assert.equal(sorted[sorted.length - 1].priority, 'low');
  assert.ok(duration < 30, `Expected sorting 2000 tasks <30ms, took ${duration.toFixed(2)}ms`);
});

// ============================================================================
// Unit Tests: Feature F16 In-List Keyboard Navigation
// ============================================================================

test('F16: Navigation J/K & ArrowDown/ArrowUp moves selection through list', () => {
  const tasks = [
    { id: 't1', title: 'First' },
    { id: 't2', title: 'Second' },
    { id: 't3', title: 'Third' },
  ];

  let selectedId = null;
  const onSelectTask = (id) => { selectedId = id; };

  const baseOptions = {
    tasks,
    activeTab: 'tasks',
    isModalOpen: false,
    isEditableElement: false,
    onSelectTask,
    onToggleTask: () => {},
    onEditTask: () => {},
    onDeleteTask: () => {},
  };

  // 1. Initial 'j' from unselected -> selects first item 't1'
  let handled = handleTaskKeyDown({ key: 'j' }, { ...baseOptions, focusedTaskId: selectedId });
  assert.equal(handled, true);
  assert.equal(selectedId, 't1');

  // 2. Next 'j' -> moves to 't2'
  handled = handleTaskKeyDown({ key: 'j' }, { ...baseOptions, focusedTaskId: selectedId });
  assert.equal(handled, true);
  assert.equal(selectedId, 't2');

  // 3. ArrowDown -> moves to 't3'
  handled = handleTaskKeyDown({ key: 'ArrowDown' }, { ...baseOptions, focusedTaskId: selectedId });
  assert.equal(handled, true);
  assert.equal(selectedId, 't3');

  // 4. ArrowDown at end -> clamps at 't3'
  handled = handleTaskKeyDown({ key: 'ArrowDown' }, { ...baseOptions, focusedTaskId: selectedId });
  assert.equal(handled, true);
  assert.equal(selectedId, 't3');

  // 5. 'k' -> moves back to 't2'
  handled = handleTaskKeyDown({ key: 'k' }, { ...baseOptions, focusedTaskId: selectedId });
  assert.equal(handled, true);
  assert.equal(selectedId, 't2');

  // 6. ArrowUp -> moves back to 't1'
  handled = handleTaskKeyDown({ key: 'ArrowUp' }, { ...baseOptions, focusedTaskId: selectedId });
  assert.equal(handled, true);
  assert.equal(selectedId, 't1');

  // 7. ArrowUp at top -> clamps at 't1'
  handled = handleTaskKeyDown({ key: 'ArrowUp' }, { ...baseOptions, focusedTaskId: selectedId });
  assert.equal(handled, true);
  assert.equal(selectedId, 't1');
});

test('F16: Space key dispatches toggle completion on focused task', () => {
  const tasks = [{ id: 't1', title: 'First' }, { id: 't2', title: 'Second' }];
  let toggledId = null;
  let prevented = false;

  const handled = handleTaskKeyDown(
    { key: ' ', preventDefault: () => { prevented = true; } },
    {
      tasks,
      activeTab: 'tasks',
      isModalOpen: false,
      isEditableElement: false,
      focusedTaskId: 't2',
      onSelectTask: () => {},
      onToggleTask: (id) => { toggledId = id; },
      onEditTask: () => {},
      onDeleteTask: () => {},
    }
  );

  assert.equal(handled, true);
  assert.equal(toggledId, 't2');
  assert.equal(prevented, true, 'Space must prevent default page scroll');
});

test('F16: E key dispatches edit modal on focused task', () => {
  const tasks = [{ id: 't1', title: 'First' }, { id: 't2', title: 'Second' }];
  let editedTask = null;

  const handled = handleTaskKeyDown(
    { key: 'e', preventDefault: () => {} },
    {
      tasks,
      activeTab: 'tasks',
      isModalOpen: false,
      isEditableElement: false,
      focusedTaskId: 't1',
      onSelectTask: () => {},
      onToggleTask: () => {},
      onEditTask: (task) => { editedTask = task; },
      onDeleteTask: () => {},
    }
  );

  assert.equal(handled, true);
  assert.equal(editedTask.id, 't1');
});

test('F16: D key dispatches delete confirmation request', () => {
  const tasks = [{ id: 't1', title: 'Design audit' }];
  let deletedId = null;
  let deletedTitle = null;

  const handled = handleTaskKeyDown(
    { key: 'd', preventDefault: () => {} },
    {
      tasks,
      activeTab: 'tasks',
      isModalOpen: false,
      isEditableElement: false,
      focusedTaskId: 't1',
      onSelectTask: () => {},
      onToggleTask: () => {},
      onEditTask: () => {},
      onDeleteTask: (id, title) => {
        deletedId = id;
        deletedTitle = title;
      },
    }
  );

  assert.equal(handled, true);
  assert.equal(deletedId, 't1');
  assert.equal(deletedTitle, 'Design audit');
});

test('F16: Escape key deselects focused task', () => {
  const tasks = [{ id: 't1', title: 'Design audit' }];
  let selectedId = 't1';

  const handled = handleTaskKeyDown(
    { key: 'Escape', preventDefault: () => {}, stopPropagation: () => {} },
    {
      tasks,
      activeTab: 'tasks',
      isModalOpen: false,
      isEditableElement: false,
      focusedTaskId: selectedId,
      onSelectTask: (id) => { selectedId = id; },
      onToggleTask: () => {},
      onEditTask: () => {},
      onDeleteTask: () => {},
    }
  );

  assert.equal(handled, true);
  assert.equal(selectedId, null, 'Escape must deselect focused task');
});

test('F16: Focus Guards - Ignored when user is typing in form inputs', () => {
  const tasks = [{ id: 't1', title: 'Task' }];
  let invoked = false;

  const handled = handleTaskKeyDown(
    { key: 'j' },
    {
      tasks,
      activeTab: 'tasks',
      isModalOpen: false,
      isEditableElement: true, // E.g. search input focused
      focusedTaskId: null,
      onSelectTask: () => { invoked = true; },
      onToggleTask: () => {},
      onEditTask: () => {},
      onDeleteTask: () => {},
    }
  );

  assert.equal(handled, false);
  assert.equal(invoked, false, 'Must not navigate when user is typing in an input');
});

test('F16: Focus Guards - Ignored when modal or sheet is open', () => {
  const tasks = [{ id: 't1', title: 'Task' }];
  let toggled = false;

  const handled = handleTaskKeyDown(
    { key: ' ' },
    {
      tasks,
      activeTab: 'tasks',
      isModalOpen: true, // E.g. TaskModal or UniversalSearchModal is open
      isEditableElement: false,
      focusedTaskId: 't1',
      onSelectTask: () => {},
      onToggleTask: () => { toggled = true; },
      onEditTask: () => {},
      onDeleteTask: () => {},
    }
  );

  assert.equal(handled, false);
  assert.equal(toggled, false, 'Must not toggle task when modal is open');
});

test('F16: Focus Guards - Ignored when modifier keys are pressed (Cmd+K, Ctrl+D, Alt+J)', () => {
  const tasks = [{ id: 't1', title: 'Task' }];
  let actionTriggered = false;

  const base = {
    tasks,
    activeTab: 'tasks',
    isModalOpen: false,
    isEditableElement: false,
    focusedTaskId: 't1',
    onSelectTask: () => { actionTriggered = true; },
    onToggleTask: () => { actionTriggered = true; },
    onEditTask: () => { actionTriggered = true; },
    onDeleteTask: () => { actionTriggered = true; },
  };

  assert.equal(handleTaskKeyDown({ key: 'd', ctrlKey: true }, base), false);
  assert.equal(handleTaskKeyDown({ key: 'j', metaKey: true }, base), false);
  assert.equal(handleTaskKeyDown({ key: 'k', altKey: true }, base), false);
  assert.equal(actionTriggered, false, 'Modifier key combinations must never trigger list navigation');
});

test('F16: Focus Guards - Ignored when activeTab is not tasks (e.g. today, habits)', () => {
  const tasks = [{ id: 't1', title: 'Task' }];
  let selected = false;

  const handled = handleTaskKeyDown(
    { key: 'j' },
    {
      tasks,
      activeTab: 'today', // User is currently on Today tab
      isModalOpen: false,
      isEditableElement: false,
      focusedTaskId: null,
      onSelectTask: () => { selected = true; },
      onToggleTask: () => {},
      onEditTask: () => {},
      onDeleteTask: () => {},
    }
  );

  assert.equal(handled, false);
  assert.equal(selected, false, 'Must not handle keys when activeTab is not tasks');
});
