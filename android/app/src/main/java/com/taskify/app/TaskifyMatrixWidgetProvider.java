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
import java.util.Calendar;

/**
 * Taskify 7-Day Habit Consistency Matrix AppWidget Provider (4x2 Resizable)
 * Displays all habits with an illuminated 7-day consistency dot grid, live flame streak,
 * and smooth Y-axis scrolling to view every tracked routine.
 * Direct check-offs: Tapping any habit's row toggles completion live on the home screen.
 */
public class TaskifyMatrixWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        try {
            String action = intent.getAction();
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
            ComponentName component = new ComponentName(context, TaskifyMatrixWidgetProvider.class);
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
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_matrix_widget);

            // 1. Calculate dynamic 7-day weekday labels ending at Today
            Calendar cal = Calendar.getInstance();
            String[] weekChars = new String[]{"S", "M", "T", "W", "T", "F", "S"};
            int todayDow = cal.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sun, 1=Mon, ..., 6=Sat

            int[] labelIds = new int[]{
                    R.id.day_label_0, R.id.day_label_1, R.id.day_label_2,
                    R.id.day_label_3, R.id.day_label_4, R.id.day_label_5, R.id.day_label_6
            };
            for (int i = 0; i < 7; i++) {
                int dow = (todayDow - (6 - i) + 7) % 7;
                views.setTextViewText(labelIds[i], weekChars[dow]);
                views.setTextColor(labelIds[i], i == 6 ? 0xFFF26A36 : 0xFFA1A1AA);
            }

            // 2. Set streak badge
            int streakCount = prefs.getInt("habits_streak_count", 6);
            views.setTextViewText(R.id.matrix_streak_badge, "🔥 " + streakCount + " Days");

            // 3. Connect ListView to TaskifyWidgetListService with feed_type="matrix"
            Intent serviceIntent = new Intent(context, TaskifyWidgetListService.class);
            serviceIntent.putExtra("feed_type", "matrix");
            serviceIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
            serviceIntent.setData(Uri.parse("taskify://widget/list/matrix/" + appWidgetId));
            views.setRemoteAdapter(R.id.matrix_scroll_list, serviceIntent);
            views.setEmptyView(R.id.matrix_scroll_list, R.id.widget_matrix_empty);

            // 4. PendingIntentTemplate for clicking habit items in the list to toggle
            Intent toggleIntent = new Intent(context, TaskifyMatrixWidgetProvider.class);
            toggleIntent.setAction(TaskifyWidgetProvider.ACTION_TOGGLE_ITEM);
            toggleIntent.setData(Uri.parse("taskify://widget/matrix/toggle/" + appWidgetId));
            int mutFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                mutFlags |= PendingIntent.FLAG_MUTABLE;
            }
            PendingIntent togglePendingIntent = PendingIntent.getBroadcast(context, 8000 + appWidgetId, toggleIntent, mutFlags);
            views.setPendingIntentTemplate(R.id.matrix_scroll_list, togglePendingIntent);

            // 5. Header opens Habits tab in app
            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.putExtra("quick_action", "routine");
            appIntent.setData(Uri.parse("taskify://habits"));
            appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int immutFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            views.setOnClickPendingIntent(R.id.widget_matrix_header,
                    PendingIntent.getActivity(context, 8090 + appWidgetId, appIntent, immutFlags));

            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.matrix_scroll_list);
            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
