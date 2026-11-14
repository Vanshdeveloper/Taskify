package com.taskify.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Taskify Glassmorphic Tasks AppWidget Provider (4x2 Resizable)
 * Dedicated to Today's Tasks with smooth Y-axis vertical scrolling.
 * Direct manipulation: Tapping any task pill toggles it immediately on the home screen.
 */
public class TaskifyWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "TaskifyWidgetData";
    public static final String ACTION_TOGGLE_ITEM = "com.taskify.app.ACTION_TOGGLE_ITEM";
    public static final String EXTRA_ITEM_INDEX = "extra_item_index";
    public static final String EXTRA_ITEM_ID = "extra_item_id";
    public static final String EXTRA_ITEM_TYPE = "extra_item_type";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_scroll_list);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        try {
            String action = intent.getAction();
            if (ACTION_TOGGLE_ITEM.equals(action)) {
                handleToggleAction(context, intent);
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    public static void handleToggleAction(Context context, Intent intent) {
        try {
            String itemId = intent.getStringExtra(EXTRA_ITEM_ID);
            String itemType = intent.getStringExtra(EXTRA_ITEM_TYPE);
            if (itemType == null) itemType = "task";

            if (itemId == null || itemId.isEmpty() || itemId.startsWith("empty_")) {
                return;
            }

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            boolean isHabit = "habit".equals(itemType);
            String prefix = isHabit ? "habit_pill_" : "task_pill_";
            String arrayKey = isHabit ? "all_habits_json" : "all_tasks_json";

            // 1. Find current state
            boolean currentDone = false;
            try {
                String arrayJson = prefs.getString(arrayKey, "[]");
                JSONArray arr = new JSONArray(arrayJson);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    if (itemId.equals(obj.optString("id"))) {
                        currentDone = obj.optBoolean("done", false);
                        break;
                    }
                }
            } catch (Exception ignored) {}

            boolean newDone = !currentDone;

            // 2. Update full JSON array & save
            try {
                String arrayJson = prefs.getString(arrayKey, "[]");
                JSONArray arr = new JSONArray(arrayJson);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    if (itemId.equals(obj.optString("id"))) {
                        obj.put("done", newDone);
                    }
                }
                editor.putString(arrayKey, arr.toString());
            } catch (Exception ignored) {}

            // 3. Update pill slots for backwards compatibility
            for (int i = 0; i < 6; i++) {
                String pId = prefs.getString(prefix + i + "_id", "");
                if (itemId.equals(pId)) {
                    editor.putBoolean(prefix + i + "_done", newDone);
                }
            }

            // 4. Calculate live pending tasks & routines counts across both datasets
            int pendingTasksCount = 0;
            int totalTasksCount = 0;
            try {
                String tasksJson = prefs.getString("all_tasks_json", "[]");
                JSONArray arr = new JSONArray(tasksJson);
                totalTasksCount = arr.length();
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    boolean isDone = obj.optBoolean("done", false);
                    if (!isHabit && itemId.equals(obj.optString("id"))) {
                        isDone = newDone;
                    }
                    if (!isDone) {
                        pendingTasksCount++;
                    }
                }
            } catch (Exception ignored) {}

            int pendingHabitsCount = 0;
            int totalHabitsCount = 0;
            try {
                String habitsJson = prefs.getString("all_habits_json", "[]");
                JSONArray arr = new JSONArray(habitsJson);
                totalHabitsCount = arr.length();
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    boolean isDone = obj.optBoolean("done", false);
                    if (isHabit && itemId.equals(obj.optString("id"))) {
                        isDone = newDone;
                    }
                    if (!isDone) {
                        pendingHabitsCount++;
                    }
                }
            } catch (Exception ignored) {}

            int completedTasksCount = Math.max(0, totalTasksCount - pendingTasksCount);
            int completedHabitsCount = Math.max(0, totalHabitsCount - pendingHabitsCount);

            editor.putInt("completed_count", completedTasksCount);
            editor.putInt("total_count", totalTasksCount);
            editor.putInt("habits_completed_count", completedHabitsCount);
            editor.putInt("habits_total_count", totalHabitsCount);

            // 5. Construct live natural language briefing sentence
            String liveSummary;
            if (pendingTasksCount == 0 && pendingHabitsCount == 0) {
                liveSummary = "All clear for today. Great job!";
            } else if (pendingTasksCount == 0) {
                liveSummary = pendingHabitsCount + " routine" + (pendingHabitsCount == 1 ? "" : "s") + " remaining today.";
            } else if (pendingHabitsCount == 0) {
                liveSummary = pendingTasksCount + " task" + (pendingTasksCount == 1 ? "" : "s") + " remaining today.";
            } else {
                liveSummary = pendingTasksCount + " task" + (pendingTasksCount == 1 ? "" : "s") + " & " +
                              pendingHabitsCount + " routine" + (pendingHabitsCount == 1 ? "" : "s") + " today.";
            }
            editor.putString("small_summary", liveSummary);

            // 6. Record pending action for silent web Dexie sync
            try {
                String existingActionsJson = prefs.getString("pending_actions", "[]");
                JSONArray actionsArray = new JSONArray(existingActionsJson);
                JSONObject actionObj = new JSONObject();
                actionObj.put("action", isHabit ? "log-habit" : "toggle-task");
                actionObj.put("id", itemId);
                actionObj.put("type", itemType);
                actionObj.put("done", newDone);
                actionObj.put("timestamp", System.currentTimeMillis());
                actionsArray.put(actionObj);
                editor.putString("pending_actions", actionsArray.toString());
            } catch (Exception ignored) {}

            editor.apply();

            // Refresh all widgets instantly with updated state and notify list views
            updateAllWidgets(context);
            TaskifyHabitsWidgetProvider.updateAllWidgets(context);
            TaskifySmallWidgetProvider.updateAllWidgets(context);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName component = new ComponentName(context, TaskifyWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(component);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                for (int id : appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, id);
                }
                appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_scroll_list);
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

            String title = prefs.getString("header_title", "Today's Tasks");
            int completedCount = prefs.getInt("completed_count", 0);
            int totalCount = prefs.getInt("total_count", 0);
            String subtitle = completedCount >= 3 ? "Great start to the day" : "Focus on what matters";

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_widget);
            views.setTextViewText(R.id.widget_title, title);
            views.setTextViewText(R.id.widget_subtitle, subtitle);
            views.setTextViewText(R.id.widget_progress_badge, completedCount + "/" + Math.max(totalCount, completedCount));

            // Header click opens app
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_header, PendingIntent.getActivity(
                    context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Bind Y-Axis Scrollable ListView
            Intent serviceIntent = new Intent(context, TaskifyWidgetListService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.putExtra("feed_type", "tasks");
            serviceIntent.setData(Uri.parse("taskify://widget/service/tasks/" + appWidgetId));
            views.setRemoteAdapter(R.id.widget_scroll_list, serviceIntent);
            views.setEmptyView(R.id.widget_scroll_list, R.id.widget_empty);

            // Bind PendingIntent template for direct tactile check-offs without opening the app
            Intent toggleTemplate = new Intent(context, TaskifyWidgetProvider.class);
            toggleTemplate.setAction(ACTION_TOGGLE_ITEM);
            toggleTemplate.setData(Uri.parse("taskify://widget/template/tasks/" + appWidgetId));

            int templateFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                templateFlags |= PendingIntent.FLAG_MUTABLE;
            }

            PendingIntent templatePending = PendingIntent.getBroadcast(
                    context,
                    1000 + appWidgetId,
                    toggleTemplate,
                    templateFlags
            );
            views.setPendingIntentTemplate(R.id.widget_scroll_list, templatePending);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
