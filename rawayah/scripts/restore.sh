#!/usr/bin/env bash
# يستعيد قاعدة بيانات Postgres من نسخة احتياطية. عملية مدمِّرة: تستبدل كل
# البيانات الحالية بمحتوى الملف. تتطلب تأكيدًا صريحًا ما لم يُمرَّر --yes.
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "الاستخدام: scripts/restore.sh <مسار ملف .sql.gz> [--yes]"
  exit 1
fi

BACKUP_FILE="$1"
CONFIRM="${2:-}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "الملف غير موجود: $BACKUP_FILE"
  exit 1
fi

COMPOSE_SERVICE="${POSTGRES_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-rawaya}"
DB_NAME="${POSTGRES_DB:-rawaya}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$CONFIRM" != "--yes" ]; then
  echo "تحذير: هذه العملية تحذف كل البيانات الحالية في قاعدة البيانات '$DB_NAME' وتستبدلها بمحتوى '$BACKUP_FILE'."
  read -r -p "اكتب 'نعم' للمتابعة: " ANSWER
  if [ "$ANSWER" != "نعم" ]; then
    echo "أُلغيت العملية."
    exit 1
  fi
fi

echo "جارٍ الاستعادة من: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T "$COMPOSE_SERVICE" psql -U "$DB_USER" "$DB_NAME"
echo "تمت الاستعادة."
