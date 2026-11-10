/**
 * Apple Design Glassmorphic Home-Screen Widget Bridge
 * 
 * Powered by @capgo/capacitor-widget-kit.
 * Synchronizes tasks, daily routines, and completion metrics with iOS WidgetKit
 * and Android AppWidget. Enables home-screen direct manipulation (check-off tasks & habits)
 * without opening the app.
 * 
 * STRICT CONSTRAINT: Operates purely in native/background storage. No in-app UI.
 */

import { Capacitor } from '@capacitor/core';
import { CapgoWidgetKit } from '@capgo/capacitor-widget-kit';
import type { Task, Habit, HabitLog } from '../types';
import { getTodayString } from '../db';

export interface WidgetSyncPayload {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  userName?: string;
}

export interface WidgetEventHandlers {
  onToggleTask?: (taskId: string) => Promise<void>;
  onIncrementHabit?: (habitId: string) => Promise<void>;
}

const WIDGET_SESSION_ID = 'taskify_home_widget';

/**
 * Builds an Apple Design glassmorphic SVG layout for medium widget (360x170 pt)
 */
function buildMediumWidgetSvg(
  tasks: Array<{ id: string; title: string; category: string; done: boolean }>,
  habits: Array<{ id: string; name: string; progress: string; done: boolean }>,
  pendingTasksCount: number,
  pendingHabitsCount: number
): string {
  const task1 = tasks[0] || { title: 'No pending objectives', category: 'General', done: true };
  const task2 = tasks[1] || { title: 'All objectives clear', category: 'General', done: true };
  const habit1 = habits[0] || { name: 'No routines scheduled', progress: '0/1', done: true };

  return `
<svg width="360" height="170" viewBox="0 0 360 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Apple Translucent Frosted Glass Canvas -->
  <rect width="360" height="170" rx="28" fill="#181412" fill-opacity="0.82"/>
  <rect x="0.5" y="0.5" width="359" height="169" rx="27.5" stroke="white" stroke-opacity="0.12"/>

  <!-- Top Glass Highlight Rim -->
  <path d="M28 1H332C346.912 1 359 13.0883 359 28V40C359 28 346 16 332 16H28C14 16 1 28 1 40V28C1 13.0883 13.0883 1 28 1Z" fill="white" fill-opacity="0.04"/>

  <!-- Header Bar -->
  <g transform="translate(18, 18)">
    <circle cx="8" cy="8" r="7" fill="#F26A36"/>
    <circle cx="8" cy="8" r="3" fill="#181412"/>
    <text x="22" y="12" fill="white" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="13" font-weight="800" letter-spacing="-0.03em">Taskify</text>
    <rect x="250" y="0" width="74" height="20" rx="10" fill="white" fill-opacity="0.07"/>
    <text x="287" y="13" text-anchor="middle" fill="#E4E4E7" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="9" font-weight="700">${pendingTasksCount} left • ${pendingHabitsCount} rut</text>
  </g>

  <!-- Divider -->
  <line x1="18" y1="46" x2="342" y2="46" stroke="white" stroke-opacity="0.06"/>

  <!-- Column 1: Objectives (Tasks) -->
  <g transform="translate(18, 56)">
    <text x="0" y="10" fill="#A1A1AA" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="700" letter-spacing="0.05em">TODAY'S FOCUS</text>
    
    <!-- Task Item 1 -->
    <g transform="translate(0, 20)">
      <rect width="18" height="18" rx="6" fill="${task1.done ? '#10B981' : 'rgba(255,255,255,0.08)'}" stroke="${task1.done ? '#10B981' : 'rgba(255,255,255,0.18)'}"/>
      ${task1.done ? '<path d="M5 9L8 12L13 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
      <text x="26" y="13" fill="${task1.done ? '#71717A' : '#FFFFFF'}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="12" font-weight="600">${task1.title.slice(0, 18)}</text>
    </g>

    <!-- Task Item 2 -->
    <g transform="translate(0, 52)">
      <rect width="18" height="18" rx="6" fill="${task2.done ? '#10B981' : 'rgba(255,255,255,0.08)'}" stroke="${task2.done ? '#10B981' : 'rgba(255,255,255,0.18)'}"/>
      ${task2.done ? '<path d="M5 9L8 12L13 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
      <text x="26" y="13" fill="${task2.done ? '#71717A' : '#FFFFFF'}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="12" font-weight="600">${task2.title.slice(0, 18)}</text>
    </g>
  </g>

  <!-- Column 2: Routines (Habits) -->
  <g transform="translate(195, 56)">
    <text x="0" y="10" fill="#A1A1AA" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="700" letter-spacing="0.05em">ACTIVE ROUTINE</text>
    
    <g transform="translate(0, 20)">
      <rect width="145" height="48" rx="14" fill="white" fill-opacity="0.04" stroke="white" stroke-opacity="0.06"/>
      <circle cx="22" cy="24" r="12" fill="#F26A36" fill-opacity="0.18"/>
      <path d="M18 24L21 27L26 21" stroke="#F26A36" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="42" y="22" fill="white" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="11" font-weight="700">${habit1.name.slice(0, 13)}</text>
      <text x="42" y="34" fill="#A1A1AA" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="9" font-weight="600">${habit1.progress}</text>
    </g>
  </g>
</svg>
  `.trim();
}

