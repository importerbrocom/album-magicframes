# Magic Frames — Project Steering

Private, mobile-first digital wedding/photo album platform. Single-origin app:
a React SPA and a Laravel API served from the **same domain**
(`album-magicframes.nokkoo.in`), so no CORS is needed.

## Stack & layout

- **frontend/** — React 18 + Vite SPA (React Router, Tailwind, axios). Built to
  `frontend/dist/`. Entry/chunks are content-hashed and served `immutable`.
- **backend/** — Laravel 11 API (PHP 8.3+ in dev; the production host runs
  `ea-php74` CLI at `/opt/cpanel/ea-php74/root/usr/bin/php`). Sanctum
  **bearer-token** auth (NOT stateful cookies — see `bootstrap/app.php`).
- **deploy/cpanel/** — cPanel/LiteSpeed deploy assets: `index.php` (doc-root
  front controller), `htaccess-docroot.txt`, `setup.sh`, and a committed
  prebuilt SPA bundle in `spa-dist/`.
- **.github/workflows/deploy-cpanel.yml** — builds the SPA + backend and deploys
  over FTPS. Runs **only on manual `workflow_dispatch`** (auto-deploy on push is
  intentionally disabled).

## Auth & roles (admin + staff)

- One `users` table. `role` is `super_admin`/`admin` (full access) or `staff`.
- `User::isAdmin()` gates staff management. Staff get the same dashboard **minus**
  the Staff page and admin-only settings (enforced by `admin.only` middleware on
  the backend and `adminOnly` route guard + role-filtered nav on the frontend).
- **One shared login** (`/admin/login`) routes by role. New staff and
  password-resets set `must_change_password`, forcing a change before the
  dashboard (frontend `/admin/force-password`). Suspended users are blocked at
  login and have tokens revoked.
- Self-service profile endpoints (admin + staff): `admin/profile`,
  `admin/profile/password`, `admin/profile/avatar`. Avatars live on the public
  disk (`storage/app/public/avatars`) served via the `/storage` symlink.

## Conventions

- Backend: thin controllers, API Resources for output, FormRequest/`validate()`
  for input, policies/middleware for authorization. Return clean JSON errors
  (see the exception renderers in `bootstrap/app.php`); never leak raw
  exceptions on `api/*`.
- Frontend: feature pages under `frontend/src/admin/` (admin) and
  `frontend/src/pages/` (public). API calls go through `services/adminService.js`
  + the axios instance in `services/api.js` (attaches the bearer token to
  `/admin/*`). Prefer existing utility/class patterns; inputs use the shared
  bordered-rounded style.
- Images: album/section/photo images are proxied through the backend
  (`/api/public/.../thumb|preview|full|cover`) — never hotlink raw
  `googleusercontent`/Drive URLs in an `<img>` (they are hotlink-blocked).

## Migrations gotcha

The production DB already has columns an earlier (reverted) build added
(`avatar_path`, `status`, `permissions`, `must_change_password`, `last_login_at`,
`created_by`). **Always write migrations idempotently** (guard with
`Schema::hasColumn(...)`) so `migrate --force` doesn't fail on
"Duplicate column".
