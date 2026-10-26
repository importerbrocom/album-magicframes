import { usePageMeta } from '../hooks/usePageMeta';

/**
 * Google Drive guidance for admins: how to organize a shoot in Drive and
 * connect it to an album via the folder link.
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
          its event sub-folders and images are read directly from Drive.
        </p>

        <ol className="mt-4 space-y-2 text-sm">
          <li>1. Organize the shoot in Drive: top-level folders become <strong>events</strong>, their sub-folders become <strong>folders/categories</strong>.</li>
          <li>2. Share the folder so it is link-readable (<em>Anyone with the link can view</em>), then copy the folder link.</li>
          <li>3. Create an album and paste the folder link — synchronization runs in the background.</li>
          <li>4. Add or remove photos in Drive anytime, then press <strong>Sync Now</strong> on the album.</li>
        </ol>

        <p className="mt-6 text-xs" style={{ color: 'var(--muted)' }}>
          If a folder can't be read you'll see a clear message like “Google Drive folder cannot be
          accessed” when creating or syncing an album. Make sure the folder's sharing is set to
          link-readable and the link points to the correct folder.
        </p>
      </div>
    </div>
  );
}
