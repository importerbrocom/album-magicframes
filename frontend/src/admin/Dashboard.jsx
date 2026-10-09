import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';

const Stat = ({ label, value }) => (
  <div className="themed-surface p-5">
    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</p>
    <p className="mt-1 text-3xl font-semibold">{value}</p>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  usePageMeta({ title: 'Dashboard | Magic Frames' });

  useEffect(() => {
    adminService.dashboard().then(setData).catch(() => setData({ stats: {}, recent_albums: [] }));
  }, []);

  const s = data?.stats || {};

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
        <Link to="/admin/albums/create" className="btn-accent !rounded-lg text-sm">+ New Album</Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total Albums" value={s.total_albums ?? '—'} />
        <Stat label="Active" value={s.active_albums ?? '—'} />
        <Stat label="Photos" value={(s.total_photos ?? 0).toLocaleString()} />
        <Stat label="Album Views" value={(s.total_views ?? 0).toLocaleString()} />
      </div>

      <h2 className="font-heading mb-3 text-xl">Recent Albums</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.recent_albums || []).map((a) => (
          <Link key={a.id} to={`/admin/albums/${a.id}`} className="themed-surface overflow-hidden">
            <div className="h-32 w-full bg-black/10">
              {a.cover_image_url && <img src={a.cover_image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <p className="font-medium">{a.client_name}</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{a.title}</p>
              <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                {a.photo_count} photos · {a.event_count} events · <span className="capitalize">{a.sync_status}</span>
              </p>
            </div>
          </Link>
        ))}
        {data && data.recent_albums.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No albums yet. Create your first one.</p>
        )}
      </div>
    </div>
  );
}
