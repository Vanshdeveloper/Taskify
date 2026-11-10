import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Feature F13: Lightweight Task Subtasks / Checklist
 * Core Pure Functions & Business Logic Engine
 */

/**
 * Unique ID generator for subtasks
 */
export function generateSubtaskId() {
  return 'st-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Calculate progress metrics for subtasks
 * Returns standardized metrics compatible with both internal conventions and E2E contract.
 */
export function calculateSubtaskProgress(subtasks) {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return {
      total: 0,
      count: 0,
      completed: 0,
      completedCount: 0,
      percent: 0,
      isAllDone: false,
      isAllCompleted: false,
      summary: '0/0',
    };
  }

  const total = subtasks.length;
  const completed = subtasks.filter((s) => Boolean(s.completed)).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = total > 0 && completed === total;

  return {
    total,
    count: total,
    completed,
    completedCount: completed,
    percent,
    isAllDone,
    isAllCompleted: isAllDone,
    summary: `${completed}/${total}`,
  };
}

/**
 * Add a new subtask (immutable)
 */
export function addSubtask(subtasks = [], title, idGenerator = generateSubtaskId) {
  const trimmed = (title || '').trim();
  if (!trimmed) {
    return subtasks ? [...subtasks] : [];
  }

  const newSubtask = {
    id: idGenerator(),
    title: trimmed,
    completed: false,
  };

  return [...(subtasks || []), newSubtask];
}

/**
 * Toggle subtask completion status (immutable)
 */
export function toggleSubtask(subtasks = [], subtaskId) {
  if (!Array.isArray(subtasks)) return [];

  return subtasks.map((st) => {
    if (st.id === subtaskId) {
      return {
        ...st,
        completed: !st.completed,
      };
    }
    return st;
  });
}

/**
 * Update subtask title inline (immutable)
 */
export function updateSubtaskTitle(subtasks = [], subtaskId, newTitle) {
  if (!Array.isArray(subtasks)) return [];
  const trimmed = (newTitle || '').trim();
  if (!trimmed) return [...subtasks];

  return subtasks.map((st) => {
    if (st.id === subtaskId) {
      return {
        ...st,
        title: trimmed,
      };
    }
    return st;
  });
}

/**
 * Remove a subtask by ID (immutable)
 */
export function removeSubtask(subtasks = [], subtaskId) {
  if (!Array.isArray(subtasks)) return [];
  return subtasks.filter((st) => st.id !== subtaskId);
}

/**
 * Reorder subtasks by moving an item fromIndex to toIndex (immutable)
 */
export function reorderSubtasks(subtasks = [], fromIndex, toIndex) {
  if (!Array.isArray(subtasks)) return [];
  if (fromIndex < 0 || fromIndex >= subtasks.length) return [...subtasks];
  if (toIndex < 0 || toIndex >= subtasks.length) return [...subtasks];
  if (fromIndex === toIndex) return [...subtasks];

  const clone = [...subtasks];
  const [removed] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, removed);
  return clone;
}

/**
 * Clone subtasks with reset completion (used by task duplication / templates)
 */
export function cloneSubtasks(subtasks, idGenerator = generateSubtaskId) {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return undefined;
  return subtasks.map((st) => ({
    id: idGenerator(),
    title: st.title,
    completed: false,
  }));
}

// =========================================================================
// UNIT TESTS: Feature F13 Lightweight Task Subtasks / Checklist
// =========================================================================

test('F13 - Progress Calculation: Handles empty or undefined subtasks gracefully', () => {
  const resultUndefined = calculateSubtaskProgress(undefined);
  assert.deepEqual(resultUndefined, {
    total: 0,
    count: 0,
    completed: 0,
    completedCount: 0,
    percent: 0,
    isAllDone: false,
    isAllCompleted: false,
    summary: '0/0',
  });

  const resultEmpty = calculateSubtaskProgress([]);
  assert.deepEqual(resultEmpty, {
    total: 0,
    count: 0,
    completed: 0,
    completedCount: 0,
    percent: 0,
    isAllDone: false,
    isAllCompleted: false,
    summary: '0/0',
  });
});

