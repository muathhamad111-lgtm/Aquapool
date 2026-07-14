# scripts

Deployment and operational scripts.

- `backup-aqua-app-db.sh` — daily `pg_dump` of the `aqua_app` PostgreSQL
  database. Deployed to `/root/scripts/` on the production server, run via
  root's crontab at 03:15 daily, keeps the last 7 dumps locally under
  `/var/backups/aqua_app/`. Restore is manual (see the script's header
  comment) — not automated on purpose.
