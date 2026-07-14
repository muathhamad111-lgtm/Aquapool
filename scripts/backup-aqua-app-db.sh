#!/usr/bin/env bash
# Deployed to /root/scripts/backup-aqua-app-db.sh on the production server,
# run daily via root's crontab: 15 3 * * * /root/scripts/backup-aqua-app-db.sh
#
# Restore (manual, not automated):
#   gunzip -c <file>.sql.gz | psql -h 127.0.0.1 -U aqua_app aqua_app

set -euo pipefail

BACKUP_DIR="/var/backups/aqua_app"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${BACKUP_DIR}/aqua_app-${TIMESTAMP}.sql.gz"
KEEP=7

mkdir -p "${BACKUP_DIR}"

PGPASSWORD="$(cat /root/.aqua_app_db_password)" \
  pg_dump -h 127.0.0.1 -U aqua_app aqua_app | gzip > "${FILE}"

# Keep only the most recent $KEEP dumps
ls -1t "${BACKUP_DIR}"/aqua_app-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "$(date -Iseconds) backup written: ${FILE} ($(du -h "${FILE}" | cut -f1))" >> "${BACKUP_DIR}/backup.log"
