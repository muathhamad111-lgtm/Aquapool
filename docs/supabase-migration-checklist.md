# Supabase Migration Master Checklist

> **Superseded — historical record.** Last verified 2026-07-19: the two
> items this document still listed as outstanding are both closed, and
> §13's "Lovable is intentionally kept" no longer describes the repo.
> See "Closed since this inventory" immediately below; the rest of the
> document is kept as the record of how the migration was executed.
> `docs/architecture.md` is the current source of truth.

## Closed since this inventory

- **§9 environment variables** — `aqua-frontend/.env` now contains only
  `VITE_API_URL`. Every Supabase variable is gone, and an `.env.example`
  documents the one that remains.
- **§13 Lovable-specific files** — the `@lovable.dev/vite-tanstack-config`
  dependency and the Lovable build integration were removed, and the Vite
  config is standard and self-contained. `src/lib/lovable-error-reporting.ts`
  survives as the error boundary's reporter, but it is plain local code
  (it calls `window.__lovableEvents` if something injected it, and no-ops
  otherwise) with no Lovable dependency of its own.

Last updated: 2026-07-04. This is a point-in-time inventory of every
remaining Supabase / Lovable Cloud dependency in the project, produced
before starting any further migration work beyond Phase 3 (Site Settings).
See `docs/development-standards.md` for the mandatory implementation
pipeline each migrated module must follow, and `docs/architecture.md` for
overall system context.

This document does not implement any migration. It exists so every future
phase starts from a complete, accurate picture instead of rediscovering
scope module by module.

## How to read this document

Each category below documents, as of this inventory:

- **Current usage** — what the dependency actually does today.
- **Files involved** — where it lives, so a future phase can jump straight in.
- **Replacement in Laravel/PostgreSQL** — what already exists, or what the
  replacement should look like.
- **Migration status** — `Done`, `Partially done`, or `Not started`.
- **Risk level** — how bad it is that this still depends on Supabase.
- **Recommended migration order** — where this sits in the priority list below.

## Executive summary

Phase 3 (Site Settings), Phase 5 (Product Categories, the reference
implementation for every remaining CRUD module), Phase 6 (Services,
the first module needing server-side rich-text sanitization), Phase 7
(Products), Phase 8 (Projects), and Phase 9 (Messages / contact form) are
all fully cut over to Laravel. Authentication, user/role management, the
generic audit-logging pipeline (Phase 4), and image/file uploads
(Phase 5A) are also fully on Laravel. The **Final Cleanup Phase** (step 8)
has since removed every remaining Supabase runtime dependency from
`aqua-frontend` — **the codebase has zero Supabase imports, zero
Supabase-named build output, and no `@supabase/supabase-js` dependency
left.** Only two things remain, both deliberate: `.env`'s now-dead
Supabase variables (left in place on purpose, a separate operational
task) and the historical `supabase/migrations/*.sql` archive (kept for
reference). Lovable's own scaffolding (`.lovable/`, `AGENTS.md`,
`lib/lovable-error-reporting.ts`, the `@lovable.dev/vite-tanstack-config`
devDependency) was explicitly untouched — Lovable continues as the
project's UI/UX prototyping tool going forward.

**Historical note, now fully resolved as of Phase 9:** content-management
audit logging (services, products, projects, categories, messages) was
**silently broken from the Laravel auth cutover until Phase 4 introduced
the `Auditable` trait**, and remained partially broken for any module that
still called the old `recordAudit()` helper (`aqua-frontend/src/lib/audit.ts`)
until that module migrated off Supabase. `recordAudit()` calls
`supabase.auth.getUser()` to identify the acting admin, which always
returns no user since admin login is Sanctum-based — the guard silently
no-op'd on every call, with no visible error. Messages (Phase 9) was the
last caller of `recordAudit()`; now that it's gone, `lib/audit.ts` is dead
code (not yet deleted — see step 8), and every module's audit trail is
recorded server-side via `Auditable`, with zero frontend involvement.

## Recommended migration order

1. ~~**Audit logging fix**~~ — **done** (Phase 4): generic `Auditable`
   trait + observer + centralized writer, reused by every module below
   with zero per-module code.
2. ~~**Contact / Messages**~~ — **done** (Phase 9). The only module with a
   genuine public *write* endpoint — added rate limiting (`throttle:5,1`),
   a new protection not present in Supabase's RLS (which only checked
   field lengths). Status changes use `AuditAction::StatusChange` via
   `auditAs()` instead of a plain attribute update — `status` had to be
   added to `Message::auditIgnore()` to stop the automatic observer from
   *also* logging a redundant plain `update` entry alongside the intended
   `status_change` one (caught by a failing test during implementation).
   Bulk status-change/delete iterate model instances individually, never
   a mass `whereIn()->update()`/`delete()`, so every message in a batch
   gets its own audit entry. A new `GET /admin/messages/summary` endpoint
   backs the dashboard overview's messages widgets; the overview's
   services/projects/products counts were deliberately left untouched
   (still stale Supabase queries — see step 8).
