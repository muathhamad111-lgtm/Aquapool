# scripts

Deployment and operational scripts.

- `backup-aqua-app-db.sh` — daily `pg_dump` of the `aqua_app` PostgreSQL
  database. Deployed to `/root/scripts/` on the production server, run via
  root's crontab at 03:15 daily, keeps the last 7 dumps locally under
  `/var/backups/aqua_app/`. Restore is manual (see the script's header
  comment) — not automated on purpose.

- `deploy-frontend.sh` — near-zero-downtime deploy for the `aqua-frontend`
  TanStack Start SSR app, using a releases + atomic symlink swap pattern with
  a post-restart health check and automatic rollback. Builds each new release
  in full **before** touching the live site, so a failed `bun install`/build
  never affects production. Deployed to `/root/scripts/` on the server.

  Deploy (run on the server as root):

  ```bash
  # 1. From your machine, upload the fresh source (no node_modules/.output/.env):
  rsync -az --delete \
    --exclude node_modules --exclude .output --exclude .env \
    --exclude .wrangler --exclude .tanstack \
    aqua-frontend/  root@SERVER:/var/www/aqua-pool-incoming/

  # 2. On the server:
  /root/scripts/deploy-frontend.sh production /var/www/aqua-pool-incoming
  # or: staging
  /root/scripts/deploy-frontend.sh staging /var/www/aqua-pool-incoming
  ```

  Rollback to a previous release:

  ```bash
  /root/scripts/deploy-frontend.sh production --rollback            # list releases
  /root/scripts/deploy-frontend.sh production --rollback 20260714-132800
  ```

  Layout it manages (per environment): builds live under
  `<live>-releases/<timestamp>/`, the shared secret `.env` lives once under
  `<live>-shared/.env` (symlinked into each release), and `<live>` (e.g.
  `/var/www/aqua-pool`) is a symlink to the active release. systemd
  (`aqua-pool.service`) and Nginx need no changes — they keep pointing at
  `/var/www/aqua-pool/.output/server/index.mjs` through the symlink.

  Note: the `staging` profile defaults to `PORT=3001` for its health check —
  adjust it in the script if staging listens on a different port.

- `deploy-api.sh` — the same releases + atomic symlink swap + health check +
  auto-rollback pattern, for the `aqua-app` Laravel API behind Nginx +
  PHP-FPM. Deployed to `/root/scripts/` on the server.

  **Not yet run against the server.** Verify `FPM_SERVICE`, `LIVE_LINK` and
  `HEALTH_URL` in the profile block before the first deploy — the script
  refuses to run if the systemd unit or `pg_dump` is missing rather than
  guessing, but it cannot tell whether `/var/www/aqua-api` is really where
  Nginx points.

  ```bash
  # 1. From your machine, upload the fresh source (no vendor/.env/storage):
  rsync -az --delete \
    --exclude vendor --exclude .env --exclude storage --exclude node_modules \
    aqua-app/  root@SERVER:/var/www/aqua-api-incoming/

  # 2. On the server:
  /root/scripts/deploy-api.sh production /var/www/aqua-api-incoming
  ```

  Rollback (code only — see below):

  ```bash
  /root/scripts/deploy-api.sh production --rollback            # list releases
  /root/scripts/deploy-api.sh production --rollback 20260719-140233
  ```

  Three things differ from the frontend script, all Laravel-specific:

  - **`storage/` is shared**, living once under `<live>-shared/storage` and
    symlinked into each release. Uploaded images (`ImageUploadService` writes
    to the `public` disk) live there — a per-release `storage/` would make
    every deploy silently lose every upload.
  - **Migrations run before the symlink swap**, immediately after a `pg_dump`
    taken in the same run under `/var/backups/aqua_app/pre-deploy/`. The new
    code therefore never meets the old schema.
  - **PHP-FPM is reloaded after the swap.** Nginx resolves the symlink per
    request, but opcache caches compiled files by resolved path, so without
    the reload the old release keeps being executed.

  `--rollback` repoints the code symlink **only** — it never runs
  `migrate:rollback`, which would destroy data on a release that has already
  taken writes. Write migrations so the previous release can still run
  against the new schema (add columns; don't rename or drop in the same
  deploy). If a rollback genuinely needs the old schema, restore that run's
  pre-deploy dump by hand.
