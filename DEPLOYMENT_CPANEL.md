# Deploying Magic Frames to cPanel

Target for this guide:

| Setting            | Value                                               |
| ------------------ | --------------------------------------------------- |
| Domain             | `album-magicframes.nokkoo.in`                       |
| Doc root           | `/home/uddjzwrz/album-magicframes.nokkoo.in`        |
| Database name      | `uddjzwrz_albummagicframes`                         |
| cPanel user        | `uddjzwrz`                                          |

This is a **single-origin** deployment: the React SPA is served as static files
from the doc root, and the Laravel API runs under `/api` on the **same domain**.
No CORS configuration is needed.

```
Browser ──► album-magicframes.nokkoo.in
              ├── /api/*   ──► Laravel (PHP)
              └── /*       ──► React SPA (index.html)
```

> ⚠️ **Rotate your database password.** It was shared in chat, so change it in
> **cPanel → MySQL® Databases → Current Users → Change Password** and use the new
> one in the `.env` below. The password only ever lives in the server `.env`
> (which is gitignored) — never in the repository.

---

## Prerequisites in cPanel

1. **PHP 8.3+** — set via **cPanel → Select PHP Version**. Enable extensions:
   `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`,
   `bcmath`, `fileinfo`, `curl`, `gd`, `zip`.
2. **Composer** — available on most cPanel hosts; if not, see "No SSH" note below.
3. **Database** — the DB `uddjzwrz_albummagicframes` already exists. Confirm the
   **DB user** and that it is **added to the database with ALL PRIVILEGES**
   (cPanel → MySQL Databases → "Add User To Database").

---

## Recommended folder layout

Keep the Laravel application **outside** the public doc root (so source, `.env`
and `vendor/` are never web-accessible). Only the compiled front controller and
the SPA live in the doc root.

```
/home/uddjzwrz/
├── laravel/album-magicframes/          ← Laravel app (git clone of backend/)
│   ├── app/ bootstrap/ config/ routes/ vendor/ storage/ ...
│   └── .env                       ← secrets live here only
└── album-magicframes.nokkoo.in/   ← DOC ROOT
    ├── index.php                  ← repointed front controller
    ├── .htaccess                  ← SPA + /api routing
    ├── index.html assets/ ...     ← React build output
    └── favicon.ico robots.txt     ← from Laravel public/
```

---

## Step 1 — Get the code onto the server

### With SSH (preferred)

```bash
cd ~
mkdir -p laravel
git clone -b feat/wedding-album-app https://github.com/importerbrocom/album-magicframes.git tmp-mf
mv tmp-mf/backend laravel/album-magicframes
# keep tmp-mf/frontend for building the SPA (Step 4)
```

### Without SSH

Download the repo ZIP from GitHub, upload via **cPanel → File Manager**, and
extract so that `backend/` ends up at `~/laravel/album-magicframes`.

---

## Step 2 — Install backend dependencies

With SSH:

```bash
cd ~/laravel/album-magicframes
composer install --no-dev --optimize-autoloader
```

**No SSH / no Composer on the host?** Run `composer install --no-dev
--optimize-autoloader` locally, then upload the resulting `vendor/` folder along
with the code. (Set your local PHP to 8.3/8.4 so the autoloader matches.)

---

## Step 3 — Configure the backend `.env`

```bash
cd ~/laravel/album-magicframes
cp deploy/cpanel/backend.env.example .env   # template prefilled for this domain
nano .env
```

Fill in:
- `DB_PASSWORD` — your (rotated) database password.
- Confirm `DB_USERNAME` (cPanel usually = DB name; verify under MySQL Databases).
- `ALBUM_TOKEN_SECRET` — run `php -r "echo bin2hex(random_bytes(32));"` and paste.

Then generate the app key and set up the database:

```bash
php artisan key:generate
php artisan migrate --force --seed      # --seed creates the admin + demo album
php artisan config:cache
php artisan route:cache
```

The seeder creates:
- **Admin login:** `admin@magicframes.test` / `password` — change this after first login.
- **Demo album:** `/album/rahul-anjali-demo01` (password `RA2026`) using demo images.

Make sure Laravel can write to its storage:

```bash
chmod -R 775 storage bootstrap/cache
```

---

## Step 4 — Build the React SPA

Build locally (needs Node 18+), then upload — most cPanel hosts don't run Node:

```bash
cd frontend
cp .env.production .env.production      # already set to VITE_API_URL=/api
npm ci
npm run build                           # outputs frontend/dist/
```

Upload the **contents of `frontend/dist/`** into the doc root
`/home/uddjzwrz/album-magicframes.nokkoo.in/` (so `index.html` sits at the doc
root, with `assets/` beside it).

