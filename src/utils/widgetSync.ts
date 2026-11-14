/**
 * Apple Design Glassmorphic Home-Screen Widget Bridge
 * 
 * Powered by @capgo/capacitor-widget-kit.
 * Synchronizes tasks, daily routines, and completion metrics with iOS WidgetKit
 * and Android AppWidget. Enables home-screen direct manipulation (check-off tasks & habits)
 * without opening the app.
 * 
 * Inspired by reference designs:
 * - widget-ref-1.jpg (Medium 2x4 widget with 6 interactive illuminated pill capsules & progress ring)
 * - widget-ref-2.jpg (Small 2x2 widget with natural language day briefing & 1-tap focus)
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { CapgoWidgetKit } from '@capgo/capacitor-widget-kit';
import type { Task, Habit, HabitLog, Transaction } from '../types';
import { getTodayString } from '../db';

export interface NativeWidgetAction {
  action: string;
  id: string;
  type: string;
  done: boolean;
  timestamp: number;
}

export interface NativeWidgetBridge {
  syncWidgetState(options: { state: Record<string, unknown> }): Promise<{ success: boolean }>;
  getPendingWidgetActions(): Promise<{ actions: NativeWidgetAction[] }>;
  clearPendingWidgetActions(): Promise<{ success: boolean }>;
  getLaunchQuickAction(): Promise<{ action: string | null }>;
}

export const TaskifyNativeWidget = registerPlugin<NativeWidgetBridge>('TaskifyNativeWidget');

export interface WidgetSyncPayload {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  transactions?: Transaction[];
  currency?: string;
  monthlyBudget?: number;
  userName?: string;
}

export interface WidgetEventHandlers {
  onToggleTask?: (taskId: string) => Promise<void>;
  onIncrementHabit?: (habitId: string) => Promise<void>;
  onQuickAction?: (action: string) => Promise<void> | void;
}

export interface WidgetPillItem {
  id: string;
  title: string;
  type: 'task' | 'habit';
  done: boolean;
  [key: string]: string | boolean | number;
}

const WIDGET_SESSION_ID = 'taskify_home_widget';

/**
 * Builds an Apple Design Glassmorphic SVG layout for Medium Widget (360x170 pt)
 * Exactly replicates widget-ref-1.jpg:
 * - Frosted glass canvas with specular 1px top highlight
 * - "Tasks & Routines" title + Daypart status
 * - Circular progress ring (e.g. "3/6")
 * - 2-Column Grid of 6 interactive pill capsules
 */
