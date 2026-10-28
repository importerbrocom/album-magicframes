# Deployment — cPanel + LiteSpeed (hard-won rules)

Target: `album-magicframes.nokkoo.in` on a cPanel host running **LiteSpeed**.
- Doc root: `/home/uddjzwrz/album-magicframes.nokkoo.in/`
- Laravel app: `/home/uddjzwrz/laravel/album-magicframes/backend/`
- PHP CLI: `/opt/cpanel/ea-php74/root/usr/bin/php`

Read this before touching deploy config — these rules encode real incidents.

## How the SPA is actually served (CRITICAL)

**This LiteSpeed vhost does NOT honor `.htaccess` RewriteRule SPA fallbacks.**
An explicit test rule at line 1 of `.htaccess` did not fire, yet `index.php`
(Laravel) IS always reached. So the SPA is served **through Laravel**:

- `.htaccess`: send every non-file request to `index.php`
  (`RewriteCond %{REQUEST_FILENAME} !-f` → `RewriteRule ^ index.php [L]`), plus
  `DirectoryIndex index.php index.html`.
- `deploy/cpanel/index.php`: calls `$app->usePublicPath(__DIR__)` so
  `public_path()` resolves to the doc root.
- `backend/routes/web.php`: `Route::fallback()` returns the doc-root
  `index.html` for any non-API path (resolves via `$_SERVER['DOCUMENT_ROOT']`
  fallbacks so it never 404s). `/api/*` matches `routes/api.php` first.

Do **not** reintroduce an HTTPS-redirect block or `!-d` condition in the SPA
rewrite — both broke deep routes on this LiteSpeed vhost.

## CI deploy rules (.github/workflows/deploy-cpanel.yml)

- **Manual only** (`workflow_dispatch` with `force_deploy=true`). Auto-deploy on
  push was removed because it fought manual deploys and reverted fixes.
- Doc-root FTP deploy runs with **`dangerous-clean-slate: false`**. Clean-slate
  deletes `.htaccess` (a dotfile the FTP action won't re-upload) → `/admin/*`
  404s. Keep it off.
- **Never** add a separate FTP pass with a control-files-only `local-dir`: the
  `SamKirkland/FTP-Deploy-Action` deletes remote files missing from its
  `local-dir`, which once wiped `index.html` and took the whole SPA down.
- The build job emits content-hashed chunks, so stale chunks are not a concern
  without clean-slate.

## Trigger + verify a deploy

```bash
# Trigger (from a machine with gh + repo access):
gh api -X POST repos/importerbrocom/album-magicframes/actions/workflows/deploy-cpanel.yml/dispatches \
  -f ref=main -f 'inputs[force_deploy]=true'
```

After deploy, on the cPanel terminal:

```bash
cd ~/laravel/album-magicframes && git checkout main && git pull origin main
/opt/cpanel/ea-php74/root/usr/bin/php backend/artisan migrate --force   # idempotent migrations
/opt/cpanel/ea-php74/root/usr/bin/php backend/artisan storage:link       # for avatars (/storage)
/opt/cpanel/ea-php74/root/usr/bin/php backend/artisan route:cache
/opt/cpanel/ea-php74/root/usr/bin/php backend/artisan config:cache
# Smoke test:
curl -s -o /dev/null -w "/ %{http_code}\n"            https://album-magicframes.nokkoo.in/
curl -s -o /dev/null -w "/admin/albums %{http_code}\n" https://album-magicframes.nokkoo.in/admin/albums
curl -s -o /dev/null -w "/api %{http_code}\n"          https://album-magicframes.nokkoo.in/api/public/albums/rahul-anjali-demo01/landing
```

Expected: `/` and `/admin/albums` → 200 (SPA), `/api/...` → 200 (JSON).

## If the whole site 404s

1. Is `index.html` present in the doc root? `ls -la ~/album-magicframes.nokkoo.in/index.html`
   — if missing, restore from the committed bundle:
   `cp deploy/cpanel/spa-dist/index.html ~/album-magicframes.nokkoo.in/ && cp -r deploy/cpanel/spa-dist/assets/. ~/album-magicframes.nokkoo.in/assets/`
2. Is `.htaccess` present? If not: `cp deploy/cpanel/htaccess-docroot.txt ~/album-magicframes.nokkoo.in/.htaccess`
3. Confirm `index.php` has `usePublicPath(__DIR__)` and web.php has the
   `Route::fallback`.

## Caching

- `index.html`/manifest are `no-cache`; hashed assets are `immutable`. When the
  Logo/favicon file changes, bump its `?v=` token so browsers refetch. There is
  no separate LiteSpeed page cache active for this vhost (a `.htaccess`
  `<IfModule LiteSpeed>CacheLookup off</IfModule>` block is present as a guard).

## Do NOT

- Do not run `npm run build` on the server — Rolldown panics there (resource
  limit). Build happens in CI.
- Do not re-enable `statefulApi()` in `bootstrap/app.php` — it caused CSRF
  mismatches on login (auth is bearer-token only).