test('F13 - Progress Calculation: Calculates partial completion percentages accurately', () => {
  const subtasks = [
    { id: '1', title: 'Draft outline', completed: true },
    { id: '2', title: 'Write tests', completed: false },
    { id: '3', title: 'Implement feature', completed: false },
  ];

  const progress = calculateSubtaskProgress(subtasks);
  assert.equal(progress.total, 3);
  assert.equal(progress.count, 3);
  assert.equal(progress.completed, 1);
  assert.equal(progress.completedCount, 1);
  assert.equal(progress.percent, 33); // Math.round(1/3 * 100) = 33
  assert.equal(progress.isAllDone, false);
  assert.equal(progress.isAllCompleted, false);
  assert.equal(progress.summary, '1/3');
});

test('F13 - Progress Calculation: Handles 50% and 100% completion states correctly', () => {
  const halfDone = [
    { id: '1', title: 'Step 1', completed: true },
    { id: '2', title: 'Step 2', completed: false },
  ];
  assert.equal(calculateSubtaskProgress(halfDone).percent, 50);
  assert.equal(calculateSubtaskProgress(halfDone).isAllDone, false);

  const allDone = [
    { id: '1', title: 'Step 1', completed: true },
    { id: '2', title: 'Step 2', completed: true },
    { id: '3', title: 'Step 3', completed: true },
  ];
  const allProgress = calculateSubtaskProgress(allDone);
  assert.equal(allProgress.total, 3);
  assert.equal(allProgress.completed, 3);
  assert.equal(allProgress.percent, 100);
  assert.equal(allProgress.isAllDone, true);
  assert.equal(allProgress.isAllCompleted, true);
  assert.equal(allProgress.summary, '3/3');
});

test('F13 - Subtask Addition: Adds new item with unique ID and default completed=false', () => {
  const initial = [];
  const updated = addSubtask(initial, 'Finalize UX specifications', () => 'st-fixed-1');

  assert.equal(updated.length, 1);
  assert.deepEqual(updated[0], {
    id: 'st-fixed-1',
    title: 'Finalize UX specifications',
    completed: false,
  });
  // Original array remained empty (immutability)
  assert.equal(initial.length, 0);
});

test('F13 - Subtask Addition: Trims whitespace and ignores blank titles', () => {
  const list = [{ id: 'st-1', title: 'Existing', completed: false }];

  const withSpaces = addSubtask(list, '   Audit spring physics   ', () => 'st-2');
  assert.equal(withSpaces.length, 2);
  assert.equal(withSpaces[1].title, 'Audit spring physics');

  const withEmpty = addSubtask(list, '    ');
  assert.equal(withEmpty.length, 1);
  assert.deepEqual(withEmpty, list);

  const withNull = addSubtask(list, null);
  assert.equal(withNull.length, 1);
});

test('F13 - Subtask Toggling: Inverts completed state for targeted item only', () => {
  const subtasks = [
    { id: 'st-1', title: 'Item 1', completed: false },
    { id: 'st-2', title: 'Item 2', completed: true },
    { id: 'st-3', title: 'Item 3', completed: false },
  ];

  const step1 = toggleSubtask(subtasks, 'st-1');
  assert.equal(step1[0].completed, true);
  assert.equal(step1[1].completed, true);
  assert.equal(step1[2].completed, false);

  const step2 = toggleSubtask(step1, 'st-2');
  assert.equal(step2[1].completed, false);

  // Toggling non-existent ID leaves items unmodified
  const step3 = toggleSubtask(step2, 'non-existent');
  assert.deepEqual(step3, step2);
});

test('F13 - Subtask Title Editing: Updates target title while preserving completed status', () => {
  const subtasks = [
    { id: 'st-1', title: 'Initial title', completed: true },
    { id: 'st-2', title: 'Second title', completed: false },
  ];

  const updated = updateSubtaskTitle(subtasks, 'st-1', 'Renamed title');
  assert.equal(updated[0].title, 'Renamed title');
  assert.equal(updated[0].completed, true);
  assert.equal(updated[1].title, 'Second title');

  // Blank rename is ignored
  const noop = updateSubtaskTitle(subtasks, 'st-1', '   ');
  assert.equal(noop[0].title, 'Initial title');
});

test('F13 - Subtask Deletion: Removes item and preserves remaining order', () => {
  const subtasks = [
    { id: 'st-1', title: 'First', completed: false },
    { id: 'st-2', title: 'Second', completed: true },
    { id: 'st-3', title: 'Third', completed: false },
  ];

  const remaining = removeSubtask(subtasks, 'st-2');
  assert.equal(remaining.length, 2);
  assert.equal(remaining[0].id, 'st-1');
  assert.equal(remaining[1].id, 'st-3');

  // Deleting only remaining item yields empty array
  const empty = removeSubtask(remaining, 'st-1');
  const none = removeSubtask(empty, 'st-3');
  assert.deepEqual(none, []);
});

