# Aqua — Development Standards

Last updated: 2026-07-02. These rules are mandatory for every future feature
built on top of `aqua-app` (Laravel) and `aqua-frontend` (React). See
`docs/architecture.md` for the overall system context and migration roadmap.

## Principle

Laravel owns business logic. React owns UI. Nothing crosses that line.

- Never put business logic inside Controllers.
- Never put business logic inside React.
- Keep React responsible for UI only — no validation rules, no authorization
  checks, no direct database/Supabase access, no workflow logic.
- Keep Laravel responsible for business logic — validation, authorization,
  data access, workflows, integrations, audit logs, background processing.

## The mandatory layer pipeline

Every feature that touches data must pass through these layers, in this
order. **Never skip a layer** — even a "simple" feature gets a Form Request
and a Feature Test. If a layer genuinely doesn't apply (e.g. no seed data
needed), say so explicitly in the PR/commit description rather than silently
omitting it.

### 1. Database Migration
- Location: `aqua-app/database/migrations/`
- One migration per schema change. Never edit a migration that has already
  run in any shared environment — write a new one.
- Column names and types match what the API Resource and frontend actually
  need; don't add speculative columns.

### 2. Eloquent Model
- Location: `aqua-app/app/Models/`
- Holds relationships, casts, scopes, and attribute accessors only.
- No business rules here beyond what's intrinsic to the data shape (e.g. a
  cast or a relationship is fine; a pricing calculation is not — that's a
  Domain Service).

### 3. Factory
- Location: `aqua-app/database/factories/`
- Every model that appears in a Feature Test must have a factory. Factories
  produce valid, realistic data — no placeholder junk that would pass
  validation by accident.

### 4. Seeder (when appropriate)
- Location: `aqua-app/database/seeders/`
- Only for reference/demo data that needs to exist consistently across
  environments (e.g. default categories, an initial admin user). Not every
  feature needs one — skip it for pure transactional data.

### 5. Policy
- Location: `aqua-app/app/Policies/`
- All authorization decisions live here, registered against the model. This
  is the direct replacement for today's Supabase RLS policies — when porting
  a module, the Policy must reproduce the same authorization outcome the RLS
  policy currently enforces, verified by a Feature Test before cutover.
- Controllers call `$this->authorize(...)` / `Gate::authorize(...)`. They
  never contain `if ($user->role === ...)` logic inline.

### 6. Form Request
- Location: `aqua-app/app/Http/Requests/`
- All input validation lives here, not in the controller, not in the
  frontend. The frontend may mirror validation with Zod for instant user
  feedback, but the Form Request is the source of truth — never trust the
  client.
- Never duplicate validation rules across multiple Form Requests for the
  same field shape — extract shared rules into a trait or base request if
  they repeat.

### 7. Domain Service
- Location: `aqua-app/app/Services/`
- Where actual business logic lives: multi-step workflows, calculations,
  side effects (dispatching Jobs/Events), anything beyond "validate, then
  save." A Domain Service is the thing a Controller calls into.
- Keep services focused — one service per bounded concern. If a service
  starts accumulating unrelated responsibilities, split it.

### 8. Controller
- Location: `aqua-app/app/Http/Controllers/Api/V1/`
- Keep controllers thin: resolve the Form Request, call `authorize()`, call
  the Domain Service, return an API Resource. No validation, no
  authorization logic, no business rules inline.
- One controller action = one job. Prefer single-action (`__invoke`)
  controllers for simple endpoints, as already used in `HealthController`.

### 9. API Resource
- Location: `aqua-app/app/Http/Resources/`
- All API responses go through a Resource class — never return raw models
  or raw arrays from a controller. This is what keeps the response shape
  consistent and versioned.

### 10. Feature Test
- Location: `aqua-app/tests/Feature/`
- Every API endpoint must have a Feature Test covering: the happy path,
  validation failure, and each authorization outcome the Policy defines
  (e.g. admin can, staff can, unauthorized cannot). No endpoint ships
  without this.

### 11. Frontend API integration
- Location: `aqua-frontend/src/lib/` (existing hook files) and
  `aqua-frontend/src/routes/**` (consumers)
- Replace the relevant Supabase calls with TanStack Query hooks calling the
  new `/api/v1/...` endpoint. Keep existing hook names/shapes where
  reasonable to minimize churn in consuming components.
- No business logic here: no validation beyond immediate UX feedback, no
  authorization branching beyond showing/hiding UI based on what the API
  already told the client.

### 12. Frontend UI changes — only if required
- Only touch JSX/styling if the API integration genuinely requires a shape
  change (e.g. a new field to display). Do not refactor or restyle
  components as a side effect of a backend migration.

## Cross-cutting rules

- **Never duplicate authorization.** One Policy per model is the single
  source of truth — don't re-check the same rule in a Controller, a Service,
  and a Form Request.
- **Never duplicate validation.** One Form Request per input shape — don't
  re-validate the same field elsewhere.
