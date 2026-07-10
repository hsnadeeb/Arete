# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# expo-sqlite
-keep class expo.modules.sqlite.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.core.** { *; }

# expo-notifications
-keep class expo.modules.notifications.** { *; }
-keep class expo.modules.core.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JSI bindings
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }

# Keep all model classes
-keep class * implements com.facebook.react.bridge.NativeModule
-keep class * implements com.facebook.react.bridge.ReactPackage

# Add any project specific keep options here:
