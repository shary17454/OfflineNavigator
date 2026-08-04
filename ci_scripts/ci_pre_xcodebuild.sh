#!/bin/sh
set -euo pipefail
exec "$CI_PRIMARY_REPOSITORY_PATH/rawayah/apps/mobile/ios/ci_scripts/ci_pre_xcodebuild.sh"
