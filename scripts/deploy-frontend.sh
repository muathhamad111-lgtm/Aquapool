#!/usr/bin/env bash
#
# Zero-(near)-downtime deploy for the aqua-frontend TanStack Start SSR app.
#
# Pattern: releases + atomic symlink swap + health check + auto-rollback.
#   - Builds the NEW release fully BEFORE touching the live site, so a failed
#     build never affects production.
#   - Swaps the live path via a single atomic `ln -sfn`, then restarts systemd.
#   - Health-checks the new process; if it fails, repoints the symlink back to
#     the previous release and restarts (automatic rollback).
#   - Keeps the last $KEEP releases for instant manual rollback.
#
# The secret .env lives ONCE under $SHARED_DIR/.env and is symlinked into every
# release — it is never copied around and never lives in the repo.
#
# ---------------------------------------------------------------------------
# USAGE (run on the server as root):
#
#   1. Upload the fresh frontend SOURCE from your machine (no node_modules/
#      .output/.env), e.g.:
#        rsync -az --delete \
#          --exclude node_modules --exclude .output --exclude .env \
#          --exclude .wrangler --exclude .tanstack \
#          aqua-frontend/  root@SERVER:/var/www/aqua-pool-incoming/
#
#   2. Deploy:
#        /root/scripts/deploy-frontend.sh production /var/www/aqua-pool-incoming
#      or for staging:
#        /root/scripts/deploy-frontend.sh staging /var/www/aqua-pool-incoming
#
#   Manual rollback to a previous release (lists them if no arg):
#        /root/scripts/deploy-frontend.sh production --rollback
# ---------------------------------------------------------------------------

set -euo pipefail

# ----- Environment profiles -------------------------------------------------
ENVIRONMENT="${1:-}"
case "$ENVIRONMENT" in
  production)
    SERVICE="aqua-pool.service"
    LIVE_LINK="/var/www/aqua-pool"
    PORT="3000"
    ;;
  staging)
    SERVICE="aqua-pool-staging.service"
    LIVE_LINK="/var/www/aqua-pool-staging"
    PORT="3001"            # adjust if staging uses a different PORT
    ;;
  *)
    echo "Usage: $0 <production|staging> <source-dir> | <production|staging> --rollback [release]" >&2
    exit 2
    ;;
esac

RELEASES_DIR="${LIVE_LINK}-releases"
SHARED_DIR="${LIVE_LINK}-shared"
KEEP=5
HEALTH_URL="http://127.0.0.1:${PORT}/"
BUN="$(command -v bun || echo /root/.bun/bin/bun)"
TS="$(date +%Y%m%d-%H%M%S)"

log() { echo "[$(date -Iseconds)] $*"; }
die() { echo "[$(date -Iseconds)] ERROR: $*" >&2; exit 1; }

# ----- Health check: retry curl for ~20s ------------------------------------
health_ok() {
  for _ in $(seq 1 20); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$HEALTH_URL" || true)"
    if [ "$code" = "200" ] || [ "$code" = "302" ]; then return 0; fi
    sleep 1
  done
  return 1
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
  ln -sfn "$RELEASES_DIR/$TARGET" "$LIVE_LINK"
  systemctl restart "$SERVICE"
  health_ok && log "Rolled back to $TARGET and healthy." || die "rollback restarted but health check FAILED"
  exit 0
fi

# ----- Normal deploy --------------------------------------------------------
SOURCE="${2:-}"
[ -n "$SOURCE" ] && [ -d "$SOURCE" ] || die "source dir '$SOURCE' missing (arg 2)"
[ -f "$SOURCE/package.json" ] && [ -f "$SOURCE/vite.config.ts" ] || die "'$SOURCE' is not the aqua-frontend source"

mkdir -p "$RELEASES_DIR" "$SHARED_DIR"

# First-run: adopt the existing live .env into the shared store.
if [ ! -f "$SHARED_DIR/.env" ]; then
  if [ -f "$LIVE_LINK/.env" ]; then
    cp -a "$LIVE_LINK/.env" "$SHARED_DIR/.env"
    log "Adopted existing .env into $SHARED_DIR/.env"
  else
    die "no .env found at $SHARED_DIR/.env or $LIVE_LINK/.env — create it first"
  fi
fi

NEW_RELEASE="$RELEASES_DIR/$TS"
log "Preparing release $NEW_RELEASE"
mkdir -p "$NEW_RELEASE"
cp -a "$SOURCE/." "$NEW_RELEASE/"
# Never let an uploaded .env/artifacts win over the shared one.
rm -rf "$NEW_RELEASE/.env" "$NEW_RELEASE/node_modules" "$NEW_RELEASE/.output"
ln -sfn "$SHARED_DIR/.env" "$NEW_RELEASE/.env"

# ----- Build the new release (live site still untouched) --------------------
log "Installing dependencies (clean, frozen lockfile)…"
( cd "$NEW_RELEASE" && "$BUN" install --frozen-lockfile ) || die "bun install failed — live site untouched"
log "Building…"
( cd "$NEW_RELEASE" && "$BUN" run build ) || die "build failed — live site untouched"
[ -f "$NEW_RELEASE/.output/server/index.mjs" ] || die "build produced no .output/server/index.mjs — live site untouched"

# ----- Record current target for auto-rollback ------------------------------
PREVIOUS=""
if [ -L "$LIVE_LINK" ]; then
  PREVIOUS="$(readlink -f "$LIVE_LINK")"
elif [ -d "$LIVE_LINK" ]; then
  # First run: live path is a real directory. Preserve it as a backup, then
  # replace it with the symlink structure.
  BACKUP="${LIVE_LINK}-legacy-${TS}"
  log "First run: backing up existing live dir to $BACKUP"
  mv "$LIVE_LINK" "$BACKUP"
  PREVIOUS="$BACKUP"
fi

# ----- Atomic swap + restart ------------------------------------------------
log "Swapping live symlink → $NEW_RELEASE"
ln -sfn "$NEW_RELEASE" "$LIVE_LINK"
systemctl restart "$SERVICE"

# ----- Verify, auto-rollback on failure -------------------------------------
if health_ok; then
  log "Deploy OK — $SERVICE healthy on $HEALTH_URL"
else
  log "Health check FAILED — rolling back"
  if [ -n "$PREVIOUS" ]; then
    ln -sfn "$PREVIOUS" "$LIVE_LINK"
    systemctl restart "$SERVICE"
    health_ok && log "Rolled back to previous release." || log "ROLLBACK ALSO UNHEALTHY — investigate now."
  fi
  die "deploy failed; rolled back"
fi

# ----- Prune old releases (keep newest $KEEP) -------------------------------
( cd "$RELEASES_DIR" && ls -1t | tail -n +$((KEEP + 1)) | xargs -r rm -rf )
log "Done. Kept newest $KEEP releases in $RELEASES_DIR."
