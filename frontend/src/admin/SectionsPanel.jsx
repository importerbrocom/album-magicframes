import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

/**
 * Admin panel to manually override each section's cover image and video.
 * Overrides win over the auto-detected cover photo / Drive-folder video; leave
 * a field blank to fall back to the automatic behaviour.
 */
export default function SectionsPanel({ albumId }) {
  const [sections, setSections] = useState(null);

  useEffect(() => {
    adminService.sections(albumId).then(setSections).catch(() => setSections([]));
  }, [albumId]);

  // Reorder a section up/down and persist the new order immediately.
  const move = async (index, dir) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try {
      await adminService.updateSectionsOrder(albumId, next.map((s) => s.id));
    } catch {
      /* non-fatal: UI already reordered; a refresh reflects server state */
    }
  };

  if (sections === null) return <div className="themed-surface p-5"><div className="skeleton h-24 w-full rounded" /></div>;

  return (
    <div className="themed-surface p-5">
      <h3 className="font-heading mb-1 text-xl">Sections</h3>
      <p className="mb-4 text-xs" style={{ color: 'var(--muted)' }}>
        Reorder with ▲ ▼ (saves automatically). Override a section’s cover or video — leave blank to use the auto-detected cover photo / Drive-folder video.
      </p>
      {sections.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No sections yet — run Sync Now first.</p>
      ) : (
        <ul className="space-y-4">
          {sections.map((s, i) => (
            <SectionRow
              key={s.id}
              albumId={albumId}
              section={s}
              index={i}
              count={sections.length}
              onMove={move}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionRow({ albumId, section, index, count, onMove }) {
  const [cover, setCover] = useState(section.cover_override || '');
  const [film, setFilm] = useState(section.film_url_override || '');
  const [state, setState] = useState('idle'); // idle | saving | saved | error

  const dirty = cover !== (section.cover_override || '') || film !== (section.film_url_override || '');

  const save = async () => {
    setState('saving');
    try {
      await adminService.updateSection(albumId, section.id, {
        cover_override: cover,
        film_url_override: film,
      });
      setState('saved');
      setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('error');
    }
  };

  const thumb = section.cover_override || section.cover_image_url;

  return (
    <li className="rounded-lg border border-black/10 p-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move up" className="px-1 text-sm leading-none disabled:opacity-25">▲</button>
          <button type="button" onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label="Move down" className="px-1 text-sm leading-none disabled:opacity-25">▼</button>
        </div>
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-black/10">
          {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium"><span style={{ color: 'var(--muted)' }}>{index + 1}.</span> {section.name}</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {section.photo_count} photos
            {section.film_drive_id ? ' · video auto-detected' : ''}
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          placeholder="Cover image URL (override)"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
        />
        <input
          value={film}
          onChange={(e) => setFilm(e.target.value)}
          placeholder="Video URL — YouTube / Vimeo / Drive / .mp4"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!dirty || state === 'saving'}
          className="btn-accent !rounded-lg text-xs disabled:opacity-40"
        >
          {state === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {state === 'saved' && <span className="text-xs text-green-600">Saved ✓</span>}
        {state === 'error' && <span className="text-xs text-red-600">Save failed</span>}
      </div>
    </li>
  );
}
