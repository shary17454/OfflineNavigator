#!/bin/sh
set -euo pipefail

APP_DIR="${CI_PRIMARY_REPOSITORY_PATH}/rawayah/apps/mobile"
cd "$APP_DIR"

if [ -d "$HOME/flutter/bin" ]; then
  export PATH="$HOME/flutter/bin:$PATH"
fi

if command -v xattr >/dev/null 2>&1; then
  xattr -cr . || true
fi

flutter build ios --release --no-codesign \
  --dart-define=API_BASE_URL=https://rawaya-api-production.up.railway.app/api

if command -v xattr >/dev/null 2>&1; then
  xattr -cr build/ios || true
fi
