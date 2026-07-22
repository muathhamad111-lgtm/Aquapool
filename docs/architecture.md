# Aqua — Architecture

Last updated: 2026-07-22. This document is the source of truth for the
project's architecture. The Git repository is authoritative. Dated notes on
individual changes live in [`docs/work-log.md`](work-log.md).

> **Status: migration complete.** The project began as a Lovable-generated app
> with Supabase as its entire backend. It has been fully migrated to a
> Laravel 12 + PostgreSQL REST API (`aqua-app/`) consumed by the React
> frontend (`aqua-frontend/`) over a versioned `/api/v1` boundary. **Supabase
> and all `@lovable.dev` tooling have been removed.** The sections at the end
> retain the original migration plan as historical context.

## Monorepo layout

```
aquapool/
  aqua-frontend/   React + TypeScript SPA/SSR (TanStack Start), consumes the
                   aqua-app REST API. Live at aqua.moathhamad.space.
  aqua-app/        Laravel 12 + PostgreSQL REST API. All business logic.
                   Live at aqua-api.moathhamad.space.
  docs/            Architecture and API documentation (this file)
  scripts/         Operational scripts (DB backup, frontend + API deploy)
  docker/          Container definitions (reserved for a later phase)
  README.md
```

## Current stack (aqua-frontend)

- React 19 + TypeScript, **TanStack Start** (SSR) + **TanStack Router**
  (file-based routing) + **TanStack Query**
- Vite 8 (standard self-contained config), Tailwind CSS v4, shadcn/ui (Radix
  primitives)
- react-hook-form + zod, custom i18n context (ar/en, RTL-first)
- Package manager: bun
- Data access: a typed API client (`src/lib/*-api.ts` → `api-client.ts`)
  calling the aqua-app REST API. React contains **no** business logic and
  talks to **no** database directly.
- Deploy: self-hosted on a DigitalOcean droplet (Nginx + systemd, node-server
  Nitro build). See `scripts/deploy-frontend.sh` (releases + atomic symlink
  swap, health check, auto-rollback).
- Lovable is gone: the `@lovable.dev/vite-tanstack-config` dependency and the
  Lovable build integration were removed, and the Vite config is standard and
  self-contained. `src/lib/lovable-error-reporting.ts` remains as the error
  boundary's reporter — it is plain local code with no Lovable dependency.

### Presentation layer (public site)

Three constraints that are easy to break without knowing them:

- **Two palettes coexist, on purpose.** The Ocean Deep tokens (`--deep`,
  `--ocean`, `--teal`, `--mint`, `--sand`) drive every light page.
  "Night Aqua" (`--night`, `--night-2`, `--aqua`, `--aqua-2`, `--foam`) drives
  the dark homepage and the footer, and `--paper`/`--cream`/`--lagoon` are the
  About page's warm surfaces. All are declared in `src/styles.css`.
- **The navbar is `fixed`, so pages own their top padding.** It is a floating
  pill with transparent space around it; page content is meant to run beneath
  it to the top edge. Any new route's first section must carry enough top
  padding to clear it — `PageHero` does this for the pages that use it.
- **Entrance animations must never be able to hide content.** `useReveal` in
  `src/lib/motion.ts` reveals once and stays revealed, and re-measures
  ScrollTrigger whenever the document changes height. Both exist because
  client-side data loading grows the page after triggers are measured; see the
  2026-07-22 entry in [`work-log.md`](work-log.md) for the failure this caused.
- **Mixed-direction strings need `dir="auto"`.** In an RTL document a string
  like `01 — Services` renders as `SERVICES — 01`, because the leading digits
  are weakly-directional. This applies to any label that mixes scripts,
  numbers, or punctuation with Arabic.

## Current stack (aqua-app)

- Laravel 12, PHP 8.5, PostgreSQL (database `aqua_app`, dedicated role)
- REST API only, versioned under `/api/v1/...`
- Laravel Sanctum for auth
- Business logic lives here: domain Services, Form Requests, API Resources,
  Policies, Migrations, Seeders, Feature Tests
- Nightly `pg_dump` backup via `scripts/backup-aqua-app-db.sh` (cron 03:15,
  keeps 7 days)
- Deploy: the server's own `/var/www/aqua_app/deploy.sh` (releases + `current`
  symlink, shared `.env`/`storage`, `php8.5-fpm` reload), driven by an rsync
  from the local machine. There is **no API deploy script in this repo** —
  see `scripts/README.md` for the runbook and why. Runs as the `aqua_app`
  user, never root.
- Unbounded, append-only reads (`/admin/audit-logs`, `/admin/messages`) are
  paginated and filtered in SQL; see `docs/api-foundation.md`

All data access goes through the Laravel REST API. React must never contain
business logic.

## Modules (migrated)

Services, projects, products, product categories, site settings, messages
(public contact form), users, audit log, and authentication have all been
cut over to `aqua-app`. Real production data was exported read-only from the
former Supabase instance into `aqua-app/database/seeders/fixtures/*.json` and
seeded into PostgreSQL.

## History — original migration plan (2026-07-02)

The following is retained for context. It describes the pre-migration state
(Supabase as the entire backend, authorization via Postgres RLS) and the
incremental roadmap that was executed to reach the current architecture:

1. Audit current repository.
2. Restructure into a monorepo (`aqua-frontend/` + `aqua-app/`).
3. Scaffold Laravel 12, configure PostgreSQL, add `GET /api/v1/health`.
4. Implement authentication and users (Sanctum), Policies mirroring the former
   Supabase RLS behavior, backed by feature tests.
5. Build the REST foundation: API Resources, Form Requests, a consistent
   response/error envelope, `/api/v1` versioning.
6. Migrate public read-only content (services/projects/products/categories).
7. Migrate admin CRUD modules one at a time: products → projects → services →
   categories → messages → settings.
8. Migrate the users/audit-log module last (most auth-sensitive).
9. Migrate existing data (rows + users) into the new PostgreSQL.
10. Remove the Supabase dependency once every module was verified.
11. Remove the Lovable build tooling; standardize the Vite config.

Risks that shaped the approach: the auth-model swap (GoTrue/JWT → Sanctum),
RLS → Policy parity, cross-domain auth (frontend and API on sibling
subdomains), avoiding partial cutovers within a module, file-storage URL
continuity, identity remapping during data import, the small 2 vCPU/2GB
droplet's capacity, and keeping the DNS-live site working through every phase.
