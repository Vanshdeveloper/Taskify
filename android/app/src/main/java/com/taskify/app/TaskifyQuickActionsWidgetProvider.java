package com.taskify.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

/**
 * Taskify Quick Actions AppWidget Provider (2x2 Resizable)
 * Instant tactile 1-tap launchers for Taskify core capture loops:
 * - New Task (zero-lag quick capture without opening full app)
 * - New Routine (zero-lag quick capture without opening full app)
 * - Log Expense (zero-lag quick capture without opening full app)
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

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            // Header opens app default
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_quick_header, PendingIntent.getActivity(
                    context, 400 + appWidgetId, openAppIntent, pFlags
            ));

            // Button 1: + Task -> Direct Quick Capture Dialog
            Intent taskIntent = new Intent(context, TaskifyQuickCaptureActivity.class);
            taskIntent.putExtra(TaskifyQuickCaptureActivity.EXTRA_TYPE, "task");
            taskIntent.setData(Uri.parse("taskify://capture/task/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_quick_task, PendingIntent.getActivity(
                    context, 401 + appWidgetId, taskIntent, pFlags
            ));

            // Button 2: + Routine -> Direct Quick Capture Dialog
            Intent routineIntent = new Intent(context, TaskifyQuickCaptureActivity.class);
            routineIntent.putExtra(TaskifyQuickCaptureActivity.EXTRA_TYPE, "habit");
            routineIntent.setData(Uri.parse("taskify://capture/habit/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_quick_routine, PendingIntent.getActivity(
                    context, 402 + appWidgetId, routineIntent, pFlags
            ));

            // Button 3: + Expense -> Direct Quick Capture Dialog
            Intent expenseIntent = new Intent(context, TaskifyQuickCaptureActivity.class);
            expenseIntent.putExtra(TaskifyQuickCaptureActivity.EXTRA_TYPE, "expense");
            expenseIntent.setData(Uri.parse("taskify://capture/expense/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_quick_expense, PendingIntent.getActivity(
                    context, 403 + appWidgetId, expenseIntent, pFlags
            ));

            // Button 4: Focus Timer -> Open full app focus timer
            Intent focusIntent = new Intent(context, MainActivity.class);
            focusIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            focusIntent.putExtra("quick_action", "focus");
            focusIntent.setData(Uri.parse("taskify://focus/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_quick_focus, PendingIntent.getActivity(
                    context, 404 + appWidgetId, focusIntent, pFlags
            ));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
