package com.taskify.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TaskifyNativeWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        // Enable Chrome remote inspection and wireless debugging
        WebView.setWebContentsDebuggingEnabled(true);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.hasExtra("quick_action")) {
            String action = intent.getStringExtra("quick_action");
            if (action != null && !action.isEmpty()) {
                SharedPreferences prefs = getSharedPreferences(TaskifyWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit().putString("last_quick_action", action).apply();
            }
        }
    }
}
