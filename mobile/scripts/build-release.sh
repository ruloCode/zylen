#!/bin/bash
# Build Android firmado con el keystore de upload (mobile/credentials.json).
#
# Uso:
#   ./scripts/build-release.sh apk   → APK instalable para probar en dispositivo
#   ./scripts/build-release.sh aab   → AAB para subir a Google Play
#
# Las contraseñas nunca se escriben en archivos del repo: se exportan como
# variables de entorno que android/app/build.gradle lee en signingConfigs.release.
set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="${1:-aab}"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"

export ZYLEN_UPLOAD_STORE_FILE="$(pwd)/$(node -p "require('./credentials.json').android.keystore.keystorePath")"
export ZYLEN_UPLOAD_STORE_PASSWORD="$(node -p "require('./credentials.json').android.keystore.keystorePassword")"
export ZYLEN_UPLOAD_KEY_ALIAS="$(node -p "require('./credentials.json').android.keystore.keyAlias")"
export ZYLEN_UPLOAD_KEY_PASSWORD="$(node -p "require('./credentials.json').android.keystore.keyPassword")"

if [ ! -f "$ZYLEN_UPLOAD_STORE_FILE" ]; then
  echo "❌ No existe el keystore: $ZYLEN_UPLOAD_STORE_FILE" >&2
  exit 1
fi

# `expo prebuild --clean` regenera android/ y borra el signingConfig release.
if ! grep -q ZYLEN_UPLOAD_STORE_FILE android/app/build.gradle; then
  echo "❌ android/app/build.gradle no tiene el signingConfig release." >&2
  echo "   (¿Corriste 'expo prebuild --clean'? Re-aplica el bloque release en signingConfigs.)" >&2
  exit 1
fi

cd android
if [ "$TARGET" = "apk" ]; then
  ./gradlew assembleRelease
  echo ""
  echo "✅ APK firmado: android/app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew bundleRelease
  echo ""
  echo "✅ AAB firmado: android/app/build/outputs/bundle/release/app-release.aab"
fi
