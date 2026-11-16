package com.taskify.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Capacitor Plugin: TaskifyNativeWidget
 * Bridges TypeScript/Web state (tasks, habits, metrics, finance) with native Android AppWidgets.
 */
@CapacitorPlugin(name = "TaskifyNativeWidget")
public class TaskifyNativeWidgetPlugin extends Plugin {

    @PluginMethod
    public void syncWidgetState(PluginCall call) {
        try {
            JSObject state = call.getObject("state");
            if (state == null) {
                call.reject("Missing state object");
                return;
            }

            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            // 1. Tasks 4x2 Widget Data
            editor.putString("header_title", state.optString("headerTitle", "Today's Tasks"));
            editor.putString("header_subtitle", state.optString("headerSubtitle", "Focus on what matters"));
            editor.putInt("completed_count", state.optInt("completedCount", 0));
            editor.putInt("total_count", state.optInt("totalCount", 0));

            JSONArray taskPills = state.optJSONArray("taskPills");
            if (taskPills != null) {
                for (int i = 0; i < 6; i++) {
                    if (i < taskPills.length()) {
                        JSONObject p = taskPills.getJSONObject(i);
                        editor.putString("task_pill_" + i + "_id", p.optString("id", ""));
                        editor.putString("task_pill_" + i + "_title", p.optString("title", "Objective"));
                        editor.putString("task_pill_" + i + "_type", "task");
                        editor.putBoolean("task_pill_" + i + "_done", p.optBoolean("done", false));
                    } else {
                        editor.putString("task_pill_" + i + "_id", "");
                        editor.putString("task_pill_" + i + "_title", "Plan Ahead");
                        editor.putString("task_pill_" + i + "_type", "task");
                        editor.putBoolean("task_pill_" + i + "_done", false);
                    }
                }
            }

            // 2. Routines 4x2 Widget Data
            editor.putString("habits_title", state.optString("habitsTitle", "Daily Routines"));
            editor.putString("habits_subtitle", state.optString("habitsSubtitle", "Build steady consistency"));
            editor.putInt("habits_completed_count", state.optInt("completedHabitsCount", 0));
            editor.putInt("habits_total_count", state.optInt("totalHabitsCount", 0));

            JSONArray habitPills = state.optJSONArray("habitPills");
            if (habitPills != null) {
                for (int i = 0; i < 6; i++) {
                    if (i < habitPills.length()) {
                        JSONObject p = habitPills.getJSONObject(i);
                        editor.putString("habit_pill_" + i + "_id", p.optString("id", ""));
                        editor.putString("habit_pill_" + i + "_title", p.optString("title", "Daily Routine"));
                        editor.putString("habit_pill_" + i + "_type", "habit");
                        editor.putBoolean("habit_pill_" + i + "_done", p.optBoolean("done", false));
                    } else {
                        editor.putString("habit_pill_" + i + "_id", "");
                        editor.putString("habit_pill_" + i + "_title", "Daily Routine");
                        editor.putString("habit_pill_" + i + "_type", "habit");
                        editor.putBoolean("habit_pill_" + i + "_done", false);
                    }
                }
            }

            // 3. Scrollable List Feeds (Full arrays for ListView)
            JSONArray allTasks = state.optJSONArray("allTasks");
            editor.putString("all_tasks_json", allTasks != null ? allTasks.toString() : "[]");

            JSONArray allHabits = state.optJSONArray("allHabits");
            editor.putString("all_habits_json", allHabits != null ? allHabits.toString() : "[]");

            // 4. Date Header & Live Briefing
            editor.putString("day_short", state.optString("dayShort", "Today"));
            editor.putString("date_str", state.optString("dateStr", ""));
            editor.putString("user_name", state.optString("userName", "Alex"));
            editor.putString("small_greeting", state.optString("smallGreeting", "Good day, Alex."));
            editor.putString("small_summary", state.optString("smallSummary", "All clear for today."));

            editor.putInt("habit_streak", state.optInt("habitStreak", 1));
            editor.putString("currency", state.optString("currency", "$"));

            // 5. Finance Metrics
            editor.putString("safe_to_spend", state.optString("safeToSpend", "$45"));
            editor.putString("remaining_budget_str", state.optString("remainingBudgetStr", "$840 remaining"));
            editor.putString("monthly_budget_str", state.optString("monthlyBudgetStr", "$1,200"));
            editor.putString("spent_this_month_str", state.optString("spentThisMonthStr", "$360"));
            editor.putInt("budget_burn_percent", state.optInt("budgetBurnPercent", 25));

            // 6. Habit Matrix & Streak Metrics
            JSONArray matrixHabits = state.optJSONArray("matrixHabits");
            if (matrixHabits != null) {
                editor.putString("matrix_habits_json", matrixHabits.toString());
            }
            int streakCount = state.optInt("streakCount", 6);
            editor.putInt("habits_streak_count", streakCount);

            // 7. Focus Timer Sync
            if (state.has("timerRunning")) {
                boolean timerRunning = state.optBoolean("timerRunning", false);
                editor.putBoolean("timer_running", timerRunning);
                long durationMs = state.optLong("timerDurationMs", 25 * 60 * 1000L);
                editor.putLong("timer_duration_ms", durationMs);
                if (timerRunning) {
                    long remainingMs = state.optLong("timerRemainingMs", durationMs);
                    editor.putLong("timer_end_time", android.os.SystemClock.elapsedRealtime() + remainingMs);
                    TaskifyTimerWidgetProvider.startLiveProgressTicker(context);
                } else {
                    TaskifyTimerWidgetProvider.stopLiveProgressTicker();
                }
            }

            editor.apply();

            // Broadcast immediate widget updates across all widget providers
            TaskifyWidgetProvider.updateAllWidgets(context);
            TaskifyHabitsWidgetProvider.updateAllWidgets(context);
            TaskifySmallWidgetProvider.updateAllWidgets(context);
            TaskifyQuickActionsWidgetProvider.updateAllWidgets(context);
            TaskifyFinanceWidgetProvider.updateAllWidgets(context);
            TaskifyTimerWidgetProvider.updateAllWidgets(context);
            TaskifyMatrixWidgetProvider.updateAllWidgets(context);
            TaskifyHabitsCompactWidgetProvider.updateAllWidgets(context);

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to sync widget state", e);
        }
    }

