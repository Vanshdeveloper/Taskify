package com.taskify.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
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
            editor.putString("sync_date_iso", state.optString("syncDateIso", ""));
            editor.putString("day_short", state.optString("dayShort", "Today"));
            editor.putString("date_str", state.optString("dateStr", ""));
            editor.putString("user_name", state.optString("userName", "Alex"));
            editor.putString("small_greeting", state.optString("smallGreeting", "Good day, Alex."));
            editor.putString("small_summary", state.optString("smallSummary", "All clear for today."));

            editor.putInt("habit_streak", state.optInt("habitStreak", 1));
            editor.putString("currency", state.optString("currency", "$"));

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

    /**
     * In-App Updater: Downloads latest APK in the background with progress reporting
     * and automatically triggers the Android native Package Installer.
     */
    @PluginMethod
    public void downloadAndInstallUpdate(final PluginCall call) {
        final String url = call.getString("url");
        final String version = call.getString("version", "latest");
        final String fileName = call.getString("fileName", "Taskify-v" + version + ".apk");

        if (url == null || url.trim().isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                InputStream in = null;
                FileOutputStream out = null;
                try {
                    URL downloadUrl = new URL(url);
                    conn = (HttpURLConnection) downloadUrl.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "Taskify-Android-App");
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.connect();

                    // Handle redirects (GitHub release asset redirects to AWS S3)
                    int code = conn.getResponseCode();
                    if (code == HttpURLConnection.HTTP_MOVED_PERM || code == HttpURLConnection.HTTP_MOVED_TEMP || code == 307 || code == 308) {
                        String redirectUrl = conn.getHeaderField("Location");
                        if (redirectUrl != null) {
                            conn.disconnect();
                            downloadUrl = new URL(redirectUrl);
                            conn = (HttpURLConnection) downloadUrl.openConnection();
                            conn.setRequestProperty("User-Agent", "Taskify-Android-App");
                            conn.setConnectTimeout(15000);
                            conn.setReadTimeout(30000);
                            conn.connect();
                        }
                    }

                    int totalBytes = conn.getContentLength();
                    in = conn.getInputStream();

                    Context ctx = getContext();
                    File cacheDir = ctx.getExternalCacheDir();
                    if (cacheDir == null) {
                        cacheDir = ctx.getCacheDir();
                    }
                    File apkFile = new File(cacheDir, fileName);
                    if (apkFile.exists()) {
                        apkFile.delete();
                    }

                    out = new FileOutputStream(apkFile);
                    byte[] buffer = new byte[32768];
                    long bytesReadSoFar = 0;
                    int count;
                    long lastEmitTime = 0;

                    while ((count = in.read(buffer)) != -1) {
                        bytesReadSoFar += count;
                        out.write(buffer, 0, count);

                        long now = System.currentTimeMillis();
                        if (now - lastEmitTime > 200) {
                            lastEmitTime = now;
                            int progress = totalBytes > 0 ? (int) ((bytesReadSoFar * 100) / totalBytes) : -1;
                            JSObject progressEvt = new JSObject();
                            progressEvt.put("status", "downloading");
                            progressEvt.put("progress", progress);
                            progressEvt.put("bytesDownloaded", bytesReadSoFar);
                            progressEvt.put("totalBytes", totalBytes);
                            notifyListeners("updateProgress", progressEvt);
                        }
                    }
                    out.flush();

                    // Notify download completed
                    JSObject compEvt = new JSObject();
                    compEvt.put("status", "completed");
                    compEvt.put("progress", 100);
                    compEvt.put("bytesDownloaded", bytesReadSoFar);
                    compEvt.put("totalBytes", bytesReadSoFar);
                    compEvt.put("filePath", apkFile.getAbsolutePath());
                    notifyListeners("updateProgress", compEvt);

                    // Automatically trigger native package installation
                    boolean triggered = triggerApkInstall(apkFile);

                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("filePath", apkFile.getAbsolutePath());
                    result.put("installTriggered", triggered);
                    call.resolve(result);

                } catch (Exception err) {
                    JSObject errEvt = new JSObject();
                    errEvt.put("status", "error");
                    errEvt.put("error", err.getMessage());
                    notifyListeners("updateProgress", errEvt);
                    call.reject("Failed to download update: " + err.getMessage(), err);
                } finally {
                    try {
                        if (out != null) out.close();
                        if (in != null) in.close();
                        if (conn != null) conn.disconnect();
                    } catch (Exception ignored) {}
                }
            }
        }).start();
    }

    /**
     * Re-triggers installation of a previously downloaded APK.
     */
    @PluginMethod
    public void installDownloadedApk(final PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null || filePath.trim().isEmpty()) {
            call.reject("File path required");
            return;
        }

        File apkFile = new File(filePath);
        boolean ok = triggerApkInstall(apkFile);
        JSObject res = new JSObject();
        res.put("success", ok);
        call.resolve(res);
    }

    private boolean triggerApkInstall(File apkFile) {
        try {
            Context context = getContext();
            if (apkFile == null || !apkFile.exists()) {
                return false;
            }

            // On Android 8.0+ (Oreo, API 26+), verify package installer permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.getPackageManager().canRequestPackageInstalls()) {
                    Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    permIntent.setData(Uri.parse("package:" + context.getPackageName()));
                    permIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(permIntent);
                }
            }

            Uri apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(installIntent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
