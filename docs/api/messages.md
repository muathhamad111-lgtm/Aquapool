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

Auth required. Paginated, newest first. The inbox grows with every contact
form submission, so this endpoint never returns the whole table — filtering
and searching happen in SQL, not in the browser.

Query parameters (all optional):

| Param | Rules | Default | Notes |
|---|---|---|---|
| `page` | integer, min 1 | 1 | |
| `per_page` | integer, 1–100 | 25 | Capped so a client can't request the whole inbox |
| `status` | one of `App\Enums\MessageStatus` | — | `new`, `in_progress`, `replied`, `archived` |
| `search` | string, max 255 | — | Case-insensitive substring match across `name`, `email`, `subject`, `message` |

`status` and `search` combine (AND).

- `200` → `{"data": [MessageResource, ...], "meta": {"current_page": 1, "per_page": 25, "total": 340, "last_page": 14, "status_counts": {"new": 12, "in_progress": 3, "replied": 300, "archived": 25}}}`
- `422` → invalid `page` / `per_page` / `status` / `search`

**`meta.status_counts`** covers the whole inbox, deliberately ignoring the
active filters — it backs the admin page's status chips, which must keep
showing each status's total. Every status is always present, zero included,
so a client rendering one chip per status never has to treat a missing key
as zero.

**Ordering** is `created_at DESC, id DESC`. The `id` tiebreaker is required:
`messages` has no `updated_at` and a burst of submissions can share a
`created_at` second, so `created_at` alone is not a unique ordering — rows
sharing a timestamp could otherwise repeat on one page and vanish from the
next.

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
