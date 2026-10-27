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

function AlbumCard({ a }) {
  return (
    <Link to={`/admin/albums/${a.id}`} className="themed-surface overflow-hidden">
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
  );
}

export default function Albums() {
  const [albums, setAlbums] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [grouped, setGrouped] = useState(false);
  usePageMeta({ title: 'Albums | Magic Frames' });

  // Load the full category list once (server-side distinct) for the filter.
  useEffect(() => {
    adminService.albumCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Fetch albums; category is filtered server-side so it scales past one page.
  useEffect(() => {
    const t = setTimeout(() => {
      const params = {};
      if (q) params.q = q;
      if (category) params.category = category;
      adminService.albums(params).then((r) => setAlbums(r.data)).catch(() => setAlbums([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, category]);

  // Build category -> albums groups (used when "Group by category" is on).
  const groups = (() => {
    const map = new Map();
    for (const a of albums || []) {
      const key = (a.category || '').trim() || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  })();

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
        {categories.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} />
            Group by category
          </label>
        )}
      </div>

      {albums === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="themed-surface h-56 skeleton" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {category ? `No ${category} albums found.` : 'No albums found.'}
        </p>
      ) : grouped ? (
        <div className="space-y-8">
          {groups.map(([name, items]) => (
            <section key={name}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-heading text-xl">{name}</h2>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{items.length}</span>
                <span className="h-px flex-1 bg-black/10" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => <AlbumCard key={a.id} a={a} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => <AlbumCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
