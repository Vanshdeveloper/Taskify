import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { ReminderPreset, Task, Habit, HabitLog } from '../types';
import { getTodayString } from '../db';
import { getDailyPoke, DAILY_POKE_SCHEDULE } from './pokeMessages';
import { DAYPART_SCHEDULE, generateDaypartGreeting } from './daypartGreetings';
import { focusTimerStore } from './focusTimer';

/**
 * Standard preset reminder time distributions for daily habits based on frequency count (1x - 5x max)
 */
export function generateDefaultReminderTimes(count: number): string[] {
  const c = Math.max(1, Math.min(5, count));
  switch (c) {
    case 1:
      return ['09:00'];
    case 2:
      return ['09:00', '18:00'];
    case 3:
      return ['09:00', '13:00', '18:00'];
    case 4:
      return ['09:00', '12:00', '15:00', '18:00'];
    case 5:
    default:
      return ['08:00', '11:00', '14:00', '17:00', '20:00'];
  }
}

/**
 * Calculate reminder time based on task's dueTime and chosen preset offset
 */
export function calculateTaskReminderTime(
  dueTime: string,
  preset: ReminderPreset,
  customTime?: string
): string {
  if (preset === 'custom') {
    return customTime || dueTime || '09:00';
  }

  if (!dueTime) {
    return '09:00';
  }

  const [hStr, mStr] = dueTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  if (isNaN(h) || isNaN(m)) {
    return dueTime;
  }

  let totalMinutes = h * 60 + m;

  if (preset === 'at_due') {
    totalMinutes = totalMinutes;
  } else if (preset === '15m_before') {
    totalMinutes = Math.max(0, totalMinutes - 15);
  } else if (preset === '1h_before') {
    totalMinutes = Math.max(0, totalMinutes - 60);
  } else if (preset === '1d_before') {
    // For 1 day before, default to same time of day or morning
    totalMinutes = Math.max(0, totalMinutes);
  }

  const remH = Math.floor(totalMinutes / 60) % 24;
  const remM = totalMinutes % 60;
  return `${String(remH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`;
}

/**
 * Format HH:MM 24-hour time to 12-hour AM/PM string (e.g. "09:00 AM")
 */
