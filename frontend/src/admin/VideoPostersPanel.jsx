import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

/**
 * Admin panel to set a per-video cover/thumbnail (poster) for each clip in the
 * album's Video Gallery folder. Leave blank to use the video's first frame.
 * Only shown when the album has a video-gallery folder configured.
 */
export default function VideoPostersPanel({ albumId, hasGallery }) {
  const [videos, setVideos] = useState(null);
  const [posters, setPosters] = useState({});
  const [state, setState] = useState('idle'); // idle | saving | saved | error

  useEffect(() => {
    if (!hasGallery) return;
    adminService.galleryVideos(albumId)
      .then((list) => {
        setVideos(list);
        setPosters(Object.fromEntries(list.map((v) => [v.id, v.poster || ''])));
      })
      .catch(() => setVideos([]));
  }, [albumId, hasGallery]);

  if (!hasGallery) return null;

  const save = async () => {
    setState('saving');
    try {
      await adminService.updateGalleryPosters(albumId, posters);
      setState('saved');
      setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('error');
    }
  };

  // Reorder a video up/down and persist the new order immediately.
  const move = async (index, dir) => {
    const next = [...videos];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setVideos(next);
    try {
      await adminService.updateGalleryOrder(albumId, next.map((v) => v.id));
    } catch {
      setState('error');
    }
  };

  return (
    <div className="themed-surface p-5">
      <h3 className="font-heading mb-1 text-xl">Video Gallery — Order &amp; Posters</h3>
      <p className="mb-4 text-xs" style={{ color: 'var(--muted)' }}>
        Reorder videos with ▲ ▼, and set a cover image per video (URL or Google Drive image link). Leave a poster blank to use the video’s first frame.
      </p>
      {videos === null ? (
        <div className="skeleton h-20 w-full rounded" />
      ) : videos.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No videos found in the gallery folder yet.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {videos.map((v, i) => (
              <li key={v.id} className="flex items-center gap-3">
                {/* Reorder controls */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="px-1 text-sm leading-none disabled:opacity-25"
                  >▲</button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === videos.length - 1}
                    aria-label="Move down"
                    className="px-1 text-sm leading-none disabled:opacity-25"
                  >▼</button>
                </div>
                <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-black/10">
                  {posters[v.id] && !posters[v.id].includes('drive.google.com') && (
                    <img src={posters[v.id]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate text-sm font-medium">
                    <span style={{ color: 'var(--muted)' }}>{i + 1}.</span> {v.name}
                  </p>
                  <input
                    value={posters[v.id] ?? ''}
                    onChange={(e) => setPosters((p) => ({ ...p, [v.id]: e.target.value }))}
                    placeholder="Poster image URL / Google Drive image link"
                    className="w-full rounded-lg border border-black/15 px-3 py-1.5 text-sm focus:outline-none"
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>Use ▲ ▼ to reorder — the order saves automatically.</p>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={save} disabled={state === 'saving'} className="btn-accent !rounded-lg text-xs disabled:opacity-40">
              {state === 'saving' ? 'Saving…' : 'Save Posters'}
            </button>
            {state === 'saved' && <span className="text-xs text-green-600">Saved ✓</span>}
            {state === 'error' && <span className="text-xs text-red-600">Save failed</span>}
          </div>
        </>
      )}
    </div>
  );
}
