package com.taskify.app;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Lightweight translucent quick-capture dialog activity.
 * Allows adding tasks, routines, and expenses directly from the home screen
 * in under 50ms without opening or foregrounding the main application.
 */
public class TaskifyQuickCaptureActivity extends Activity {

    public static final String EXTRA_TYPE = "extra_type"; // "task", "habit", "expense"

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_quick_capture);

        // Keep soft input responsive
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);

        final String type = getIntent() != null && getIntent().getStringExtra(EXTRA_TYPE) != null
                ? getIntent().getStringExtra(EXTRA_TYPE)
                : "task";

        TextView tagView = findViewById(R.id.dialog_tag);
        TextView titleView = findViewById(R.id.dialog_title);
        final EditText inputPrimary = findViewById(R.id.input_primary);
        final EditText inputSecondary = findViewById(R.id.input_secondary);
        View btnCancel = findViewById(R.id.btn_cancel);
        View btnSave = findViewById(R.id.btn_save);

        if ("habit".equalsIgnoreCase(type) || "routine".equalsIgnoreCase(type)) {
            tagView.setText("ROUTINE");
            titleView.setText("New Routine");
            inputPrimary.setHint("e.g. Read 20 pages");
            inputSecondary.setVisibility(View.GONE);
        } else if ("expense".equalsIgnoreCase(type)) {
            tagView.setText("EXPENSE");
            titleView.setText("Log Expense");
            inputPrimary.setHint("Amount (e.g. 15.00)");
            inputPrimary.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
            inputSecondary.setVisibility(View.VISIBLE);
            inputSecondary.setHint("Note (e.g. Groceries)");
        } else {
            tagView.setText("TASK");
            titleView.setText("New Task");
            inputPrimary.setHint("What needs to be done?");
            inputSecondary.setVisibility(View.GONE);
        }

        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        btnSave.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String primaryText = inputPrimary.getText().toString().trim();
                if (primaryText.isEmpty()) {
                    Toast.makeText(TaskifyQuickCaptureActivity.this, "Please enter details", Toast.LENGTH_SHORT).show();
                    return;
                }

                saveActionAndRefresh(type, primaryText, inputSecondary.getText().toString().trim());
                finish();
            }
        });
    }

    private void saveActionAndRefresh(String type, String primary, String secondary) {
        try {
            SharedPreferences prefs = getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            // 1. Append to pending_actions array for App sync
            String pendingStr = prefs.getString("pending_actions", "[]");
            JSONArray actions = new JSONArray(pendingStr);

            JSONObject actionObj = new JSONObject();
            actionObj.put("timestamp", System.currentTimeMillis());

            if ("habit".equalsIgnoreCase(type) || "routine".equalsIgnoreCase(type)) {
                actionObj.put("action", "add-habit");
                actionObj.put("name", primary);
                actions.put(actionObj);

                // Update local widget cache immediately (prepend)
                String habitsJson = prefs.getString("all_habits_json", "[]");
                JSONArray habitsArr = new JSONArray(habitsJson);
                JSONObject newH = new JSONObject();
                newH.put("id", "temp_h_" + System.currentTimeMillis());
                newH.put("title", primary);
                newH.put("done", false);
                JSONArray prependedHabits = new JSONArray();
                prependedHabits.put(newH);
                for (int i = 0; i < habitsArr.length(); i++) {
                    prependedHabits.put(habitsArr.get(i));
                }
                editor.putString("all_habits_json", prependedHabits.toString());

                // Update matrix habits
                String matrixJson = prefs.getString("matrix_habits_json", "[]");
                JSONArray matrixArr = new JSONArray(matrixJson);
                JSONObject newM = new JSONObject();
                newM.put("id", "temp_h_" + System.currentTimeMillis());
                newM.put("name", primary);
                newM.put("streak", 0);
                JSONArray daysArr = new JSONArray();
                for (int d = 0; d < 7; d++) daysArr.put(false);
                newM.put("days", daysArr);
                JSONArray prependedMatrix = new JSONArray();
                prependedMatrix.put(newM);
                for (int i = 0; i < matrixArr.length(); i++) {
                    prependedMatrix.put(matrixArr.get(i));
                }
                editor.putString("matrix_habits_json", prependedMatrix.toString());

                Toast.makeText(this, "Routine added: " + primary, Toast.LENGTH_SHORT).show();

            } else if ("expense".equalsIgnoreCase(type)) {
                actionObj.put("action", "add-expense");
                double amt = 0.0;
                try {
                    amt = Double.parseDouble(primary);
                } catch (NumberFormatException ignored) {}
                actionObj.put("amount", amt);
                actionObj.put("note", secondary.isEmpty() ? "Quick expense" : secondary);
                actions.put(actionObj);

                String currency = prefs.getString("currency", "$");
                Toast.makeText(this, "Expense recorded: " + currency + primary, Toast.LENGTH_SHORT).show();

            } else {
                // Task
                actionObj.put("action", "add-task");
                actionObj.put("title", primary);
                actions.put(actionObj);

                // Update local widget cache immediately (prepend)
                String tasksJson = prefs.getString("all_tasks_json", "[]");
                JSONArray tasksArr = new JSONArray(tasksJson);
                JSONObject newT = new JSONObject();
                newT.put("id", "temp_t_" + System.currentTimeMillis());
                newT.put("title", primary);
                newT.put("done", false);
                JSONArray prependedTasks = new JSONArray();
                prependedTasks.put(newT);
                for (int i = 0; i < tasksArr.length(); i++) {
                    prependedTasks.put(tasksArr.get(i));
                }
                editor.putString("all_tasks_json", prependedTasks.toString());

                int total = prefs.getInt("total_count", 0) + 1;
                editor.putInt("total_count", total);
                editor.putInt("task_total_count", total);

                Toast.makeText(this, "Task created: " + primary, Toast.LENGTH_SHORT).show();
            }

            editor.putString("pending_actions", actions.toString());
            editor.apply();

            // Refresh all widgets immediately on home screen
            TaskifyWidgetProvider.updateAllWidgets(this);
            TaskifyHabitsWidgetProvider.updateAllWidgets(this);
            TaskifyMatrixWidgetProvider.updateAllWidgets(this);
            TaskifyFinanceWidgetProvider.updateAllWidgets(this);
            TaskifySmallWidgetProvider.updateAllWidgets(this);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
