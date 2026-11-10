import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Feature F11: Task Duplication & Quick Templates Core Logic
 */

// Title duplication formatter
export function generateDuplicateTitle(originalTitle) {
  const trimmed = (originalTitle || '').trim();
  const match = trimmed.match(/^(.*?)\s*\(Copy(?:\s*(\d+))?\)$/);
  if (!match) {
    return trimmed ? `${trimmed} (Copy)` : '(Copy)';
  }
  const base = match[1].trim();
  const count = match[2] ? parseInt(match[2], 10) : 1;
  return `${base} (Copy ${count + 1})`;
}

// Subtask deep cloner with completion reset
export function cloneSubtasks(subtasks) {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return undefined;
  return subtasks.map((st) => ({
    id: 'st-' + Math.random().toString(36).substring(2, 9),
    title: st.title,
    completed: false,
  }));
}

// Pure task duplication data generator
export function duplicateTaskData(source, idGenerator = () => 't-' + Math.random().toString(36).substring(2, 9)) {
  if (!source) throw new Error('Source task is required for duplication');

  const clonedSubtasks = cloneSubtasks(source.subtasks);

  const duplicated = {
    ...source,
    id: idGenerator(),
    title: generateDuplicateTitle(source.title),
    status: 'todo',
    completedAt: undefined,
    createdAt: Date.now(),
  };

  if (clonedSubtasks) {
    duplicated.subtasks = clonedSubtasks;
  } else if ('subtasks' in duplicated) {
    delete duplicated.subtasks;
  }

  return duplicated;
}

// Built-in Quick Task Templates catalog
export const BUILTIN_TASK_TEMPLATES = [
  {
    id: 'tpl-deep-work',
    name: 'Deep Work Session',
    description: '90-minute distraction-free focus block on highest-leverage priority',
    category: 'Work',
    priority: 'high',
    icon: 'Target',
    estimatedMinutes: 90,
    tags: ['focus', 'deep-work'],
    subtasks: [
      { title: 'Silence notifications & close chat tabs' },
      { title: 'Define single core output for session' },
      { title: 'Execute core task for 90 minutes' },
      { title: 'Document progress & log next steps' },
    ],
  },
  {
    id: 'tpl-weekly-planning',
    name: 'Weekly Planning & Review',
    description: 'Review last week achievements and calibrate incoming weekly goals',
    category: 'Personal',
    priority: 'medium',
    icon: 'Calendar',
    estimatedMinutes: 45,
    tags: ['planning', 'review'],
    subtasks: [
      { title: 'Review completed tasks and celebrate wins' },
      { title: 'Check budget velocity and safe-to-spend' },
      { title: 'Clear inbox & capture loose ends' },
      { title: 'Schedule top 3 MITs for upcoming week' },
    ],
  },
  {
    id: 'tpl-daily-standup',
    name: 'Daily Standup & Sync',
    description: 'Prepare and share daily progress updates and flag any blockers',
    category: 'Work',
    priority: 'medium',
    icon: 'MessageSquare',
    estimatedMinutes: 15,
    tags: ['standup', 'sync'],
    subtasks: [
      { title: 'What did I accomplish yesterday?' },
      { title: 'What is my primary focus today?' },
      { title: 'Any blockers impeding progress?' },
    ],
  },
  {
    id: 'tpl-bug-triage',
    name: 'Bug Triage & Fix',
    description: 'Investigate, isolate, reproduce, and resolve critical bug',
    category: 'Work',
    priority: 'urgent',
    icon: 'AlertCircle',
    estimatedMinutes: 60,
    tags: ['bug', 'engineering'],
    subtasks: [
      { title: 'Reproduce issue with minimal test case' },
      { title: 'Identify root cause in codebase' },
      { title: 'Implement targeted fix' },
      { title: 'Verify test suite passes' },
    ],
  },
  {
    id: 'tpl-health-reset',
    name: 'Health & Reset Routine',
    description: 'Physical and mental recharge routine for optimal wellbeing',
    category: 'Fitness',
    priority: 'low',
    icon: 'Heart',
    estimatedMinutes: 30,
    tags: ['wellness', 'health'],
    subtasks: [
      { title: 'Hydrate (500ml water)' },
      { title: '30-min brisk walk or workout' },
      { title: 'Posture stretch & screen break' },
    ],
  },
];