    @PluginMethod
    public void syncTimerState(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            boolean running = call.getBoolean("running", false);
            long durationMs = call.getLong("durationMs", 25 * 60 * 1000L);
            long remainingMs = call.getLong("remainingMs", durationMs);
            int presetMinutes = call.getInt("presetMinutes", (int) (durationMs / 60000L));

            editor.putBoolean("timer_running", running);
            editor.putLong("timer_duration_ms", durationMs);
            if (presetMinutes > 0) {
                editor.putInt("timer_preset_selected", presetMinutes);
                editor.putInt("timer_total_duration_sec", presetMinutes * 60);
            }
            if (running) {
                editor.putLong("timer_end_time", android.os.SystemClock.elapsedRealtime() + remainingMs);
                TaskifyTimerWidgetProvider.startLiveProgressTicker(context);
            } else {
                TaskifyTimerWidgetProvider.stopLiveProgressTicker();
            }
            editor.apply();

            TaskifyTimerWidgetProvider.updateAllWidgets(context);

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to sync timer state", e);
        }
    }

    @PluginMethod
    public synchronized void consumePendingWidgetActions(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            String actionsJson = prefs.getString("pending_actions", "[]");
            prefs.edit().putString("pending_actions", "[]").commit();

            JSONArray actions = new JSONArray(actionsJson);
            JSObject res = new JSObject();
            res.put("actions", actions);

            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to consume pending widget actions", e);
        }
    }

    @PluginMethod
    public void getPendingWidgetActions(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            String actionsJson = prefs.getString("pending_actions", "[]");
            JSONArray actions = new JSONArray(actionsJson);

            JSObject res = new JSObject();
            res.put("actions", actions);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to get pending widget actions", e);
        }
    }

    @PluginMethod
    public void clearPendingWidgetActions(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString("pending_actions", "[]").apply();

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to clear pending actions", e);
        }
    }

    @PluginMethod
    public void getLaunchQuickAction(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            String action = prefs.getString("last_quick_action", null);
            if (action != null) {
                prefs.edit().remove("last_quick_action").apply();
            }

            JSObject res = new JSObject();
            res.put("action", action);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to get launch quick action", e);
        }
    }

    @PluginMethod
    public void setImmersiveMode(final PluginCall call) {
        final boolean enabled = call.getBoolean("enabled", false);
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }

        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        WindowInsetsController controller = getActivity().getWindow().getInsetsController();
                        if (controller != null) {
                            if (enabled) {
                                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                            } else {
                                controller.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                            }
                        }
                    } else {
                        View decorView = getActivity().getWindow().getDecorView();
                        if (enabled) {
                            decorView.setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                            );
                        } else {
                            decorView.setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            );
                        }
                    }
                    JSObject res = new JSObject();
                    res.put("success", true);
                    call.resolve(res);
                } catch (Exception e) {
                    call.reject("Failed to set immersive mode", e);
                }
            }
        });
    }
}
