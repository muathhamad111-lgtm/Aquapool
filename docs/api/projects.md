# API — Projects (Phase 8)

Base path: `/api/v1`. See `docs/api-foundation.md` for the response envelope
and error shapes, `docs/api/admin-auth-and-users.md` for auth, and
`docs/api/product-categories.md` for the category relationship these
reference. Admin routes require a Sanctum bearer token and are authorized
via `ProjectPolicy` (`isStaff()` — admin or staff, same as Categories,
Services, and Products).

`image_url` is populated via the existing generic upload endpoint
(`POST /admin/uploads`, `folder: "projects"` — already in the Phase 5A
allow-list) and stored as a plain string, not validated as a strict URL —
same reasoning as Products (the admin form falls back to a relative
placeholder path when no image is uploaded).

`category` is a legacy plain-text field that predates `category_id`,
populated from a fixed admin dropdown (`residential`, `commercial`,
`hospitality`, `renovation`). Preserved for data continuity — the public
site never reads it — and is not a cleanup target in this phase.

`category_id` is **nullable and optional** at this endpoint's validation
layer, unlike Products — the admin UI's `CategoryCascader` has no
`required` prop for Projects (matching Services), and every real exported
production row currently has `category_id = null`.

`year` is a plain string, not an integer — matches the current admin
form's free-text field and the original Supabase column type.

`is_featured` is a boolean flag surfaced on the public projects grid and
used for the admin's client-side "featured" filter tab.

## `GET /projects`

Public, no auth. Always filtered to `is_published = true`, ordered by
`sort_order`. No query parameters.

- `200` → `{"data": [ProjectResource, ...]}`

## `GET /admin/projects`

Auth required (staff or admin). Returns every project, published and
unpublished.

- `200` → `{"data": [ProjectResource, ...]}`

## `POST /admin/projects`

Auth required. Body:
```json
{
  "title_ar": "string", "title_en": "string",
  "location_ar": "string|null", "location_en": "string|null",
  "category": "string|null",
  "image_url": "string|null",
  "year": "string|null",
  "is_featured": "boolean|null",
  "category_id": "uuid|null",
  "sort_order": "integer|null",
  "is_published": "boolean|null"
}
```
- `201` → `{"data": ProjectResource}`
- `422` → validation error (missing title, non-existent category)

## `PATCH /admin/projects/{project}`

Auth required. Same body shape as create — editing a project updates every
field in one request, same as Products and Services.

- `200` → `{"data": ProjectResource}`
- `422` → validation error

## `DELETE /admin/projects/{project}`

Auth required. Plain delete — no cascade concerns (nothing else references
`projects.id`).

- `200` → `{"message": "Project deleted."}`

## `ProjectResource` shape

```json
{
  "id": "uuid",
  "title_ar": "string",
  "title_en": "string",
  "location_ar": "string|null",
  "location_en": "string|null",
  "category": "string",
  "category_id": "uuid|null",
  "image_url": "string|null",
  "year": "string|null",
  "is_featured": false,
  "sort_order": 0,
  "is_published": true,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
