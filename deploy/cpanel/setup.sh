#!/usr/bin/env bash
#
# Magic Frames — cPanel one-command deploy.
#
# Run from the repo root after pulling the latest code:
#
#     cd ~/laravel/album-magicframes
#     git pull
#     bash deploy/cpanel/setup.sh
#
# What it does (idempotent — safe to re-run):
#   1. Detects the right PHP CLI (PHP 8.2+ required).
#   2. Backs up the production database (mysqldump) unless SKIP_DB_BACKUP=1.
#   3. composer install (no-dev, optimized).
#   4. php artisan migrate --force   (additive migrations only).
#   5. Seeds roles + permission catalogue (RolePermissionSeeder, idempotent).
#   6. Backfills role_id for any pre-existing users from their string role.
#   7. php artisan storage:link      (backend public disk symlink).
#   8. Ensures the DOC ROOT /storage symlink exists (serves uploaded avatars).
#   9. Rebuilds config + route caches.
#  10. Builds the React SPA and copies it into the doc root WITHOUT clobbering
#      index.php, the storage symlink, php.ini, cgi-bin, robots.txt, logos, etc.
#
# Configurable via environment variables (sensible defaults for this host):
#   DOC_ROOT          Web doc root           (default: ~/album-magicframes.nokkoo.in)
#   PHP_BIN           PHP CLI to use          (default: auto-detected)
#   SKIP_DB_BACKUP=1  Skip the mysqldump step
#   SKIP_FRONTEND=1   Skip the npm build + SPA copy (backend-only deploy)
#   SKIP_COMPOSER=1   Skip composer install
#
set -euo pipefail

# --- Resolve locations ------------------------------------------------------
# Repo root = two levels up from this script (deploy/cpanel/setup.sh).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND="$REPO_ROOT/backend"
FRONTEND="$REPO_ROOT/frontend"
DOC_ROOT="${DOC_ROOT:-$HOME/album-magicframes.nokkoo.in}"

