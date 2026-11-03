# magic.nokkoo.in — Leads API endpoint (for album enquiry forwarding)

These files add a **token-protected `POST /api/leads`** endpoint to the
`magic.nokkoo.in` Laravel app so the album site
(`album-magicframes.nokkoo.in`) can push enquiries into the Leads system.

Why a new endpoint instead of the existing `POST /leads`?
The existing route is a **web** route: it requires a CSRF token and a
logged-in session (`store()` calls `auth()->id()` and `$request->user()`).
An app-to-app call has neither, so it would be rejected with `419`/`500`.
This new API route authenticates with a shared secret header and attributes
the lead to a configured system user.

## What gets added

1. `app/Http/Controllers/Api/LeadApiController.php`  — the endpoint logic
2. A route line in `routes/api.php`                  — `POST /api/leads`
3. Two `.env` lines                                  — the shared secret + system user id
4. (maybe) register the API routes in `bootstrap/app.php` — only if not already

## Payload the album sends

```json
{
  "name":  "Jane Doe",
  "phone": "9876543210",
  "email": "jane@example.com",   // may be null
  "notes": "message text\n\nAlbum: some-album-slug",  // may be null
  "source": "website",
  "event_type": "Enquiry"
}
```

Header: `Authorization: Bearer <LEADS_API_TOKEN>`

## Install steps — run ON THE SERVER in ~/magic.nokkoo.in

See INSTALL.txt for the exact commands.
