package com.taskify.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/**
 * Taskify Quick Actions AppWidget Provider (2x2 Resizable)
 * Instant tactile 1-tap launchers for Taskify core capture loops:
 * - New Task
 * - New Routine
 * - Log Expense
 * - Focus Timer
 */
public class TaskifyQuickActionsWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName component = new ComponentName(context, TaskifyQuickActionsWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(component);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                for (int id : appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, id);
                }
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_quick_widget);

            // Header opens app default
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_quick_header, PendingIntent.getActivity(
                    context, 400, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Button 1: + Task
            Intent taskIntent = new Intent(context, MainActivity.class);
            taskIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            taskIntent.putExtra("quick_action", "task");
            views.setOnClickPendingIntent(R.id.btn_quick_task, PendingIntent.getActivity(
                    context, 401, taskIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Button 2: + Routine
            Intent routineIntent = new Intent(context, MainActivity.class);
            routineIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            routineIntent.putExtra("quick_action", "habit");
            views.setOnClickPendingIntent(R.id.btn_quick_routine, PendingIntent.getActivity(
                    context, 402, routineIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Button 3: + Expense
            Intent expenseIntent = new Intent(context, MainActivity.class);
            expenseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            expenseIntent.putExtra("quick_action", "expense");
            views.setOnClickPendingIntent(R.id.btn_quick_expense, PendingIntent.getActivity(
                    context, 403, expenseIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Button 4: Focus Timer
            Intent focusIntent = new Intent(context, MainActivity.class);
            focusIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            focusIntent.putExtra("quick_action", "focus");
            views.setOnClickPendingIntent(R.id.btn_quick_focus, PendingIntent.getActivity(
                    context, 404, focusIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
