#!/bin/sh
set -euo pipefail

# Xcode Cloud: repository root is OfflineNavigator; Flutter app lives under rawayah/
APP_DIR="${CI_PRIMARY_REPOSITORY_PATH}/rawayah/apps/mobile"
cd "$APP_DIR"

if ! command -v flutter >/dev/null 2>&1; then
  git clone https://github.com/flutter/flutter.git --depth 1 -b stable "$HOME/flutter"
  export PATH="$HOME/flutter/bin:$PATH"
fi

export PATH="${HOME}/flutter/bin:${PATH}"

flutter --version
flutter precache --ios
flutter pub get
flutter test