- **Every new endpoint must be documented** (OpenAPI, once the docs
  pipeline exists per the roadmap in `docs/architecture.md`; until then, a
  short entry in `docs/api/` describing method, path, auth, request/response
  shape).
- **Every feature must be committed separately.** Don't bundle unrelated
  features into one commit, and don't mix a feature commit with unrelated
  cleanup.
- **Never modify unrelated files.** A feature touching `products` doesn't
  also touch `projects` files "while we're in there."
- **Explain the implementation plan before writing code.** For every new
  feature or module, walk through which of the 12 layers are involved and
  what each will do, and get that confirmed before implementation starts —
  same process used for Phase 1.

## Audit logging

Every module that mutates data gets audit logging automatically — there is
no per-module audit implementation to write, and there must never be one.

- **Add `use App\Models\Concerns\Auditable;` to the Eloquent model.** That's
  the entire integration for plain create/update/delete. `AuditObserver`
  (attached automatically by the trait) turns the model's own Eloquent
  lifecycle events into `audit_logs` rows through the single centralized
  writer, `App\Services\AuditLogWriter`. No Controller, Domain Service, or
  Policy needs any audit-specific code.
- **No authenticated actor means no log entry, always.** Console commands,
  seeders, and jobs run with no request-bound user, so nothing they do is
  audited — this is deliberate (see `aqua:create-admin` /
  `aqua:reset-password`), not a gap to "fix" by inventing a system actor.
- **Bulk operations must iterate model instances**, e.g.
  `Model::whereIn(...)->get()->each->update(...)`, never a raw mass update/
  delete (`Model::whereIn(...)->update([...])`). Mass query builder
  operations bypass Eloquent model events entirely, which means they bypass
  audit logging entirely too — this is the most likely way a future module
  silently loses its audit trail.
- **Action naming** is a closed enum, `App\Enums\AuditAction`: `Create`,
  `Update`, `Delete` cover ordinary CRUD automatically. A domain-specific
  transition that isn't a plain attribute diff (e.g. a message's status)
  uses `AuditAction::StatusChange` via the model's explicit
  `$model->auditAs(AuditAction::StatusChange, ['from' => $old, 'to' => $new])`
  escape hatch — still funnels through the same `AuditLogWriter`, just
  invoked explicitly instead of automatically. Add new cases to the enum
  rather than passing free-form action strings.
- **Entity naming** defaults to `Str::snake(class_basename($model))` (e.g.
  `ProductCategory` → `product_category`) — don't override unless the class
  name genuinely doesn't match the desired public name.
- **Details payload convention**: always `null` or a plain JSON object,
  never a scalar. Updates use `{"changes": {"field": [old, new], ...}}`
  — an actual diff, not the full new state. Never let sensitive values
  (passwords, tokens, secrets) reach the `details` column: list them in the
  model's `auditRedact()` override so they're recorded as
  `{"field": {"redacted": true}}` instead of their real values. Fields that
  change constantly but aren't meaningful audit events (e.g. a login
  timestamp) belong in `auditIgnore()` instead, so they don't generate noise
  or empty-diff log rows.

## Folder & naming conventions

Established when the API foundation was built (see `docs/api-foundation.md`
for the response envelope and error handling these controllers rely on):

- **Controllers**: `app/Http/Controllers/Api/V1/{Model}Controller.php`,
  extending `App\Http\Controllers\Api\V1\ApiController` (never the bare
  `Controller`). Prefer single-action (`__invoke`) controllers for simple
  endpoints.
- **Form Requests**: `app/Http/Requests/V1/{Module}/{Store|Update}{Model}Request.php`.
  `authorize()` always returns `true` — authorization happens exactly once,
  via the Policy, invoked from the Controller. This is what "never duplicate
  authorization" means concretely: don't re-check access in the Form
  Request too.
- **API Resources**: `app/Http/Resources/V1/{Model}Resource.php`. Formatting
  only — no business logic, no authorization checks.
- **Domain Services**: `app/Services/{Module}Service.php`. Plain PHP
  classes, constructor-injected dependencies, one cohesive concern per
  service.
- **Policies**: `app/Policies/{Model}Policy.php`, relying on Laravel's
  auto-discovery convention (`{Model}Policy` resolves to `App\Models\{Model}`
  automatically).

## Feature checklist (copy this into the plan for every new module)

- [ ] Migration
- [ ] Model (add `use Auditable;` — see "Audit logging" above)
- [ ] Factory
- [ ] Seeder (if appropriate — state explicitly if skipped, and why)
- [ ] Policy
- [ ] Form Request(s)
- [ ] Domain Service
- [ ] Controller (thin)
- [ ] API Resource
- [ ] Feature Tests (happy path + validation + each authorization outcome)
- [ ] Frontend API integration
- [ ] Frontend UI changes (only if required)
- [ ] Endpoint documented
- [ ] Committed as its own focused commit
