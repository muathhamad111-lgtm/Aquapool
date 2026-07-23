# scripts

Deployment and operational scripts.

> **Who runs these:** the repo owner, on their own machine/server. AI assistants
> must not deploy, push, or otherwise run these against the live environment —
> see `CLAUDE.md`. The runbooks below are written for a human operator.

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

## Deploying the API (`aqua-app`)

**There is no deploy script for the API in this repo, deliberately.** The
server already has one, provisioned alongside the project and used for every
release so far: `/var/www/aqua_app/deploy.sh`. An earlier version of this
README documented a `scripts/deploy-api.sh` that was written without checking
the server first; every one of its assumptions was wrong (`/var/www/aqua-api`,
`php8.4-fpm`, running as root) and it has been deleted rather than left to
mislead.

What is actually true on the server:

| | |
|---|---|
| App root | `/var/www/aqua_app` — `releases/<timestamp>/`, `shared/`, `current` symlink |
| Runs as | the `aqua_app` Linux user; the script **refuses to run as root** |
| PHP | `php8.5-fpm`, with a dedicated pool socket `/run/php/aqua_app.sock` |
| Nginx root | `/var/www/aqua_app/current/public` |
| Shared | `shared/.env` and `shared/storage` (uploaded images live here) |
| Staging twin | `/var/www/aqua_app_staging`, database `aqua_app_staging`, at `staging-aqua-api.moathhamad.space` |

The server script is rsync-based, not git-based: it expects the code to
already be in the release directory. A deploy is four steps from your machine:

```bash
export SERVER=root@<droplet-ip>
TS=$(date +%Y%m%d%H%M%S)

ssh $SERVER "mkdir -p /var/www/aqua_app/releases/$TS"

rsync -az --delete \
  --exclude vendor --exclude .env --exclude storage \
  --exclude node_modules --exclude .git --exclude tests \
  aqua-app/ $SERVER:/var/www/aqua_app/releases/$TS/

ssh $SERVER "chown -R aqua_app:aqua_app /var/www/aqua_app/releases/$TS"

ssh $SERVER "sudo -u aqua_app /var/www/aqua_app/deploy.sh $TS --migrate"
```

Drop `--migrate` when the release has no new migrations. The script links
shared resources, runs `composer install --no-dev`, migrates, caches
config/routes/views, flips `current` atomically, reloads `php8.5-fpm`, and
prunes to the last 5 releases.

**Take a database backup first.** The server script runs `migrate --force`
with no backup of its own, and the nightly dump can be up to 24 hours old:

```bash
ssh $SERVER "/root/scripts/backup-aqua-app-db.sh"
```

Rollback is repointing the symlink; migrations are never reverted
automatically, because `migrate:rollback` on a release that has already taken
writes destroys data. Write migrations the previous release can still run
against (add columns; don't rename or drop in the same deploy):

```bash
ssh $SERVER "ls -1t /var/www/aqua_app/releases | head -5"
ssh $SERVER "sudo -u aqua_app ln -sfn /var/www/aqua_app/releases/<TS> /var/www/aqua_app/current && sudo systemctl reload php8.5-fpm"
```

Note: staging's `deploy.sh` is git-based and still points at the old
`AquaPoolWebsite` repo and a `feat/public-site-polish` branch. It needs its
`REPO_URL`/`BRANCH` updated to this repo and `main` before staging can be
used again.
