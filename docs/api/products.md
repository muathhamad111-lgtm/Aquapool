# API — Products (Phase 7)

Base path: `/api/v1`. See `docs/api-foundation.md` for the response envelope
and error shapes, `docs/api/admin-auth-and-users.md` for auth, and
`docs/api/product-categories.md` for the category relationship these
reference. Admin routes require a Sanctum bearer token and are authorized
via `ProductPolicy` (`isStaff()` — admin or staff, same as Categories and
Services).

`image_url` is populated via the existing generic upload endpoint
(`POST /admin/uploads`, `folder: "products"` — see
`docs/api/admin-auth-and-users.md` or the Uploads phase docs) and stored as
a plain string, not validated as a strict URL — the admin form falls back
to a relative placeholder path (`/site/placeholder.jpg`) when no image is
uploaded, and that value is saved as-is.

`category` is a legacy plain-text field that predates `category_id`.
It is preserved for data continuity (the public site never reads it; it's
only used as an admin-listing fallback string) and is not a cleanup target
in this phase.

`category_id` is **required** at this endpoint's validation layer, unlike
Services — the admin UI enforces category selection via a native
`<select required>`. The database column itself stays **nullable**, matching
existing Supabase production semantics exactly (a real exported row has
`category_id = null`); this is a request-layer rule only, not a schema
constraint.

## `GET /products`

Public, no auth. Always filtered to `is_published = true`, ordered by
`sort_order`. No query parameters.

- `200` → `{"data": [ProductResource, ...]}`

## `GET /admin/products`

Auth required (staff or admin). Returns every product, published and
unpublished.

- `200` → `{"data": [ProductResource, ...]}`

## `POST /admin/products`

Auth required. Body:
```json
{
  "title_ar": "string", "title_en": "string",
  "caption_ar": "string|null", "caption_en": "string|null",
  "category": "string|null",
  "image_url": "string|null",
  "price_label_ar": "string|null", "price_label_en": "string|null",
  "category_id": "uuid",
  "sort_order": "integer|null",
  "is_published": "boolean|null"
}
```
- `201` → `{"data": ProductResource}`
- `422` → validation error (missing title, missing/non-existent category)

## `PATCH /admin/products/{product}`

Auth required. Same body shape as create — editing a product updates every
field in one request, same as Services.

- `200` → `{"data": ProductResource}`
- `422` → validation error

## `DELETE /admin/products/{product}`

Auth required. Plain delete — no cascade concerns (nothing else references
`products.id`).

- `200` → `{"message": "Product deleted."}`

## `ProductResource` shape

```json
{
  "id": "uuid",
  "title_ar": "string",
  "title_en": "string",
  "caption_ar": "string|null",
  "caption_en": "string|null",
  "category": "string",
  "category_id": "uuid|null",
  "image_url": "string|null",
  "price_label_ar": "string|null",
  "price_label_en": "string|null",
  "sort_order": 0,
  "is_published": true,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
