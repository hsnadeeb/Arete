#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
DOWNLOADS="$HOME/Downloads"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

# Build number (YYYYMMDD-HHMMSS)
BUILD_NUMBER=$(date +"%Y%m%d-%H%M%S")

APP_NAME="Arete"
OUTPUT_APK="$DOWNLOADS/${APP_NAME}-Build-${BUILD_NUMBER}.apk"

echo "======================================="
echo "🚀 Building Arete Release APK (Expo)"
echo "======================================="

# --- EXPO CRITICAL STEP ---
echo ""
echo "⚙️ Regenerating native Android folder and bundling JS..."
# This ensures the android folder exists, native plugins are synced,
# and your latest JS/TS code is compiled.
cd "$PROJECT_ROOT"
# npx expo prebuild --platform android --clean
npx expo prebuild --clean


echo ""
echo "🧹 Cleaning old Gradle build artifacts..."
# Remove Gradle/CMake build outputs
rm -rf "$ANDROID_DIR/.gradle"
rm -rf "$ANDROID_DIR/build"
rm -rf "$ANDROID_DIR/app/build"
rm -rf "$ANDROID_DIR/app/.cxx"

# Remove accidental duplicate folders
rm -rf "$ANDROID_DIR/app 2"
rm -rf "$ANDROID_DIR/build 2"
rm -rf "$ANDROID_DIR/gradle 2"

cd "$ANDROID_DIR"

echo ""
echo "🔨 Building release APK..."
# Expo prebuild ensures gradlew is correctly configured
./gradlew assembleRelease

echo ""
echo "📦 Verifying APK..."

if [ ! -f "$APK_PATH" ]; then
  echo "❌ Release APK was not generated."
  exit 1
fi

echo "📁 Copying APK to Downloads..."
cp -f "$APK_PATH" "$OUTPUT_APK"

echo ""
echo "======================================="
echo "✅ Build completed successfully!"
echo "======================================="
echo ""
echo "APK Location:"
echo "  $OUTPUT_APK"
echo ""

ls -lh "$OUTPUT_APK"

echo ""
echo "🎉 Done!"
