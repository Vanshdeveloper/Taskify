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
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Taskify Instant Focus / Pomodoro Timer AppWidget Provider (4x2 Resizable)
 * Direct home-screen countdown powered by Android Chronometer and live responsive circular ring.
 * Features 1-second dynamic progress updates while running.
 */
public class TaskifyTimerWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_TIMER_TOGGLE = "com.taskify.app.ACTION_TIMER_TOGGLE";
    public static final String ACTION_TIMER_STOP = "com.taskify.app.ACTION_TIMER_STOP";
    public static final String ACTION_TIMER_PRESET = "com.taskify.app.ACTION_TIMER_PRESET";
    public static final String EXTRA_PRESET_MINUTES = "extra_preset_minutes";

    private static Handler sTimerHandler = null;
    private static Runnable sTimerRunnable = null;

    public static synchronized void startLiveProgressTicker(final Context context) {
        stopLiveProgressTicker();
        if (sTimerHandler == null) {
            sTimerHandler = new Handler(Looper.getMainLooper());
        }
        sTimerRunnable = new Runnable() {
            @Override
            public void run() {
                try {
                    SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
                    boolean running = prefs.getBoolean("timer_running", false);
                    if (!running) {
                        stopLiveProgressTicker();
                        return;
                    }

                    long endTime = prefs.getLong("timer_end_time", 0);
                    long remaining = endTime - SystemClock.elapsedRealtime();

                    if (remaining <= 0) {
                        prefs.edit().putBoolean("timer_running", false).putLong("timer_duration_ms", 0).apply();
                        recordPendingAction(context, "timer-complete", 0);
                        updateAllWidgets(context);
                        stopLiveProgressTicker();
                        return;
                    }

                    // Refresh widget ring progress each second
                    updateAllWidgets(context);

                    if (sTimerHandler != null) {
                        sTimerHandler.postDelayed(this, 1000);
                    }
                } catch (Throwable ignored) {}
            }
        };
        sTimerHandler.postDelayed(sTimerRunnable, 1000);
    }

    public static synchronized void stopLiveProgressTicker() {
        if (sTimerHandler != null && sTimerRunnable != null) {
            sTimerHandler.removeCallbacks(sTimerRunnable);
            sTimerRunnable = null;
        }
    }

    private static void recordPendingAction(Context context, String actionType, int minutes) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            String actionsJson = prefs.getString("pending_actions", "[]");
            JSONArray arr = new JSONArray(actionsJson);
            JSONObject obj = new JSONObject();
            obj.put("action", actionType);
            if (minutes > 0) obj.put("minutes", minutes);
            obj.put("timestamp", System.currentTimeMillis());
            arr.put(obj);
            prefs.edit().putString("pending_actions", arr.toString()).apply();
        } catch (Exception ignored) {}
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
        SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
        if (prefs.getBoolean("timer_running", false)) {
            startLiveProgressTicker(context);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        try {
            String action = intent.getAction();
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            if (ACTION_TIMER_TOGGLE.equals(action)) {
                boolean running = prefs.getBoolean("timer_running", false);
                int preset = prefs.getInt("timer_preset_selected", 25);
                int totalSec = prefs.getInt("timer_total_duration_sec", preset * 60);
                long durationMs = prefs.getLong("timer_duration_ms", (long) totalSec * 1000L);

                if (running) {
                    // Pause timer: calculate remaining time
                    long endTime = prefs.getLong("timer_end_time", 0);
                    long remaining = Math.max(0, endTime - SystemClock.elapsedRealtime());
                    editor.putBoolean("timer_running", false);
                    editor.putLong("timer_duration_ms", remaining > 0 ? remaining : (long) totalSec * 1000L);
                    editor.apply();
                    stopLiveProgressTicker();
                    recordPendingAction(context, "timer-pause", 0);
                } else {
                    // Start timer
                    long endTime = SystemClock.elapsedRealtime() + durationMs;
                    editor.putBoolean("timer_running", true);
                    editor.putLong("timer_end_time", endTime);
                    editor.apply();
                    startLiveProgressTicker(context);
                    recordPendingAction(context, "timer-start", 0);
                }
                updateAllWidgets(context);

            } else if (ACTION_TIMER_STOP.equals(action)) {
                int preset = prefs.getInt("timer_preset_selected", 25);
                int totalSec = prefs.getInt("timer_total_duration_sec", preset * 60);
                editor.putBoolean("timer_running", false);
                editor.putLong("timer_duration_ms", (long) totalSec * 1000L);
                editor.apply();
                stopLiveProgressTicker();
                recordPendingAction(context, "timer-reset", 0);
                updateAllWidgets(context);

            } else if (ACTION_TIMER_PRESET.equals(action)) {
                int minutes = intent.getIntExtra(EXTRA_PRESET_MINUTES, 25);
                editor.putInt("timer_preset_selected", minutes);
                editor.putInt("timer_total_duration_sec", minutes * 60);
                editor.putBoolean("timer_running", false);
                editor.putLong("timer_duration_ms", minutes * 60 * 1000L);
                editor.apply();
                stopLiveProgressTicker();
                recordPendingAction(context, "timer-preset", minutes);
                updateAllWidgets(context);
            }
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName component = new ComponentName(context, TaskifyTimerWidgetProvider.class);
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

            boolean running = prefs.getBoolean("timer_running", false);
            long durationMs = prefs.getLong("timer_duration_ms", 25 * 60 * 1000L);
            long endTime = prefs.getLong("timer_end_time", SystemClock.elapsedRealtime() + durationMs);
            int preset = prefs.getInt("timer_preset_selected", 25);

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_timer_widget);

            // 1. Preset chip states
            views.setInt(R.id.btn_preset_25, "setBackgroundResource",
                    preset == 25 ? R.drawable.taskify_timer_chip_active_bg : R.drawable.taskify_timer_chip_bg);
            views.setInt(R.id.btn_preset_50, "setBackgroundResource",
                    preset == 50 ? R.drawable.taskify_timer_chip_active_bg : R.drawable.taskify_timer_chip_bg);
            views.setInt(R.id.btn_preset_5, "setBackgroundResource",
                    preset == 5 ? R.drawable.taskify_timer_chip_active_bg : R.drawable.taskify_timer_chip_bg);

            // 2. Responsive circular progress ring (0 to 100%)
            int totalSec = prefs.getInt("timer_total_duration_sec", Math.max(1, preset * 60));
            if (totalSec <= 0) totalSec = Math.max(1, preset * 60);
            int remSec;
            if (running) {
                long rem = Math.max(0, endTime - SystemClock.elapsedRealtime());
                remSec = (int) (rem / 1000L);
            } else {
                remSec = (int) (durationMs / 1000L);
            }
            int progressPercent = Math.max(0, Math.min(100, Math.round(((float) remSec / totalSec) * 100f)));
            views.setProgressBar(R.id.timer_progress_ring, 100, progressPercent, false);

            // 3. Native Live Chronometer countdown
            if (running) {
                views.setChronometerCountDown(R.id.timer_chronometer, true);
                views.setChronometer(R.id.timer_chronometer, endTime, "%s", true);
                views.setImageViewResource(R.id.btn_timer_icon, R.drawable.taskify_ic_timer_pause);
                views.setTextViewText(R.id.btn_timer_stop, "Reset");
            } else {
                long displayBase = SystemClock.elapsedRealtime() + durationMs;
                views.setChronometerCountDown(R.id.timer_chronometer, true);
                views.setChronometer(R.id.timer_chronometer, displayBase, "%s", false);
                views.setImageViewResource(R.id.btn_timer_icon, R.drawable.taskify_ic_timer_play);
                views.setTextViewText(R.id.btn_timer_stop, "Reset");
            }

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            // 4. Play/Pause toggle click
            Intent toggleIntent = new Intent(context, TaskifyTimerWidgetProvider.class);
            toggleIntent.setAction(ACTION_TIMER_TOGGLE);
            toggleIntent.setData(Uri.parse("taskify://widget/timer/toggle/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_timer_toggle,
                    PendingIntent.getBroadcast(context, 7001 + appWidgetId, toggleIntent, pFlags));

            // 5. Stop / Reset click
            Intent stopIntent = new Intent(context, TaskifyTimerWidgetProvider.class);
            stopIntent.setAction(ACTION_TIMER_STOP);
            stopIntent.setData(Uri.parse("taskify://widget/timer/stop/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_timer_stop,
                    PendingIntent.getBroadcast(context, 7002 + appWidgetId, stopIntent, pFlags));

            // 6. Preset 25 mins click
            Intent preset25 = new Intent(context, TaskifyTimerWidgetProvider.class);
            preset25.setAction(ACTION_TIMER_PRESET);
            preset25.putExtra(EXTRA_PRESET_MINUTES, 25);
            preset25.setData(Uri.parse("taskify://widget/timer/preset/25/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_preset_25,
                    PendingIntent.getBroadcast(context, 7025 + appWidgetId, preset25, pFlags));

            // 7. Preset 50 mins click
            Intent preset50 = new Intent(context, TaskifyTimerWidgetProvider.class);
            preset50.setAction(ACTION_TIMER_PRESET);
            preset50.putExtra(EXTRA_PRESET_MINUTES, 50);
            preset50.setData(Uri.parse("taskify://widget/timer/preset/50/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_preset_50,
                    PendingIntent.getBroadcast(context, 7050 + appWidgetId, preset50, pFlags));

            // 8. Preset 5 mins click
            Intent preset5 = new Intent(context, TaskifyTimerWidgetProvider.class);
            preset5.setAction(ACTION_TIMER_PRESET);
            preset5.putExtra(EXTRA_PRESET_MINUTES, 5);
            preset5.setData(Uri.parse("taskify://widget/timer/preset/5/" + appWidgetId));
            views.setOnClickPendingIntent(R.id.btn_preset_5,
                    PendingIntent.getBroadcast(context, 7005 + appWidgetId, preset5, pFlags));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