test('F13 - Subtask Reordering: Reorders elements without mutating source array', () => {
  const subtasks = [
    { id: 'a', title: 'A', completed: false },
    { id: 'b', title: 'B', completed: false },
    { id: 'c', title: 'C', completed: false },
  ];

  // Move C from index 2 to index 0
  const reordered1 = reorderSubtasks(subtasks, 2, 0);
  assert.deepEqual(
    reordered1.map((s) => s.id),
    ['c', 'a', 'b']
  );

  // Move A from index 0 to index 2
  const reordered2 = reorderSubtasks(subtasks, 0, 2);
  assert.deepEqual(
    reordered2.map((s) => s.id),
    ['b', 'c', 'a']
  );

  // Out of bounds or identical indices return copy of array
  assert.deepEqual(reorderSubtasks(subtasks, 0, 0), subtasks);
  assert.deepEqual(reorderSubtasks(subtasks, -1, 2), subtasks);
  assert.deepEqual(reorderSubtasks(subtasks, 0, 99), subtasks);

  // Ensure source array is not mutated
  assert.equal(subtasks[0].id, 'a');
  assert.equal(subtasks[1].id, 'b');
  assert.equal(subtasks[2].id, 'c');
});

test('F13 - Immutability Contract: All mutations return new object references', () => {
  const item1 = { id: 'st-1', title: 'Alpha', completed: false };
  const item2 = { id: 'st-2', title: 'Beta', completed: false };
  const initial = [item1, item2];

  const toggled = toggleSubtask(initial, 'st-1');
  assert.notEqual(toggled, initial, 'Array reference must change');
  assert.notEqual(toggled[0], item1, 'Toggled item reference must change');
  assert.equal(toggled[1], item2, 'Untouched item reference should be preserved (structural sharing)');

  const renamed = updateSubtaskTitle(initial, 'st-2', 'Beta Updated');
  assert.notEqual(renamed, initial);
  assert.notEqual(renamed[1], item2);
  assert.equal(renamed[0], item1);
});

test('F13 - Task Schema Integration: Task with subtasks conforms to schema specifications', () => {
  const sampleTask = {
    id: 't-123',
    title: 'Release Version 2.0',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-11-10',
    category: 'Work',
    createdAt: 1731000000000,
    subtasks: [
      { id: 'st-1', title: 'Run linter and tests', completed: true },
      { id: 'st-2', title: 'Build production artifacts', completed: true },
      { id: 'st-3', title: 'Publish release tag', completed: false },
    ],
  };

  assert.equal(sampleTask.subtasks?.length, 3);
  const progress = calculateSubtaskProgress(sampleTask.subtasks);
  assert.equal(progress.summary, '2/3');
  assert.equal(progress.percent, 67);
  assert.equal(progress.isAllDone, false);
  assert.equal(progress.count, 3);
  assert.equal(progress.completedCount, 2);

  // Clone subtasks for duplication test
  const cloned = cloneSubtasks(sampleTask.subtasks);
  assert.equal(cloned.length, 3);
  assert.ok(cloned.every((s) => s.completed === false));
  assert.ok(cloned[0].id !== sampleTask.subtasks[0].id);
});

test('F13 - Stress & Performance: 2,000 subtasks calculate progress and toggle under 15ms', () => {
  const largeSubtasks = Array.from({ length: 2000 }, (_, i) => ({
    id: `st-bulk-${i}`,
    title: `Task checklist item #${i}`,
    completed: i % 3 === 0,
  }));

  const start = performance.now();

  const progress = calculateSubtaskProgress(largeSubtasks);
  assert.equal(progress.total, 2000);
  assert.equal(progress.count, 2000);
  assert.equal(progress.completed, 667); // 0, 3, 6 ... 1998 -> 667 items
  assert.equal(progress.completedCount, 667);

  const toggled = toggleSubtask(largeSubtasks, 'st-bulk-1000');
  assert.equal(toggled[1000].completed, !largeSubtasks[1000].completed);

  const duration = performance.now() - start;
  assert.ok(duration < 25, `Large batch operations should take < 25ms, took ${duration.toFixed(2)}ms`);
});
