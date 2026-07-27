package com.shaz.arete

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class DoomscrollingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val NAME = "DoomscrollingModule"
        private const val PREFS_NAME = "com.shaz.arete.doomscrolling"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_BLOCKED_APPS = "blocked_apps"
    }

    private val prefs: SharedPreferences by lazy {
        reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun isEnabled(promise: Promise) {
        try {
            promise.resolve(prefs.getBoolean(KEY_ENABLED, false))
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()

        if (enabled) {
            val intent = Intent(reactApplicationContext, DoomscrollingAccessibilityService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
        } else {
            val intent = Intent(reactApplicationContext, DoomscrollingAccessibilityService::class.java)
            reactApplicationContext.stopService(intent)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            promise.resolve(DoomscrollingAccessibilityService.isRunning)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val defaults: Set<String> = setOf(
                "com.instagram.android",
                "com.google.android.youtube",
                "com.zhiliaoapp.musically",
                "com.ss.android.ugc.trill",
                "com.snapchat.android",
                "com.facebook.katana",
                "com.twitter.android"
            )
            val apps: Set<String> = prefs.getStringSet(KEY_BLOCKED_APPS, defaults) ?: defaults
            promise.resolve(apps.toList())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray) {
        val appSet: MutableSet<String> = HashSet()
        for (i in 0 until apps.size()) {
            val pkg = apps.getString(i) ?: continue
            appSet.add(pkg)
        }
        prefs.edit().putStringSet(KEY_BLOCKED_APPS, appSet).apply()
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val am = reactApplicationContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
            val enabledServices = am.getEnabledAccessibilityServiceList(
                android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_GENERIC
            )
            val componentName = ComponentName(reactApplicationContext, DoomscrollingAccessibilityService::class.java)
            val isEnabled = enabledServices.any { it.resolveInfo.serviceInfo.packageName == componentName.packageName }
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun openUsageAccessSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