3. ~~**Product Categories**~~ — **done** (Phase 5, reference
   implementation). Other modules (Products, Services) reference
   categories, so this existing in Laravel first was the point.
4. ~~**Services**~~ — **done** (Phase 6). Simplest remaining content CRUD
   candidate turned out to have one real wrinkle: `description_ar`/
   `description_en` are rich HTML, requiring the same server-side
   sanitization Site Settings needed — the HTMLPurifier config was
   extracted into a shared `App\Support\HtmlSanitizer` rather than
   duplicated a second time.
5. ~~**Products**~~ — **done** (Phase 7). Closest match yet to the
   Categories/Services pattern — reused the image upload endpoint (step 7)
   as-is with zero new backend work, and preserved the legacy plain-text
   `category` column unchanged (not a cleanup target). One real, evidenced
   behavior difference from Services: `category_id` is validated as
   `required` at the Form Request layer (matching the admin UI's existing
   native `<select required>`), while the database column itself stays
   nullable to match existing Supabase production semantics exactly (a
   real exported row has `category_id = null`).
6. ~~**Projects**~~ — **done** (Phase 8). Closest structural match to
   Products (legacy `category` plain-text column, `image_url` reusing the
   Phase 5A upload endpoint as-is), plus one new field the prior modules
   didn't have: `is_featured`, threaded through every layer (migration,
   model cast, Form Request, Resource, frontend API, admin dashboard).
   `category_id` is nullable and optional here (unlike Products, like
   Services) — confirmed both by the admin UI (`CategoryCascader` has no
   `required` prop for Projects) and by every one of the 8 real exported
   production rows currently having `category_id = null`.
7. ~~**Storage / file upload replacement**~~ — **done**, out of order
   (Phase 5A): migrated early as a direct fix for a production incident
   (admin accounts created after the Sanctum auth cutover had no
   Supabase session, so Storage RLS silently blocked their uploads),
   rather than waiting for Products/Projects to migrate first as
   originally planned.
8. ~~**Runtime cleanup**~~ — **done** (Final Cleanup Phase), scoped
   deliberately to *Supabase runtime removal only* — **Lovable scaffolding
   is explicitly kept** (`.lovable/`, `AGENTS.md`, `lib/lovable-error-reporting.ts`,
   the `@lovable.dev/vite-tanstack-config` devDependency, the Lovable-connected
   GitHub remote), since Lovable remains the intended UI/UX prototyping tool
   going forward (Lovable → prototype → Claude → React implementation).
   `dashboard.index.tsx`'s `services`/`projects`/`products` stat-card counts
   (stale since Phases 6–8, flagged during Phase 9 planning) now reuse the
   existing `useAdminServices`/`useAdminProducts`/`useAdminProjects` hooks
   (`.length`) — no new backend endpoint needed. Deleted: the whole
   `src/integrations/supabase/` directory (client, client.server,
   auth-attacher, auth-middleware, types — all had zero external callers
   once the above landed), `lib/audit.ts` (`recordAudit`, unused since
   Phase 9), `lib/supabase-mutation-guard.ts` (`assertRowsAffected`, unused).
   `DbAuditLog` (a pure display type, unrelated to the dead `recordAudit`
   write path) was relocated from `lib/audit.ts` into `admin-api.ts` before
   deletion, since `dashboard.audit.tsx` — a fully Laravel-backed page —
   still needed it for typing. `@supabase/supabase-js` removed from
   `package.json`; confirmed zero `supabase` string matches anywhere left
   in `src/` and zero `supabase`-named chunks in the production build
   output. **`.env`'s Supabase variables were deliberately left in place**
   this phase (explicit instruction — cleaned up later as a separate
   operational task); `aqua-frontend/supabase/migrations/*.sql` and
   `supabase/config.toml` retained as historical archive, not deleted.

---

## 1. Authentication

**Status: Done.**

| | |
|---|---|
| Current usage | Admin login (`admin.tsx`) authenticates entirely against the Laravel API (Sanctum bearer tokens) — zero Supabase references. |
| Files involved | `aqua-frontend/src/routes/admin.tsx` (Laravel-only, confirmed clean) |
| Replacement in Laravel/PostgreSQL | Laravel Sanctum, `personal_access_tokens` table, `App\Models\User` |
| Migration status | **Done** |
| Risk level | Low |
| Recommended order | N/A — complete |