export function formatTime12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.padStart(2, '0')} ${ampm}`;
}

/**
 * Convert arbitrary string to a deterministic positive 32-bit integer ID for Android AlarmManager
 */
export function stringToIntegerId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const id = Math.abs(hash) & 0x7fffffff;
  return id === 0 ? 1 : id;
}

/**
 * Initialize high-priority notification channel for Android 8+
 */
export async function initializeNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: 'taskify_reminders',
      name: 'Taskify Reminders',
      description: 'System reminders for scheduled tasks and daily habits',
      importance: 5, // High importance for heads-up banners
      visibility: 1, // Public on lockscreen
      vibration: true,
    });
  } catch (err) {
    console.warn('[Notification] Failed to create channel:', err);
  }
}

/**
 * Request system / browser notification permission safely across native and web
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (Capacitor.isNativePlatform()) {
    try {
      await initializeNotificationChannel();
      const status = await LocalNotifications.requestPermissions();
      if (status.display === 'granted') {
        return 'granted';
      }
      return status.display === 'denied' ? 'denied' : 'default';
    } catch {
      return 'default';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return Notification.permission;
  }
}

/**
 * Synchronize native OS background alarms via @capacitor/local-notifications.
 * Ensures notifications trigger reliably even when Taskify is closed or killed!
 */
export async function syncNativeScheduledReminders(
  tasks: Task[],
  habits: Habit[],
  userName: string = 'Alex',
  habitLogs: HabitLog[] = []
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perms = await LocalNotifications.checkPermissions();
    if (perms.display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== 'granted') return;
    }

    await initializeNotificationChannel();

    // Cancel previously scheduled alarms before re-registering current state
    await LocalNotifications.cancelAll();

    const notifications: LocalNotificationSchema[] = [];
    const nowMs = Date.now();

    // Preserve active Focus/Pomodoro timer notification if running
    const timerSnap = focusTimerStore.getSnapshot();
    if (timerSnap.status === 'running' && timerSnap.remainingMs > 1000) {
      notifications.push({
        id: 99901,
        title: timerSnap.mode === 'focus' ? '🎉 Focus Session Completed!' : '☕ Break Finished!',
        body:
          timerSnap.mode === 'focus'
            ? 'Great focus! Time to take a well-deserved break.'
            : 'Ready to resume your deep work session?',
        channelId: 'taskify_reminders',
        schedule: { at: new Date(nowMs + timerSnap.remainingMs) },
        smallIcon: 'ic_stat_taskify',
        iconColor: '#f26a36',
        autoCancel: true,
      });
    }

    // 1. Schedule one-time task reminders
    tasks.forEach((t) => {
      if (t.status === 'completed' || !t.reminderEnabled) return;
      if (!t.dueDate) return;

      const targetTimes =
        t.reminderTimes && t.reminderTimes.length > 0
          ? t.reminderTimes
          : t.reminderTime || t.dueTime
          ? [t.reminderTime || t.dueTime!]
          : [];

      targetTimes.forEach((targetTime) => {
        const [yearStr, monthStr, dayStr] = t.dueDate.split('-');
        const [hStr, mStr] = targetTime.split(':');
        if (yearStr && monthStr && dayStr && hStr && mStr) {
          const scheduledDate = new Date(
            parseInt(yearStr, 10),
            parseInt(monthStr, 10) - 1,
            parseInt(dayStr, 10),
            parseInt(hStr, 10),
            parseInt(mStr, 10),
            0
          );

          // Only schedule if the alarm is in the future (plus 5s margin)
          if (scheduledDate.getTime() > nowMs + 5000) {
            const bodyText = t.dueTime
              ? `Due at ${formatTime12Hour(t.dueTime)} • ${t.category}`
              : `Scheduled for today • ${t.category}`;
            const expandedBody = t.description ? `${bodyText}\n${t.description}` : bodyText;
            notifications.push({
              id: stringToIntegerId(`task-${t.id}-${t.dueDate}-${targetTime}`),
              title: `Task Reminder: ${t.title}`,
              body: bodyText,
              largeBody: expandedBody,
              summaryText: t.category || 'Task Reminder',
              channelId: 'taskify_reminders',
              smallIcon: 'ic_stat_taskify',
              iconColor: '#f26a36',
              schedule: {
                at: scheduledDate,
                allowWhileIdle: true,
              },
              autoCancel: true,
              extra: { type: 'task', id: t.id },
            });
          }
          }
        });
      });

      // 2. Schedule daily habit reminders (strictly gated against habits completed today)
      const todayStr = getTodayString();
      const nowDate = new Date();

      habits.forEach((h) => {
        if (!h.reminderEnabled || !h.reminderTimes || !h.reminderTimes.length) return;

        // If habit is already checked off / completed today, do not schedule for today
        const isCompletedToday = habitLogs.some(
          (l) => l.habitId === h.id && l.date === todayStr && (l.completed || l.currentCount >= h.targetCount)
        );

        h.reminderTimes.forEach((time) => {
          const [hStr, mStr] = time.split(':');
          const hour = parseInt(hStr, 10);
          const minute = parseInt(mStr, 10);
          if (!isNaN(hour) && !isNaN(minute)) {
            const bodyText = `Time for your daily routine: ${h.targetCount} ${h.unit} • ${h.timeOfDay}`;
            const expandedBody = h.description ? `${bodyText}\n${h.description}` : bodyText;

            const scheduledToday = new Date(
              nowDate.getFullYear(),
              nowDate.getMonth(),
              nowDate.getDate(),
              hour,
              minute,
              0
            );

            let scheduledDate: Date;
            if (isCompletedToday || scheduledToday.getTime() <= nowMs + 5000) {
              // Habit is checked off today or time has passed: schedule for tomorrow
              const tomorrow = new Date(nowDate);
              tomorrow.setDate(tomorrow.getDate() + 1);
              scheduledDate = new Date(
                tomorrow.getFullYear(),
                tomorrow.getMonth(),
                tomorrow.getDate(),
                hour,
                minute,
                0
              );
            } else {
              // Not yet completed today and time is in future: schedule for today
              scheduledDate = scheduledToday;
            }

            notifications.push({
              id: stringToIntegerId(`habit-${h.id}-${time}`),
              title: `Daily Routine: ${h.name}`,
              body: bodyText,
              largeBody: expandedBody,
              summaryText: 'Daily Routine',
              channelId: 'taskify_reminders',
              smallIcon: 'ic_stat_taskify',
              iconColor: '#f26a36',
              schedule: {
                at: scheduledDate,
                allowWhileIdle: true,
              },
              autoCancel: true,
              extra: { type: 'habit', id: h.id },
            });
          }
        });
      });

      // 3. Schedule daily recurring witty poke notifications (7 times/day spaced every 2 hours)
      const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
      DAILY_POKE_SCHEDULE.forEach((slot, idx) => {
        const poke = getDailyPoke(userName, pendingCount, idx + 1);
        notifications.push({
          id: stringToIntegerId(`daily-poke-${slot.slotId}`),
          title: poke.title,
          body: poke.body,
          largeBody: poke.body,
          summaryText: 'Taskify Focus',
          channelId: 'taskify_reminders',
          smallIcon: 'ic_stat_taskify',
          iconColor: '#f26a36',
          schedule: {
            on: { hour: slot.hour, minute: slot.minute },
            allowWhileIdle: true,
          },
          autoCancel: true,
          extra: { type: 'poke', slot: slot.slotId },
        });
      });

      // 4. Schedule daily recurring contextual daypart notifications (Morning, Afternoon, Night)
      const pendingHabitsCount = habits.length;
      DAYPART_SCHEDULE.forEach((slot) => {
        const greeting = generateDaypartGreeting(slot.slotId, userName, pendingCount, pendingHabitsCount);
        notifications.push({
          id: stringToIntegerId(`daypart-greeting-${slot.slotId}`),
          title: greeting.title,
          body: greeting.body,
          largeBody: greeting.body,
          summaryText: 'Daily Briefing',
          channelId: 'taskify_reminders',
          smallIcon: 'ic_stat_taskify',
          iconColor: '#f26a36',
          schedule: {
            on: { hour: slot.hour, minute: slot.minute },
            allowWhileIdle: true,
          },
          autoCancel: true,
          extra: { type: 'daypart', slot: slot.slotId },
        });
      });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (err) {
      console.error('[Notification] Error syncing background reminders:', err);
    }
  }

  /**
   * Trigger native OS notification when app is backgrounded / not active
   */
  export function sendNativeNotification(
    title: string,
    options?: { body?: string; icon?: string; tag?: string }
  ): boolean {
    if (Capacitor.isNativePlatform()) {
      try {
        const bodyText = options?.body || 'Taskify Reminder';
        LocalNotifications.schedule({
          notifications: [
            {
              id: (Date.now() & 0x7fffffff) || 1,
              title,
              body: bodyText,
              largeBody: bodyText,
              channelId: 'taskify_reminders',
              smallIcon: 'ic_stat_taskify',
              iconColor: '#f26a36',
              autoCancel: true,
            },
          ],
        });
      return true;
    } catch {
      return false;
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body || 'Taskify Reminder',
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag,
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
