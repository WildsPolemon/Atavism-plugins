#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/android-cashier"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
./gradlew assembleDebug --no-daemon
mkdir -p "$ROOT/release"
cp -f app/build/outputs/apk/debug/app-debug.apk "$ROOT/release/starnet-cashier-android-debug.apk"
echo "APK: $ROOT/release/starnet-cashier-android-debug.apk"
