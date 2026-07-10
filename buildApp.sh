#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

# Versioned APK filename
VERSION=$(date +"%Y-%m-%d_%H-%M")
OUTPUT_APK="$HOME/Downloads/Arete-$VERSION.apk"

cd "$ANDROID_DIR"

./gradlew assembleRelease

cp "$APK_PATH" "$OUTPUT_APK"

echo "✅ APK copied to $OUTPUT_APK"
