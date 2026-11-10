import type { Task } from '../types';

/**
 * Standard RFC 4180 CSV field escaper.
 * If a field contains commas, double quotes, carriage returns, or line feeds,
 * it is enclosed in double quotes with internal quotes escaped as double double-quotes ("").
 */
export function escapeCSVField(value: unknown): string {
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
 * Safely converts timestamps (ms number, ISO string, etc.) to standard ISO 8601 string.
 */
export function formatTimestamp(ts?: number | string | null): string {
  if (ts === null || ts === undefined || ts === '') return '';
  const date = new Date(ts);
  return isNaN(date.getTime()) ? String(ts) : date.toISOString();
}

/**
 * Capitalizes string for display
 */
export function capitalize(str?: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates an RFC 4180 compliant CSV string representing task data.
 * Columns: ID, Title, Description, Category, Priority, Status, DueDate, DueTime, EstimatedMinutes, CreatedAt, CompletedAt
 */
export function generateTasksCSV(tasks: Task[]): string {
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
      escapeCSVField((task as any).estimatedMinutes ?? ''),
      escapeCSVField(formatTimestamp(task.createdAt)),
      escapeCSVField(formatTimestamp(task.completedAt)),
    ].join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

/**
 * Generates a clean, structured GitHub / Obsidian-compatible Markdown backlog document.
 * Tasks are grouped by category, with checkbox items, priorities, due dates, indented blockquote descriptions, and subtasks.
 */
export function generateTasksMarkdown(
  tasks: Task[],
  options?: { date?: string; title?: string }
): string {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const dateStr = options?.date || new Date().toISOString().split('T')[0];
  const title = options?.title || `# Taskify Tasks Backlog — ${dateStr}`;

  if (taskList.length === 0) {
    return `${title}\n\n*No tasks to export.*`;
  }

  const completedCount = taskList.filter((t) => t.status === 'completed').length;
  const pendingCount = taskList.length - completedCount;

  const lines: string[] = [
    title,
    '',
    `> Generated on ${dateStr} • **${taskList.length}** total tasks (${completedCount} completed, ${pendingCount} pending)`,
    '',
  ];

  // Group tasks by category
  const categories: Record<string, Task[]> = {};
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

      // Subtasks support (forward compatible with M3/M4)
      if (Array.isArray((task as any).subtasks) && (task as any).subtasks.length > 0) {
        for (const sub of (task as any).subtasks) {
          const subCheck = sub.completed ? '[x]' : '[ ]';
          lines.push(`  - ${subCheck} ${sub.title}`);
        }
      }

      // Tags support
      if (Array.isArray(task.tags) && task.tags.length > 0) {
        const tagBadges = task.tags.map((t) => `\`#${t}\``).join(' ');
        lines.push(`  *Tags: ${tagBadges}*`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * Triggers a safe browser file download using standard Blob and URL.createObjectURL.
 * Cleans up DOM elements and revokes object URL to prevent memory leaks.
 */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Client-side export of tasks to CSV file format adhering to RFC 4180.
 * Filename format: taskify-tasks-YYYY-MM-DD.csv
 */
export function exportTasksToCSV(tasks: Task[], customFilename?: string): void {
  const csvContent = generateTasksCSV(tasks);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `taskify-tasks-${dateStr}.csv`;
  // Prepend UTF-8 BOM (\uFEFF) for seamless Microsoft Excel compatibility across Windows/macOS
  downloadBlob('\uFEFF' + csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Client-side export of tasks to Markdown backlog format for Obsidian, GitHub, or Notion.
 * Filename format: taskify-backlog-YYYY-MM-DD.md
 */
export function exportTasksToMarkdown(tasks: Task[], customFilename?: string): void {
  const mdContent = generateTasksMarkdown(tasks);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `taskify-backlog-${dateStr}.md`;
  downloadBlob(mdContent, filename, 'text/markdown;charset=utf-8;');
}
