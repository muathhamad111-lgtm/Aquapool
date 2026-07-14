# API — Product Categories (Phase 5)

Base path: `/api/v1`. See `docs/api-foundation.md` for the response envelope
and error shapes these all follow, and `docs/api/admin-auth-and-users.md`
for auth. Admin routes require a Sanctum bearer token and are authorized
via `ProductCategoryPolicy` (`isStaff()` — admin or staff, same as Site
Settings; not admin-only).

Categories are hierarchical (self-referencing `parent_id`) and shared
across three kinds: `product`, `service`, `project`. A sub-category always
inherits its parent's `kind` — this is enforced server-side
(`ProductCategoryService::create()`), not client-controllable.

## `GET /product-categories`

Public, no auth. Always filtered to `is_published = true`.

Query: `kind` (required) — one of `product`, `service`, `project`.

- `200` → `{"data": [ProductCategoryResource, ...]}`
- `422` → missing or invalid `kind`

## `GET /admin/product-categories`

Auth required (staff or admin). Returns every category, every kind,
published and unpublished — the admin dashboard fetches everything once
and builds its tabs/tree/breadcrumb client-side from the flat list.

- `200` → `{"data": [ProductCategoryResource, ...]}`

## `POST /admin/product-categories`

Auth required. Body: `{"name_ar": string, "name_en": string, "parent_id"?: uuid, "kind"?: "product"|"service"|"project"}`.

- `kind` is required for a root category (no `parent_id`); ignored and
  overridden with the parent's own `kind` when `parent_id` is set.
- `201` → `{"data": ProductCategoryResource}`
- `422` → validation error (missing name, invalid kind, non-existent parent, missing kind on a root category)

## `PATCH /admin/product-categories/{productCategory}`

Auth required. Body: `{"name_ar": string, "name_en": string}` — name only;
`parent_id`/`kind` are immutable after creation, matching the current
admin UI.

- `200` → `{"data": ProductCategoryResource}`
- `422` → validation error

## `DELETE /admin/product-categories/{productCategory}`

Auth required. Deletes the category and every descendant. Each row is
deleted individually (not a DB cascade) specifically so every deletion —
parent and each descendant — gets its own audit log entry.

- `200` → `{"message": "Category deleted."}`

## `ProductCategoryResource` shape

```json
{
  "id": "uuid",
  "parent_id": "uuid|null",
  "name_ar": "string",
  "name_en": "string",
  "kind": "product|service|project",
  "sort_order": 0,
  "is_published": true,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
