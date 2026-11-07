# CRN / Leads integration (album enquiries -> magic.nokkoo.in)

Public-album enquiries are saved locally, then forwarded to the Leads board on
`https://magic.nokkoo.in` (a separate Laravel app on the same cPanel server).

## Album side (this repo)

- `backend/app/Services/CrnService.php::forward()` - builds payload, POSTs, and
  records `crn_status` (`sent`/`failed`/`skipped`) + `crn_response` on the enquiry.
- `backend/config/services.php` -> `crn` block, driven by env.
- `QUEUE_CONNECTION=sync`, so forwarding happens inside the request.
- Payload: `name, phone, email, notes, source, event_type`.
  - `notes` = enquiry message + `Album: <slug>` (Leads has no message/album field).
  - `source` must be one of `website|referral|social_media|walk_in|other`.
  - `event_type` is required by Leads (>=1 event); default `Enquiry`.
- Server `.env` lives at `~/laravel/album-magicframes/backend/.env` (NOT the
  repo-root `.env`; running artisan without `backend/` falls back to sqlite).

Required env (album):
```
CRN_ENDPOINT=https://magic.nokkoo.in/api/leads
CRN_SOURCE=website
CRN_EVENT_TYPE=Enquiry
CRN_TOKEN=<same value as LEADS_API_TOKEN on magic>
```

## magic.nokkoo.in side (NOT in this repo)

Installed by hand from `deploy/magic-nokkoo-leads-api/`:
- `app/Http/Controllers/Api/LeadApiController.php`
- `routes/api.php` (`POST /leads` -> `/api/leads`) and `api:` registered in `bootstrap/app.php`
- `config/services.php` -> `leads_api` { token, system_user_id }
- `.env`: `LEADS_API_TOKEN`, `LEADS_API_SYSTEM_USER_ID=1` (creator = Ashbin K)
- PHP CLI: `/opt/alt/php83/usr/bin/php`

Why a custom API route: the app's `POST /leads` is a web route (CSRF + login,
uses `auth()->id()`), so it cannot accept server-to-server calls.

## Admin management of enquiries

- Panel: `frontend/src/admin/AlbumDetail.jsx` (Enquiries card) shows the 10
  newest, each with a `CRN: sent|failed|skipped` badge and a **Delete** button
  (confirm dialog). Service call: `adminService.deleteEnquiry(albumId, id)`.
- Endpoint: `DELETE /admin/albums/{album}/enquiries/{enquiry}` ->
  `AlbumController@destroyEnquiry`, authorized with the album **`update`**
  policy (admin + owning staff), 404 if the enquiry is not on that album.
- Delete removes only the album's local copy. A lead already forwarded to
  magic.nokkoo.in is a separate record and is NOT deleted; clean those up on the
  Leads board directly.

## Hard-won rules (each one caused a real outage)

1. **Read the token via `config()`, never `env()`** in the magic controller.
   magic has `bootstrap/cache/config.php`; with a cached config `env()` returns
   null and every call gets 401.
2. **Create the lead inside `Lead::withoutEvents(...)`.** `LeadObserver::created()`
   sends a blocking WhatsApp message with no timeout, which made the web request
   hang until Cloudflare returned 522 (CLI did not show it). Side effect: album
   leads get no automatic welcome message.
3. After adding a new class on magic, run `composer dump-autoload -o` (the
   optimized autoloader otherwise gives "Target class does not exist" -> 500).
4. `.env` values must not be wrapped in `< >`; a duplicate bad line once made
   the token mismatch.
5. Do not reuse the `PhoneNumber` rule in the API controller; phone is validated
   with a self-contained regex.
6. 522 = origin timeout (Cloudflare); 401 = token/config; 404 = route not
   registered or wrong path; 422 = validation.

## Diagnose / re-forward

Last enquiries and their CRN result:
```
cd ~/laravel/album-magicframes && /opt/cpanel/ea-php74/root/usr/bin/php backend/artisan tinker --execute="foreach(\App\Models\Enquiry::latest()->take(3)->get() as \$e){ echo \$e->id.' | '.\$e->name.' | '.\$e->crn_status.' | '.\$e->crn_response.PHP_EOL; }"
```
Re-forward everything not sent:
```
cd ~/laravel/album-magicframes && /opt/cpanel/ea-php74/root/usr/bin/php backend/artisan tinker --execute="foreach(\App\Models\Enquiry::where('crn_status','!=','sent')->get() as \$e){ app(\App\Services\CrnService::class)->forward(\$e); echo \$e->id.': '.\$e->fresh()->crn_status.' | '.\$e->fresh()->crn_response.PHP_EOL; }"
```
After changing any `.env` on either app, run `config:clear` (or `config:cache`
on magic) with that app's own PHP binary.