// Helper to instantiate a task from a template
export function createTaskFromTemplateData(
  template,
  options = {},
  idGenerator = () => 't-' + Math.random().toString(36).substring(2, 9)
) {
  if (!template) throw new Error('Template is required');

  const todayStr = options.today || new Date().toISOString().split('T')[0];
  const subtasks = template.subtasks?.map((st) => ({
    id: 'st-' + Math.random().toString(36).substring(2, 9),
    title: st.title,
    completed: false,
  }));

  return {
    id: idGenerator(),
    title: template.name,
    description: template.description,
    category: template.category,
    priority: template.priority,
    status: 'todo',
    dueDate: options.dueDate || todayStr,
    dueTime: options.dueTime,
    tags: template.tags ? [...template.tags] : [],
    subtasks: subtasks && subtasks.length > 0 ? subtasks : undefined,
    createdAt: Date.now(),
  };
}

/* =====================================================================
   TEST SUITE: Feature F11 (Task Duplication & Quick Templates)
   ===================================================================== */

test('F11 - Title Formatter: Appends (Copy) to standard title', () => {
  assert.equal(generateDuplicateTitle('Ship v2 release'), 'Ship v2 release (Copy)');
});

test('F11 - Title Formatter: Trims whitespace before appending (Copy)', () => {
  assert.equal(generateDuplicateTitle('  Audit security tokens   '), 'Audit security tokens (Copy)');
});

test('F11 - Title Formatter: Increments (Copy) to (Copy 2)', () => {
  assert.equal(generateDuplicateTitle('Ship v2 release (Copy)'), 'Ship v2 release (Copy 2)');
});

test('F11 - Title Formatter: Increments (Copy 2) to (Copy 3)', () => {
  assert.equal(generateDuplicateTitle('Ship v2 release (Copy 2)'), 'Ship v2 release (Copy 3)');
});

test('F11 - Title Formatter: Correctly increments multi-digit copy numbers (Copy 9 -> Copy 10)', () => {
  assert.equal(generateDuplicateTitle('Ship v2 release (Copy 9)'), 'Ship v2 release (Copy 10)');
  assert.equal(generateDuplicateTitle('Ship v2 release (Copy 99)'), 'Ship v2 release (Copy 100)');
});

test('F11 - Title Formatter: Preserves titles that contain inner parentheses', () => {
  assert.equal(
    generateDuplicateTitle('Refactor DB (SQLite/Dexie) (Copy)'),
    'Refactor DB (SQLite/Dexie) (Copy 2)'
  );
  assert.equal(
    generateDuplicateTitle('Meeting (with CEO)'),
    'Meeting (with CEO) (Copy)'
  );
});

test('F11 - Title Formatter: Correctly handles titles ending with the word "Copy" without parentheses', () => {
  assert.equal(generateDuplicateTitle('Review marketing Copy'), 'Review marketing Copy (Copy)');
});

test('F11 - Title Formatter: Handles empty and edge titles gracefully', () => {
  assert.equal(generateDuplicateTitle(''), '(Copy)');
  assert.equal(generateDuplicateTitle(null), '(Copy)');
  assert.equal(generateDuplicateTitle(undefined), '(Copy)');
});

