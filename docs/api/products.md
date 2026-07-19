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

## Slug, gallery and specifications

Three fields were added after the initial phase, for the public product
detail page:

**`slug`** — the public URL key (`/products/{slug}`), unique and `NOT NULL`.
Optional on write: when absent, `ProductService` derives one from
`title_en` and de-duplicates it with a numeric suffix. `Str::slug()` strips
Arabic to an empty string, so a product with no Latin title falls back to a
random `product-xxxxxxxx` rather than an empty slug, which the unique index
would reject for the second such product. **An existing slug is never
regenerated on update** — renaming a product must not silently change a
published address; send `slug` explicitly to change it.

**`images`** — the gallery, a JSON array of URL strings in display order,
populated by the same `POST /admin/uploads` endpoint one file at a time.
`image_url` remains the **cover** and is always kept equal to `images[0]`
by `ProductService`, so the catalogue list, the seeded Supabase fixtures and
the existing admin form keep reading it unchanged. Reordering the gallery
moves the cover; clearing it nulls the cover. Max 20 images.

**`specifications`** — free-form spec groups, a JSON array of
`{title_ar, title_en, fields: [{label_ar, label_en, value_ar, value_en}]}`.
Free-form **per product** by design: there is no shared definition table, so
two products' groups are unrelated even when identically named. Every bound
(max 20 groups, max 50 fields per group, max 2000 chars per value) is
deliberate — this is client-supplied nested data written straight into a
`jsonb` column. `fields` is required on every group.

## `GET /products`

Public, no auth. Always filtered to `is_published = true`, ordered by
`sort_order`. No query parameters.

- `200` → `{"data": [ProductResource, ...]}`

`ProductResource` deliberately **omits `specifications`** — a catalogue page
would otherwise download every product's full spec tables. It does include
`slug` (needed to link to the detail page) and `images`.

## `GET /products/{slug}`

Public, no auth. The product detail page. Addressed by slug, never by UUID.

- `200` → `{"data": ProductDetailResource}` — everything `ProductResource`
  sends, plus `specifications`
- `404` → unknown slug **or an unpublished product**

An unpublished product returns `404`, not `403`, deliberately: a public
visitor must not be able to tell a hidden product apart from one that never
existed.

## `GET /admin/products`

Auth required (staff or admin). Returns every product, published and
unpublished.

- `200` → `{"data": [ProductResource, ...]}`

## `GET /admin/products/{product}`

Auth required (staff or admin). One product **with** its `specifications`,
for the admin edit form. Addressed by **UUID**, not slug — unlike the public
detail endpoint. Returns unpublished products too; editing one is the point.

- `200` → `{"data": ProductDetailResource}`
- `404` → unknown id
- `401` / `403` → unauthenticated / not staff

This exists so `GET /admin/products` can keep omitting `specifications`: an
admin list would otherwise carry every product's full spec tables just so
one of them can be opened for editing.

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
  "is_published": "boolean|null",
  "slug": "string|null (alpha_dash; generated from title_en when absent)",
  "images": ["string"],
  "specifications": [
    {
      "title_ar": "string|null", "title_en": "string|null",
      "fields": [
        {
          "label_ar": "string|null", "label_en": "string|null",
          "value_ar": "string|null", "value_en": "string|null"
        }
      ]
    }
  ]
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
