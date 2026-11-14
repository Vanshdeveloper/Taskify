package com.taskify.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/**
 * Taskify Finance & Safe-To-Spend AppWidget Provider (2x2 / 4x2 Resizable)
 * Displays live daily allowance pace, monthly burn meter, and instant expense logger.
 */
public class TaskifyFinanceWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName component = new ComponentName(context, TaskifyFinanceWidgetProvider.class);
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

            String safeToSpend = prefs.getString("safe_to_spend", "$45");
            String remainingLabel = prefs.getString("remaining_budget_str", "$840 remaining");
            int percentSpent = prefs.getInt("budget_burn_percent", 25);
            String currency = prefs.getString("currency", "$");

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.taskify_finance_widget);
            views.setTextViewText(R.id.widget_finance_safe_amount, safeToSpend);
            views.setTextViewText(R.id.widget_finance_remaining_label, remainingLabel);
            views.setTextViewText(R.id.widget_finance_percent_label, percentSpent + "% spent");
            views.setProgressBar(R.id.widget_finance_progress, 100, Math.min(100, Math.max(0, percentSpent)), false);
            views.setTextViewText(R.id.widget_finance_currency_badge, currency + " FINANCE");

            // Header opens Finance view
            Intent financeIntent = new Intent(context, MainActivity.class);
            financeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            financeIntent.putExtra("quick_action", "finance");
            views.setOnClickPendingIntent(R.id.widget_finance_header, PendingIntent.getActivity(
                    context, 500, financeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            // Log Expense button opens direct modal
            Intent expenseIntent = new Intent(context, MainActivity.class);
            expenseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            expenseIntent.putExtra("quick_action", "expense");
            views.setOnClickPendingIntent(R.id.btn_finance_log_expense, PendingIntent.getActivity(
                    context, 501, expenseIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            ));

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
