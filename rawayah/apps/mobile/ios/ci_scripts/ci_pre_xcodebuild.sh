#!/bin/sh
set -euo pipefail

cd "$CI_PRIMARY_REPOSITORY_PATH/apps/mobile"

if [ -d "$HOME/flutter/bin" ]; then
  export PATH="$HOME/flutter/bin:$PATH"
fi

if command -v xattr >/dev/null 2>&1; then
  xattr -cr . || true
fi

flutter build ios --release --no-codesign

if command -v xattr >/dev/null 2>&1; then
  xattr -cr build/ios || true
fi
