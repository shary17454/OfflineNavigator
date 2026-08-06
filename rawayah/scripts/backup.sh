#!/usr/bin/env bash
# ينشئ نسخة احتياطية مضغوطة من قاعدة بيانات Postgres عبر حاوية docker-compose.
# النسخ تُحفظ محليًا فقط في backups/ ولا تُرفع لأي مكان تلقائيًا.
set -euo pipefail

COMPOSE_SERVICE="${POSTGRES_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-rawaya}"
DB_NAME="${POSTGRES_DB:-rawaya}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="$BACKUP_DIR/rawaya-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "جارٍ إنشاء نسخة احتياطية من قاعدة البيانات '$DB_NAME' (الخدمة: $COMPOSE_SERVICE)..."
docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T "$COMPOSE_SERVICE" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUT_FILE"

echo "تم الحفظ في: $OUT_FILE"
