# cPanel deployment

One-command deploy for the shared-hosting layout used by
`album-magicframes.nokkoo.in`.

## Server layout

```
~/laravel/album-magicframes/           <- the git repo (run the script here)
  backend/                             <- Laravel app (artisan, vendor, storage)
  frontend/                            <- React SPA source
  deploy/cpanel/setup.sh               <- this deploy script

~/album-magicframes.nokkoo.in/         <- web doc root
  index.php                            <- Laravel front controller (points at ../backend)
  index.html + assets/                 <- built SPA (replaced by the script)
  storage -> ../backend/storage/app/public   <- symlink (serves uploaded avatars)
  php.ini, cgi-bin/, robots.txt, logo* <- server/static files (left untouched)
```

## Usage

```bash
cd ~/laravel/album-magicframes
git pull
bash deploy/cpanel/setup.sh
```

The script is **idempotent** — safe to re-run on every deploy. It:

1. Detects a PHP 8.2+ CLI (`ea-php83`, `php83`, … or `PHP_BIN`).
2. Backs up the MySQL database via `mysqldump` (reads creds from `backend/.env`).
3. `composer install --no-dev --optimize-autoloader`.
4. `php artisan migrate --force` (migrations are additive / non-destructive).
5. Seeds roles + permissions (`RolePermissionSeeder`, idempotent).
6. Backfills `role_id` on pre-existing users from their string `role`.
7. `php artisan storage:link` + ensures the doc-root `/storage` symlink.
8. Rebuilds config + route caches.
9. Builds the SPA and copies **only** `assets/` + `index.html` (+ manifest/
   favicons) into the doc root — never clobbering `index.php`, `storage`,
   `php.ini`, `cgi-bin/`, or `robots.txt`.

## Environment overrides

| Variable | Default | Purpose |
|----------|---------|---------|
| `DOC_ROOT` | `~/album-magicframes.nokkoo.in` | Web doc root |
| `PHP_BIN` | auto-detected | Force a specific PHP CLI |
| `SKIP_DB_BACKUP=1` | — | Skip the automatic `mysqldump` |
| `SKIP_FRONTEND=1` | — | Backend-only deploy (no SPA build) |
| `SKIP_COMPOSER=1` | — | Skip `composer install` |

Examples:

```bash
# Backend-only (skip the SPA rebuild)
SKIP_FRONTEND=1 bash deploy/cpanel/setup.sh

# Force a PHP version
PHP_BIN=ea-php83 bash deploy/cpanel/setup.sh
```

## Prerequisites

- `backend/.env` is configured (DB, `APP_URL`, `MAIL_*`, `ALBUM_PUBLIC_BASE_URL`).
- `frontend/.env` sets the production API origin before building:
  ```
  VITE_API_URL=https://album-magicframes.nokkoo.in/api
  ```
- `node`/`npm` available on the host (or run `SKIP_FRONTEND=1` and build the SPA
  elsewhere, copying `dist/assets` + `dist/index.html` into the doc root).

## Post-deploy smoke test

1. `https://album-magicframes.nokkoo.in/admin/login` — admin login.
2. **Profile** → upload an avatar (verifies the `/storage` symlink end-to-end).
3. **Staff** → add a staff member → copy the one-time temp credentials.
4. Log in as that staff member → confirm the forced first-login password change.
5. Confirm staff get **403** on admin-only routes (Roles / Activity).
