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

# رقم البناء اليدوي في pubspec.yaml يتعارض بسهولة مع رفعات سابقة (يدوية
# أو من تشغيلات CI أخرى). CI_BUILD_NUMBER من Xcode Cloud يتزايد تلقائيًا
# ومضمون أعلى من أي رقم سابق دائمًا — نستبدل به بعد أن يُنشئ flutter
# build ملف Generated.xcconfig، قبل أن تبدأ مرحلة الأرشفة الفعلية.
if [ -n "${CI_BUILD_NUMBER:-}" ]; then
  sed -i '' "s/^FLUTTER_BUILD_NUMBER=.*/FLUTTER_BUILD_NUMBER=${CI_BUILD_NUMBER}/" ios/Flutter/Generated.xcconfig
fi

if command -v xattr >/dev/null 2>&1; then
  xattr -cr build/ios || true
fi