test('F11 - Duplication: Resets completed status to "todo" and clears completedAt', () => {
  const source = {
    id: 't-123',
    title: 'Review PR',
    status: 'completed',
    completedAt: 1730000000000,
    priority: 'high',
    category: 'Work',
    dueDate: '2026-11-07',
    createdAt: 1729000000000,
  };

  const copy = duplicateTaskData(source);
  assert.equal(copy.status, 'todo');
  assert.equal(copy.completedAt, undefined);
  assert.notEqual(copy.id, source.id);
  assert.ok(copy.createdAt >= source.createdAt);
  assert.equal(copy.title, 'Review PR (Copy)');
  assert.equal(copy.priority, 'high');
  assert.equal(copy.category, 'Work');
  assert.equal(copy.dueDate, '2026-11-07');
});

test('F11 - Duplication: Resets in_progress status to "todo"', () => {
  const source = {
    id: 't-456',
    title: 'Draft architecture',
    status: 'in_progress',
    priority: 'urgent',
    category: 'Work',
    dueDate: '2026-11-08',
    createdAt: 1729500000000,
  };

  const copy = duplicateTaskData(source);
  assert.equal(copy.status, 'todo');
  assert.equal(copy.title, 'Draft architecture (Copy)');
});

test('F11 - Duplication: Preserves optional fields (description, dueTime, reminderPreset, tags)', () => {
  const source = {
    id: 't-789',
    title: 'Client Demo',
    description: 'Present milestone 3 deliverables',
    status: 'todo',
    priority: 'high',
    category: 'Work',
    dueDate: '2026-11-10',
    dueTime: '15:30',
    reminderEnabled: true,
    reminderPreset: '15m_before',
    reminderTime: '15:15',
    tags: ['client', 'm3'],
    createdAt: 1729600000000,
  };

  const copy = duplicateTaskData(source);
  assert.equal(copy.description, 'Present milestone 3 deliverables');
  assert.equal(copy.dueTime, '15:30');
  assert.equal(copy.reminderEnabled, true);
  assert.equal(copy.reminderPreset, '15m_before');
  assert.equal(copy.reminderTime, '15:15');
  assert.deepEqual(copy.tags, ['client', 'm3']);
});

test('F11 - Duplication: Deep clones subtasks, resets completed to false, and assigns new IDs', () => {
  const source = {
    id: 't-parent',
    title: 'Deploy to Staging',
    status: 'completed',
    completedAt: 1730100000000,
    priority: 'high',
    category: 'Work',
    dueDate: '2026-11-07',
    subtasks: [
      { id: 'st-1', title: 'Run migrations', completed: true },
      { id: 'st-2', title: 'Warm cache', completed: true },
      { id: 'st-3', title: 'Smoke test login', completed: false },
    ],
    createdAt: 1729700000000,
  };

  const copy = duplicateTaskData(source);
  assert.ok(Array.isArray(copy.subtasks));
  assert.equal(copy.subtasks.length, 3);

  // All subtasks must have completion reset to false
  assert.equal(copy.subtasks[0].completed, false);
  assert.equal(copy.subtasks[1].completed, false);
  assert.equal(copy.subtasks[2].completed, false);

  // All subtasks must receive new distinct IDs
  assert.notEqual(copy.subtasks[0].id, 'st-1');
  assert.notEqual(copy.subtasks[1].id, 'st-2');
  assert.notEqual(copy.subtasks[2].id, 'st-3');

  // Titles must be preserved in exact order
  assert.equal(copy.subtasks[0].title, 'Run migrations');
  assert.equal(copy.subtasks[1].title, 'Warm cache');
  assert.equal(copy.subtasks[2].title, 'Smoke test login');
});

