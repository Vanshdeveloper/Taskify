/**
 * Daypart Motivational Greetings & Check-in System
 * 
 * Delivers contextual morning, afternoon, and night notifications informing the user
 * of their pending tasks and daily habits. If everything is checked off, delivers
 * uplifting, motivating praise to reward consistency.
 */

export type Daypart = 'morning' | 'afternoon' | 'night';

export interface DaypartSlot {
  slotId: Daypart;
  hour: number;
  minute: number;
  timeStr: string;
  label: string;
}

export const DAYPART_SCHEDULE: DaypartSlot[] = [
  { slotId: 'morning', hour: 8, minute: 30, timeStr: '08:30', label: 'Morning Kickoff' },
  { slotId: 'afternoon', hour: 13, minute: 30, timeStr: '13:30', label: 'Midday Momentum' },
  { slotId: 'night', hour: 20, minute: 30, timeStr: '20:30', label: 'Evening Debrief' },
];

export interface DaypartNotification {
  daypart: Daypart;
  title: string;
  body: string;
  emoji: string;
  isAllDone: boolean;
}

/**
 * Determine current daypart based on 24-hour hour number
 */
export function getDaypartForHour(hour: number): Daypart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

/**
 * Generate uplifting daypart greeting based on pending tasks & habits
 */
export function generateDaypartGreeting(
  daypart: Daypart,
  userName: string,
  pendingTasksCount: number,
  pendingHabitsCount: number
): DaypartNotification {
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

  // Formatting counts
  const parts: string[] = [];
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
