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
