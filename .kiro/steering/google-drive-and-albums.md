# Google Drive, Downloads & Album Passwords

How the album's Drive-backed features work and the failure modes seen in
production. Read this before changing Drive auth, sync, downloads or album
passwords. Deploy mechanics are in `deployment.md`.

## Google Drive auth

- Config: `backend/config/services.php` → `google_drive.*`, set in
  **`~/laravel/album-magicframes/backend/.env`** (not the repo-root `.env`).
  - `GOOGLE_DRIVE_AUTH_MODE=oauth` (or `api_key`, which only works for
    publicly shared folders).
  - OAuth needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and
    `GOOGLE_REFRESH_TOKEN`. The token must be issued for that exact client.
  - Scope: `https://www.googleapis.com/auth/drive.readonly`.
- The access token is cached for 50 minutes under the cache key
  `gdrive.access_token`. After changing `.env`, run `config:clear` **and**
  `cache:clear`, or the old token/config keeps being used.

### Known incident: "Unable to connect to Google Drive"

- **Cause:** the Google Cloud OAuth consent screen is in **Testing** mode.
  Google revokes Testing-mode refresh tokens **7 days** after they are issued,
  so sync, thumbnails and downloads all stop about a week after a new token.
- **Fix now:** create a new refresh token in the OAuth Playground
  (https://developers.google.com/oauthplayground, gear icon → "Use your own
  OAuth credentials"; add `https://developers.google.com/oauthplayground` as
  an authorized redirect URI; the signing-in account must be listed as a test
  user). Put it in `backend/.env`, then clear the config and cache.
- **Permanent fix:** click **Publish app** on the consent screen ("In
  production"). Verification is not needed for the owner's own account.
- `GoogleDriveService::accessToken()` maps OAuth `invalid_grant` and
  `invalid_client` to specific admin messages. `SyncAlbumFromGoogleDrive`
  appends a redacted technical reason in `[...]` to `sync_message`. Keep
  redacting `key=`, `access_token=`, `refresh_token=`, `client_secret=` and
  `Bearer` values; never put credentials in `sync_message` or logs.
- `rawRequest()` catches `BadResponseException` (4xx and 5xx) and retries
  429/5xx and 403 `rateLimitExceeded` with exponential backoff. Don't narrow
  it back to `ClientException`; that skipped retries for Google 5xx.

## Photo downloads

- Flow: the frontend calls `albumService.downloadPhoto()`, which POSTs
  `/api/public/albums/{slug}/photos/{id}/download-link` (bearer album token).
  The backend returns a relative **10-minute signed URL** for
  `public.photos.file`, and the browser downloads it natively with
  `<a download>`. This avoids holding large originals in memory, which failed
  on mobile.
- The `/file` route uses the `signed:relative` middleware, so it needs no
  bearer header. It re-checks `allow_download` and that the photo is available.
- Fallback: the old blob download via `/download` (bearer). Blob URLs are
  revoked after 60 seconds, not immediately; revoking at once cancels the save
  in Safari and Firefox.
- Demo albums return `{url}`; the signed route redirects to it.
- The stream response sends `Content-Length`, an RFC 5987 `filename*`, and
  `X-Accel-Buffering: no`, and flushes output buffers while streaming.
- Downloads depend on working Drive auth. A Drive outage looks like "download
  not happening".

## Album passwords

- `albums.password_hash` (bcrypt) is what verifies visitors. It cannot be
  reversed.
- `albums.password_encrypted` (nullable, `Crypt::encryptString` with
  APP_KEY) is an admin-viewable copy. Always set passwords via
  `Album::setPlainPassword()`, which writes both fields and skips the copy if
  the column is missing.
- `current_password` is returned **only** by `AdminAlbumResource` on the
  single-album `show` endpoint (`withViewablePassword = true`), never in
  lists or public payloads.
- Albums whose password was set before this feature show "Not available"
  until the password is saved again in Edit Album. Rotating `APP_KEY` makes
  every stored copy unreadable; the method returns null instead of failing.

## Admin login

- Seeder default: `admin@magicframes.test` / `password` (change after first
  login). Reset a password with `php artisan tinker` against `App\Models\User`.
  Never re-run `db:seed` on production; it recreates the demo album.
