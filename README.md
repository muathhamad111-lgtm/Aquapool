# Aqua Pool Group

Monorepo for the Aqua Pool Group platform.

- **`aqua-frontend/`** — React + TypeScript frontend (TanStack Start/Router/Query, shadcn/ui). Currently deployed at `aqua.moathhamad.space`.
- **`aqua-app/`** — Laravel 12 + PostgreSQL REST API. All business logic, validation, permissions, and data access live here.
- **`docs/`** — architecture and migration documentation. Start with [`docs/architecture.md`](docs/architecture.md).
- **`scripts/`** — operational scripts: nightly DB backup, and near-zero-downtime
  deploys for the frontend and the API.
- **`docker/`** — container definitions (reserved for a later phase).

CI (`.github/workflows/ci.yml`) runs the Laravel suite plus the frontend's
lint/typecheck/build on every push to `main` and every pull request.

## Status

The migration is complete. The permanent backend lives in `aqua-app/`
(Laravel 12 + PostgreSQL REST API) and the frontend consumes it exclusively
through a versioned `/api/v1` boundary. The original Lovable + Supabase stack
has been fully removed — the frontend no longer depends on Supabase or any
`@lovable.dev` tooling, and its Vite build is a standard, self-contained
config. See [`docs/architecture.md`](docs/architecture.md) for the full
picture.
