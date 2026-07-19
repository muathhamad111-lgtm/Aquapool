#!/usr/bin/env bash
#
# Near-zero-downtime deploy for the aqua-app Laravel API (Nginx + PHP-FPM).
#
# Mirrors scripts/deploy-frontend.sh: releases + atomic symlink swap + health
# check + auto-rollback. The parts that differ are Laravel-specific:
#   - `storage/` is SHARED across releases, not per-release. Uploaded images
#     (ImageUploadService writes to the `public` disk) live there — a
#     per-release storage dir would make every deploy lose every upload.
#   - Migrations run BEFORE the symlink swap, against a fresh pg_dump taken
#     in the same run. See "Rollback and the database" below.
#   - PHP-FPM is reloaded (not restarted) after the swap: without it, opcache
#     keeps serving the previous release's compiled files.
#
# The secret .env lives ONCE under $SHARED_DIR/.env and is symlinked into
# every release — never copied around, never in the repo.
#
# ---------------------------------------------------------------------------
# BEFORE THE FIRST RUN, verify the four settings under "Environment profiles"
# against the actual server (`systemctl list-units 'php*fpm*'`, and the
# `root` of the API's Nginx server block). The script refuses to run if the
# service or the live path doesn't exist, rather than guessing.
# ---------------------------------------------------------------------------
# USAGE (run on the server as root):
#
#   1. Upload the fresh API SOURCE from your machine (no vendor/.env/storage):
#        rsync -az --delete \
#          --exclude vendor --exclude .env --exclude storage \
#          --exclude node_modules \
#          aqua-app/  root@SERVER:/var/www/aqua-api-incoming/
#
#   2. Deploy:
#        /root/scripts/deploy-api.sh production /var/www/aqua-api-incoming
#
#   Rollback to a previous release (lists them if no arg):
#        /root/scripts/deploy-api.sh production --rollback
#        /root/scripts/deploy-api.sh production --rollback 20260719-140233
#
# ROLLBACK AND THE DATABASE
#   --rollback repoints the code symlink only. It does NOT undo migrations,
#   deliberately: `migrate:rollback` on a release that already took writes
#   destroys data. Write migrations so the previous release can still run
#   against the new schema (add columns, don't rename/drop in the same
#   deploy). If a rollback genuinely needs the old schema, restore the dump
#   this script took under $BACKUP_DIR before the migration ran.
# ---------------------------------------------------------------------------

set -euo pipefail

# ----- Environment profiles -------------------------------------------------
ENVIRONMENT="${1:-}"
case "$ENVIRONMENT" in
  production)
    FPM_SERVICE="${FPM_SERVICE:-php8.4-fpm.service}"
    LIVE_LINK="/var/www/aqua-api"
    HEALTH_URL="${HEALTH_URL:-https://aqua-api.moathhamad.space/api/v1/health}"
    DB_NAME="aqua_app"
    ;;
  *)
    echo "Usage: $0 production <source-dir> | production --rollback [release]" >&2
    exit 2
    ;;
esac

RELEASES_DIR="${LIVE_LINK}-releases"
SHARED_DIR="${LIVE_LINK}-shared"
BACKUP_DIR="/var/backups/aqua_app/pre-deploy"
KEEP=5
PHP="$(command -v php || echo /usr/bin/php)"
COMPOSER="$(command -v composer || echo /usr/local/bin/composer)"
TS="$(date +%Y%m%d-%H%M%S)"

log() { echo "[$(date -Iseconds)] $*"; }
die() { echo "[$(date -Iseconds)] ERROR: $*" >&2; exit 1; }

# ----- Health check: retry curl for ~20s ------------------------------------
# /api/v1/health returns 200 with {"data":{"status":"ok",...}} and 503 with
# "degraded" when PostgreSQL is unreachable — so 200 alone is the pass
# condition here, unlike the frontend script which also accepts a redirect.
health_ok() {
  for _ in $(seq 1 20); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$HEALTH_URL" || true)"
    if [ "$code" = "200" ]; then return 0; fi
    sleep 1
  done
  return 1
}

reload_fpm() {
  systemctl reload "$FPM_SERVICE" || systemctl restart "$FPM_SERVICE"
}

# ----- Rollback mode --------------------------------------------------------
if [ "${2:-}" = "--rollback" ]; then
  TARGET="${3:-}"
  if [ -z "$TARGET" ]; then
    log "Available releases under $RELEASES_DIR (newest first):"
    ls -1t "$RELEASES_DIR" 2>/dev/null || die "no releases dir"
    echo "Re-run: $0 $ENVIRONMENT --rollback <release-name>"
    exit 0
  fi
  [ -d "$RELEASES_DIR/$TARGET" ] || die "release '$TARGET' not found"
  log "Rolling back CODE ONLY — database migrations are not reverted."
  ln -sfn "$RELEASES_DIR/$TARGET" "$LIVE_LINK"
  reload_fpm
  health_ok && log "Rolled back to $TARGET and healthy." || die "rollback reloaded but health check FAILED"
  exit 0
fi

# ----- Preflight ------------------------------------------------------------
SOURCE="${2:-}"
[ -n "$SOURCE" ] && [ -d "$SOURCE" ] || die "source dir '$SOURCE' missing (arg 2)"
[ -f "$SOURCE/artisan" ] && [ -f "$SOURCE/composer.json" ] || die "'$SOURCE' is not the aqua-app source"
systemctl list-unit-files --no-legend "$FPM_SERVICE" | grep -q . \
  || die "service '$FPM_SERVICE' not found — set FPM_SERVICE=<name> or fix the profile above"
