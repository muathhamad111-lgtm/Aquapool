# Aqua Pool Group

Monorepo for the Aqua Pool Group platform.

- **`aqua-frontend/`** — React + TypeScript frontend (TanStack Start/Router/Query, shadcn/ui). Currently deployed at `aqua.moathhamad.space`.
- **`aqua-app/`** — Laravel 12 + PostgreSQL REST API. All business logic, validation, permissions, and data access live here.
- **`docs/`** — architecture and migration documentation. Start with [`docs/architecture.md`](docs/architecture.md).
- **`scripts/`** — deployment/dev scripts (reserved for a later phase).
- **`docker/`** — container definitions (reserved for a later phase).

## Status

The frontend was originally built on Lovable + Supabase. Supabase is now a
frozen, temporary dependency — no new schema/roles/policies are being added to
it. The permanent backend is being built from scratch in `aqua-app/` and
modules are being migrated over incrementally. See `docs/architecture.md` for
the full picture and migration roadmap.