**Dead/vestigial Supabase auth code — removed in the Final Cleanup Phase**:
`auth-attacher.ts`'s `functionMiddleware` (previously registered in
`start.ts`, called `supabase.auth.getSession()` on every server-function
RPC — harmless no-op since nothing signs in via Supabase, but wasted work
every request), `auth-middleware.ts`'s `requireSupabaseAuth` (never
imported anywhere, fully dead), and `__root.tsx`'s
`supabase.auth.onAuthStateChange(...)` listener (never fired meaningfully).
All three are gone; `src/integrations/supabase/` no longer exists.

## 2. Users and roles

**Status: Done.**

| | |
|---|---|
| Current usage | None remaining. Supabase's `user_roles` table and `has_role` function have zero references outside the generated types file. |
| Files involved | `aqua-frontend/src/integrations/supabase/types.ts` (schema definition only, unused) |
| Replacement in Laravel/PostgreSQL | `users.role` column (`admin`/`user`), `User::isAdmin()` / `User::isStaff()` (`aqua-app/app/Models/User.php`) |
| Migration status | **Done** |
| Risk level | Low |
| Recommended order | Cleaned up in step 8 (types.ts shrinks as each table migrates; `user_roles`/`has_role` can be removed from the type immediately) |

## 3. Database tables

**Status: Mixed — 6 of 8 tables migrated.**

Supabase schema (from `aqua-frontend/src/integrations/supabase/types.ts`):

| Table | Status | Notes |
|---|---|---|
| `site_settings` | **Done** | Migrated in Phase 3 |
| `audit_logs` | **Done — see §8** | Laravel has its own `audit_logs` table; every content module (including Messages as of Phase 9) now writes to it exclusively via `Auditable`/`auditAs()` |
| `messages` | **Done** | Migrated in Phase 9 — no `updated_at` column (matches Supabase exactly, `Message::UPDATED_AT = null`); public submit endpoint is rate-limited (new protection); status changes use `auditAs(StatusChange)`, never a plain `update` |
| `product_categories` | **Done** | Migrated in Phase 5 (reference implementation) — UUIDs preserved via read-only export, so still-Supabase-backed products/projects continue resolving `category_id` correctly against the same values |
| `products` | **Done** | Migrated in Phase 7 — image upload dependency reused as-is (Phase 5A); legacy `category` column preserved unchanged |
| `projects` | **Done** | Migrated in Phase 8 — image upload dependency reused as-is (Phase 5A); legacy `category` column preserved unchanged; `category_id` nullable/optional |
| `services` | **Done** | Migrated in Phase 6 — first module needing server-side rich-text sanitization (shared `HtmlSanitizer`, extracted from Site Settings) |
| `user_roles` | **Done (orphaned)** | Superseded by `users.role`; zero remaining reads |

## 4. Public page reads

**Status: Partially done.**

| | |
|---|---|
| Current usage | Homepage, About, Contact, and Footer read hero/about/values/contact content from Laravel (Phase 3). Category reads (Phase 5), Services reads (Phase 6), Products reads (Phase 7), and Projects reads (Phase 8) are all now Laravel-backed. No content module reads from Supabase anymore. |
| Files involved | `aqua-frontend/src/lib/content.ts` (every hook now delegates to its own `*-api.ts` — `useProjects` → `projects-api.ts`, `useProducts` → `products-api.ts`, `useCategories`/`useProductCategories` → `product-categories-api.ts`, `useServices` → `services-api.ts`; zero remaining Supabase imports in this file); `aqua-frontend/src/routes/services.tsx`, `projects.tsx`, `products.tsx` |
| Replacement in Laravel/PostgreSQL | Public `GET /api/v1/product-categories`, `/services`, `/products`, `/projects` — all done |
| Migration status | **Done** |
| Risk level | Low |
| Recommended order | N/A — complete |

## 5. Admin CRUD

**Status: Done — every content module migrated.**

| | |
|---|---|
| Current usage | Categories (Phase 5), Services (Phase 6), Products (Phase 7), Projects (Phase 8), and Messages (Phase 9) admin surfaces are all now Laravel-backed. |
| Files involved | `aqua-frontend/src/routes/_authenticated/dashboard.categories.tsx`, `dashboard.services.tsx`, `dashboard.products.tsx`, `dashboard.projects.tsx`, `dashboard.messages.tsx` — all done |
| Replacement in Laravel/PostgreSQL | `ProductCategoryController`/`ServiceController`/`ProductController`/`ProjectController`/`MessageController` + their Policies — see `docs/api/product-categories.md`, `docs/api/services.md`, `docs/api/products.md`, `docs/api/projects.md`, `docs/api/messages.md` |
| Migration status | **Done** |
| Risk level | Low |
| Recommended order | N/A — complete |

