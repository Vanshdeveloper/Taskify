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
 * Taskify Compact Routines Checklist AppWidget Provider (2x2 Resizable)
 * Line-wise display of daily habits with circle sparkle badge and big pending count.
 * Direct tactile check-offs without opening the app.
 */
public class TaskifyHabitsCompactWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        TaskifyWidgetProvider.checkAndRolloverDailyRoutines(context);
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_scroll_list);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        try {
            String action = intent != null ? intent.getAction() : null;
            if (Intent.ACTION_DATE_CHANGED.equals(action) ||
                Intent.ACTION_TIME_CHANGED.equals(action) ||
                Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
                TaskifyWidgetProvider.checkAndRolloverDailyRoutines(context);
                return;
            }

            TaskifyWidgetProvider.checkAndRolloverDailyRoutines(context);

            if (TaskifyWidgetProvider.ACTION_TOGGLE_ITEM.equals(action)) {
                TaskifyWidgetProvider.handleToggleAction(context, intent);
                updateAllWidgets(context);
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName component = new ComponentName(context, TaskifyHabitsCompactWidgetProvider.class);
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
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);

            int pendingCount = 0;
            try {
                String habitsJson = prefs.getString("all_habits_json", "[]");
                JSONArray arr = new JSONArray(habitsJson);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    if (!obj.optBoolean("done", false)) {
                        pendingCount++;
                    }
                }
            } catch (Exception ignored) {}

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_habits_compact_widget);
            views.setTextViewText(R.id.compact_habits_count, String.valueOf(pendingCount));
            views.setTextViewText(R.id.compact_habits_subtitle,
                    pendingCount == 0 ? "All routines completed! ✓" : pendingCount + " remaining today");

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

            // Header click opens app
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.compact_habits_header,
                    PendingIntent.getActivity(context, 4010 + appWidgetId, openAppIntent, pFlags));

            // Bind Scrollable ListView for line-wise habits
            Intent serviceIntent = new Intent(context, TaskifyWidgetListService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.putExtra("feed_type", "habits");
            serviceIntent.setData(Uri.parse("taskify://widget/service/compact_habits/" + appWidgetId));
            views.setRemoteAdapter(R.id.widget_scroll_list, serviceIntent);
            views.setEmptyView(R.id.widget_scroll_list, R.id.widget_empty);

            // Bind PendingIntent template for direct check-off
            Intent toggleTemplate = new Intent(context, TaskifyHabitsCompactWidgetProvider.class);
            toggleTemplate.setAction(TaskifyWidgetProvider.ACTION_TOGGLE_ITEM);
            toggleTemplate.setData(Uri.parse("taskify://widget/template/compact_habits/" + appWidgetId));

            int templateFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                templateFlags |= PendingIntent.FLAG_MUTABLE;
            }

            PendingIntent templatePending = PendingIntent.getBroadcast(
                    context,
                    4020 + appWidgetId,
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
