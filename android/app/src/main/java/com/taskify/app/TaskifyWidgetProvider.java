package com.taskify.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

/**
 * Taskify Glassmorphic AppWidget Provider
 * 
 * Delivers home-screen direct manipulation for completing objectives and logging daily routines.
 * Reads synchronized state from SharedPreferences populated by @capgo/capacitor-widget-kit.
 */
public class TaskifyWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_TOGGLE_TASK = "com.taskify.app.ACTION_TOGGLE_TASK";
    public static final String ACTION_LOG_HABIT = "com.taskify.app.ACTION_LOG_HABIT";
    public static final String EXTRA_TASK_ID = "extra_task_id";
    public static final String EXTRA_HABIT_ID = "extra_habit_id";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (ACTION_TOGGLE_TASK.equals(action)) {
            String taskId = intent.getStringExtra(EXTRA_TASK_ID);
            // Launch main app via deep link or record action
            Intent launchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("taskify://toggle-task?id=" + taskId));
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launchIntent);
        } else if (ACTION_LOG_HABIT.equals(action)) {
            String habitId = intent.getStringExtra(EXTRA_HABIT_ID);
            Intent launchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("taskify://log-habit?id=" + habitId));
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launchIntent);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String taskTitle1 = prefs.getString("task_0_title", "No pending objectives");
        String taskTitle2 = prefs.getString("task_1_title", "All clear");
        String habitName = prefs.getString("habit_0_name", "Daily Habit");
        String habitProgress = prefs.getString("habit_0_progress", "0/1 times");
        int pendingTasksCount = prefs.getInt("pendingTasksCount", 0);
        int pendingHabitsCount = prefs.getInt("pendingHabitsCount", 0);
        boolean taskDone1 = prefs.getBoolean("task_0_done", false);
        boolean taskDone2 = prefs.getBoolean("task_1_done", false);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_widget);
        views.setTextViewText(R.id.widget_task_title_1, taskTitle1);
        views.setTextViewText(R.id.widget_task_title_2, taskTitle2);
        views.setImageViewResource(R.id.widget_check_task_1, taskDone1 ? R.drawable.taskify_widget_checkbox_checked : R.drawable.taskify_widget_checkbox_unchecked);
        views.setImageViewResource(R.id.widget_check_task_2, taskDone2 ? R.drawable.taskify_widget_checkbox_checked : R.drawable.taskify_widget_checkbox_unchecked);
        views.setTextViewText(R.id.widget_habit_name, habitName);
        views.setTextViewText(R.id.widget_habit_progress, habitProgress);
        views.setTextViewText(R.id.widget_status_pill, pendingTasksCount + " tasks • " + pendingHabitsCount + " rut");

        // Open app when tapping root widget
        Intent openAppIntent = new Intent(context, MainActivity.class);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
                context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, openAppPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
