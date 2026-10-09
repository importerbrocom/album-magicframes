import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';

const Stat = ({ label, value }) => (
  <div className="themed-surface p-5">
    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</p>
    <p className="mt-1 text-3xl font-semibold">{(value ?? 0).toLocaleString()}</p>
  </div>
);

export default function Analytics() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [data, setData] = useState(null);
  usePageMeta({ title: 'Analytics | Admin' });

  useEffect(() => {
    adminService.album(id).then(setAlbum).catch(() => {});
    adminService.analytics(id).then(setData).catch(() => {});
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link to={`/admin/albums/${id}`} className="text-sm" style={{ color: 'var(--muted)' }}>‹ Back</Link>
      <h1 className="font-heading mb-1 mt-3 text-3xl font-semibold">Analytics</h1>
      {album && <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>{album.client_name} — {album.title}</p>}

      {!data ? (
        <div className="skeleton h-40 w-full rounded-xl" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total Views" value={data.total_views} />
            <Stat label="Unique Visitors" value={data.unique_visitors} />
            <Stat label="Photos Viewed" value={data.photos_viewed} />
            <Stat label="Downloads" value={data.downloads} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Stat label="Shares" value={data.shares} />
            <div className="themed-surface p-5">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Most Viewed Event</p>
              <p className="mt-1 text-xl font-medium">{data.most_viewed_event?.name || '—'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