## 6. Contact form / messages

**Status: Done** (Phase 9).

| | |
|---|---|
| Current usage | Public contact form (`contact.tsx`) submits via `POST /api/v1/messages`. Admin inbox (`dashboard.messages.tsx`) reads, updates status (single + bulk), and deletes (single + bulk) via Laravel. The dashboard overview's messages count/new-count/recent widgets (`dashboard.index.tsx`) now call `GET /admin/messages/summary` instead of querying Supabase directly. |
| Files involved | `aqua-frontend/src/routes/contact.tsx`, `aqua-frontend/src/routes/_authenticated/dashboard.messages.tsx`, `aqua-frontend/src/routes/_authenticated/dashboard.index.tsx` (messages widgets only — its services/projects/products counts are untouched, see step 8) |
| Replacement in Laravel/PostgreSQL | `POST /api/v1/messages` (rate-limited `throttle:5,1`, a new protection Supabase's RLS never had), admin `GET/PATCH/DELETE /api/v1/admin/messages` (+ bulk variants, + `/summary`) — see `docs/api/messages.md` |
| Migration status | **Done** |
| Risk level | Low (was Medium — the public write endpoint now has real validation and rate limiting, both absent under Supabase) |
| Recommended order | N/A — complete |

## 7. Storage buckets and file uploads

**Status: Done** — out of the originally planned order.

| | |
|---|---|
| Current usage | `uploadSiteImage()` now calls Laravel's `POST /api/v1/admin/uploads`, storing to Laravel's local `public` disk and returning a served URL. Used by the Products and Projects admin forms via the unchanged `ImageUpload` component (Services has no image field). |
| Files involved | `aqua-frontend/src/lib/admin-api.ts` (`uploadSiteImage`), `aqua-frontend/src/lib/api-client.ts` (`upload()`), `aqua-frontend/src/components/admin/ImageUpload.tsx` (unchanged); `aqua-app` `ImageUploadController`/`ImageUploadService`/`StoreImageUploadRequest` |
| Replacement in Laravel/PostgreSQL | Done — see the Phase 5A commits. `folder` restricted to an allow-list (`products`, `projects`), filenames always server-generated UUIDs, 5MB max, real image validation |
| Migration status | **Done** |
| Risk level | Low (was Medium) |
| Recommended order | Was step 7; migrated early (out of order) as a direct fix for a production incident — admin accounts created after the Sanctum auth cutover had no Supabase session, so Storage RLS silently blocked their image uploads |

## 8. Audit logs

**Status: Done.**

| | |
|---|---|
| Current usage | `recordAudit()` (`aqua-frontend/src/lib/audit.ts`) is no longer called anywhere in the application — Messages (Phase 9) was its last caller. Every content module's audit logging now happens server-side in Laravel via the `Auditable` trait / `auditAs()`, with zero frontend involvement. `lib/audit.ts` itself is now dead code, not yet deleted (cleanup deferred to step 8). |
| Files involved | None — no remaining call sites. `aqua-frontend/src/lib/audit.ts` still exists but is unused. |
| Replacement in Laravel/PostgreSQL | `aqua-app`'s `audit_logs` table, `App\Models\AuditLog`, `AuditLogPolicy`, `AuditLogController` (`GET /api/v1/admin/audit-logs`), the `RecordUserAuditLog` listener (user-account events), and `Auditable`/`AuditObserver`/`AuditLogWriter` (every content module). |
| Migration status | **Done** |
| Risk level | Low |
| Recommended order | N/A — complete. `lib/audit.ts` deletion tracked under step 8 |

**Historical record of the bug this section used to describe** (kept for
context, now fully resolved): content-management audit logging was
**silently broken** from the Laravel auth cutover until each module
migrated off `recordAudit()`, because that helper depended on Supabase
auth:

```ts
// aqua-frontend/src/lib/audit.ts (now unused)
const { data: userData } = await supabase.auth.getUser();
if (!userData.user) return;   // always true post-cutover; audit write never happened
await supabase.from("audit_logs").insert({ ... });
```

Since admin login went through Laravel Sanctum, not Supabase Auth,
`supabase.auth.getUser()` never resolved a session, so the guard silently
skipped every call — no error surfaced, admin dashboards behaved normally,
but no audit trail was recorded for content changes in that window. Fixed
incrementally as each module (Categories → Services → Products →
Projects → Messages) cut over to `Auditable`; Phase 9 closed the loop.

## 9. Environment variables

**Status: Deliberately deferred** — a separate operational task, not part of the Final Cleanup Phase.

| | |
|---|---|
| Current usage | `SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY` and their `VITE_`-prefixed client-side equivalents still sit in `aqua-frontend/.env`, unread by any code now that `src/integrations/supabase/` is deleted. `SUPABASE_SERVICE_ROLE_KEY` was referenced in the now-deleted `client.server.ts` but was never actually set in `.env`. |
| Files involved | `aqua-frontend/.env` only |
| Replacement in Laravel/PostgreSQL | None needed beyond the existing `VITE_API_URL` already used for the Laravel API |
| Migration status | **Deliberately not touched** — explicit instruction to leave `.env` untouched during the Final Cleanup Phase; the vars are now provably dead (nothing reads them) but their removal is left as a distinct, separate operational task |
| Risk level | Low — unused, not harmful to leave in place |
| Recommended order | Separate task, whenever convenient |

## 10. Supabase SDK imports

**Status: Done.**

| | |
|---|---|
| Current usage | `@supabase/supabase-js` has been removed from `package.json` entirely. Confirmed zero `supabase` string matches anywhere in `aqua-frontend/src/` and zero `supabase`-named chunks in the production build output. |
| Files involved | None remaining |
| Replacement in Laravel/PostgreSQL | N/A — package fully removed |
| Migration status | **Done** |
| Risk level | Low |
| Recommended order | N/A — complete |

## 11. Supabase generated types

**Status: Done.**

| | |
|---|---|
| Current usage | `src/integrations/supabase/types.ts` deleted along with the rest of the integration directory — its only consumers (`client.ts`, `client.server.ts`, `auth-middleware.ts`) were deleted in the same pass. |
| Files involved | None remaining |
| Replacement in Laravel/PostgreSQL | N/A — file deleted |
| Migration status | **Done** |
| Risk level | Low |
| Recommended order | N/A — complete |

## 12. Supabase migrations

**Status: Historical — not something to migrate, only to retire.**

| | |
|---|---|
| Current usage | 9 `.sql` migration files documenting how the Supabase schema was built over time. Not executed against anything post-migration; purely historical record. |
| Files involved | `aqua-frontend/supabase/migrations/*.sql`, `aqua-frontend/supabase/config.toml` |
| Replacement in Laravel/PostgreSQL | Laravel's own `database/migrations/` already serves as the historical record going forward |
| Migration status | **N/A / historical** |
| Risk level | Low |
| Recommended order | Retired (not deleted without separate approval) in step 8 |

## 13. Lovable-specific files

**Status: Intentionally kept — not a cleanup target.**

| | |
|---|---|
| Current usage | Project scaffolding and tooling tied to the Lovable platform, independent of Supabase specifically. Lovable remains the intended UI/UX prototyping tool going forward (Lovable → prototype/design → Claude → React implementation), confirmed explicitly ahead of the Final Cleanup Phase. |
| Files involved | `aqua-frontend/.lovable/project.json`; `aqua-frontend/AGENTS.md` (Lovable sync banner); `aqua-frontend/src/lib/lovable-error-reporting.ts` (actively used by `__root.tsx`'s error boundary); `@lovable.dev/vite-tanstack-config` build dependency in `package.json`; GitHub remote still points to `muathhamad111-lgtm/AquaPoolWebsite` (Lovable-connected) |
| Replacement in Laravel/PostgreSQL | N/A — not applicable, this isn't a Supabase dependency |
| Migration status | **Intentionally not removed** — explicit standing instruction; only revisit a specific item here if it's proven unnecessary for the Lovable workflow AND separately approved |
| Risk level | N/A |
| Recommended order | Not scheduled — out of scope by design |

## 14. Remaining runtime dependency on Lovable Cloud

**Status: Runtime dependency removed.** The only thing left is inert `.env` values.

| | |
|---|---|
| Current usage | No code reads the Supabase env vars anymore (§9) and the SDK is gone (§10) — the app has no live Lovable Cloud runtime dependency left. The vars themselves remain in `.env`, unread, by deliberate choice this phase. |
| Files involved | `aqua-frontend/.env` (dead values only) |
| Replacement in Laravel/PostgreSQL | Done, except the unread env vars (§9) |
| Migration status | **Runtime: done. Env var cleanup: deferred as a separate task.** |
| Risk level | Low |
| Recommended order | N/A — the umbrella concern (a live runtime dependency) is resolved; only inert leftover values remain |
