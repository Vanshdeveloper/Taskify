import type { Task, TaskTemplate, Subtask } from '../types';

export type { TaskTemplate };

export interface SubtaskTemplate {
  title: string;
}

/**
 * Intelligent Title Duplication Formatter
 * Rules:
 *  - "Title" -> "Title (Copy)"
 *  - "Title (Copy)" -> "Title (Copy 2)"
 *  - "Title (Copy 2)" -> "Title (Copy 3)"
 *  - "Title (Copy N)" -> "Title (Copy N+1)"
 *  - Preserves titles with parentheses: "Sprint Review (Q4) (Copy)" -> "Sprint Review (Q4) (Copy 2)"
 *  - Trims extraneous whitespace safely
 */
export function generateDuplicateTitle(originalTitle?: string | null): string {
  const trimmed = (originalTitle || '').trim();
  const match = trimmed.match(/^(.*?)\s*\(Copy(?:\s*(\d+))?\)$/);
  if (!match) {
    return trimmed ? `${trimmed} (Copy)` : '(Copy)';
  }
  const base = match[1].trim();
  const count = match[2] ? parseInt(match[2], 10) : 1;
  return `${base} (Copy ${count + 1})`;
}

/**
 * Subtask cloner that resets completion and assigns unique IDs
 */
export function cloneSubtasks(
  subtasks?: Array<{ id?: string; title: string; completed?: boolean }>,
  idGenerator: () => string = () => 'st-' + Math.random().toString(36).substring(2, 9)
): Subtask[] | undefined {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return undefined;
  return subtasks.map((st) => ({
    id: idGenerator(),
    title: st.title,
    completed: false,
  }));
}

/**
 * Pure task duplication transform
 */
export function duplicateTaskData(
  source: Task,
  idGenerator: () => string = () => 't-' + Math.random().toString(36).substring(2, 9)
): Task {
  if (!source) throw new Error('Source task is required for duplication');

  const clonedSubtasks = cloneSubtasks(source.subtasks, idGenerator);

  const duplicated: Task = {
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

/**
 * Built-in Quick Task Templates catalog
 */
export const BUILTIN_TASK_TEMPLATES: TaskTemplate[] = [
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
    description: 'Review last week accomplishments and calibrate incoming weekly goals',
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

/**
 * Instantiates a Task from a template definition
 */
export function createTaskFromTemplateData(
  template: TaskTemplate,
  options: { today?: string; dueDate?: string; dueTime?: string } = {},
  idGenerator: () => string = () => 't-' + Math.random().toString(36).substring(2, 9)
): Task {
  if (!template) throw new Error('Template is required');

  const todayStr = options.today || new Date().toISOString().split('T')[0];
  const subtasks = template.subtasks?.map((st) => ({
    id: idGenerator(),
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
