package com.taskify.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * RemoteViewsService providing scrollable list rows for Taskify AppWidgets.
 * Powers Y-axis smooth vertical scrolling through all today's tasks, routines, and habit consistency matrix.
 */
public class TaskifyWidgetListService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new TaskifyWidgetViewsFactory(this.getApplicationContext(), intent);
    }
}

class TaskifyWidgetViewsFactory implements RemoteViewsService.RemoteViewsFactory {
    private final Context context;
    private final String feedType;
    private final List<ListItem> items = new ArrayList<>();

    static class ListItem {
        final String id;
        final String title;
        final String type;
        final boolean done;
        final boolean[] days; // 7-day consistency booleans for matrix
        final int streak;

        ListItem(String id, String title, String type, boolean done) {
            this(id, title, type, done, null, 0);
        }

        ListItem(String id, String title, String type, boolean done, boolean[] days, int streak) {
            this.id = id;
            this.title = title;
            this.type = type;
            this.done = done;
            this.days = days;
            this.streak = streak;
        }
    }

    public TaskifyWidgetViewsFactory(Context context, Intent intent) {
        this.context = context;
        String type = null;
        if (intent != null) {
            type = intent.getStringExtra("feed_type");
            if (type == null && intent.getData() != null) {
                type = intent.getData().getQueryParameter("feed_type");
            }
        }
        this.feedType = (type != null) ? type : "all";
    }

    @Override
    public void onCreate() {
        loadData();
    }

    @Override
    public void onDataSetChanged() {
        loadData();
    }

    private void loadData() {
        items.clear();
        try {
            TaskifyWidgetProvider.checkAndRolloverDailyRoutines(context);
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);

            if ("matrix".equals(feedType)) {
                String matrixJson = prefs.getString("matrix_habits_json", "[]");
                JSONArray arr = new JSONArray(matrixJson);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    String id = obj.optString("id");
                    String name = obj.optString("name", "Routine");
                    int streak = obj.optInt("streak", 0);
                    boolean[] days = new boolean[7];
                    JSONArray daysArr = obj.optJSONArray("days");
                    if (daysArr != null) {
                        for (int d = 0; d < 7 && d < daysArr.length(); d++) {
                            days[d] = daysArr.optBoolean(d, false);
                        }
                    }
                    boolean todayDone = days[6];
                    if (!id.isEmpty()) {
                        items.add(new ListItem(id, name, "habit", todayDone, days, streak));
                    }
                }
            } else if ("tasks".equals(feedType)) {
                String jsonStr = prefs.getString("all_tasks_json", "[]");
                JSONArray arr = new JSONArray(jsonStr);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    String id = obj.optString("id");
                    String title = obj.optString("title", "Objective");
                    boolean done = obj.optBoolean("done", false);
                    if (!id.isEmpty()) {
                        items.add(new ListItem(id, title, "task", done));
                    }
                }
            } else if ("habits".equals(feedType)) {
                String jsonStr = prefs.getString("all_habits_json", "[]");
                JSONArray arr = new JSONArray(jsonStr);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    String id = obj.optString("id");
                    String title = obj.optString("title", "Routine");
                    boolean done = obj.optBoolean("done", false);
                    if (!id.isEmpty()) {
                        items.add(new ListItem(id, title, "habit", done));
                    }
                }
            } else {
                // "all" feed (Scrollable Day Feed): load tasks first, then routines
                String tasksJson = prefs.getString("all_tasks_json", "[]");
                JSONArray tasksArr = new JSONArray(tasksJson);
                for (int i = 0; i < tasksArr.length(); i++) {
                    JSONObject obj = tasksArr.getJSONObject(i);
                    String id = obj.optString("id");
                    String title = obj.optString("title", "Objective");
                    boolean done = obj.optBoolean("done", false);
                    if (!id.isEmpty()) {
                        items.add(new ListItem(id, title, "task", done));
                    }
                }

                String habitsJson = prefs.getString("all_habits_json", "[]");
                JSONArray habitsArr = new JSONArray(habitsJson);
                for (int i = 0; i < habitsArr.length(); i++) {
                    JSONObject obj = habitsArr.getJSONObject(i);
                    String id = obj.optString("id");
                    String title = obj.optString("title", "Routine");
                    boolean done = obj.optBoolean("done", false);
                    if (!id.isEmpty()) {
                        items.add(new ListItem(id, title, "habit", done));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        items.clear();
    }

    @Override
    public int getCount() {
        return items.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        if (position < 0 || position >= items.size()) return null;

        ListItem item = items.get(position);

        if ("matrix".equals(feedType)) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_matrix_list_item);
            views.setTextViewText(R.id.matrix_item_title, item.title);

            int[] dotIds = new int[]{
                    R.id.matrix_item_dot_0, R.id.matrix_item_dot_1, R.id.matrix_item_dot_2,
                    R.id.matrix_item_dot_3, R.id.matrix_item_dot_4, R.id.matrix_item_dot_5, R.id.matrix_item_dot_6
            };
            for (int d = 0; d < 7; d++) {
                boolean done = item.days != null && item.days[d];
                if (done) {
                    views.setImageViewResource(dotIds[d], R.drawable.taskify_matrix_dot_done);
                } else if (d == 6) {
                    views.setImageViewResource(dotIds[d], R.drawable.taskify_matrix_dot_today_empty);
                } else {
                    views.setImageViewResource(dotIds[d], R.drawable.taskify_matrix_dot_empty);
                }
            }

            // Fill-in Intent for habit toggle directly on home screen
            Intent fillInIntent = new Intent();
            fillInIntent.putExtra(TaskifyWidgetProvider.EXTRA_ITEM_ID, item.id);
            fillInIntent.putExtra(TaskifyWidgetProvider.EXTRA_ITEM_TYPE, "habit");
            fillInIntent.putExtra(TaskifyWidgetProvider.EXTRA_ITEM_INDEX, position);
            fillInIntent.setData(Uri.parse("taskify://widget/fill/matrix/" + item.id));
            views.setOnClickFillInIntent(R.id.matrix_item_root, fillInIntent);

            return views;
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_widget_list_item);
        views.setTextViewText(R.id.item_title, item.title);

        if (item.done) {
            views.setInt(R.id.item_root, "setBackgroundResource", R.drawable.taskify_widget_pill_completed);
            views.setTextColor(R.id.item_title, 0xFF71717A);
            views.setImageViewResource(R.id.item_check, R.drawable.taskify_widget_ic_check_orange);
        } else {
            views.setInt(R.id.item_root, "setBackgroundResource", R.drawable.taskify_widget_pill_pending);
            views.setTextColor(R.id.item_title, 0xFFE4E4E7);
            views.setImageViewResource(R.id.item_check, R.drawable.taskify_widget_ic_circle_unchecked);
        }

        // Fill-in Intent for item check-off directly on home screen
        Intent fillInIntent = new Intent();
        fillInIntent.putExtra(TaskifyWidgetProvider.EXTRA_ITEM_ID, item.id);
        fillInIntent.putExtra(TaskifyWidgetProvider.EXTRA_ITEM_TYPE, item.type);
        fillInIntent.putExtra(TaskifyWidgetProvider.EXTRA_ITEM_INDEX, position);
        fillInIntent.setData(Uri.parse("taskify://widget/fill/" + item.type + "/" + item.id));
        views.setOnClickFillInIntent(R.id.item_root, fillInIntent);
        views.setOnClickFillInIntent(R.id.item_check, fillInIntent);

        return views;
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 2;
    }

    @Override
    public long getItemId(int position) {
        if (position >= 0 && position < items.size()) {
            return items.get(position).id.hashCode();
        }
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}