BOLD=$'\033[1m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; NC=$'\033[0m'
step() { echo "${BOLD}${GREEN}==>${NC} ${BOLD}$*${NC}"; }
warn() { echo "${YELLOW}[warn]${NC} $*"; }
die()  { echo "${RED}[error]${NC} $*" >&2; exit 1; }

[ -f "$BACKEND/artisan" ] || die "Laravel app not found at $BACKEND (artisan missing). Run from the repo root."

# --- 1. Detect a PHP 8.2+ CLI ----------------------------------------------
detect_php() {
    if [ -n "${PHP_BIN:-}" ]; then echo "$PHP_BIN"; return; fi
    # Prefer explicit cPanel EasyApache binaries, newest first, then plain php.
    for cand in ea-php84 ea-php83 ea-php82 php84 php83 php82 php8.4 php8.3 php8.2 php; do
        if command -v "$cand" >/dev/null 2>&1; then
            ver="$("$cand" -r 'echo PHP_VERSION_ID;' 2>/dev/null || echo 0)"
            if [ "$ver" -ge 80200 ] 2>/dev/null; then echo "$cand"; return; fi
        fi
    done
    return 1
}
PHP_BIN="$(detect_php)" || die "No PHP 8.2+ CLI found. Set PHP_BIN=/path/to/php and re-run."
step "Using PHP: $PHP_BIN ($("$PHP_BIN" -r 'echo PHP_VERSION;'))"

# Composer: prefer a global binary, else look for composer.phar in the backend.
COMPOSER_CMD=""
if command -v composer >/dev/null 2>&1; then
    COMPOSER_CMD="$PHP_BIN $(command -v composer)"
elif [ -f "$BACKEND/composer.phar" ]; then
    COMPOSER_CMD="$PHP_BIN $BACKEND/composer.phar"
fi

cd "$BACKEND"

# --- 2. Database backup -----------------------------------------------------
if [ "${SKIP_DB_BACKUP:-0}" != "1" ]; then
    step "Backing up the production database"
    # Read DB creds straight from .env (no extra config needed).
    get_env() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
    DB_CONN="$(get_env DB_CONNECTION)"
    if [ "$DB_CONN" = "mysql" ] || [ "$DB_CONN" = "mariadb" ]; then
        DB_DATABASE="$(get_env DB_DATABASE)"; DB_USERNAME="$(get_env DB_USERNAME)"
        DB_PASSWORD="$(get_env DB_PASSWORD)"; DB_HOST="$(get_env DB_HOST)"; DB_PORT="$(get_env DB_PORT)"
        BACKUP_FILE="$HOME/mf-db-backup-$(date +%Y%m%d-%H%M%S).sql"
        if command -v mysqldump >/dev/null 2>&1 && [ -n "$DB_DATABASE" ]; then
            MYSQL_PWD="$DB_PASSWORD" mysqldump \
                -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" \
                --single-transaction --quick --no-tablespaces "$DB_DATABASE" > "$BACKUP_FILE" \
                && step "Database backed up to $BACKUP_FILE" \
                || warn "mysqldump failed — review before continuing (or set SKIP_DB_BACKUP=1 if you backed up elsewhere)."
        else
            warn "mysqldump not available or DB_DATABASE empty — skipping automatic backup."
            warn "Take a manual backup (cPanel > Backup / phpMyAdmin) before proceeding."
        fi
    else
        warn "DB_CONNECTION='$DB_CONN' (not mysql/mariadb) — skipping mysqldump. Back up manually if needed."
    fi
else
    warn "SKIP_DB_BACKUP=1 set — skipping database backup."
fi

# --- 3. Composer install ----------------------------------------------------
if [ "${SKIP_COMPOSER:-0}" != "1" ]; then
    if [ -n "$COMPOSER_CMD" ]; then
        step "Installing PHP dependencies (composer install --no-dev)"
        $COMPOSER_CMD install --no-dev --optimize-autoloader --no-interaction
    else
        warn "Composer not found — skipping. Ensure vendor/ is up to date manually."
    fi
else
    warn "SKIP_COMPOSER=1 set — skipping composer install."
fi

# --- 4. Migrations ----------------------------------------------------------
step "Running database migrations"
"$PHP_BIN" artisan migrate --force

# --- 5. Seed roles + permissions (idempotent) -------------------------------
step "Seeding roles & permission catalogue"
"$PHP_BIN" artisan db:seed --class=RolePermissionSeeder --force

# --- 6. Backfill role_id for pre-existing users -----------------------------
step "Backfilling role_id for existing users"
"$PHP_BIN" artisan tinker --execute="App\Models\User::whereNull('role_id')->get()->each(function(\$u){ \$r = App\Models\Role::where('slug', \$u->role)->first(); if(\$r){ \$u->forceFill(['role_id'=>\$r->id])->save(); } });" \
    || warn "role_id backfill skipped/failed (non-fatal — super_admin works without it)."

# --- 7. Backend storage:link ------------------------------------------------
step "Ensuring backend storage symlink (public disk)"
"$PHP_BIN" artisan storage:link 2>/dev/null || warn "storage:link already exists or could not be (re)created."

# --- 8. Doc-root /storage symlink (serves uploaded avatars) -----------------
step "Ensuring doc-root /storage symlink"
TARGET="$BACKEND/storage/app/public"
LINK="$DOC_ROOT/storage"
if [ -L "$LINK" ]; then
    CUR="$(readlink "$LINK")"
    [ "$CUR" = "$TARGET" ] && echo "   ok: $LINK -> $CUR" || warn "   $LINK points to $CUR (expected $TARGET)"
elif [ -e "$LINK" ]; then
    warn "   $LINK exists and is NOT a symlink — leaving it untouched. Fix manually if avatars 404."
else
    ln -s "$TARGET" "$LINK" && echo "   created: $LINK -> $TARGET"
fi

# --- 9. Rebuild caches ------------------------------------------------------
step "Rebuilding config & route caches"
"$PHP_BIN" artisan config:clear >/dev/null
"$PHP_BIN" artisan route:clear  >/dev/null
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache

# --- 10. Build + deploy the SPA (safe copy) ---------------------------------
if [ "${SKIP_FRONTEND:-0}" != "1" ]; then
    if command -v npm >/dev/null 2>&1; then
        step "Building the React SPA"
        ( cd "$FRONTEND" && (npm ci || npm install) && npm run build )

        DIST="$FRONTEND/dist"
        [ -d "$DIST" ] || die "Frontend build produced no dist/ at $DIST"

        step "Deploying SPA into $DOC_ROOT (preserving server files)"
        mkdir -p "$DOC_ROOT/assets"
        # Replace only the hashed bundle dir + entry files; NEVER the whole docroot.
        rm -rf "$DOC_ROOT/assets"/*
        cp -r "$DIST/assets/." "$DOC_ROOT/assets/"
        cp "$DIST/index.html" "$DOC_ROOT/index.html"
        # Copy build-managed static files if present (don't fail if absent).
        for f in manifest.webmanifest favicon.ico favicon.svg robots.txt; do
            [ -f "$DIST/$f" ] && cp "$DIST/$f" "$DOC_ROOT/$f" || true
        done
        echo "   SPA deployed. (index.php, storage, php.ini, cgi-bin left intact.)"
    else
        warn "npm not found — skipping frontend build. Build elsewhere and copy dist/assets + index.html into $DOC_ROOT."
    fi
else
    warn "SKIP_FRONTEND=1 set — skipping SPA build/deploy."
fi

echo
step "Deploy complete."
echo "   Smoke test:"
echo "     1. https://album-magicframes.nokkoo.in/admin/login  (admin login)"
echo "     2. Profile > upload avatar  (verifies /storage symlink end-to-end)"
echo "     3. Staff > add staff > copy temp credentials"
echo "     4. Log in as that staff > forced password change before dashboard"
