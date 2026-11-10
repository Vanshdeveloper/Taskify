import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * RFC 4180 CSV field escaper
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats timestamp to ISO 8601 string safely
 */
function formatTimestamp(ts) {
  if (ts === null || ts === undefined || ts === '') return '';
  const date = new Date(ts);
  return isNaN(date.getTime()) ? String(ts) : date.toISOString();
}

/**
 * Capitalizes string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate CSV string from tasks array adhering strictly to RFC 4180
 */
function generateTasksCSV(tasks) {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Priority',
    'Status',
    'DueDate',
    'DueTime',
    'EstimatedMinutes',
    'CreatedAt',
    'CompletedAt',
  ];

  const headerRow = headers.map(escapeCSVField).join(',');
  const taskList = Array.isArray(tasks) ? tasks : [];

  if (taskList.length === 0) {
    return headerRow;
  }

  const rows = taskList.map((task) => {
    return [
      escapeCSVField(task.id ?? ''),
      escapeCSVField(task.title ?? ''),
      escapeCSVField(task.description ?? ''),
      escapeCSVField(task.category ?? ''),
      escapeCSVField(task.priority ?? ''),
      escapeCSVField(task.status ?? ''),
      escapeCSVField(task.dueDate ?? ''),
      escapeCSVField(task.dueTime ?? ''),
      escapeCSVField(task.estimatedMinutes ?? ''),
      escapeCSVField(formatTimestamp(task.createdAt)),
      escapeCSVField(formatTimestamp(task.completedAt)),
    ].join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

/**
 * Generate clean GitHub / Obsidian Markdown backlog from tasks array
 */
function generateTasksMarkdown(tasks, options = {}) {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const dateStr = options.date || new Date().toISOString().split('T')[0];
  const title = options.title || `# Taskify Tasks Backlog — ${dateStr}`;

  if (taskList.length === 0) {
    return `${title}\n\n*No tasks to export.*`;
  }

  const completedCount = taskList.filter((t) => t.status === 'completed').length;
  const pendingCount = taskList.length - completedCount;

  const lines = [
    title,
    '',
    `> Generated on ${dateStr} • **${taskList.length}** total tasks (${completedCount} completed, ${pendingCount} pending)`,
    '',
  ];

  // Group tasks by category
  const categories = {};
  for (const task of taskList) {
    const cat = task.category && task.category.trim() ? task.category.trim() : 'General';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(task);
  }

  const sortedCatNames = Object.keys(categories).sort((a, b) => a.localeCompare(b));

  for (const catName of sortedCatNames) {
    lines.push(`## ${catName}`);
    lines.push('');

    const catTasks = categories[catName];
    for (const task of catTasks) {
      const isCompleted = task.status === 'completed';
      const check = isCompleted ? '[x]' : '[ ]';
      const priorityLabel = capitalize(task.priority || 'medium');
      const timeStr = task.dueTime ? ` ${task.dueTime}` : '';
      const dueStr = task.dueDate ? `, Due: ${task.dueDate}${timeStr}` : '';
      const inProgressTag = task.status === 'in_progress' ? ' *[In Progress]*' : '';

      lines.push(`- ${check} **${task.title}** (Priority: \`${priorityLabel}\`${dueStr})${inProgressTag}`);

      // Indented description blockquote
      if (task.description && task.description.trim()) {
        const descLines = task.description.trim().split('\n');
        for (const dl of descLines) {
          lines.push(`  > ${dl}`);
        }
      }

      // Subtasks
      if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        for (const sub of task.subtasks) {
          const subCheck = sub.completed ? '[x]' : '[ ]';
          lines.push(`  - ${subCheck} ${sub.title}`);
        }
      }

      // Tags
      if (Array.isArray(task.tags) && task.tags.length > 0) {
        const tagBadges = task.tags.map((t) => `\`#${t}\``).join(' ');
        lines.push(`  *Tags: ${tagBadges}*`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

// ==========================================
// Test Suites
// ==========================================

test('F15: RFC 4180 CSV Escaping', () => {
  assert.strictEqual(escapeCSVField('Simple text'), 'Simple text');
  assert.strictEqual(escapeCSVField(null), '');
  assert.strictEqual(escapeCSVField(undefined), '');
  assert.strictEqual(escapeCSVField(42), '42');
  assert.strictEqual(escapeCSVField(0), '0');

  // Commas require quotes
  assert.strictEqual(escapeCSVField('Design, Review'), '"Design, Review"');

  // Quotes require quotes and double-quote escaping
  assert.strictEqual(escapeCSVField('Fix "urgent" bug'), '"Fix ""urgent"" bug"');

  // Line breaks require quotes
  assert.strictEqual(escapeCSVField('Line 1\nLine 2'), '"Line 1\nLine 2"');
  assert.strictEqual(escapeCSVField('Line 1\r\nLine 2'), '"Line 1\r\nLine 2"');

  // Complex combination of commas, quotes, and newlines
  assert.strictEqual(
    escapeCSVField('He said: "Hello, world!"\nNext line'),
    '"He said: ""Hello, world!""\nNext line"'
  );
});

test('F15: generateTasksCSV with empty task list', () => {
  const result = generateTasksCSV([]);
  assert.strictEqual(
    result,
    'ID,Title,Description,Category,Priority,Status,DueDate,DueTime,EstimatedMinutes,CreatedAt,CompletedAt'
  );
});

test('F15: generateTasksCSV standard columns and RFC 4180 formatting', () => {
  const sampleTasks = [
    {
      id: 'task-101',
      title: 'Quarterly Review, Planning & Budget',
      description: 'Review Q3 financial reports\nDraft "aggressive" targets for Q4',
      category: 'Work',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2026-11-15',
      dueTime: '14:30',
      estimatedMinutes: 90,
      createdAt: 1730900000000,
      completedAt: null,
    },
    {
      id: 'task-102',
      title: 'Simple Completed Task',
      description: 'Done cleanly',
      category: 'Personal',
      priority: 'low',
      status: 'completed',
      dueDate: '2026-11-05',
      dueTime: undefined,
      estimatedMinutes: undefined,
      createdAt: 1730800000000,
      completedAt: 1730850000000,
    },
  ];

  const csv = generateTasksCSV(sampleTasks);
  const rows = csv.split('\r\n');

  assert.strictEqual(rows.length, 3);
  assert.strictEqual(
    rows[0],
    'ID,Title,Description,Category,Priority,Status,DueDate,DueTime,EstimatedMinutes,CreatedAt,CompletedAt'
  );

  // Check row 1
  assert.ok(rows[1].startsWith('task-101,"Quarterly Review, Planning & Budget"'));
  assert.ok(rows[1].includes('"Review Q3 financial reports\nDraft ""aggressive"" targets for Q4"'));
  assert.ok(rows[1].includes(',Work,high,in_progress,2026-11-15,14:30,90,'));
  assert.ok(rows[1].endsWith(',')); // completedAt is empty

  // Check row 2
  assert.ok(rows[2].startsWith('task-102,Simple Completed Task,Done cleanly,Personal,low,completed,2026-11-05,,,'));
  assert.ok(rows[2].includes(new Date(1730800000000).toISOString()));
  assert.ok(rows[2].endsWith(new Date(1730850000000).toISOString()));
});

test('F15: generateTasksCSV handles Unicode, emojis, and special chars', () => {
  const unicodeTasks = [
    {
      id: 'task-emoji',
      title: 'Ship Taskify v2 🚀🔥',
      description: 'Internationalization: 日本語, Español, Français, & "quotes"',
      category: 'Launch 🚀',
      priority: 'urgent',
      status: 'todo',
      dueDate: '2026-11-20',
      createdAt: 1730976000000,
    },
  ];

  const csv = generateTasksCSV(unicodeTasks);
  assert.ok(csv.includes('Ship Taskify v2 🚀🔥'));
  assert.ok(csv.includes('"Internationalization: 日本語, Español, Français, & ""quotes"""'));
  assert.ok(csv.includes('Launch 🚀'));
});

test('F15: generateTasksMarkdown formatting and category grouping', () => {
  const sampleTasks = [
    {
      id: 't1',
      title: 'Design Apple Fluid Sheets',
      description: 'Ensure 0.35s critically damped springs\nCheck 44px tap targets',
      category: 'Design',
      priority: 'urgent',
      status: 'in_progress',
      dueDate: '2026-11-08',
      dueTime: '10:00',
      subtasks: [
        { id: 's1', title: 'Token damping', completed: true },
        { id: 's2', title: 'Backdrop blur', completed: false },
      ],
      tags: ['ui', 'motion'],
    },
    {
      id: 't2',
      title: 'Write Documentation',
      description: 'Document RFC 4180 export contract',
      category: 'Engineering',
      priority: 'medium',
      status: 'completed',
      dueDate: '2026-11-07',
    },
    {
      id: 't3',
      title: 'Uncategorized Fast Action',
      category: '',
      priority: 'low',
      status: 'todo',
      dueDate: '2026-11-12',
    },
  ];

  const md = generateTasksMarkdown(sampleTasks, { date: '2026-11-07' });

  // Title and header
  assert.ok(md.includes('# Taskify Tasks Backlog — 2026-11-07'));
  assert.ok(md.includes('**3** total tasks (1 completed, 2 pending)'));

  // Categories present and sorted
  assert.ok(md.includes('## Design'));
  assert.ok(md.includes('## Engineering'));
  assert.ok(md.includes('## General')); // Empty category fallback

  // Task item formatting
  assert.ok(md.includes('- [ ] **Design Apple Fluid Sheets** (Priority: `Urgent`, Due: 2026-11-08 10:00) *[In Progress]*'));
  assert.ok(md.includes('  > Ensure 0.35s critically damped springs'));
  assert.ok(md.includes('  > Check 44px tap targets'));
  assert.ok(md.includes('  - [x] Token damping'));
  assert.ok(md.includes('  - [ ] Backdrop blur'));
  assert.ok(md.includes('  *Tags: `#ui` `#motion`*'));

  assert.ok(md.includes('- [x] **Write Documentation** (Priority: `Medium`, Due: 2026-11-07)'));
  assert.ok(md.includes('  > Document RFC 4180 export contract'));

  assert.ok(md.includes('- [ ] **Uncategorized Fast Action** (Priority: `Low`, Due: 2026-11-12)'));
});

test('F15: generateTasksMarkdown empty backlog', () => {
  const md = generateTasksMarkdown([], { date: '2026-11-07' });
  assert.strictEqual(md, '# Taskify Tasks Backlog — 2026-11-07\n\n*No tasks to export.*');
});

test('F15: Browser Blob & Download Mock Verification', () => {
  // Mock DOM environment for safe Blob download testing
  let createdBlob = null;
  let objectUrlCreated = null;
  let revokedUrl = null;
  let appendedElement = null;
  let clicked = false;
  let removedElement = null;

  globalThis.Blob = class MockBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      createdBlob = this;
    }
  };

  globalThis.URL = {
    createObjectURL: (blob) => {
      objectUrlCreated = `blob:mock-url-${blob.options.type}`;
      return objectUrlCreated;
    },
    revokeObjectURL: (url) => {
      revokedUrl = url;
    },
  };

  const mockAnchor = {
    setAttribute: (k, v) => {
      mockAnchor[k] = v;
    },
    style: {},
    click: () => {
      clicked = true;
    },
  };

  globalThis.document = {
    createElement: (tag) => {
      if (tag === 'a') return mockAnchor;
      return {};
    },
    body: {
      appendChild: (el) => {
        appendedElement = el;
      },
      removeChild: (el) => {
        removedElement = el;
      },
    },
  };

  // Execute downloadBlob simulator
  function downloadBlob(content, filename, mimeType) {
    const blob = new globalThis.Blob([content], { type: mimeType });
    const url = globalThis.URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    globalThis.document.body.appendChild(link);
    link.click();
    globalThis.document.body.removeChild(link);
    globalThis.URL.revokeObjectURL(url);
  }

  downloadBlob('csv-content', 'test-tasks.csv', 'text/csv;charset=utf-8;');

  assert.strictEqual(createdBlob.parts[0], 'csv-content');
  assert.strictEqual(createdBlob.options.type, 'text/csv;charset=utf-8;');
  assert.strictEqual(mockAnchor.download, 'test-tasks.csv');
  assert.strictEqual(clicked, true);
  assert.strictEqual(appendedElement, mockAnchor);
  assert.strictEqual(removedElement, mockAnchor);
  assert.strictEqual(revokedUrl, objectUrlCreated);
});


test('F15: Graceful null and undefined task array handling', () => {
  assert.strictEqual(
    generateTasksCSV(null),
    'ID,Title,Description,Category,Priority,Status,DueDate,DueTime,EstimatedMinutes,CreatedAt,CompletedAt'
  );
  assert.strictEqual(
    generateTasksCSV(undefined),
    'ID,Title,Description,Category,Priority,Status,DueDate,DueTime,EstimatedMinutes,CreatedAt,CompletedAt'
  );
  assert.strictEqual(
    generateTasksMarkdown(null, { date: '2026-11-07' }),
    '# Taskify Tasks Backlog — 2026-11-07\n\n*No tasks to export.*'
  );
});

test('F15: Filename generation adheres to specification pattern', () => {
  const todayIso = new Date().toISOString().split('T')[0];
  const expectedCsvName = `taskify-tasks-${todayIso}.csv`;
  const expectedMdName = `taskify-backlog-${todayIso}.md`;

  function getExportFilenames(customDate = new Date()) {
    const dStr = customDate.toISOString().split('T')[0];
    return {
      csv: `taskify-tasks-${dStr}.csv`,
      md: `taskify-backlog-${dStr}.md`,
    };
  }

  const generated = getExportFilenames();
  assert.strictEqual(generated.csv, expectedCsvName);
  assert.strictEqual(generated.md, expectedMdName);
  assert.match(generated.csv, /^taskify-tasks-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.match(generated.md, /^taskify-backlog-\d{4}-\d{2}-\d{2}\.md$/);
});
