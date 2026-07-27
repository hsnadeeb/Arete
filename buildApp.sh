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

# Restore custom native code that prebuild may have overwritten
echo "📦 Restoring custom native modules..."
NATIVE_SRC="$PROJECT_ROOT/src/native-modules/android"
NATIVE_DST="$ANDROID_DIR/app/src/main/java/com/shaz/arete"
if [ -d "$NATIVE_SRC" ]; then
  mkdir -p "$NATIVE_DST"
  cp "$NATIVE_SRC/DoomscrollingModule.kt" "$NATIVE_DST/" 2>/dev/null || echo "  ⚠️ DoomscrollingModule.kt not found"
  cp "$NATIVE_SRC/DoomscrollingPackage.kt" "$NATIVE_DST/" 2>/dev/null || echo "  ⚠️ DoomscrollingPackage.kt not found"
  cp "$NATIVE_SRC/DoomscrollingAccessibilityService.kt" "$NATIVE_DST/" 2>/dev/null || echo "  ⚠️ DoomscrollingAccessibilityService.kt not found"
  cp "$NATIVE_SRC/DoomscrollingMonitorService.kt" "$NATIVE_DST/" 2>/dev/null || echo "  ⚠️ DoomscrollingMonitorService.kt not found"
  # Restore accessibility service XML config
  mkdir -p "$ANDROID_DIR/app/src/main/res/xml"
  cp "$NATIVE_SRC/res/xml/doomscrolling_service.xml" "$ANDROID_DIR/app/src/main/res/xml/" 2>/dev/null || echo "  ⚠️ doomscrolling_service.xml not found"
  echo "  ✅ Custom native modules restored"

  # Patch AndroidManifest to add DoomscrollingMonitorService if missing
  MANIFEST="$ANDROID_DIR/app/src/main/AndroidManifest.xml"
  if [ -f "$MANIFEST" ] && ! grep -q "DoomscrollingMonitorService" "$MANIFEST"; then
    sed -i '' 's|</application>|    <service android:name=".DoomscrollingMonitorService" android:exported="false" android:foregroundServiceType="specialUse" />\n  </application>|' "$MANIFEST"
    echo "  ✅ AndroidManifest patched for DoomscrollingMonitorService"
  fi
fi

# Copy keystores from project root to android/app/ for consistent signing
echo "🔑 Copying keystores..."
cp "$PROJECT_ROOT/release.keystore" "$ANDROID_DIR/app/release.keystore" 2>/dev/null || echo "⚠️ release.keystore not found at project root"
cp "$PROJECT_ROOT/debug.keystore" "$ANDROID_DIR/app/debug.keystore" 2>/dev/null || echo "⚠️ debug.keystore not found at project root"

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

echo ""
echo "🔑 App Fingerprints (for Google/Firebase Console):"
echo "--------------------------------------------------"
if command -v keytool >/dev/null 2>&1; then
  keytool -list -v -keystore "$PROJECT_ROOT/release.keystore" -alias arete -storepass arete123 | grep -E "SHA1|SHA256"
else
  echo "⚠️ keytool not found, could not print fingerprints."
fi
echo "--------------------------------------------------"
echo ""

echo "👉 IMPORTANT: Uninstall any existing 'Arete' app from your phone before installing this new version."