/**
 * Synchronize task and habit data to the native widget bridge
 */
export async function syncWidgetData(payload: WidgetSyncPayload): Promise<void> {
  const todayStr = getTodayString();
  const { tasks, habits, habitLogs, userName } = payload;

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const pendingTasks = todayTasks.filter((t) => t.status !== 'completed');

  const todayHabitData = habits.map((h) => {
    const log = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr);
    const currentCount = log?.currentCount || 0;
    const completed = log?.completed || false;
    return {
      id: h.id,
      name: h.name,
      category: h.category,
      targetCount: h.targetCount,
      currentCount,
      unit: h.unit,
      progress: `${currentCount}/${h.targetCount} ${h.unit}`,
      done: completed,
    };
  });

  const pendingHabits = todayHabitData.filter((h) => !h.done);

  const sharedState = {
    userName: userName || 'Alex',
    date: todayStr,
    totalTasks: todayTasks.length,
    pendingTasksCount: pendingTasks.length,
    completedTasksCount: todayTasks.length - pendingTasks.length,
    totalHabits: habits.length,
    pendingHabitsCount: pendingHabits.length,
    completedHabitsCount: todayHabitData.filter((h) => h.done).length,
    tasks: todayTasks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      done: t.status === 'completed',
    })),
    habits: todayHabitData.slice(0, 5),
    updatedAt: Date.now(),
  };

  // If running on native platform with CapgoWidgetKit available
  if (Capacitor.isPluginAvailable('CapgoWidgetKit')) {
    try {
      // 1. Update native shared JSON session
      try {
        await CapgoWidgetKit.updateWidgetSession({
          widgetId: WIDGET_SESSION_ID,
          state: sharedState,
          merge: true,
        });
      } catch {
        // If not started yet, initialize session
        await CapgoWidgetKit.startWidgetSession({
          widgetId: WIDGET_SESSION_ID,
          kind: 'taskify_home_widget',
          state: sharedState,
        });
      }

      // 2. Persist Apple Design glassmorphic SVG widget template
      const svgLayout = buildMediumWidgetSvg(
        sharedState.tasks,
        sharedState.habits,
        sharedState.pendingTasksCount,
        sharedState.pendingHabitsCount
      );

      await CapgoWidgetKit.startTemplateWidget({
        activityId: WIDGET_SESSION_ID,
        definition: {
          id: 'taskify-apple-glass-widget',
          version: '1.0.0',
          layouts: {
            homeScreen: {
              width: 360,
              height: 170,
              defaultFrameId: 'frame-main',
              frames: [
                {
                  id: 'frame-main',
                  svg: svgLayout,
                  hotspots: [
                    // Hotspot for checking off Task 1
                    ...(todayTasks[0]
                      ? [
                          {
                            id: 'hs-task-0',
                            actionId: 'toggle-task',
                            x: 18,
                            y: 76,
                            width: 150,
                            height: 28,
                            payload: { taskId: todayTasks[0].id },
                          },
                        ]
                      : []),
                    // Hotspot for checking off Task 2
                    ...(todayTasks[1]
                      ? [
                          {
                            id: 'hs-task-1',
                            actionId: 'toggle-task',
                            x: 18,
                            y: 108,
                            width: 150,
                            height: 28,
                            payload: { taskId: todayTasks[1].id },
                          },
                        ]
                      : []),
                    // Hotspot for logging active habit
                    ...(habits[0]
                      ? [
                          {
                            id: 'hs-habit-0',
                            actionId: 'log-habit',
                            x: 195,
                            y: 76,
                            width: 145,
                            height: 48,
                            payload: { habitId: habits[0].id },
                          },
                        ]
                      : []),
                  ],
                },
              ],
            },
          },
        },
        state: sharedState,
        openUrl: 'taskify://home',
      });

      // 3. Request OS to re-render SpringBoard / Home Screen widgets
      await CapgoWidgetKit.reloadWidgets();
    } catch (err) {
      // Graceful error logging without breaking the web thread
      console.warn('[WidgetKit] Native widget sync warning:', err);
    }
  }
}

/**
 * Poll and acknowledge pending widget interactions (e.g. user checked off a task or habit from home screen)
 */
export async function pollWidgetEvents(handlers: WidgetEventHandlers): Promise<void> {
  if (!Capacitor.isPluginAvailable('CapgoWidgetKit')) return;

  try {
    const events = await CapgoWidgetKit.listTemplateEvents();
    if (events && events.events && events.events.length > 0) {
      const acknowledgedIds: string[] = [];

      for (const ev of events.events) {
        if (ev.actionId === 'toggle-task' && ev.payload?.taskId && handlers.onToggleTask) {
          await handlers.onToggleTask(String(ev.payload.taskId));
          acknowledgedIds.push(ev.eventId);
        } else if (ev.actionId === 'log-habit' && ev.payload?.habitId && handlers.onIncrementHabit) {
          await handlers.onIncrementHabit(String(ev.payload.habitId));
          acknowledgedIds.push(ev.eventId);
        }
      }

      if (acknowledgedIds.length > 0) {
        await CapgoWidgetKit.acknowledgeTemplateEvents({ eventIds: acknowledgedIds });
      }
    }
  } catch (err) {
    console.warn('[WidgetKit] Error processing widget events:', err);
  }
}
