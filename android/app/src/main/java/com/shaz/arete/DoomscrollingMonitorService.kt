package com.shaz.arete

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.TextView

class DoomscrollingMonitorService : Service() {

    companion object {
        private const val TAG = "DoomscrollingMonitor"
        private const val CHANNEL_ID = "doomscrolling_channel"
        private const val NOTIF_ID = 1001
        private const val PREFS_NAME = "com.shaz.arete.doomscrolling"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_BLOCKED_APPS = "blocked_apps"
        private const val POLL_INTERVAL_MS = 1500L

        @Volatile
        var isRunning = false
            private set
    }

    private var pollingThread: Thread? = null
    private var overlayView: View? = null
    private var windowManager: WindowManager? = null
    private var prefs: SharedPreferences? = null
    private var lastBlockedApp: String? = null

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notif = buildNotification()
        startForeground(NOTIF_ID, notif)
        isRunning = true
        startPolling()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        stopPolling()
        hideOverlay()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Doomscrolling Blocker",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitoring blocked apps"
                setShowBadge(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }
        return builder
            .setContentTitle("Doomscrolling Blocker")
            .setContentText("Monitoring blocked apps")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setOngoing(true)
            .setPriority(Notification.PRIORITY_LOW)
            .build()
    }

    private fun startPolling() {
        pollingThread = Thread {
            while (isRunning) {
                try {
                    checkForegroundApp()
                    Thread.sleep(POLL_INTERVAL_MS)
                } catch (e: InterruptedException) {
                    break
                } catch (e: Exception) {
                    Log.e(TAG, "Poll error", e)
                }
            }
        }.apply { isDaemon = true; start() }
    }

    private fun stopPolling() {
        pollingThread?.interrupt()
        pollingThread = null
    }

    private fun checkForegroundApp() {
        val enabled = prefs?.getBoolean(KEY_ENABLED, false) ?: false
        if (!enabled) return

        val blockedApps = prefs?.getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()
        if (blockedApps.isEmpty()) return

        val currentApp = getForegroundPackage() ?: return

        if (blockedApps.contains(currentApp)) {
            if (currentApp != lastBlockedApp) {
                lastBlockedApp = currentApp
                Log.d(TAG, "Blocking app: $currentApp")
                showOverlay()
            }
        } else {
            if (lastBlockedApp != null) {
                lastBlockedApp = null
                hideOverlay()
            }
        }
    }

    private fun getForegroundPackage(): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return null

        val usm = getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val events = usm.queryEvents(now - 5000, now) ?: return null

        var foreground: String? = null
        var lastTime = 0L

        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            when (event.eventType) {
                UsageEvents.Event.MOVE_TO_FOREGROUND,
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    if (event.timeStamp > lastTime) {
                        foreground = event.packageName?.toString()
                        lastTime = event.timeStamp
                    }
                }
                UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                    if (event.packageName?.toString() == foreground) {
                        foreground = null
                    }
                }
            }
        }
        return foreground
    }

    private fun showOverlay() {
        if (overlayView != null) return
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
        if (!Settings.canDrawOverlays(this)) return

        try {
            val tv = TextView(this).apply {
                text = "Blocked by Arete"
                setTextColor(-0x1)
                textSize = 22f
                setTypeface(null, Typeface.BOLD)
                gravity = Gravity.CENTER
                setBackgroundColor(0xCC000000.toInt())
                setOnClickListener { hideOverlay() }
            }

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.CENTER
            }

            windowManager?.addView(tv, params)
            overlayView = tv
        } catch (e: Exception) {
            Log.e(TAG, "Overlay failed", e)
        }
    }

    private fun hideOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (_: Exception) {}
            overlayView = null
        }
    }
}