export function buildMediumWidgetSvg(
  items: WidgetPillItem[],
  completedCount: number,
  totalCount: number,
  statusText = 'Great start to the day'
): string {
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;

  // Generate 6 pill items
  const pillsSvg = items.slice(0, 6).map((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = col === 0 ? 16 : 186;
    const y = 48 + row * 38;
    const width = 158;
    const height = 34;

    const safeTitle = (item.title || 'Objective')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .slice(0, 15);

    if (item.done) {
      // Completed Illuminated Pill Capsule
      return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="17" fill="#FFFFFF"/>
      <circle cx="17" cy="17" r="11" fill="#141312"/>
      <path d="M14 17L16.5 19.5L20.5 14.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="35" y="21" fill="#141312" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="11" font-weight="700">${safeTitle}</text>
      <path d="M140 17L143.5 20.5L149 14" stroke="#141312" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
    }

    // Pending Frosted Glass Pill Capsule
    return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="17" fill="white" fill-opacity="0.06" stroke="white" stroke-opacity="0.10"/>
      <circle cx="17" cy="17" r="11" fill="white" fill-opacity="0.08"/>
      <circle cx="17" cy="17" r="4" fill="white" fill-opacity="0.4"/>
      <text x="35" y="21" fill="#E4E4E7" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="11" font-weight="600">${safeTitle}</text>
      <circle cx="144" cy="17" r="8" fill="none" stroke="white" stroke-opacity="0.28" stroke-width="1.6"/>
    </g>`;
  }).join('');

  return `
<svg width="360" height="170" viewBox="0 0 360 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Apple Translucent Frosted Glass Canvas -->
  <rect width="360" height="170" rx="28" fill="#141312" fill-opacity="0.94"/>
  <rect x="0.5" y="0.5" width="359" height="169" rx="27.5" stroke="white" stroke-opacity="0.12"/>

  <!-- Top Glass Highlight Rim -->
  <line x1="28" y1="1" x2="332" y2="1" stroke="white" stroke-opacity="0.25" stroke-linecap="round"/>

  <!-- Header Section -->
  <g transform="translate(18, 18)">
    <text x="0" y="12" fill="white" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="15" font-weight="800" letter-spacing="-0.02em">Tasks &amp; Routines</text>
    <text x="0" y="25" fill="#A1A1AA" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="500">${statusText}</text>

    <!-- Circular Progress Indicator Ring -->
    <g transform="translate(308, 1)">
      <circle cx="14" cy="14" r="13" stroke="white" stroke-opacity="0.10" stroke-width="2.8" fill="none"/>
      <circle cx="14" cy="14" r="13" stroke="white" stroke-width="2.8" stroke-linecap="round" fill="none" stroke-dasharray="81.68" stroke-dashoffset="${(1 - progressRatio) * 81.68}" transform="rotate(-90 14 14)"/>
      <text x="14" y="17.5" text-anchor="middle" fill="white" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="9" font-weight="700">${completedCount}/${totalCount}</text>
    </g>
  </g>

  <!-- 2-Column Grid of 6 Pills -->
  ${pillsSvg}
</svg>
  `.trim();
}

/**
 * Builds an Apple Design Glassmorphic SVG layout for Small Widget (170x170 pt)
 * Replicates widget-ref-2.jpg (Day abbreviation + Date + Natural Language Briefing + Focus Task)
 */
export function buildSmallWidgetSvg(
  dayShort: string,
  dateStr: string,
  year: number,
  userName: string,
  pendingTasks: number,
  pendingHabits: number,
  topTaskTitle?: string,
  topTaskDone = false
): string {
  const safeTitle = (topTaskTitle || 'Focus Objective')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 16);

  return `
<svg width="170" height="170" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="170" height="170" rx="26" fill="#141312" fill-opacity="0.94"/>
  <rect x="0.5" y="0.5" width="169" height="169" rx="25.5" stroke="white" stroke-opacity="0.12"/>
  <line x1="20" y1="1" x2="150" y2="1" stroke="white" stroke-opacity="0.25" stroke-linecap="round"/>

  <!-- Top Row: Day + Accent Dot + Date -->
  <g transform="translate(16, 18)">
    <text x="0" y="20" fill="white" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="22" font-weight="900" letter-spacing="-0.03em">${dayShort}</text>
    <circle cx="48" cy="14" r="3.5" fill="#F26A36"/>

    <text x="138" y="10" text-anchor="end" fill="#D4D4D8" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="600">${dateStr}</text>
    <text x="138" y="22" text-anchor="end" fill="#71717A" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', monospace" font-size="9" font-weight="500">${year}</text>
  </g>

  <!-- Middle: Natural Language Briefing -->
  <g transform="translate(16, 60)">
    <text x="0" y="14" fill="#A1A1AA" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="500">Good day, <tspan fill="white" font-weight="700">${userName}</tspan>.</text>
    <text x="0" y="30" fill="#E4E4E7" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="600">You have <tspan fill="white" font-weight="700">${pendingTasks} tasks</tspan> &amp;</text>
    <text x="0" y="44" fill="#E4E4E7" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="600"><tspan fill="white" font-weight="700">${pendingHabits} habits</tspan> today.</text>
  </g>

  <!-- Bottom: 1-Tap Objective Pill -->
  <g transform="translate(14, 122)">
    <rect width="142" height="32" rx="16" fill="white" fill-opacity="${topTaskDone ? '0.95' : '0.06'}" stroke="white" stroke-opacity="${topTaskDone ? '1' : '0.10'}"/>
    <text x="14" y="20" fill="${topTaskDone ? '#141312' : '#E4E4E7'}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" font-size="10" font-weight="700">${safeTitle}</text>
    ${
      topTaskDone
        ? '<path d="M122 16L125 19L130 13" stroke="#141312" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<circle cx="126" cy="16" r="7" fill="none" stroke="white" stroke-opacity="0.3" stroke-width="1.5"/>'
    }
  </g>
</svg>
  `.trim();
}

/**
 * Synchronize task and habit data to the native widget bridge
 */
export async function syncWidgetData(payload: WidgetSyncPayload): Promise<void> {
  const todayStr = getTodayString();
  const { tasks, habits, habitLogs, transactions, monthlyBudget, currency, userName } = payload;

  const now = new Date();

  // 1. Tasks Processing (Includes today's scheduled tasks and overdue pending tasks)
  const todayTasks = tasks.filter((t) => (t.dueDate && t.dueDate <= todayStr) || (!t.dueDate && t.status !== 'completed'));
  const pendingTasks = todayTasks.filter((t) => t.status !== 'completed');
  const completedTasksCount = todayTasks.filter((t) => t.status === 'completed').length;

  const sortedTodayTasks = [...todayTasks].sort((a, b) => {
    const aDone = a.status === 'completed';
    const bDone = b.status === 'completed';
    return aDone === bDone ? 0 : aDone ? 1 : -1;
  });

  const taskPills: WidgetPillItem[] = sortedTodayTasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: 'task' as const,
    done: t.status === 'completed',
  }));

  // 2. Habits Processing
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
  const completedHabitsCount = todayHabitData.filter((h) => h.done).length;

  const sortedHabits = [...todayHabitData].sort((a, b) => {
    return a.done === b.done ? 0 : a.done ? 1 : -1;
  });

  const habitPills: WidgetPillItem[] = sortedHabits.map((h) => ({
    id: h.id,
    title: h.name,
    type: 'habit' as const,
    done: h.done,
  }));

  const dayShort = now.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const displayName = userName || 'Alex';

  // 3. Finance & Budget Metrics
  const currMonth = todayStr.slice(0, 7); // 'YYYY-MM'
  const monthTransactions = (transactions || []).filter((t) => t.date && t.date.startsWith(currMonth));
  const monthExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const budget = monthlyBudget && monthlyBudget > 0 ? monthlyBudget : 1000;
  const remainingBudget = Math.max(0, budget - monthExpenses);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailyAllowance = Math.max(0, Math.round(remainingBudget / daysRemaining));
  const budgetBurnRatio = budget > 0 ? Math.min(1, monthExpenses / budget) : 0;
  const currSymbol = currency || '$';

  // 4. Synchronize to Android Native AppWidgets
  if (Capacitor.isPluginAvailable('TaskifyNativeWidget')) {
    try {
      await TaskifyNativeWidget.syncWidgetState({
        state: {
          // 1. Tasks widget (4x2 Resizable, Y-axis scroll)
          headerTitle: "Today's Tasks",
          headerSubtitle: completedTasksCount >= 3 ? 'Great momentum today' : 'Focus on what matters',
          completedCount: completedTasksCount,
          totalCount: todayTasks.length,
          taskPills: taskPills.slice(0, 6),
          allTasks: sortedTodayTasks.map((t) => ({
            id: t.id,
            title: t.title,
            done: t.status === 'completed',
            priority: t.priority || 'medium',
            category: t.category || 'Focus',
          })),

          // 2. Daily Routines widget (4x2 Resizable, Y-axis scroll)
          habitsTitle: 'Daily Routines',
          habitsSubtitle: completedHabitsCount >= 2 ? 'Streak on fire' : 'Build steady consistency',
          completedHabitsCount,
          totalHabitsCount: habits.length,
          habitPills: habitPills.slice(0, 6),
          allHabits: sortedHabits.map((h) => ({
            id: h.id,
            title: h.name,
            done: h.done,
            progress: h.progress,
            category: h.category,
          })),

          // 3. Scrollable Day Feed widget (2x2 to 2x4 Resizable, Y-axis scroll)
          dayShort,
          dateStr,
          userName: displayName,
          smallGreeting: `Good ${timeOfDay}, ${displayName}.`,
          smallSummary: `${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} & ${pendingHabits.length} routine${pendingHabits.length === 1 ? '' : 's'} today.`,

          // 4. Finance & Budget Widget
          safeToSpend: `${currSymbol}${dailyAllowance}`,
          remainingBudgetStr: `${currSymbol}${Math.round(remainingBudget)} remaining`,
          monthlyBudgetStr: `${currSymbol}${Math.round(budget)}`,
          spentThisMonthStr: `${currSymbol}${Math.round(monthExpenses)}`,
          budgetBurnPercent: Math.round(budgetBurnRatio * 100),
          currency: currSymbol,
        },
      });
    } catch (err) {
      console.warn('[TaskifyNativeWidget] Error syncing state:', err);
    }
  }

  // 2. Synchronize to iOS WidgetKit (if CapgoWidgetKit available)
  if (Capacitor.isPluginAvailable('CapgoWidgetKit')) {
    try {
      const iosPills = taskPills.slice(0, 6);
      const iosSharedState = {
        userName: displayName,
        date: todayStr,
        totalTasks: todayTasks.length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount,
        totalHabits: habits.length,
        pendingHabitsCount: pendingHabits.length,
        completedHabitsCount,
        pills: iosPills,
        updatedAt: Date.now(),
      };

      try {
        await CapgoWidgetKit.updateWidgetSession({
          widgetId: WIDGET_SESSION_ID,
          state: iosSharedState,
          merge: true,
        });
      } catch {
        await CapgoWidgetKit.startWidgetSession({
          widgetId: WIDGET_SESSION_ID,
          kind: 'taskify_home_widget',
          state: iosSharedState,
        });
      }

      const svgLayout = buildMediumWidgetSvg(
        iosPills,
        completedTasksCount,
        Math.max(1, todayTasks.length),
        'Focus on what matters'
      );

      const hotspots = iosPills.map((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = col === 0 ? 16 : 186;
        const y = 48 + row * 38;

        const payloadMap: Record<string, string> =
          item.type === 'task' ? { taskId: item.id } : { habitId: item.id };

        return {
          id: `hs-pill-${idx}`,
          actionId: item.type === 'task' ? 'toggle-task' : 'log-habit',
          x,
          y,
          width: 158,
          height: 34,
          payload: payloadMap,
        };
      });

      await CapgoWidgetKit.startTemplateWidget({
        activityId: WIDGET_SESSION_ID,
        definition: {
          id: 'taskify-apple-glass-widget',
          version: '2.0.0',
          layouts: {
            homeScreen: {
              width: 360,
              height: 170,
              defaultFrameId: 'frame-main',
              frames: [
                {
                  id: 'frame-main',
                  svg: svgLayout,
                  hotspots,
                },
              ],
            },
          },
        },
        state: iosSharedState,
        openUrl: 'taskify://home',
      });

      await CapgoWidgetKit.reloadWidgets();
    } catch (err) {
      console.warn('[WidgetKit] Native widget sync warning:', err);
    }
  }
}

/**
 * Poll and acknowledge pending widget interactions (e.g. user checked off a task or habit from home screen)
 */
export async function pollWidgetEvents(handlers: WidgetEventHandlers): Promise<void> {
  // 1. Poll Android Native Widget interactions
  if (Capacitor.isPluginAvailable('TaskifyNativeWidget')) {
    try {
      const res = await TaskifyNativeWidget.getPendingWidgetActions();
      if (res && res.actions && res.actions.length > 0) {
        for (const act of res.actions) {
          if (act.action === 'toggle-task' && act.id && handlers.onToggleTask) {
            await handlers.onToggleTask(act.id);
          } else if (act.action === 'log-habit' && act.id && handlers.onIncrementHabit) {
            await handlers.onIncrementHabit(act.id);
          }
        }
        await TaskifyNativeWidget.clearPendingWidgetActions();
      }

      if (handlers.onQuickAction && typeof TaskifyNativeWidget.getLaunchQuickAction === 'function') {
        const quickRes = await TaskifyNativeWidget.getLaunchQuickAction();
        if (quickRes && quickRes.action) {
          await handlers.onQuickAction(quickRes.action);
        }
      }
    } catch (err) {
      console.warn('[TaskifyNativeWidget] Error processing widget events:', err);
    }
  }

  // 2. Poll iOS WidgetKit interactions
  if (Capacitor.isPluginAvailable('CapgoWidgetKit')) {
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
}
