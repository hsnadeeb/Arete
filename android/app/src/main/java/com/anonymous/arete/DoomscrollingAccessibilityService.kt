package com.anonymous.arete

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class DoomscrollingAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "DoomscrollingService"
        private const val PREFS_NAME = "com.anonymous.arete.doomscrolling"
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
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                AccessibilityEvent.TYPE_VIEW_SCROLLED
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        info.notificationTimeout = 100
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
        info.flags = info.flags or AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
        serviceInfo = info
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        val enabled = prefs?.getBoolean(KEY_ENABLED, false) ?: false
        if (!enabled) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                handleWindowStateChanged(event)
            }
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                handleScrollEvent(event)
            }
            else -> {}
        }
    }

    private fun handleWindowStateChanged(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString() ?: return
        val blockedApps = prefs?.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()

        if (blockedApps.contains(packageName)) {
            Log.d(TAG, "Blocked app detected: $packageName")
            performGlobalAction(GLOBAL_ACTION_BACK)
        }
    }

    private fun handleScrollEvent(event: AccessibilityEvent) {
        val packageName = event.packageName?.toString() ?: return
        val blockedApps = prefs?.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()

        if (!blockedApps.contains(packageName)) return

        val source = event.source ?: return
        if (isLikelyShortFormFeed(source)) {
            Log.d(TAG, "Short-form feed detected in $packageName, performing back")
            performGlobalAction(GLOBAL_ACTION_BACK)
        }
        source.recycle()
    }

    private fun isLikelyShortFormFeed(node: AccessibilityNodeInfo): Boolean {
        val className = node.className?.toString() ?: ""
        val isVerticalScrollContainer = className.contains("RecyclerView") ||
                className.contains("ViewPager") ||
                className.contains("ScrollView")

        if (!isVerticalScrollContainer) return false

        return hasVideoContent(node)
    }

    private fun hasVideoContent(node: AccessibilityNodeInfo): Boolean {
        val className = node.className?.toString()?.lowercase() ?: ""
        if (className.contains("video") || className.contains("player")) return true

        val text = node.text?.toString()?.lowercase() ?: ""
        if (text.contains("reel") || text.contains("short") || text.contains("tiktok")) return true

        if (node.childCount in 1..10) {
            for (i in 0 until node.childCount) {
                val child = node.getChild(i) ?: continue
                if (hasVideoContent(child)) {
                    child.recycle()
                    return true
                }
                child.recycle()
            }
        }

        return false
    }

    override fun onInterrupt() {
        Log.d(TAG, "Accessibility service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        Log.d(TAG, "Accessibility service destroyed")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }
}
