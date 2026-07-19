#!/usr/bin/env bash
# /var/www/aqua_app/deploy.sh
#
# TRACKED COPY of the script that lives on the server. The server's copy is
# what actually runs; this one exists so changes to it are reviewable in git
# instead of being made in place on a production box and forgotten. After
# editing here, upload it:
#
#   scp scripts/aqua_app-deploy.sh $SERVER:/var/www/aqua_app/deploy.sh
#   ssh $SERVER "chown aqua_app:aqua_app /var/www/aqua_app/deploy.sh"
#
# rsync-based variant of the hosting tooling's standard deploy.sh (that one
# assumes a git remote; aqua_app is not pushed to GitHub yet, so code is
# rsynced into a release directory by the local machine first, then this
# script finishes the deploy from there).
#
# Usage (run AS the project's own Linux user, never as root):
#   sudo -u aqua_app /var/www/aqua_app/deploy.sh <release-timestamp> [--migrate]
#
# The release directory (releases/<release-timestamp>/) must already exist,
# already contain the rsynced code, and already be owned by aqua_app:aqua_app
# before this runs.

set -euo pipefail

SLUG="aqua_app"
BASE_DIR="/var/www/${SLUG}"
KEEP_RELEASES=5

RELEASE_TS="${1:-}"
RUN_MIGRATIONS=false
[[ "${2:-}" == "--migrate" ]] && RUN_MIGRATIONS=true

if [[ "$(whoami)" == "root" ]]; then
    echo "Refusing to run as root. Use: sudo -u ${SLUG} $0" >&2
    exit 1
fi

if [[ -z "$RELEASE_TS" ]]; then
    echo "Usage: $0 <release-timestamp> [--migrate]" >&2
    exit 1
fi

RELEASE_DIR="${BASE_DIR}/releases/${RELEASE_TS}"

if [[ ! -d "$RELEASE_DIR" ]]; then
    echo "Release directory not found: ${RELEASE_DIR}" >&2
    echo "(rsync the code into it first, then run this script)" >&2
    exit 1
fi

echo "==> Linking shared resources into ${RELEASE_DIR}"
ln -sfn "${BASE_DIR}/shared/.env" "${RELEASE_DIR}/.env"
if [[ -d "${BASE_DIR}/shared/storage" ]]; then
    rm -rf "${RELEASE_DIR}/storage"
    ln -sfn "${BASE_DIR}/shared/storage" "${RELEASE_DIR}/storage"
fi

cd "${RELEASE_DIR}"

echo "==> composer install"
composer install --no-dev --optimize-autoloader --no-interaction

if grep -q '^APP_KEY=$' "${BASE_DIR}/shared/.env"; then
    echo "==> Generating APP_KEY (first deploy)"
    php artisan key:generate --force
fi

if [[ "${RUN_MIGRATIONS}" == "true" ]]; then
    # Always dump before migrating. The nightly cron backup can be up to 24
    # hours old, and a migration is exactly the moment a fresh one matters.
    # Credentials come from the shared .env — the same file Laravel reads —
    # so there is no second copy of them to drift.
    echo "==> Backing up ${SLUG} before migrating"
    BACKUP_DIR="${BASE_DIR}/shared/pre-deploy-backups"
    mkdir -p "${BACKUP_DIR}"
    DUMP="${BACKUP_DIR}/${SLUG}-predeploy-${RELEASE_TS}.sql.gz"

    env_value() {
        grep -E "^$1=" "${BASE_DIR}/shared/.env" | head -1 | cut -d= -f2- | tr -d '"'
    }

    if ! PGPASSWORD="$(env_value DB_PASSWORD)" pg_dump \
            -h "$(env_value DB_HOST)" \
            -U "$(env_value DB_USERNAME)" \
            "$(env_value DB_DATABASE)" | gzip > "${DUMP}"; then
        echo "Backup failed — refusing to migrate. Live site untouched." >&2
        rm -f "${DUMP}"
        exit 1
    fi
    echo "==> Backup written: ${DUMP} ($(du -h "${DUMP}" | cut -f1))"

    # Keep as many dumps as releases, so a rollback to any surviving release
    # still has the dump taken immediately before its migration ran.
    ls -1t "${BACKUP_DIR}" | tail -n +$((KEEP_RELEASES + 1)) | while read -r stale; do
        rm -f "${BACKUP_DIR}/${stale}"
    done

    echo "==> php artisan migrate --force"
    php artisan migrate --force
else
    echo "==> Skipping migrations (pass --migrate as the second argument to run them)"
fi

echo "==> Ensuring public/storage symlink exists"
# public/ is rsynced fresh into every release directory, so this symlink
# (gitignored, not part of the synced code) needs to be (re)created on every
# deploy, not just once. --force makes this safe to run every time.
php artisan storage:link --force

echo "==> Caching config/routes/views"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Flipping current -> ${RELEASE_TS}"
ln -sfn "${RELEASE_DIR}" "${BASE_DIR}/current_tmp"
mv -Tf "${BASE_DIR}/current_tmp" "${BASE_DIR}/current"

echo "==> Reloading php8.5-fpm"
sudo systemctl reload php8.5-fpm

echo "==> Pruning old releases (keeping last ${KEEP_RELEASES})"
cd "${BASE_DIR}/releases"
ls -1t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf --

echo "==> Deploy complete: ${SLUG} -> ${RELEASE_TS}"
