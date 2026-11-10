import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateDuplicateTitle,
  duplicateTaskData,
  cloneSubtasks,
  createTaskFromTemplateData,
  BUILTIN_TASK_TEMPLATES,
} from '../src/utils/taskTemplates.ts';
import {
  escapeCSVField,
  generateTasksCSV,
  generateTasksMarkdown,
  exportTasksToCSV,
  exportTasksToMarkdown,
  formatTimestamp,
  capitalize,
} from '../src/utils/taskExport.ts';

/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE: Milestone 3 Challenger 1
 * ============================================================================
 * Focus:
 *  1. Task Duplication: 100 sequential chained iterations & title edge cases
 *  2. Title Formatter: Whitespace, emojis, unicode, parentheses, regex meta-chars
 *  3. RFC 4180 CSV Export: Full escaping, newlines, quotes, UTF-8 BOM, round-trip
 *  4. Markdown Export: Category grouping, checklists, blockquotes, subtasks, tags
 *  5. 5,000 Tasks Fuzzing & Performance Benchmark (< 50ms execution gate)
 *  6. Static source compliance with Apple Design and Gravitas directives
 */

/**
 * Deterministic RFC 4180 CSV parser for empirical round-trip verification.
 * Follows RFC 4180 §2 rules for CRLF, delimiters, quotes, and escaped quotes.
 */
