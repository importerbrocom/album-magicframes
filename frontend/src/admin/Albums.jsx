import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';
import { formatEventDate as fmtDate } from '../components/albumCopy';

const StatusPill = ({ status }) => {
  const map = {
    active: 'bg-green-100 text-green-700',
    disabled: 'bg-gray-200 text-gray-600',
    draft: 'bg-amber-100 text-amber-700',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${map[status] || ''}`}>{status}</span>;
};

export default function Albums() {
  const [albums, setAlbums] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  usePageMeta({ title: 'Albums | Magic Frames' });

  const load = () => adminService.albums({ q }).then((r) => setAlbums(r.data));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Category options derived from the loaded albums (no backend change needed).
  const categories = Array.from(
    new Set((albums || []).map((a) => (a.category || '').trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const visible = (albums || []).filter(
    (a) => !category || (a.category || '').trim() === category,
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold">Albums</h1>
        <Link to="/admin/albums/create" className="btn-accent !rounded-lg text-sm">+ New Album</Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by client or title…"
          className="w-full max-w-sm rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums === null && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="themed-surface h-56 skeleton" />
        ))}
        {visible.map((a) => (
          <Link key={a.id} to={`/admin/albums/${a.id}`} className="themed-surface overflow-hidden">
            <div className="h-32 w-full bg-black/10">
              {a.cover_image_url && <img src={a.cover_image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{a.client_name}</p>
                <StatusPill status={a.status} />
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{a.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {a.category && (
                  <span className="rounded-full border border-black/15 px-2 py-0.5 text-[11px] capitalize" style={{ color: 'var(--muted)' }}>
                    {a.category}
                  </span>
                )}
                {a.event_date && (
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{fmtDate(a.event_date)}</span>
                )}
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                {a.photo_count} photos · {a.event_count} events
              </p>
            </div>
          </Link>
        ))}
        {albums !== null && visible.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {category ? `No ${category} albums found.` : 'No albums found.'}
          </p>
        )}
      </div>
    </div>
  );
}
