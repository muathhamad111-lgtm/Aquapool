# API — Messages (Phase 9)

Base path: `/api/v1`. See `docs/api-foundation.md` for the response envelope
and error shapes, and `docs/api/admin-auth-and-users.md` for auth. Admin
routes require a Sanctum bearer token and are authorized via
`MessagePolicy` (`isStaff()` — admin or staff, same as every other content
module).

Unlike every prior module, Messages has a genuine **public write**
endpoint (the contact form) alongside the admin-only read/update/delete
surface — matching Supabase's `anon, authenticated` insert grant.

The `messages` table has **no `updated_at` column**, matching the original
Supabase schema exactly (`Message::UPDATED_AT = null`) — only `created_at`.

Status changes are **not** treated as a plain attribute update. They go
through `AuditAction::StatusChange` via `Message::auditAs()`, recorded as
`{"from": "...", "to": "..."}` — `status` is excluded from the model's
automatic update-diff (`auditIgnore()`) specifically so a status change
never also produces a redundant plain `update` audit entry.

## `POST /messages`

Public, no auth. Rate-limited to 5 requests/minute/IP (`throttle:5,1`) — a
new protection not present in Supabase today, since its RLS only checked
field lengths, not submission frequency. `status` is always forced to
`"new"` server-side regardless of what's submitted.

Body:
```json
{
  "name": "string", "email": "string",
  "phone": "string|null", "city": "string|null",
  "project_type": "string|null", "budget": "string|null",
  "timeline": "string|null", "subject": "string|null",
  "message": "string"
}
```
- `201` → `{"data": MessageResource}`
- `422` → validation error (missing name/email/message, invalid email, over-length fields)
- `429` → rate limit exceeded

Because this endpoint has no authenticated actor, **no audit log entry is
ever written for a submission** — matches the existing, deliberate
`AuditLogWriter` rule ("no authenticated actor means no log entry, always").

## `GET /admin/messages`

Auth required. Returns every message, ordered by `created_at` descending.

- `200` → `{"data": [MessageResource, ...]}`

## `GET /admin/messages/summary`

Auth required. Backs the admin dashboard overview's messages widgets in
one call — total count, per-status counts, and the 5 most recent messages.

- `200` → `{"data": {"total": 0, "by_status": {"new": 0, "in_progress": 0, "replied": 0, "archived": 0}, "recent": [MessageResource, ...]}}`

## `PATCH /admin/messages/{message}/status`

Auth required. Single status change.

Body: `{"status": "new"|"in_progress"|"replied"|"archived"}`
- `200` → `{"data": MessageResource}`
- `422` → validation error (invalid status)

## `PATCH /admin/messages/status`

Auth required. Bulk status change — iterates each message individually
(never a mass `update()`), so every message in the batch gets its own
`status_change` audit log entry.

Body: `{"ids": ["uuid", ...], "status": "..."}`
- `200` → `{"message": "Messages updated."}`
- `422` → validation error (missing/non-existent id, invalid status)

## `DELETE /admin/messages/{message}`

Auth required. Plain delete — automatic `delete` audit via the `Auditable`
trait.

- `200` → `{"message": "Message deleted."}`

## `DELETE /admin/messages`

Auth required. Bulk delete — iterates each message individually (never a
mass `delete()`), so every message in the batch gets its own `delete`
audit log entry.

Body: `{"ids": ["uuid", ...]}`
- `200` → `{"message": "Messages deleted."}`
- `422` → validation error (missing/non-existent id)

## `MessageResource` shape

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string|null",
  "city": "string|null",
  "project_type": "string|null",
  "budget": "string|null",
  "timeline": "string|null",
  "subject": "string|null",
  "message": "string",
  "status": "string",
  "created_at": "ISO8601"
}
```
