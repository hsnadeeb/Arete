#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

# Versioned APK filename
VERSION=$(date +"%Y-%m-%d_%H-%M")
OUTPUT_APK="$HOME/Downloads/Arete-$VERSION.apk"

echo "🚀 Starting build process for Arete..."

# Optional prebuild to sync native code
if [[ "$*" == *"--prebuild"* ]]; then
  echo "⚙️ Running expo prebuild..."
  npx expo prebuild --platform android
fi

cd "$ANDROID_DIR"

echo "🔨 Building release APK..."
./gradlew assembleRelease

if [ ! -f "$APK_PATH" ]; then
  echo "❌ Build failed: APK not found at $APK_PATH"
  exit 1
fi

# Verify signing
echo "🛡️ Verifying APK signature..."
APKSIGNER="apksigner"

if ! command -v apksigner >/dev/null 2>&1; then
  # Try to find it in Android SDK
  SDK_PATH="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  LATEST_BUILD_TOOLS=$(ls -d "$SDK_PATH/build-tools/"* 2>/dev/null | sort -V | tail -1)
  if [ -n "$LATEST_BUILD_TOOLS" ] && [ -f "$LATEST_BUILD_TOOLS/apksigner" ]; then
    APKSIGNER="$LATEST_BUILD_TOOLS/apksigner"
  fi
fi

if command -v "$APKSIGNER" >/dev/null 2>&1 || [ -f "$APKSIGNER" ]; then
  "$APKSIGNER" verify --verbose "$APK_PATH" || { echo "⚠️ APK might not be signed correctly."; }
else
  echo "ℹ️ apksigner not found in PATH or SDK, skipping verification. (Ensure you have a release.keystore)"
fi

cp "$APK_PATH" "$OUTPUT_APK"

echo "✅ APK copied to $OUTPUT_APK"
echo "👉 IMPORTANT: Uninstall any existing 'Arete' app from your phone before installing this new version."