> If your host has Node (via SSH or cPanel's "Setup Node.js App"), you can run
> the same `npm ci && npm run build` on the server instead.

---

## Step 5 — Wire up the doc root (front controller + routing)

Copy the two deploy files into the doc root:

```bash
cp ~/laravel/album-magicframes/deploy/cpanel/index.php          /home/uddjzwrz/album-magicframes.nokkoo.in/index.php
cp ~/laravel/album-magicframes/deploy/cpanel/htaccess-docroot.txt /home/uddjzwrz/album-magicframes.nokkoo.in/.htaccess
# Laravel's static public assets:
cp ~/laravel/album-magicframes/public/favicon.ico ~/laravel/album-magicframes/public/robots.txt /home/uddjzwrz/album-magicframes.nokkoo.in/
```

- `index.php` is a copy of Laravel's front controller with `$APP_BASE` pointing
  at `~/laravel/album-magicframes`. Edit that constant if you installed elsewhere.
- `.htaccess` forces HTTPS, routes `/api/*` and `/up` to Laravel, serves real
  files directly, and falls back to `index.html` for SPA routes.

---

## Step 6 — Background Drive sync

Album synchronization runs as a queued job. Pick ONE:

- **Cron worker (recommended)** — cPanel → Cron Jobs, every minute:
  ```
  /usr/local/bin/php /home/uddjzwrz/laravel/album-magicframes/artisan queue:work --stop-when-empty --tries=2 --timeout=600 >> /home/uddjzwrz/laravel/album-magicframes/storage/logs/worker.log 2>&1
  ```
  (Confirm the PHP binary path in cPanel → Select PHP Version → "command line".)

- **Inline** — simplest; no worker. In `.env` set `QUEUE_CONNECTION=sync`, then
  `php artisan config:cache`. Album creation will wait for the sync to finish.

---

## Step 7 — SSL and verify

1. **cPanel → SSL/TLS Status** → run **AutoSSL** for the subdomain (the
   `.htaccess` already forces HTTPS).
2. Smoke-test:
   ```bash
   curl -s https://album-magicframes.nokkoo.in/up          # Laravel health -> "OK"
   curl -s https://album-magicframes.nokkoo.in/api/public/albums/rahul-anjali-demo01/landing
   ```
3. In a browser:
   - **Admin:** `https://album-magicframes.nokkoo.in/admin/login`
   - **Demo album:** `https://album-magicframes.nokkoo.in/album/rahul-anjali-demo01` (password `RA2026`)

---

## Step 8 — Go live with real Google Drive

In `~/laravel/album-magicframes/.env`:

- **API-key mode** (folders shared "anyone with the link can view"):
  ```
  GOOGLE_DRIVE_AUTH_MODE=api_key
  GOOGLE_DRIVE_API_KEY=your-key
  DRIVE_DEMO_MODE=false
  ```
- **OAuth mode** (connected account, reads private folders):
  ```
  GOOGLE_DRIVE_AUTH_MODE=oauth
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  GOOGLE_REFRESH_TOKEN=...
  DRIVE_DEMO_MODE=false
  ```

Then `php artisan config:cache`. Create a real album in the admin panel and press
**Sync Now**.

---

## Redeploying later

```bash
# backend
cd ~/laravel/album-magicframes && git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache

# frontend (build locally, re-upload dist/ into the doc root)
cd frontend && npm ci && npm run build
```

---

## Automated deployment

Two helpers are included to make this repeatable.

### A. Server-side setup script (`deploy/cpanel/setup.sh`)

After the app code and `.env` are on the server, this script wires the doc root,
sets permissions, runs migrations and caches config/routes. It is idempotent —
run it for first deploy and every redeploy.

```bash
cd ~/laravel/album-magicframes
# first deploy (also seeds the admin + demo album):
SEED=1 bash deploy/cpanel/setup.sh
# later redeploys:
bash deploy/cpanel/setup.sh
# if your PHP CLI isn't just "php":
PHP_BIN=/usr/local/bin/ea-php83 bash deploy/cpanel/setup.sh
```

It auto-detects `APP_BASE` and defaults `DOC_ROOT` to
`~/album-magicframes.nokkoo.in`; override either via env vars if your paths
differ. You still upload the React `dist/` into the doc root (Step 4) — the
script handles everything else.

### B. GitHub Actions CI/CD (`.github/workflows/deploy-cpanel.yml`)

On every push to `main` (or this feature branch) the workflow:

1. Installs backend deps (`composer install --no-dev`) and builds the SPA.
2. Assembles an upload-ready `release/` bundle (`release/app/` = Laravel app,
   `release/docroot/` = SPA + front controller + `.htaccess`) and uploads it as
   a downloadable CI artifact.
3. **Optionally** deploys over FTPS — but only if you opt in.

The build always runs; the deploy step is gated so it never fails without
credentials. To enable automatic FTPS deploys, in the GitHub repo:

- **Settings → Secrets and variables → Actions → Secrets:**
  `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (a cPanel FTP account).
- **Settings → Secrets and variables → Actions → Variables:**
  `DEPLOY_ENABLED = true`.

The deploy pushes `release/docroot/` → `/album-magicframes.nokkoo.in/` and
`release/app/` → `/laravel/album-magicframes/` (never touching the server `.env` or
local DB). Because FTP can't run PHP, finish each deploy by running
`bash deploy/cpanel/setup.sh` (or at least `php artisan migrate --force &&
php artisan config:cache`) via cPanel Terminal / cron.

> Prefer not to store FTP credentials in GitHub? Leave `DEPLOY_ENABLED` unset,
> download the `magicframes-release` artifact from the Actions run, and upload
> the two folders through cPanel File Manager.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| 500 on every page | Check `~/laravel/album-magicframes/storage/logs/laravel.log`; ensure `storage` and `bootstrap/cache` are writable (775) and `$APP_BASE` in doc-root `index.php` is correct. |
| API 404 / returns the SPA HTML | `.htaccess` not applied or `mod_rewrite` off — confirm the doc-root `.htaccess` is present and the `/api/` rule precedes the SPA fallback. |
| DB connection refused | Verify `DB_USERNAME`/`DB_PASSWORD` and that the user is attached to the DB with privileges. |
| Config changes ignored | Re-run `php artisan config:cache` (and `php artisan config:clear` if needed). |
| Album stuck "syncing" | No queue worker running — set up the Step 6 cron, or switch to `QUEUE_CONNECTION=sync`. |
```
