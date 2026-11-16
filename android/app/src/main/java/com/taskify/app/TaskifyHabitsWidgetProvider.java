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

/**
 * Taskify Glassmorphic Daily Routines AppWidget Provider (4x2 Resizable)
 * Dedicated to Habits / Routines ONLY with smooth Y-axis vertical scrolling.
 * Direct manipulation: Tapping any habit toggles/increments it immediately on the home screen.
 */
public class TaskifyHabitsWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        TaskifyWidgetProvider.checkAndRolloverDailyRoutines(context);
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
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
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName component = new ComponentName(context, TaskifyHabitsWidgetProvider.class);
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

            String title = prefs.getString("habits_title", "Daily Routines");
            int completedCount = prefs.getInt("habits_completed_count", 0);
            int totalCount = prefs.getInt("habits_total_count", 0);
            String subtitle = completedCount >= 2 ? "Streak on fire" : "Build steady consistency";

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_habits_widget);
            views.setTextViewText(R.id.widget_habits_title, title);
            views.setTextViewText(R.id.widget_habits_subtitle, subtitle);
            views.setTextViewText(R.id.widget_habits_badge, completedCount + "/" + Math.max(totalCount, completedCount));

            // Header click opens app
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.widget_habits_header, PendingIntent.getActivity(
                    context, 100, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Bind Y-Axis Scrollable ListView
            Intent serviceIntent = new Intent(context, TaskifyWidgetListService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.putExtra("feed_type", "habits");
            serviceIntent.setData(Uri.parse("taskify://widget/service/habits/" + appWidgetId));
            views.setRemoteAdapter(R.id.widget_scroll_list, serviceIntent);
            views.setEmptyView(R.id.widget_scroll_list, R.id.widget_empty);

            // Bind PendingIntent template for direct habit check-offs without opening the app
            Intent toggleTemplate = new Intent(context, TaskifyHabitsWidgetProvider.class);
            toggleTemplate.setAction(TaskifyWidgetProvider.ACTION_TOGGLE_ITEM);
            toggleTemplate.setData(Uri.parse("taskify://widget/template/habits/" + appWidgetId));

            int templateFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                templateFlags |= PendingIntent.FLAG_MUTABLE;
            }

            PendingIntent templatePending = PendingIntent.getBroadcast(
                    context,
                    2000 + appWidgetId,
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
