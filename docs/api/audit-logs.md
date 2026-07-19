# API — Audit Logs

Base path: `/api/v1/admin`. Auth: Sanctum bearer token, staff or admin
(`AuditLogPolicy::viewAny` → `User::isStaff()`). See `docs/api-foundation.md`
for the response envelope, including the paginated list shape used here.

Audit logs are **read-only over the API** — there is no create, update or
delete endpoint, by design. Rows are written server-side only, by the
`Auditable` trait / `auditAs()` (see "Audit logging" in
`docs/development-standards.md`).

## `GET /audit-logs`

Paginated, newest first. `audit_logs` is append-only and unbounded, so this
endpoint never returns the whole table — it previously returned a hardcoded
`limit(500)`, which silently truncated the history with no indication to the
client that older entries existed.

Query parameters (all optional):

| Param | Rules | Default | Notes |
|---|---|---|---|
| `page` | integer, min 1 | 1 | |
| `per_page` | integer, 1–100 | 25 | Capped so a client can't request the whole table |
| `entity_type` | string, max 100 | — | Exact match, e.g. `product`, `service`, `user`. Not validated against an enum: entity types derive from model class names, so a new module is filterable without touching this rule |
| `search` | string, max 255 | — | Case-insensitive substring match across `user_email`, `entity_label`, `action`, `entity_type` |

`entity_type` and `search` combine (AND).

- `200` →
  ```json
  {
    "data": [{ "id": 1, "user_id": "…", "user_email": "…", "action": "update",
               "entity_type": "product", "entity_id": "…", "entity_label": "…",
               "details": { "changes": { "title": ["old", "new"] } },
               "created_at": "2026-07-19T10:11:12+00:00" }],
    "meta": {
      "current_page": 1, "per_page": 25, "total": 1840, "last_page": 74,
      "entity_counts": { "product": 900, "service": 640, "user": 300 }
    }
  }
  ```
- `401` → unauthenticated
- `403` → authenticated but not staff
- `422` → invalid `page` / `per_page` / filter values

**`meta.entity_counts`** is a per-entity-type row count for the **whole
table**, deliberately ignoring the active filters — it backs the admin
page's filter chips, which must keep showing each type's total. Filtering
the counts too would zero out every chip except the selected one.

**Ordering** is `created_at DESC, id DESC`. The `id` tiebreaker is required,
not cosmetic: `audit_logs` has no `updated_at`, and a single request can
write several rows within the same second, so `created_at` alone is not a
unique ordering — without it, rows sharing a timestamp can repeat on one
page and vanish from the next.
