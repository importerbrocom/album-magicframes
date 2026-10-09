#!/usr/bin/env bash
# =============================================================================
# Magic Frames — cPanel server-side setup / redeploy script
#
# Run this on the server (via SSH or cPanel Terminal) AFTER:
#   1. the Laravel app is at  $APP_BASE  (git clone of backend/)
#   2. ~/laravel/album-magicframes/.env is filled in (see deploy/cpanel/backend.env.example)
#   3. the React build output (frontend/dist/*) has been placed/uploaded somewhere
#      (either $APP_BASE/public is NOT used here — the SPA goes to the doc root)
#
# Usage:
#   cd ~/laravel/album-magicframes
#   bash deploy/cpanel/setup.sh                 # full setup / redeploy
#   PHP_BIN=/usr/local/bin/ea-php83 bash deploy/cpanel/setup.sh
#
# Environment overrides (all optional — sensible cPanel defaults assumed):
#   APP_BASE   Laravel app root        (default: this script's ../../.. )
#   DOC_ROOT   public doc root         (default: ~/album-magicframes.nokkoo.in)
#   PHP_BIN    PHP CLI binary          (default: php)
#   SEED       run db seeder (1/0)     (default: 0 — set 1 on first deploy)
# =============================================================================
set -euo pipefail

# --- Resolve paths ---------------------------------------------------------
# This script lives at <repo>/deploy/cpanel/setup.sh. The Laravel app is at
# <repo>/backend and the built SPA at <repo>/frontend/dist.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_BASE="${APP_BASE:-$REPO_ROOT/backend}"
DOC_ROOT="${DOC_ROOT:-$HOME/album-magicframes.nokkoo.in}"
PHP_BIN="${PHP_BIN:-php}"
SEED="${SEED:-0}"

echo "==> Magic Frames cPanel setup"
echo "    APP_BASE = $APP_BASE"
echo "    DOC_ROOT = $DOC_ROOT"
echo "    PHP_BIN  = $PHP_BIN"
echo

# --- Sanity checks ---------------------------------------------------------
[ -f "$APP_BASE/artisan" ]   || { echo "ERROR: $APP_BASE/artisan not found. Is APP_BASE correct?"; exit 1; }
[ -f "$APP_BASE/.env" ]      || { echo "ERROR: $APP_BASE/.env missing. Copy deploy/cpanel/backend.env.example to .env and fill it in."; exit 1; }
[ -d "$DOC_ROOT" ]           || { echo "ERROR: DOC_ROOT $DOC_ROOT does not exist."; exit 1; }

cd "$APP_BASE"

# --- Composer deps (skip if vendor/ already uploaded) ----------------------
if [ ! -d vendor ]; then
  if command -v composer >/dev/null 2>&1; then
    echo "==> composer install"
    composer install --no-dev --optimize-autoloader
  else
    echo "ERROR: vendor/ missing and composer not available. Run composer install locally and upload vendor/."
    exit 1
  fi
fi

# --- App key (only if not set) ---------------------------------------------
if ! grep -q '^APP_KEY=base64:' .env; then
  echo "==> Generating APP_KEY"
  "$PHP_BIN" artisan key:generate --force
fi

# --- Album token secret guard ---------------------------------------------
if grep -q '^ALBUM_TOKEN_SECRET=$' .env; then
  echo "!!  WARNING: ALBUM_TOKEN_SECRET is empty in .env."
  echo "    Set it with:  php -r \"echo bin2hex(random_bytes(32));\"  then re-run."
fi

# --- Permissions -----------------------------------------------------------
echo "==> Setting storage permissions"
chmod -R 775 storage bootstrap/cache || true

# --- Database migrations ---------------------------------------------------
echo "==> Running migrations"
if [ "$SEED" = "1" ]; then
  "$PHP_BIN" artisan migrate --force --seed
else
  "$PHP_BIN" artisan migrate --force
fi

# --- Deploy the React SPA into the doc root --------------------------------
# Prefer a freshly built frontend/dist (if Node is available / was built), else
# fall back to the prebuilt bundle committed at deploy/cpanel/spa-dist.
SPA_SRC=""
if [ -d "$REPO_ROOT/frontend/dist" ]; then
  SPA_SRC="$REPO_ROOT/frontend/dist"
elif [ -d "$SCRIPT_DIR/spa-dist" ]; then
  SPA_SRC="$SCRIPT_DIR/spa-dist"
fi
if [ -n "$SPA_SRC" ]; then
  echo "==> Deploying SPA from $SPA_SRC"
  cp -r "$SPA_SRC"/. "$DOC_ROOT/"
else
  echo "!!  No SPA build found. Upload frontend/dist/ contents into $DOC_ROOT manually."
fi

# --- Wire up the doc root (front controller + routing + static assets) -----
echo "==> Installing doc-root front controller and .htaccess"
cp "$SCRIPT_DIR/index.php"             "$DOC_ROOT/index.php"
cp "$SCRIPT_DIR/htaccess-docroot.txt"  "$DOC_ROOT/.htaccess"
[ -f "$APP_BASE/public/favicon.ico" ] && cp "$APP_BASE/public/favicon.ico" "$DOC_ROOT/" || true
[ -f "$APP_BASE/public/robots.txt" ]  && cp "$APP_BASE/public/robots.txt"  "$DOC_ROOT/" || true

# The doc-root index.php hardcodes $APP_BASE = /home/<user>/laravel/album-magicframes/backend.
# If APP_BASE differs, patch the copy so it points at the real location.
if [ "$APP_BASE" != "/home/uddjzwrz/laravel/album-magicframes/backend" ]; then
  echo "==> Patching \$APP_BASE in doc-root index.php -> $APP_BASE"
  "$PHP_BIN" -r '$f=$argv[1];$b=$argv[2];$s=file_get_contents($f);$s=preg_replace("#\\\$APP_BASE = .*;#","\$APP_BASE = ".var_export($b,true).";",$s,1);file_put_contents($f,$s);' "$DOC_ROOT/index.php" "$APP_BASE"
fi

# --- Caches ----------------------------------------------------------------
echo "==> Caching config and routes"
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache

echo
echo "==> Done."
echo "    SPA build: upload the contents of frontend/dist/ into $DOC_ROOT"
echo "    Verify:    https://album-magicframes.nokkoo.in/up"
echo "               https://album-magicframes.nokkoo.in/admin/login"
