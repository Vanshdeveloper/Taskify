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
 * Powers Y-axis smooth vertical scrolling through all today's tasks and routines.
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

        ListItem(String id, String title, String type, boolean done) {
            this.id = id;
            this.title = title;
            this.type = type;
            this.done = done;
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
            SharedPreferences prefs = context.getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);

            if ("tasks".equals(feedType)) {
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
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_widget_list_item);
        views.setTextViewText(R.id.item_title, item.title);

        if (item.done) {
            views.setInt(R.id.item_root, "setBackgroundResource", R.drawable.taskify_widget_pill_completed);
            views.setTextColor(R.id.item_title, 0xFF141312);
            views.setImageViewResource(R.id.item_check, R.drawable.taskify_widget_ic_check_dark);
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
        return 1;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}