function parseRFC4180(csvString) {
  const records = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = csvString.length;

  while (i < len) {
    const ch = csvString[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && csvString[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        if (i + 1 < len && csvString[i + 1] === '\n') {
          i++;
        }
        row.push(field);
        records.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field);
        records.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  return records;
}

/* =====================================================================
   SUITE 1: Task Duplication — 100 Sequential Chained Iterations
   ===================================================================== */

test('M3-CHALLENGE-01: 100 sequential chained task duplications track copy numbers monotonically', () => {
  let currentTask = {
    id: 't-init',
    title: 'Base Architecture Sprint',
    description: 'Initial root task for sequential chain test',
    category: 'Engineering',
    priority: 'high',
    status: 'completed',
    completedAt: 1730000000000,
    dueDate: '2026-11-07',
    dueTime: '17:00',
    tags: ['core', 'infra'],
    subtasks: [
      { id: 'st-1', title: 'Step 1', completed: true },
      { id: 'st-2', title: 'Step 2', completed: true },
    ],
    createdAt: 1729000000000,
  };

  const seenIds = new Set([currentTask.id]);
  const seenSubtaskIds = new Set(['st-1', 'st-2']);

  for (let i = 1; i <= 100; i++) {
    const prevTask = currentTask;
    currentTask = duplicateTaskData(prevTask);

    // 1. Verify title exact increment pattern
    const expectedTitle = i === 1
      ? 'Base Architecture Sprint (Copy)'
      : `Base Architecture Sprint (Copy ${i})`;
    assert.strictEqual(
      currentTask.title,
      expectedTitle,
      `Step ${i} title mismatch: expected "${expectedTitle}", got "${currentTask.title}"`
    );

    // 2. Verify state reset invariants
    assert.strictEqual(currentTask.status, 'todo', `Step ${i}: status must be reset to 'todo'`);
    assert.strictEqual(currentTask.completedAt, undefined, `Step ${i}: completedAt must be undefined`);
    assert.ok(currentTask.createdAt >= prevTask.createdAt, `Step ${i}: createdAt must be updated`);

    // 3. Verify task ID uniqueness
    assert.ok(!seenIds.has(currentTask.id), `Step ${i}: duplicate task ID generated: ${currentTask.id}`);
    seenIds.add(currentTask.id);

    // 4. Verify subtasks deep cloning and completion reset
    assert.ok(Array.isArray(currentTask.subtasks), `Step ${i}: subtasks must exist`);
    assert.strictEqual(currentTask.subtasks.length, 2, `Step ${i}: subtask count preserved`);
    for (const st of currentTask.subtasks) {
      assert.strictEqual(st.completed, false, `Step ${i}: subtask ${st.id} completion must be reset`);
      assert.ok(!seenSubtaskIds.has(st.id), `Step ${i}: duplicate subtask ID generated: ${st.id}`);
      seenSubtaskIds.add(st.id);
    }
  }

  assert.strictEqual(seenIds.size, 101, 'All 100 duplicated tasks plus initial must have distinct IDs');
  assert.strictEqual(seenSubtaskIds.size, 202, 'All subtasks across 100 iterations must have distinct IDs');
  assert.strictEqual(currentTask.title, 'Base Architecture Sprint (Copy 100)');
});

/* =====================================================================
   SUITE 2: Title Duplication Formatter — Adversarial Edge Cases
   ===================================================================== */

test('M3-CHALLENGE-02: generateDuplicateTitle edge cases and boundary conditions', () => {
  // Empty, null, undefined
  assert.strictEqual(generateDuplicateTitle(''), '(Copy)');
  assert.strictEqual(generateDuplicateTitle(null), '(Copy)');
  assert.strictEqual(generateDuplicateTitle(undefined), '(Copy)');

  // Pure whitespace strings
  assert.strictEqual(generateDuplicateTitle('   '), '(Copy)');
  assert.strictEqual(generateDuplicateTitle('\t\t\n'), '(Copy)');

  // Leading and trailing whitespace with normal titles
  assert.strictEqual(generateDuplicateTitle('  Review PR  '), 'Review PR (Copy)');
  assert.strictEqual(generateDuplicateTitle('\tAudit Security\t'), 'Audit Security (Copy)');

  // Titles naturally ending with word "Copy" without parentheses
  assert.strictEqual(generateDuplicateTitle('Ad Copy'), 'Ad Copy (Copy)');
  assert.strictEqual(generateDuplicateTitle('Review marketing Copy'), 'Review marketing Copy (Copy)');
  assert.strictEqual(generateDuplicateTitle('Carbon Copy'), 'Carbon Copy (Copy)');

  // Nested and multi-parentheses titles
  assert.strictEqual(generateDuplicateTitle('Roadmap (Q4 2026)'), 'Roadmap (Q4 2026) (Copy)');
  assert.strictEqual(generateDuplicateTitle('Roadmap (Q4 2026) (Copy)'), 'Roadmap (Q4 2026) (Copy 2)');
  assert.strictEqual(generateDuplicateTitle('Task (Phase 1) (v2.0) (Copy 9)'), 'Task (Phase 1) (v2.0) (Copy 10)');

  // Multi-digit numbers and large copy counts
  assert.strictEqual(generateDuplicateTitle('Task (Copy 99)'), 'Task (Copy 100)');
  assert.strictEqual(generateDuplicateTitle('Task (Copy 999)'), 'Task (Copy 1000)');
  assert.strictEqual(generateDuplicateTitle('Task (Copy 1000000)'), 'Task (Copy 1000001)');

  // Unicode, emojis, RTL, and CJK characters
  assert.strictEqual(generateDuplicateTitle('Ship Taskify 🚀'), 'Ship Taskify 🚀 (Copy)');
  assert.strictEqual(generateDuplicateTitle('Ship Taskify 🚀 (Copy)'), 'Ship Taskify 🚀 (Copy 2)');
  assert.strictEqual(generateDuplicateTitle('日本語タスク (Copy 3)'), '日本語タスク (Copy 4)');
  assert.strictEqual(generateDuplicateTitle('مهمة عاجلة (Copy)'), 'مهمة عاجلة (Copy 2)');
  assert.strictEqual(generateDuplicateTitle('Café & Crème brûlée'), 'Café & Crème brûlée (Copy)');

  // Regex special characters in title (must not throw or fail)
  assert.strictEqual(
    generateDuplicateTitle('Budget $100 + taxes ^.* [all] (a|b)? (Copy)'),
    'Budget $100 + taxes ^.* [all] (a|b)? (Copy 2)'
  );
  assert.strictEqual(
    generateDuplicateTitle('Price \\d+.* (Copy 3)'),
    'Price \\d+.* (Copy 4)'
  );
});

test('M3-CHALLENGE-03: ReDoS stress test on generateDuplicateTitle with 100,000 char strings', () => {
  const giantTitle = 'a'.repeat(100000) + ' (Copy 5)';
  const t0 = performance.now();
  const result = generateDuplicateTitle(giantTitle);
  const duration = performance.now() - t0;

  assert.ok(result.endsWith('(Copy 6)'));
  assert.ok(duration < 20, `Execution on 100,000 char string must be < 20ms (took ${duration.toFixed(2)}ms)`);

  // Pathological non-matching pattern with trailing parentheses
  const pathological = '('.repeat(50000) + 'Copy' + ')'.repeat(50000);
  const t1 = performance.now();
  const res2 = generateDuplicateTitle(pathological);
  const dur2 = performance.now() - t1;

  assert.ok(typeof res2 === 'string');
  assert.ok(dur2 < 20, `Pathological regex execution must be < 20ms (took ${dur2.toFixed(2)}ms)`);
});

/* =====================================================================
   SUITE 3: RFC 4180 CSV Export — Strict Escaping & Parser Round-Trip
   ===================================================================== */

test('M3-CHALLENGE-04: escapeCSVField adheres strictly to RFC 4180 rules', () => {
  // Primitives
  assert.strictEqual(escapeCSVField(''), '');
  assert.strictEqual(escapeCSVField(null), '');
  assert.strictEqual(escapeCSVField(undefined), '');
  assert.strictEqual(escapeCSVField(0), '0');
  assert.strictEqual(escapeCSVField(-100), '-100');
  assert.strictEqual(escapeCSVField(3.1415), '3.1415');

  // Fields with commas must be enclosed in double quotes
  assert.strictEqual(escapeCSVField('alpha,beta'), '"alpha,beta"');
  assert.strictEqual(escapeCSVField('1, 2, 3'), '"1, 2, 3"');

  // Fields with double quotes must be enclosed and internal quotes doubled
  assert.strictEqual(escapeCSVField('hello "world"'), '"hello ""world"""');
  assert.strictEqual(escapeCSVField('"leading quote'), '"""leading quote"');
  assert.strictEqual(escapeCSVField('trailing quote"'), '"trailing quote"""');
  assert.strictEqual(escapeCSVField('"'), '""""');
  assert.strictEqual(escapeCSVField('""'), '""""""');

  // Fields with newlines (\n, \r, \r\n) must be enclosed in double quotes
  assert.strictEqual(escapeCSVField('line1\nline2'), '"line1\nline2"');
  assert.strictEqual(escapeCSVField('line1\r\nline2'), '"line1\r\nline2"');
  assert.strictEqual(escapeCSVField('line1\rline2'), '"line1\rline2"');

  // Compound adversarial combinations
  assert.strictEqual(
    escapeCSVField('He said: "Fix this, now!"\r\nImmediate response required.'),
    '"He said: ""Fix this, now!""\r\nImmediate response required."'
  );

  // Formula injection prefixes (must be preserved verbatim in pure RFC 4180)
  assert.strictEqual(escapeCSVField('=SUM(A1:A10)'), '=SUM(A1:A10)');
  assert.strictEqual(escapeCSVField('+100,200'), '"+100,200"');
  assert.strictEqual(escapeCSVField('@username'), '@username');
  assert.strictEqual(escapeCSVField('-5'), '-5');
});

test('M3-CHALLENGE-05: generateTasksCSV RFC 4180 round-trip with complex adversarial records', () => {
  const adversarialTasks = [
    {
      id: 'adv-001',
      title: 'Fix issue #101: "Crash on comma, and quotes"',
      description: 'Step 1: Open app\r\nStep 2: Press "Run"\nStep 3: Profit, guaranteed!',
      category: 'Bug, Critical',
      priority: 'urgent',
      status: 'in_progress',
      dueDate: '2026-11-08',
      dueTime: '09:30',
      estimatedMinutes: 45,
      createdAt: 1730900000000,
      completedAt: null,
    },
    {
      id: 'adv-002',
      title: 'Unicode & HTML: <script>alert("xss")</script> & 🚀',
      description: 'Backticks `code`, pipes | and semicolons ; with tabs \t',
      category: 'Security & QA',
      priority: 'high',
      status: 'completed',
      dueDate: '2026-11-09',
      dueTime: '15:00',
      estimatedMinutes: 60,
      createdAt: 1730910000000,
      completedAt: 1730950000000,
    },
    {
      id: 'adv-003',
      title: 'Empty and boundary values',
      description: '',
      category: '',
      priority: 'low',
      status: 'todo',
      dueDate: undefined,
      dueTime: undefined,
      estimatedMinutes: undefined,
      createdAt: 1730920000000,
      completedAt: undefined,
    },
  ];

  const csv = generateTasksCSV(adversarialTasks);

  // Verify CRLF line ending on each row
  assert.ok(csv.includes('\r\n'), 'CSV must use CRLF row terminators per RFC 4180');

  // Parse back through compliant RFC 4180 parser
  const parsedRecords = parseRFC4180(csv);

  // Assert row count: 1 header + 3 data rows = 4 rows
  assert.strictEqual(parsedRecords.length, 4, `Expected 4 parsed records, got ${parsedRecords.length}`);

  // Assert header columns
  const expectedHeaders = [
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
  assert.deepStrictEqual(parsedRecords[0], expectedHeaders);

  // Assert Row 1 fidelity (with commas, double quotes, CRLF in description)
  assert.strictEqual(parsedRecords[1][0], 'adv-001');
  assert.strictEqual(parsedRecords[1][1], 'Fix issue #101: "Crash on comma, and quotes"');
  assert.strictEqual(parsedRecords[1][2], 'Step 1: Open app\r\nStep 2: Press "Run"\nStep 3: Profit, guaranteed!');
  assert.strictEqual(parsedRecords[1][3], 'Bug, Critical');
  assert.strictEqual(parsedRecords[1][4], 'urgent');
  assert.strictEqual(parsedRecords[1][5], 'in_progress');
  assert.strictEqual(parsedRecords[1][6], '2026-11-08');
  assert.strictEqual(parsedRecords[1][7], '09:30');
  assert.strictEqual(parsedRecords[1][8], '45');
  assert.strictEqual(parsedRecords[1][9], new Date(1730900000000).toISOString());
  assert.strictEqual(parsedRecords[1][10], '');

  // Assert Row 2 fidelity (Unicode, HTML, backticks, pipes, semicolons)
  assert.strictEqual(parsedRecords[2][0], 'adv-002');
  assert.strictEqual(parsedRecords[2][1], 'Unicode & HTML: <script>alert("xss")</script> & 🚀');
  assert.strictEqual(parsedRecords[2][2], 'Backticks `code`, pipes | and semicolons ; with tabs \t');
  assert.strictEqual(parsedRecords[2][3], 'Security & QA');
  assert.strictEqual(parsedRecords[2][4], 'high');
  assert.strictEqual(parsedRecords[2][5], 'completed');
  assert.strictEqual(parsedRecords[2][9], new Date(1730910000000).toISOString());
  assert.strictEqual(parsedRecords[2][10], new Date(1730950000000).toISOString());

  // Assert Row 3 fidelity (empty fields)
  assert.strictEqual(parsedRecords[3][0], 'adv-003');
  assert.strictEqual(parsedRecords[3][1], 'Empty and boundary values');
  assert.strictEqual(parsedRecords[3][2], '');
  assert.strictEqual(parsedRecords[3][3], '');
  assert.strictEqual(parsedRecords[3][6], '');
  assert.strictEqual(parsedRecords[3][7], '');
  assert.strictEqual(parsedRecords[3][8], '');
  assert.strictEqual(parsedRecords[3][10], '');
});

test('M3-CHALLENGE-06: exportTasksToCSV injects UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility', () => {
  let capturedBlobContent = null;
  let capturedMimeType = null;
  let capturedFilename = null;

  globalThis.window = globalThis;
  globalThis.Blob = class MockBlob {
    constructor(parts, options) {
      capturedBlobContent = parts.join('');
      capturedMimeType = options?.type;
    }
  };

  globalThis.URL = {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {},
  };

  const mockAnchor = {
    setAttribute: (k, v) => {
      if (k === 'download') capturedFilename = v;
    },
    style: {},
    click: () => {},
  };

  globalThis.document = {
    createElement: (tag) => (tag === 'a' ? mockAnchor : {}),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  const tasks = [{ id: 't1', title: 'Excel Test' }];
  exportTasksToCSV(tasks);

  assert.ok(capturedBlobContent !== null);
  // Verify UTF-8 BOM is the very first character (char code 0xFEFF)
  assert.strictEqual(capturedBlobContent.charCodeAt(0), 0xfeff, 'First character must be UTF-8 BOM (\\uFEFF)');
  assert.ok(capturedBlobContent.includes('ID,Title,Description'));
  assert.strictEqual(capturedMimeType, 'text/csv;charset=utf-8;');
  assert.match(capturedFilename, /^taskify-tasks-\d{4}-\d{2}-\d{2}\.csv$/);
});

/* =====================================================================
   SUITE 4: Markdown Export — Backlog Grouping & Formatting
   ===================================================================== */

test('M3-CHALLENGE-07: generateTasksMarkdown category grouping, sorting, and structure', () => {
  const sampleTasks = [
    {
      id: 'm1',
      title: 'Build Z-Index Layering',
      category: 'Zebra Operations',
      priority: 'low',
      status: 'todo',
    },
    {
      id: 'm2',
      title: 'Alpha Engine Init',
      category: 'Alpha Engine',
      priority: 'urgent',
      status: 'in_progress',
      dueDate: '2026-11-10',
      dueTime: '08:00',
    },
    {
      id: 'm3',
      title: 'Fallback Category Task',
      category: '', // should fall back to 'General'
      priority: 'medium',
      status: 'completed',
    },
    {
      id: 'm4',
      title: 'Middle Category Task',
      category: 'Beta Module',
      priority: 'high',
      status: 'todo',
      description: 'Line A\nLine B with "quotes" and `code`',
      tags: ['beta', 'v2'],
      subtasks: [
        { id: 'sb-1', title: 'Subtask Done', completed: true },
        { id: 'sb-2', title: 'Subtask Pending', completed: false },
      ],
    },
  ];

  const md = generateTasksMarkdown(sampleTasks, { date: '2026-11-07' });

  // 1. Categories must appear in alphabetical order: Alpha Engine -> Beta Module -> General -> Zebra Operations
  const alphaPos = md.indexOf('## Alpha Engine');
  const betaPos = md.indexOf('## Beta Module');
  const generalPos = md.indexOf('## General');
  const zebraPos = md.indexOf('## Zebra Operations');

  assert.ok(alphaPos !== -1 && betaPos !== -1 && generalPos !== -1 && zebraPos !== -1);
  assert.ok(alphaPos < betaPos, 'Alpha Engine must precede Beta Module');
  assert.ok(betaPos < generalPos, 'Beta Module must precede General');
  assert.ok(generalPos < zebraPos, 'General must precede Zebra Operations');

  // 2. Status formatting
  assert.ok(md.includes('- [ ] **Alpha Engine Init** (Priority: `Urgent`, Due: 2026-11-10 08:00) *[In Progress]*'));
  assert.ok(md.includes('- [x] **Fallback Category Task** (Priority: `Medium`)'));
  assert.ok(md.includes('- [ ] **Middle Category Task** (Priority: `High`)'));

  // 3. Multi-line description blockquote formatting
  assert.ok(md.includes('  > Line A\n  > Line B with "quotes" and `code`'));

  // 4. Subtasks indentation and status
  assert.ok(md.includes('  - [x] Subtask Done'));
  assert.ok(md.includes('  - [ ] Subtask Pending'));

  // 5. Tags badge formatting
  assert.ok(md.includes('  *Tags: `#beta` `#v2`*'));
});

/* =====================================================================
   SUITE 5: Large Scale Fuzzing & Performance Benchmark (5,000 Tasks)
   ===================================================================== */

test('M3-CHALLENGE-08: 5,000 Tasks Fuzzing Benchmark — CSV & Markdown (< 50ms requirement)', (t) => {
  // Generate 5,000 realistic tasks with diverse adversarial variations
  const categories = ['Work', 'Personal', 'Fitness', 'Finance', 'Engineering', 'Marketing', 'Legal', 'Operations'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['todo', 'in_progress', 'completed'];

  const fuzzedTasks = new Array(5000);

  for (let i = 0; i < 5000; i++) {
    const hasCommas = i % 2 === 0;
    const hasQuotes = i % 3 === 0;
    const hasNewlines = i % 5 === 0;

    let title = `Task #${i + 1}`;
    if (hasCommas) title += ', with comma delimiter';
    if (hasQuotes) title += ' and "nested quotes"';

    let description = `Description for task ${i + 1}`;
    if (hasNewlines) description += '\nSecond line details\r\nThird line notes';
    if (hasQuotes) description += ' with "special remarks"';

    fuzzedTasks[i] = {
      id: `task-fuzz-${i + 1}`,
      title,
      description,
      category: categories[i % categories.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      dueDate: '2026-11-' + String((i % 28) + 1).padStart(2, '0'),
      dueTime: i % 4 === 0 ? '14:30' : undefined,
      estimatedMinutes: (i % 6 + 1) * 15,
      createdAt: 1730000000000 + i * 60000,
      completedAt: statuses[i % statuses.length] === 'completed' ? 1730000000000 + i * 60000 + 3600000 : undefined,
      tags: i % 3 === 0 ? ['fuzz', `cat-${i % 5}`] : undefined,
      subtasks: i % 4 === 0 ? [
        { id: `st-fuzz-${i}-1`, title: 'Subtask Alpha', completed: true },
        { id: `st-fuzz-${i}-2`, title: 'Subtask Beta', completed: false },
      ] : undefined,
    };
  }

  // --- BENCHMARK 1: CSV Generation (< 50ms) ---
  const csvT0 = performance.now();
  const csvOutput = generateTasksCSV(fuzzedTasks);
  const csvDuration = performance.now() - csvT0;

  assert.ok(
    csvDuration < 50,
    `5,000 tasks CSV generation must execute under 50ms (actual: ${csvDuration.toFixed(2)}ms)`
  );
  assert.ok(csvOutput.length > 200000, 'CSV output must contain substantial serialized task payload');

  // Parse generated 5,000 tasks CSV with RFC 4180 parser to confirm validity
  const parseT0 = performance.now();
  const parsedRecords = parseRFC4180(csvOutput);
  const parseDuration = performance.now() - parseT0;

  // Exactly 1 header + 5,000 data rows = 5,001 rows
  assert.strictEqual(
    parsedRecords.length,
    5001,
    `5,000-task CSV parse must yield exactly 5,001 records, got ${parsedRecords.length}`
  );

  // Spot-check 100 randomly sampled rows for strict data integrity
  for (let s = 0; s < 100; s++) {
    const idx = (s * 49 + 7) % 5000;
    const task = fuzzedTasks[idx];
    const record = parsedRecords[idx + 1]; // +1 for header offset

    assert.strictEqual(record[0], task.id, `Row ${idx} ID mismatch`);
    assert.strictEqual(record[1], task.title, `Row ${idx} Title mismatch`);
    assert.strictEqual(record[2], task.description, `Row ${idx} Description mismatch`);
    assert.strictEqual(record[3], task.category, `Row ${idx} Category mismatch`);
    assert.strictEqual(record[4], task.priority, `Row ${idx} Priority mismatch`);
    assert.strictEqual(record[5], task.status, `Row ${idx} Status mismatch`);
  }

  // --- BENCHMARK 2: Markdown Generation (< 50ms) ---
  const mdT0 = performance.now();
  const mdOutput = generateTasksMarkdown(fuzzedTasks, { date: '2026-11-07' });
  const mdDuration = performance.now() - mdT0;

  assert.ok(
    mdDuration < 50,
    `5,000 tasks Markdown generation must execute under 50ms (actual: ${mdDuration.toFixed(2)}ms)`
  );
  assert.ok(mdOutput.includes('**5000** total tasks'), 'Markdown must report 5,000 total tasks');

  for (const cat of categories) {
    assert.ok(mdOutput.includes(`## ${cat}`), `Markdown must include category header ## ${cat}`);
  }

  // Record metrics for handoff report
  t.diagnostic(`5,000 Tasks CSV Generation: ${csvDuration.toFixed(2)}ms (${csvOutput.length.toLocaleString()} chars)`);
  t.diagnostic(`5,000 Tasks RFC 4180 Parse: ${parseDuration.toFixed(2)}ms (5,001 rows verified)`);
  t.diagnostic(`5,000 Tasks Markdown Generation: ${mdDuration.toFixed(2)}ms (${mdOutput.length.toLocaleString()} chars)`);
});

/* =====================================================================
   SUITE 6: Static Source Inspection & Architectural Invariants
   ===================================================================== */

test('M3-CHALLENGE-09: Production source files adhere to Apple Design & RFC 4180 contracts', () => {
  const rootDir = process.cwd();

  // 1. Check src/utils/taskExport.ts
  const exportPath = path.join(rootDir, 'src', 'utils', 'taskExport.ts');
  const exportCode = fs.readFileSync(exportPath, 'utf8');
  assert.ok(exportCode.includes('escapeCSVField'), 'taskExport.ts must export escapeCSVField');
  assert.ok(exportCode.includes('generateTasksCSV'), 'taskExport.ts must export generateTasksCSV');
  assert.ok(exportCode.includes('generateTasksMarkdown'), 'taskExport.ts must export generateTasksMarkdown');
  assert.ok(exportCode.includes('\\uFEFF'), 'taskExport.ts must prepend \\uFEFF UTF-8 BOM for Excel');
  assert.ok(exportCode.includes('URL.revokeObjectURL'), 'taskExport.ts must revoke object URLs to prevent leaks');

  // 2. Check src/utils/taskTemplates.ts
  const templatesPath = path.join(rootDir, 'src', 'utils', 'taskTemplates.ts');
  const templatesCode = fs.readFileSync(templatesPath, 'utf8');
  assert.ok(templatesCode.includes('generateDuplicateTitle'), 'taskTemplates.ts must export generateDuplicateTitle');
  assert.ok(templatesCode.includes('duplicateTaskData'), 'taskTemplates.ts must export duplicateTaskData');
  assert.ok(templatesCode.includes('BUILTIN_TASK_TEMPLATES'), 'taskTemplates.ts must export BUILTIN_TASK_TEMPLATES');
  assert.ok(BUILTIN_TASK_TEMPLATES.length >= 5, 'BUILTIN_TASK_TEMPLATES must contain at least 5 templates');

  // 3. Check src/components/tasks/TaskExportMenu.tsx for Apple Design conformance
  const exportMenuPath = path.join(rootDir, 'src', 'components', 'tasks', 'TaskExportMenu.tsx');
  const exportMenuCode = fs.readFileSync(exportMenuPath, 'utf8');
  assert.ok(
    exportMenuCode.includes('backdrop-blur') || exportMenuCode.includes('backdropBlur'),
    'TaskExportMenu must use translucent backdrop blur'
  );
  assert.ok(
    exportMenuCode.includes('min-h-[44px]') || exportMenuCode.includes('h-11') || exportMenuCode.includes('py-2'),
    'TaskExportMenu must meet Apple 44px tap target requirements'
  );

  // 4. Check src/components/tasks/TasksView.tsx for integration of F11, F12, F15, F16
  const tasksViewPath = path.join(rootDir, 'src', 'components', 'tasks', 'TasksView.tsx');
  const tasksViewCode = fs.readFileSync(tasksViewPath, 'utf8');
  assert.ok(tasksViewCode.includes('TaskExportMenu'), 'TasksView must render TaskExportMenu');
  assert.ok(tasksViewCode.includes('duplicateTask'), 'TasksView must integrate duplicateTask');
  assert.ok(tasksViewCode.includes('useTaskKeyboardNavigation'), 'TasksView must integrate keyboard navigation hook');
  assert.ok(tasksViewCode.includes('sortCriteria') || tasksViewCode.includes('sortOrder'), 'TasksView must integrate sorting');
});


/* =====================================================================
   SUITE 7: Extended Adversarial Fuzzing & Memory Footprint Invariants
   ===================================================================== */

test('M3-CHALLENGE-10: Memory footprint stability under repeated 5,000 tasks serialization', (t) => {
  const tasks = new Array(5000);
  for (let i = 0; i < 5000; i++) {
    tasks[i] = {
      id: `task-mem-${i}`,
      title: `Task ${i} with "quotes", commas, and symbols`,
      description: `Description line 1\nLine 2 for ${i}`,
      category: `Category ${i % 10}`,
      priority: 'high',
      status: 'todo',
      dueDate: '2026-11-07',
      createdAt: 1730000000000,
    };
  }

  if (globalThis.gc) {
    globalThis.gc();
  }

  const initialHeap = process.memoryUsage().heapUsed;

  // Run 5 full serializations
  for (let cycle = 0; cycle < 5; cycle++) {
    const csv = generateTasksCSV(tasks);
    const md = generateTasksMarkdown(tasks);
    assert.ok(csv.length > 100000);
    assert.ok(md.length > 100000);
  }

  if (globalThis.gc) {
    globalThis.gc();
  }

  const finalHeap = process.memoryUsage().heapUsed;
  const heapDeltaMb = (finalHeap - initialHeap) / (1024 * 1024);

  // Assert heap delta remains reasonably bounded (< 60MB increase without uncollectible leak)
  assert.ok(
    heapDeltaMb < 60,
    `Memory delta after 5 cycles of 5,000 tasks serialization must be < 60MB (got ${heapDeltaMb.toFixed(2)}MB)`
  );
  t.diagnostic(`Memory Delta after 5x 5,000 tasks runs: ${heapDeltaMb.toFixed(2)}MB`);
});

test('M3-CHALLENGE-11: Malformed and boundary data tolerance in export formatters', () => {
  // Non-array inputs must not throw and return safe fallback
  assert.strictEqual(
    generateTasksCSV(null),
    'ID,Title,Description,Category,Priority,Status,DueDate,DueTime,EstimatedMinutes,CreatedAt,CompletedAt'
  );
  assert.strictEqual(
    generateTasksCSV(undefined),
    'ID,Title,Description,Category,Priority,Status,DueDate,DueTime,EstimatedMinutes,CreatedAt,CompletedAt'
  );
  assert.strictEqual(
    generateTasksCSV({ not: 'an array' }),
    'ID,Title,Description,Category,Priority,Status,DueDate,DueTime,EstimatedMinutes,CreatedAt,CompletedAt'
  );

  // Markdown non-array inputs
  const mdNull = generateTasksMarkdown(null, { date: '2026-11-07' });
  assert.ok(mdNull.includes('*No tasks to export.*'));

  const mdObj = generateTasksMarkdown(42, { date: '2026-11-07' });
  assert.ok(mdObj.includes('*No tasks to export.*'));

  // Invalid date inputs in formatTimestamp
  assert.strictEqual(formatTimestamp(null), '');
  assert.strictEqual(formatTimestamp(undefined), '');
  assert.strictEqual(formatTimestamp(''), '');
  assert.strictEqual(formatTimestamp('invalid-date-string'), 'invalid-date-string');
  assert.strictEqual(formatTimestamp(NaN), 'NaN');

  // Tasks with sparse/undefined fields
  const sparseTasks = [
    {},
    { id: null, title: undefined, description: null },
    { id: 't-valid', createdAt: '2026-11-07T12:00:00.000Z' },
  ];
  const sparseCSV = generateTasksCSV(sparseTasks);
  const sparseRows = parseRFC4180(sparseCSV);
  assert.strictEqual(sparseRows.length, 4); // 1 header + 3 rows
});

test('M3-CHALLENGE-12: Additional title incrementer edge cases and boundary counts', () => {
  // Boundary count 0
  assert.strictEqual(generateDuplicateTitle('Task (Copy 0)'), 'Task (Copy 1)');

  // Leading zeros: Copy 01 -> Copy 2
  assert.strictEqual(generateDuplicateTitle('Task (Copy 01)'), 'Task (Copy 2)');
  assert.strictEqual(generateDuplicateTitle('Task (Copy 007)'), 'Task (Copy 8)');

  // Negative count: Copy -1 does not match \d+, so it is treated as part of the title
  assert.strictEqual(generateDuplicateTitle('Task (Copy -1)'), 'Task (Copy -1) (Copy)');

  // Non-numeric inside copy parens: Copy ABC
  assert.strictEqual(generateDuplicateTitle('Task (Copy ABC)'), 'Task (Copy ABC) (Copy)');

  // Huge integer: Copy 9007199254740990
  assert.strictEqual(
    generateDuplicateTitle('Task (Copy 9007199254740990)'),
    'Task (Copy 9007199254740991)'
  );

  // Title with spaces inside parens: "Task ( Copy )"
  // Note: match requires "(Copy...)" without space after opening parenthesis
  assert.strictEqual(generateDuplicateTitle('Task ( Copy )'), 'Task ( Copy ) (Copy)');

  // Unclosed parenthesis
  assert.strictEqual(generateDuplicateTitle('Task (Copy'), 'Task (Copy (Copy)');
});
