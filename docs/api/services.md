# API — Services (Phase 6)

Base path: `/api/v1`. See `docs/api-foundation.md` for the response envelope
and error shapes, `docs/api/admin-auth-and-users.md` for auth, and
`docs/api/product-categories.md` for the category relationship these
reference. Admin routes require a Sanctum bearer token and are authorized
via `ServicePolicy` (`isStaff()` — admin or staff, same as Categories and
Site Settings; not admin-only).

`description_ar`/`description_en` accept rich HTML (from the admin's
`RichTextArea` editor) and are sanitized server-side (`App\Support\HtmlSanitizer`,
shared with Site Settings) before being stored — scripts, event handlers,
and any tag/attribute outside the allow-list are stripped.

## `GET /services`

Public, no auth. Always filtered to `is_published = true`, ordered by
`sort_order`. No query parameters.

- `200` → `{"data": [ServiceResource, ...]}`

## `GET /admin/services`

Auth required (staff or admin). Returns every service, published and
unpublished.

- `200` → `{"data": [ServiceResource, ...]}`

## `POST /admin/services`

Auth required. Body:
```json
{
  "icon": "droplets|filter|lightbulb|shield|wrench|sparkles|sun|gem|waves|leaf",
  "title_ar": "string", "title_en": "string",
  "description_ar": "string|null", "description_en": "string|null",
  "category_id": "uuid|null",
  "sort_order": "integer|null",
  "is_published": "boolean|null"
}
```
- `201` → `{"data": ServiceResource}`
- `422` → validation error (invalid icon, missing title, non-existent category)

## `PATCH /admin/services/{service}`

Auth required. Same body shape as create — unlike Categories, editing a
service updates every field in one request, not just the name.

- `200` → `{"data": ServiceResource}`
- `422` → validation error

## `DELETE /admin/services/{service}`

Auth required. Plain delete — no cascade concerns (nothing else references
`services.id`).

- `200` → `{"message": "Service deleted."}`

## `ServiceResource` shape

```json
{
  "id": "uuid",
  "icon": "string",
  "title_ar": "string",
  "title_en": "string",
  "description_ar": "string|null",
  "description_en": "string|null",
  "category_id": "uuid|null",
  "sort_order": 0,
  "is_published": true,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
