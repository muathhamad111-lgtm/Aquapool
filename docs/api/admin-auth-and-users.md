# API — Admin Auth & Users (Phase 2.1)

Base path: `/api/v1/admin`. Auth: Sanctum bearer token (`Authorization: Bearer <token>`), issued by login. See `docs/api-foundation.md` for the response envelope and error shapes these all follow.

Roles: `admin` (full access) and `user` (staff — full access except deleting users, deleting audit logs, or creating other admins). See `app/Policies/UserPolicy.php` for the exact rules.

## `POST /auth/login`
Public. Body: `{"email": string, "password": string}`.
- `200` → `{"data": {"token": string, "user": {id, email, role, created_at, last_login_at}}}`
- `422` → invalid credentials or validation error
- `429` → rate limited: 5 attempts per minute, keyed by **email + IP** (the
  `login` limiter in `AppServiceProvider`). Keyed by both rather than IP alone
  so a shared office IP can't lock every admin out over one person's typos,
  while an attacker cycling passwords against one account still trips the
  limit immediately. The email part of the key is lower-cased, so changing
  the casing can't reset the counter.

## `POST /auth/logout`
Auth required. Revokes the token used for this request only (not other sessions).
- `200` → `{"message": "Logged out."}`

## `GET /auth/me`
Auth required.
- `200` → `{"data": {id, email, role, created_at, last_login_at}}`

## `GET /users`
Auth required (admin or staff).
- `200` → `{"data": [UserResource, ...]}`

## `POST /users`
Auth required (admin or staff). Body: `{"email": string, "password": string (min 8), "role": "admin"|"user"}`.
- Creating `role: "admin"` requires the caller to already be admin.
- `201` → `{"data": UserResource}`
- `403` → staff attempted to create an admin
- `422` → validation error (duplicate email, short password)

## `PATCH /users/{user}/password`
Auth required. Body: `{"password": string (min 8)}`.
- Staff can reset another staff user's password, but **not** an admin's.
- Admin can reset anyone's password, including another admin's.
- `200` → `{"message": "Password updated."}`
- `403` → staff attempted to reset an admin's password

## `DELETE /users/{user}`
Admin only. Cannot delete your own account.
- `200` → `{"message": "User deleted."}`
- `403` → non-admin, or attempting to delete self

## First admin
No public registration endpoint exists anywhere. The first admin is created via:
```
php artisan aqua:create-admin {email} {--password=} {--force}
```
Prompts for a password if `--password` isn't given. Refuses to run if an admin already exists, unless `--force` is passed.
