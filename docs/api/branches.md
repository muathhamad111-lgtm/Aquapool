# API — Branches

Base path: `/api/v1`. See `docs/api-foundation.md` for the response envelope
and `docs/api/admin-auth-and-users.md` for auth. Admin routes require a
Sanctum bearer token and are authorized via `BranchPolicy` (`isStaff()` —
admin or staff, same as every other content module).

Branches are the company's physical locations, shown on the contact page.
They replaced the address/phone/email/hours that used to live in the single
`contact` site setting; that setting now holds only the company-wide values
that aren't per-location (WhatsApp, social links). The site footer shows the
**first published branch**, since it has room for one.

## Fields

| Field | Rules | Notes |
|---|---|---|
| `name_ar`, `name_en` | required, max 255 | The only required fields |
| `country_ar/en`, `region_ar/en`, `district_ar/en`, `street_ar/en` | nullable, max 255 | The address, split into parts |
| `email` | nullable, valid email | |
| `phone` | nullable, max 50 | Free text — international formats vary too much to validate |
| `map_url` | nullable, `url:http,https`, max 2048 | An exact map link, pasted from Google Maps |
| `hours_ar/en` | nullable, max 255 | Per branch; a second location often keeps different hours |
| `sort_order` | nullable, integer | Display order; also picks the footer's branch |
| `is_published` | nullable, boolean | Defaults to `true` |

**`map_url`** is what the site's directions button opens when set. Without
one it falls back to a Google Maps *search* built from the address, so a
branch always has working directions. Schemes are pinned to `http`/`https`
rather than using the generic `url` rule: the value is rendered straight
into an `href`, and `javascript:` satisfies that rule. It is deliberately
not restricted to Google's domains — a branch may reasonably be pinned on
another map service. The column is 2048 chars because a Google Maps place
URL carries an encoded name and a coordinate blob and routinely passes 255.

**Only the name is required.** A real branch may have no street, no
district, or no dedicated email — requiring those would force the admin to
invent placeholder data. Address parts are bilingual like every other
module; the frontend's `pick()` falls back between languages, so a missing
English value renders the Arabic one rather than a blank.

## `GET /branches`

Public, no auth. Published branches only, ordered by `sort_order`.

- `200` → `{"data": [BranchResource, ...]}`

Ordering is a contract, not a convenience: the footer renders the first
element of this list as the primary branch.

## `GET /admin/branches`

Auth required. Every branch, published and unpublished, ordered by
`sort_order`.

- `200` → `{"data": [BranchResource, ...]}`

## `POST /admin/branches`

Auth required. Body: the fields above.

- `201` → `{"data": BranchResource}`
- `422` → validation error (missing name, malformed email)

The response is read back from the database after insert, so `is_published`
and `sort_order` report their stored defaults rather than `null` — otherwise
a client would show a freshly created, live branch as hidden.

## `PATCH /admin/branches/{branch}`

Auth required. Same body shape as create.

- `200` → `{"data": BranchResource}`
- `404` → unknown id

## `DELETE /admin/branches/{branch}`

Auth required.

- `200` → `{"message": "Branch deleted."}`

## Migration from the `contact` setting

The table's migration converts the existing single `contact` setting into
the first branch, so the contact page and footer are never empty between the
migration and an admin creating branches by hand.

The setting stored one free-text address string, not structured parts. The
live value was `الرياض، المملكة العربية السعودية` — region then country — so
the migration splits it on the comma. That is a best-effort parse of one
known row, not a general address parser: anything it can't split lands in
`region` whole, which still renders correctly and takes seconds to fix in
the admin. Verified against the real production setting: it produced
`region_ar = الرياض`, `country_ar = المملكة العربية السعودية`,
`region_en = Riyadh`, `country_en = Saudi Arabia`, with email, phone and
hours carried across.
