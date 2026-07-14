# Aqua — Architecture

Last updated: 2026-07-02. This document is the source of truth for the project's
architecture and migration plan. The Git repository (not Lovable, not Supabase)
is authoritative going forward.

## Monorepo layout

```
Aqua/
  aqua-frontend/   React + TypeScript SPA/SSR (formerly the standalone
                   AquaPoolWebsite repo — moved here with full git history
                   preserved via `git log --follow`)
  aqua-app/        Laravel 12 + PostgreSQL REST API (new)
  docs/            Architecture and migration documentation (this file)
  scripts/         Deployment/dev scripts (empty for now)
  docker/          Container definitions (empty for now)
  README.md
```

## Status as of the migration decision (2026-07-02)

The project started as a Lovable-generated app: React frontend + Supabase
(Postgres/PostgREST/GoTrue/Storage) as the entire backend, with authorization
enforced via Postgres Row Level Security. It is deployed and live at
`aqua.moathhamad.space` (self-hosted on a DigitalOcean droplet, Nginx +
systemd, independent of Lovable's own hosting).

Decision: stop investing further in Supabase. It is now a **temporary MVP
dependency only** — no further schema, roles, policies, or business logic will
be added to it. The permanent architecture is **Laravel + PostgreSQL + React**,
built incrementally alongside the working Supabase-backed app until each
module is fully ported.

## Current stack (aqua-frontend)

- React 19 + TypeScript, **TanStack Start** (SSR) + **TanStack Router**
  (file-based routing) + **TanStack Query**
- Vite 8, Tailwind CSS v4, shadcn/ui (Radix primitives)
- react-hook-form + zod already present as dependencies
- Custom i18n context (ar/en, RTL-first)
- Package manager: bun

There is no independent backend today. "Backend" = Supabase:
Postgres + auto-generated REST (PostgREST) + Auth (GoTrue) + Storage,
configured via SQL migrations under `aqua-frontend/supabase/migrations/`.
The one exception is `aqua-frontend/src/lib/users.functions.ts` — TanStack
Start server functions that call Supabase's service-role admin API for user
management. It's a thin proxy, not a business-logic layer.

### Where Supabase is used today (inventory)

| Concern | Files (under `aqua-frontend/src/`) |
|---|---|
| Client init | `integrations/supabase/client.ts` (anon key), `client.server.ts` (service-role) |
| Auth | `integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `routes/_authenticated/route.tsx`, `routes/admin.tsx`, `routes/_authenticated/dashboard.tsx` |
| Public reads | `lib/content.ts` → used by `routes/index.tsx`, `services.tsx`, `projects.tsx`, `products.tsx`, `about.tsx` |
| Admin CRUD | `routes/_authenticated/dashboard.{services,projects,products,categories,settings,messages}.tsx` |
| Contact form | `routes/contact.tsx` (public insert into `messages`) |
| Audit log | `lib/audit.ts`, `routes/_authenticated/dashboard.audit.tsx` |
| User management | `lib/users.functions.ts`, `lib/admin-api.ts` (`getCurrentRole`), `routes/_authenticated/dashboard.users.tsx` |
| File storage | `lib/admin-api.ts` `uploadSiteImage` → Supabase Storage bucket `site-assets` |
| Schema/policies | `aqua-frontend/supabase/migrations/*.sql` — tables: `user_roles`, `services`, `projects`, `products`, `product_categories`, `site_settings`, `messages`, `audit_logs` |

**Every one of these calls Supabase directly from React** — there is no API
boundary today. This is the core thing the migration must fix: React must
never contain business logic or talk to a database directly.

### What's reusable vs. what must be replaced

**Keep as-is:** all UI/components (`components/**`), i18n, hooks, assets,
route file structure (`routes/**` as page shells), styling, the deployed
DigitalOcean/Nginx/systemd setup.

**Must be replaced:** everything under `integrations/supabase/**`, the
`supabase/` directory (schema moves to Laravel migrations), the internals of
`lib/content.ts` / `lib/admin-api.ts` / `lib/audit.ts` / `lib/users.functions.ts`
(hook names can stay, implementations must call the Laravel API instead),
Lovable-specific metadata (`.lovable/`, `AGENTS.md` banner, `@lovable.dev/*`
vite plugins) once fully detached.

`aqua-frontend/.lovable/` and `aqua-frontend/supabase/` are kept in place as
**historical/temporary references only**. They are not to be modified or
extended — no new Supabase migrations, no new Lovable-managed files.

## Target stack (aqua-app)

- Laravel 12, PHP 8.5
- PostgreSQL
- REST API only, versioned under `/api/v1/...`
- Laravel Sanctum for auth (final choice of cookie/SPA mode vs. bearer tokens
  to be made explicitly when auth is implemented, based on whether
  aqua-frontend and aqua-app share a parent domain)
- Business logic lives here: domain services, Form Requests, API Resources,
  Policies, Jobs, Events/Listeners, Queues, Scheduled Tasks, Migrations,
  Seeders, Feature Tests, OpenAPI docs

React must never contain business logic. All data access goes through the
Laravel REST API.

## Migration roadmap

Incremental, one module fully cut over (read + write + auth) before the next
starts. The app must stay functional throughout — no big-bang rewrite.

1. ~~Audit current repository~~ — done, this document.
2. ~~Restructure into monorepo~~ — `aqua-frontend/` + `aqua-app/` skeleton.
3. Scaffold Laravel 12 in `aqua-app`, configure PostgreSQL, add
   `GET /api/v1/health` as the first provable vertical slice.
4. Implement authentication and users (Sanctum), with Policies mirroring
   today's Supabase RLS behavior (`has_role`/`is_staff`), backed by feature
   tests asserting the same authorization outcomes.
5. Build the REST foundation: API Resources, Form Requests, consistent
   response/error envelope, `/api/v1` versioning conventions.
6. Migrate public read-only content first (services/projects/products/
   categories) — lowest risk, no auth involved.
7. Migrate admin CRUD modules one at a time: products → projects → services →
   categories → messages → settings.
8. Migrate users/audit-log module last (most auth-sensitive).
9. Migrate existing Supabase data (rows + `auth.users`) into the new Postgres.
10. Remove the Supabase dependency once every module is verified against
    Laravel.
11. Add seed/demo data, expand test coverage, generate OpenAPI docs, add
    deployment scripts/Docker for `aqua-app` and updated Nginx config for
    both origins.

## Known risks

- **Auth model swap**: Supabase Auth (GoTrue/JWT) → Sanctum touches the login
  page, the `_authenticated` route guard, and the dashboard shell together —
  hard to do partially.
- **RLS → Policy parity**: needs Laravel Policy classes equivalent to today's
  RLS, verified with feature tests before cutover.
- **Cross-domain auth**: `aqua-frontend` is live at `aqua.moathhamad.space`;
  `aqua-app`'s domain relationship to it determines whether Sanctum SPA
  cookie mode or bearer tokens is the right call — decide explicitly.
- **Partial-cutover consistency**: don't leave some pages on Laravel and
  others on Supabase within the same module.
- **File storage**: existing images live in Supabase Storage URLs; migrating
  storage must not break already-published links.
- **Data migration**: Supabase `auth.users` and table rows need export/import
  into the new Postgres, including identity remapping.
- **Server capacity**: the droplet is a small 2 vCPU/2GB box already running
  the frontend; adding PHP-FPM + Postgres needs a capacity check or a
  separate host.
- **Live-site regression risk**: the site is deployed and DNS-live; every
  phase must ship without breaking already-working public pages.
