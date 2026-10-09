import { usePageMeta } from '../hooks/usePageMeta';

/**
 * Google Drive connection status / instructions. The actual API credentials
 * live only on the Laravel backend (never in this SPA).
 */
export default function GoogleDrive() {
  usePageMeta({ title: 'Google Drive | Admin' });
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">Google Drive</h1>

      <div className="themed-surface p-6">
        <h2 className="font-heading mb-2 text-xl">How albums get their photos</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Photos are never uploaded to Magic Frames. Each album points at a Google Drive folder, and
          the backend reads its event sub-folders and images through the Google Drive API.
        </p>

        <ol className="mt-4 space-y-2 text-sm">
          <li>1. Organize the shoot in Drive: top-level folders become <strong>events</strong>, their sub-folders become <strong>folders/categories</strong>.</li>
          <li>2. Either connect a Google account (OAuth) on the server, or share the folder so it is link-readable.</li>
          <li>3. Create an album with the folder link — synchronization runs in the background.</li>
          <li>4. Add or remove photos in Drive anytime, then press <strong>Sync Now</strong> on the album.</li>
        </ol>

        <div className="mt-6 rounded-lg bg-black/5 p-4 text-sm">
          <p className="font-medium">Server configuration (backend .env)</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs" style={{ color: 'var(--muted)' }}>
{`GOOGLE_DRIVE_AUTH_MODE=api_key   # or "oauth"
GOOGLE_DRIVE_API_KEY=...          # for public-shared folders
GOOGLE_CLIENT_ID=...              # for OAuth connected account
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...`}
          </pre>
        </div>

        <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
          If a folder can't be read you'll see a clear message like “Google Drive folder cannot be
          accessed” when creating or syncing an album.
        </p>
      </div>
    </div>
  );
}