command -v pg_dump >/dev/null || die "pg_dump not found — needed for the pre-migration backup"

mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$BACKUP_DIR"

# First-run: adopt the existing live .env and storage/ into the shared store.
if [ ! -f "$SHARED_DIR/.env" ]; then
  if [ -f "$LIVE_LINK/.env" ]; then
    cp -a "$LIVE_LINK/.env" "$SHARED_DIR/.env"
    log "Adopted existing .env into $SHARED_DIR/.env"
  else
    die "no .env found at $SHARED_DIR/.env or $LIVE_LINK/.env — create it first"
  fi
fi
if [ ! -d "$SHARED_DIR/storage" ]; then
  if [ -d "$LIVE_LINK/storage" ]; then
    cp -a "$LIVE_LINK/storage" "$SHARED_DIR/storage"
    log "Adopted existing storage/ (uploads, logs) into $SHARED_DIR/storage"
  else
    die "no storage/ found at $SHARED_DIR/storage or $LIVE_LINK/storage — create it first"
  fi
fi

# ----- Stage the new release (live site still untouched) --------------------
NEW_RELEASE="$RELEASES_DIR/$TS"
log "Preparing release $NEW_RELEASE"
mkdir -p "$NEW_RELEASE"
cp -a "$SOURCE/." "$NEW_RELEASE/"
# Never let uploaded copies win over the shared ones.
rm -rf "$NEW_RELEASE/.env" "$NEW_RELEASE/vendor" "$NEW_RELEASE/storage"
ln -sfn "$SHARED_DIR/.env" "$NEW_RELEASE/.env"
ln -sfn "$SHARED_DIR/storage" "$NEW_RELEASE/storage"

log "Installing dependencies (no dev, optimized autoloader)…"
( cd "$NEW_RELEASE" && "$COMPOSER" install --no-dev --no-interaction --prefer-dist --optimize-autoloader ) \
  || die "composer install failed — live site untouched"

# public/storage → ../storage/app/public, so uploaded images resolve in the
# new release too. Recreated per release because it's a relative symlink
# inside public/, which is not itself shared.
log "Linking public/storage…"
( cd "$NEW_RELEASE" && "$PHP" artisan storage:link --quiet ) || die "storage:link failed — live site untouched"

log "Caching config, routes and views…"
( cd "$NEW_RELEASE" && "$PHP" artisan config:cache && "$PHP" artisan route:cache && "$PHP" artisan view:cache ) \
  || die "cache warm-up failed — live site untouched"

# ----- Database: back up, then migrate --------------------------------------
# Runs before the swap so the new code never meets the old schema. The dump
# is the only way back if a migration turns out to be destructive.
DUMP="${BACKUP_DIR}/${DB_NAME}-predeploy-${TS}.sql.gz"
log "Backing up $DB_NAME → $DUMP"
PGPASSWORD="$(cat /root/.aqua_app_db_password)" \
  pg_dump -h 127.0.0.1 -U "$DB_NAME" "$DB_NAME" | gzip > "$DUMP" \
  || die "pre-migration backup failed — refusing to migrate, live site untouched"

log "Running migrations…"
( cd "$NEW_RELEASE" && "$PHP" artisan migrate --force ) \
  || die "migration failed — live site untouched; restore from $DUMP if the schema is now partial"

# ----- Record current target for auto-rollback ------------------------------
PREVIOUS=""
if [ -L "$LIVE_LINK" ]; then
  PREVIOUS="$(readlink -f "$LIVE_LINK")"
elif [ -d "$LIVE_LINK" ]; then
  BACKUP="${LIVE_LINK}-legacy-${TS}"
  log "First run: backing up existing live dir to $BACKUP"
  mv "$LIVE_LINK" "$BACKUP"
  PREVIOUS="$BACKUP"
fi

# ----- Atomic swap + reload -------------------------------------------------
log "Swapping live symlink → $NEW_RELEASE"
ln -sfn "$NEW_RELEASE" "$LIVE_LINK"
# Nginx resolves the symlink per request but PHP-FPM's opcache caches by
# resolved path, so without this reload it keeps executing the old release.
reload_fpm

# ----- Verify, auto-rollback on failure -------------------------------------
if health_ok; then
  log "Deploy OK — API healthy on $HEALTH_URL"
else
  log "Health check FAILED — rolling back code (migrations stay applied)"
  if [ -n "$PREVIOUS" ]; then
    ln -sfn "$PREVIOUS" "$LIVE_LINK"
    reload_fpm
    health_ok && log "Rolled back to previous release." || log "ROLLBACK ALSO UNHEALTHY — investigate now."
  fi
  die "deploy failed; rolled back code. DB dump for this run: $DUMP"
fi

# ----- Prune old releases (keep newest $KEEP) -------------------------------
( cd "$RELEASES_DIR" && ls -1t | tail -n +$((KEEP + 1)) | xargs -r rm -rf )
( cd "$BACKUP_DIR" && ls -1t | tail -n +$((KEEP + 1)) | xargs -r rm -f )
log "Done. Kept newest $KEEP releases in $RELEASES_DIR and $KEEP pre-deploy dumps in $BACKUP_DIR."
