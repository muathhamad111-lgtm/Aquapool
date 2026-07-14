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
