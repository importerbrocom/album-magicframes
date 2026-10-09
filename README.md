# Magic Frames — Digital Wedding Photo Album

A production-ready, **mobile-first digital wedding photo album**. Photographers
create password-protected albums from an admin panel; clients open a private
shareable link, enter a password, and browse their memories in a premium gallery.

> This is **not** a photo-printing app and **not** a file manager. Photos live in
> the photographer's **Google Drive** and are read dynamically through the Drive
> API — they are never re-uploaded into app storage. Clients never see Drive.

```
React (SPA)  ──►  Laravel API  ──►  GoogleDriveService  ──►  Google Drive API
```

Google credentials live **only** in the Laravel backend. The React app never
touches them.

---

## Monorepo layout

```
album-magicframes/
├── backend/     Laravel 11 REST API (admin + public), queues, Drive sync
└── frontend/    React + Vite SPA (public album + admin panel)
```

---

## Tech stack

**Backend:** Laravel 11, PHP 8.3+, REST API, MySQL/MariaDB (SQLite for dev),
Laravel Sanctum (admin auth), queued jobs (Drive sync), cache, Firebase JWT
(album access tokens), endroid/qr-code.

**Frontend:** React 19, Vite, React Router, Axios, Tailwind CSS, mobile-first,
IntersectionObserver lazy loading, PWA manifest.

---

## Features

- **Admin:** Sanctum login, dashboard, albums CRUD, create wizard (with share +
  QR), background Drive sync with live progress, analytics, 6 themes, RBAC-ready
  policies.
- **Public album:** cover/password screen → events → folders → gallery →
  full-screen viewer. Masonry / Grid / Filmstrip / Story / Slideshow layouts,
  swipe + keyboard navigation, zoom, favorites (localStorage), share (WhatsApp /
  copy / email / QR), optional downloads.
- **Google Drive:** auto-detects event folders and nested photo folders (no
  hard-coded event names), handles pagination, rate limits, inaccessible folders
  and deleted files; de-dupes by Drive file id.
- **Security:** hashed album passwords, album-scoped 24h access tokens (one album
  can never reach another), unpredictable slugs, rate limiting, authorization
  policies, friendly error messages, `noindex` on private pages.

---

## Google Drive folder model

Top-level folders become **events**; their sub-folders become **folders**;
images inside become **photos**. Example:

```
ROOT ALBUM FOLDER
  Wedding/        → event
    Bride Portraits/   → folder
    Ceremony/          → folder
  Engagement/     → event
    Couple/
  Haldi/  Mehendi/  Sangeet/  Reception/
```

Add a new folder in Drive (e.g. `Post Wedding`) and press **Sync Now** — it
appears automatically as a new event.

---

## Quick start (local development)

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env            # if not already present
php artisan key:generate

# Album token secret:
php -r "echo bin2hex(random_bytes(32));"   # paste into ALBUM_TOKEN_SECRET

# Dev DB (SQLite, zero-config):
#   set DB_CONNECTION=sqlite in .env, then:
touch database/database.sqlite

php artisan migrate --seed      # creates admin + a demo album
php artisan serve               # http://127.0.0.1:8000
```

The seeder creates:
- **Admin:** `admin@magicframes.test` / `password`
- **Demo album:** `/album/rahul-anjali-demo01`, password `RA2026`

> **Demo mode:** with `DRIVE_DEMO_MODE=true` and no Drive credentials, syncs use
> local fixture data (public placeholder images) so you can explore the whole app
> without a Google account. Clearly separated from real Drive data; set to
> `false` in production.

If `QUEUE_CONNECTION=database`, run a worker so Drive syncs process in the
background:

```bash
php artisan queue:work
```

(Or set `QUEUE_CONNECTION=sync` to run jobs inline.)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

The dev server proxies `/api` to `http://127.0.0.1:8000` (see `vite.config.js`),
so no CORS setup is needed locally.

Open:
- Admin: http://localhost:5173/admin/login
- Album: http://localhost:5173/album/rahul-anjali-demo01  (password `RA2026`)

---

## Connecting a real Google Drive

Set these in `backend/.env`:

**API-key mode** (folders shared "anyone with the link can view"):
```
GOOGLE_DRIVE_AUTH_MODE=api_key
GOOGLE_DRIVE_API_KEY=your-key
DRIVE_DEMO_MODE=false
```

**OAuth mode** (a connected Google account; reads private folders):
```
GOOGLE_DRIVE_AUTH_MODE=oauth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...     # one-time consent with drive.readonly scope
DRIVE_DEMO_MODE=false
```

When a folder can't be read, the API returns a clear message
("The selected Google Drive folder is not accessible…") instead of a raw error.

---

## API overview

**Admin (Sanctum bearer token):**
```
POST   /api/admin/login
GET    /api/admin/me
POST   /api/admin/logout
GET    /api/admin/dashboard
GET    /api/admin/albums
POST   /api/admin/albums
GET    /api/admin/albums/{id}
PUT    /api/admin/albums/{id}
DELETE /api/admin/albums/{id}
POST   /api/admin/albums/{id}/sync
GET    /api/admin/albums/{id}/sync-status
GET    /api/admin/albums/{id}/analytics
GET    /api/admin/albums/{id}/share
```

**Public (album-scoped token after password verify):**
```
GET    /api/public/albums/{slug}/landing      (open)
POST   /api/public/albums/{slug}/verify       (open — issues 24h token)
GET    /api/public/albums/{slug}/qr           (open — QR PNG)
GET    /api/public/albums/{slug}
GET    /api/public/albums/{slug}/events
GET    /api/public/albums/{slug}/events/{event}
GET    /api/public/albums/{slug}/photos        (paginated)
GET    /api/public/albums/{slug}/photos/{id}
GET    /api/public/albums/{slug}/photos/{id}/download   (authorized proxy)
POST   /api/public/albums/{slug}/analytics
```

---

## Database schema

`albums`, `events` (self-nesting), `folders` (self-nesting), `photos`
(unique per `album_id` + `google_drive_file_id`), `analytics_events`.
Relationships: Album hasMany Events/Folders/Photos; Event hasMany Folders/Photos;
Folder hasMany Photos. See `backend/database/migrations`.

---

## Production deployment

### Backend (cPanel / VPS / cloud)

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env   # fill in real values (DB, Drive, token secret)
php artisan key:generate
php artisan migrate --force
php artisan config:cache && php artisan route:cache
```

- Point the web root at `backend/public`.
- Run the queue worker as a daemon (e.g. Supervisor):
  `php artisan queue:work --tries=2 --timeout=1800`
- Optional scheduler (if you add scheduled re-syncs) via cron:
  `* * * * * php /path/to/backend/artisan schedule:run >> /dev/null 2>&1`
- Set `APP_DEBUG=false`, configure CORS `FRONTEND_URL` to your SPA origin.

### Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_URL=https://api.yourdomain.com/api
npm ci
npm run build           # outputs to frontend/dist
```

Serve `frontend/dist` as a static SPA (any host / CDN). Ensure the host
rewrites unknown routes to `index.html` so client-side routing works. The app
can also be served by Laravel by copying `dist` into `backend/public`.

---

## Phasing

- **Phase 1 (done):** admin auth, create album, Drive integration, password
  access, auto event/photo detection, mobile gallery, full-screen viewer.
- **Phase 2 (done):** themes, downloads, sharing, QR, analytics, favorites.
- **Phase 3 (not built):** client favorite selection sharing, comments/likes,
  AI/face search, watermarking, custom domains, multi-photographer billing.
  Architecture (roles, `sort_order`, scoped tokens, service layer) is laid out
  so these can be added without rework.
```
