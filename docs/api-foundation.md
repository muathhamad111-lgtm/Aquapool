# Aqua App — API Foundation

Last updated: 2026-07-02. Technical reference for the shared response
envelope, error handling, and base controller introduced ahead of any
business module. See `docs/development-standards.md` for the mandatory
12-layer pipeline these fit into, and `docs/architecture.md` for overall
context.

## Response envelope

All `/api/v1/...` responses that don't go through an API Resource use the
`ApiResponses` trait (`app/Http/Controllers/Api/Concerns/ApiResponses.php`):

- `success(data, message?, status = 200)` → `{"data": ..., "message": "..."?}`
- `created(data, message?)` → same shape, status 201
- `noContent()` → empty 204
- `error(message, status = 422, errors?)` → `{"message": "...", "errors": {...}?}`

`null` values are omitted from the JSON body rather than serialized as
`null` (e.g. a success response with no message omits the `message` key
entirely).

API Resources (once introduced with the first business module) already wrap
a single resource in `{"data": ...}` by Laravel convention — the trait's
`success()` exists for everything that isn't a Resource (health checks,
delete confirmations, simple action results).

## Paginated list responses

Endpoints backed by an unbounded, append-only table (audit logs, messages)
return `paginated(...)` from the same trait instead of `success(...)`:

```json
{
  "data": [ ...resources ],
  "meta": { "current_page": 1, "per_page": 25, "total": 1840, "last_page": 74 }
}
```

`data` stays a **flat array of resources** — byte-identical to what an
unpaginated list returns — and the paging state goes in a sibling `meta`
key. This is deliberately *not* Laravel's default paginator serialization,
which nests the rows under `data.data`: keeping `data` flat means a client
that only reads `data` needs no change when an endpoint becomes paginated.

`paginated()` takes an optional third argument for module-specific meta
merged into the same `meta` object (e.g. audit logs' `entity_counts`, which
back the filter chips). On the frontend, `apiClient.getPage()` is the
counterpart — the ordinary `get()` unwraps to `body.data` and would throw
`meta` away.

Always paginate at the query level (`->paginate()`), never by fetching
everything and slicing. A hardcoded `limit(N)` is not pagination: it
truncates silently, with nothing telling the client that older rows exist.

## Base controller

`App\Http\Controllers\Api\V1\ApiController` is an abstract class extending
the root `Controller` and using `ApiResponses`. **Every controller under
`app/Http/Controllers/Api/V1/` extends this**, not the bare `Controller`,
so the response helpers are always available and controllers stay thin.

## Centralized error handling

Configured in `bootstrap/app.php`'s `withExceptions()`. Applies only to
`api/*` requests — web routes are untouched. Every exception type below
renders as a consistent JSON shape instead of each controller needing its
own try/catch:

| Exception | Status | Body |
|---|---|---|
| `AuthenticationException` | 401 | `{"message": "Unauthenticated."}` |
| `AuthorizationException` | 403 | `{"message": "..."}` |
| `ValidationException` | 422 | `{"message": "...", "errors": {...}}` |
| `ModelNotFoundException` / `NotFoundHttpException` | 404 | `{"message": "Resource not found."}` |
| Any other uncaught `Throwable` (only when `APP_DEBUG=false`) | 500 | `{"message": "Server error."}` |

When `APP_DEBUG=true`, unhandled exceptions fall through to Laravel's
default verbose JSON error (full trace) instead of the generic 500 — useful
for local development, never exposed in production.

## Example: `/api/v1/health`

`HealthController` (`app/Http/Controllers/Api/V1/HealthController.php`) is
the first controller built on this foundation. It checks live PostgreSQL
connectivity and returns:
```json
{"data": {"status": "ok", "database": "connected", "timestamp": "2026-07-02T13:22:19+00:00"}}
```
with HTTP 200, or `503` with `"status": "degraded"` if the database is
unreachable — using the same `success()` helper for both, since a health
check isn't a client error even when the service itself is degraded.

## Testing convention

Every endpoint gets a Feature Test under `tests/Feature/Api/V1/` (or
`tests/Feature/Api/` for cross-cutting concerns like error handling), using
PHPUnit classes extending `Tests\TestCase` — matching the existing
`ExampleTest.php` style, not Pest. See `HealthEndpointTest.php` and
`ErrorHandlingTest.php` for the pattern.
