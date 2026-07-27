package com.shaz.arete

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class DoomscrollingAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "DoomscrollingService"
        private const val PREFS_NAME = "com.shaz.arete.doomscrolling"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_BLOCKED_APPS = "blocked_apps"

        @Volatile
        var isRunning = false
            private set

        fun isEnabled(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getBoolean(KEY_ENABLED, false)
        }

        fun getBlockedApps(context: Context): Set<String> {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val apps = prefs.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()
            if (apps.isEmpty()) {
                return setOf(
                    "com.instagram.android",
                    "com.google.android.youtube",
                    "com.zhiliaoapp.musically",
                    "com.ss.android.ugc.trill",
                    "com.snapchat.android",
                    "com.facebook.katana",
                    "com.twitter.android"
                )
            }
            return apps
        }
    }

    private var prefs: SharedPreferences? = null

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.d(TAG, "DoomscrollingAccessibilityService created")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
        Log.d(TAG, "Accessibility service connected")

        val info = AccessibilityServiceInfo()
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        info.notificationTimeout = 100
        serviceInfo = info
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val enabled = prefs?.getBoolean(KEY_ENABLED, false) ?: false
        if (!enabled) return

        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return
        val blockedApps = prefs?.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()

        if (blockedApps.contains(packageName)) {
            Log.d(TAG, "Blocked app detected: $packageName")
            performGlobalAction(GLOBAL_ACTION_HOME)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        Log.d(TAG, "Accessibility service destroyed")
    }
}