test('F11 - Templates: Catalog integrity verification', () => {
  assert.ok(BUILTIN_TASK_TEMPLATES.length >= 5, 'Must provide at least 5 built-in templates');

  const validPriorities = new Set(['low', 'medium', 'high', 'urgent']);
  for (const tpl of BUILTIN_TASK_TEMPLATES) {
    assert.ok(tpl.id.startsWith('tpl-'), `Template ID must start with tpl-, got ${tpl.id}`);
    assert.ok(tpl.name.trim().length > 0, 'Template name cannot be empty');
    assert.ok(tpl.description.trim().length > 0, 'Template description cannot be empty');
    assert.ok(validPriorities.has(tpl.priority), `Invalid priority: ${tpl.priority}`);
    assert.ok(tpl.category.trim().length > 0, 'Template category cannot be empty');
    assert.ok(Array.isArray(tpl.subtasks) && tpl.subtasks.length > 0, 'Template must include subtasks');
  }
});

test('F11 - Templates: Instantiation creates fully valid Task conforming to schema', () => {
  const tpl = BUILTIN_TASK_TEMPLATES.find((t) => t.id === 'tpl-deep-work');
  assert.ok(tpl);

  const newTask = createTaskFromTemplateData(tpl, { today: '2026-11-07' });

  assert.ok(newTask.id.startsWith('t-'));
  assert.equal(newTask.title, 'Deep Work Session');
  assert.equal(newTask.status, 'todo');
  assert.equal(newTask.dueDate, '2026-11-07');
  assert.equal(newTask.priority, 'high');
  assert.equal(newTask.category, 'Work');
  assert.ok(Array.isArray(newTask.subtasks));
  assert.equal(newTask.subtasks.length, 4);

  // Verify all instantiated subtasks are uncompleted with unique IDs
  newTask.subtasks.forEach((st) => {
    assert.equal(st.completed, false);
    assert.ok(st.id.startsWith('st-'));
  });
});

test('F11 - Templates: Supports custom dueDate and dueTime overrides', () => {
  const tpl = BUILTIN_TASK_TEMPLATES.find((t) => t.id === 'tpl-bug-triage');
  const task = createTaskFromTemplateData(tpl, {
    dueDate: '2026-11-12',
    dueTime: '14:00',
  });

  assert.equal(task.dueDate, '2026-11-12');
  assert.equal(task.dueTime, '14:00');
  assert.equal(task.priority, 'urgent');
});

test('F11 - Stress: Sequential 10-step chained duplication tracks copy numbering correctly', () => {
  let current = {
    id: 't-root',
    title: 'Master Roadmap',
    status: 'completed',
    priority: 'high',
    category: 'Work',
    dueDate: '2026-11-07',
  };

  const expectedTitles = [
    'Master Roadmap (Copy)',
    'Master Roadmap (Copy 2)',
    'Master Roadmap (Copy 3)',
    'Master Roadmap (Copy 4)',
    'Master Roadmap (Copy 5)',
    'Master Roadmap (Copy 6)',
    'Master Roadmap (Copy 7)',
    'Master Roadmap (Copy 8)',
    'Master Roadmap (Copy 9)',
    'Master Roadmap (Copy 10)',
  ];

  for (let i = 0; i < 10; i++) {
    current = duplicateTaskData(current);
    assert.equal(current.title, expectedTitles[i]);
    assert.equal(current.status, 'todo');
  }
});

test('F11 - Stress: High-volume 1,000 tasks duplication performance (< 25ms)', () => {
  const source = {
    id: 't-source',
    title: 'Benchmark Task',
    status: 'completed',
    completedAt: Date.now(),
    priority: 'urgent',
    category: 'Work',
    dueDate: '2026-11-07',
    subtasks: [
      { id: 'st-1', title: 'Step 1', completed: true },
      { id: 'st-2', title: 'Step 2', completed: false },
    ],
  };

  const idSet = new Set();
  const start = performance.now();

  for (let i = 0; i < 1000; i++) {
    const copy = duplicateTaskData(source);
    idSet.add(copy.id);
  }

  const elapsed = performance.now() - start;
  assert.equal(idSet.size, 1000, 'All 1,000 duplicated tasks must receive unique IDs');
  assert.ok(elapsed < 25, `Duplicating 1,000 tasks must take under 25ms (took ${elapsed.toFixed(2)}ms)`);
});
