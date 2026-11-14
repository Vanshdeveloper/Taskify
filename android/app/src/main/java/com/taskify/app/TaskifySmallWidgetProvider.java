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
 * Taskify Scrollable Day Feed AppWidget Provider (2x2 to 2x4 Resizable)
 * Features:
 * - Bold Day of week ("Thu") + Accent Orange dot + Date.
 * - Natural language briefing ("Good afternoon, Vansh. 1 task & 0 routines today.").
 * - Y-Axis vertical scrollable list of all day feed items.
 * - Direct tactile check-offs that NEVER open the app.
 */
public class TaskifySmallWidgetProvider extends AppWidgetProvider {

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
            ComponentName component = new ComponentName(context, TaskifySmallWidgetProvider.class);
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

            String dayShort = prefs.getString("day_short", "Today");
            String dateStr = prefs.getString("date_str", "");
            String greeting = prefs.getString("small_greeting", "Good day, Alex.");
            String summary = prefs.getString("small_summary", "All clear for today.");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_small_widget);
            views.setTextViewText(R.id.small_widget_day, dayShort);
            views.setTextViewText(R.id.small_widget_date, dateStr);
            views.setTextViewText(R.id.small_widget_greeting, greeting);
            views.setTextViewText(R.id.small_widget_summary, summary);

            // Header click opens app
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            views.setOnClickPendingIntent(R.id.small_widget_header, PendingIntent.getActivity(
                    context, 10, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Bind Y-Axis Scrollable ListView for unified Day Feed
            Intent serviceIntent = new Intent(context, TaskifyWidgetListService.class);
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.putExtra("feed_type", "all");
            serviceIntent.setData(Uri.parse("taskify://widget/service/feed/" + appWidgetId));
            views.setRemoteAdapter(R.id.widget_scroll_list, serviceIntent);
            views.setEmptyView(R.id.widget_scroll_list, R.id.widget_empty);

            // Bind PendingIntent template for direct feed item check-offs without opening the app
            Intent toggleTemplate = new Intent(context, TaskifySmallWidgetProvider.class);
            toggleTemplate.setAction(TaskifyWidgetProvider.ACTION_TOGGLE_ITEM);
            toggleTemplate.setData(Uri.parse("taskify://widget/template/feed/" + appWidgetId));

            int templateFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                templateFlags |= PendingIntent.FLAG_MUTABLE;
            }

            PendingIntent templatePending = PendingIntent.getBroadcast(
                    context,
                    3000 + appWidgetId,
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
