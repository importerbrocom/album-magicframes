import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';
import SharePanel from './SharePanel';

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [share, setShare] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const poll = useRef(null);

  usePageMeta({ title: album ? `${album.client_name} | Admin` : 'Album | Admin' });

  const loadAlbum = () => adminService.album(id).then(setAlbum);

  useEffect(() => {
    loadAlbum();
    adminService.share(id).then(setShare).catch(() => {});
    adminService.analytics(id).then(setAnalytics).catch(() => {});
    return () => clearInterval(poll.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll sync status while a sync is running.
  useEffect(() => {
    if (!album) return;
    const running = album.sync_status === 'pending' || album.sync_status === 'syncing';
    if (running && !poll.current) {
      poll.current = setInterval(async () => {
        const s = await adminService.syncStatus(id);
        setSyncing(s);
        if (s.sync_status === 'completed' || s.sync_status === 'failed') {
          clearInterval(poll.current);
          poll.current = null;
          loadAlbum();
        }
      }, 1500);
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.sync_status, id]);

  const triggerSync = async () => {
    await adminService.sync(id);
    setAlbum((a) => ({ ...a, sync_status: 'pending' }));
    setSyncing({ sync_status: 'pending', sync_progress: 0, sync_message: 'Queued…' });
  };

  const remove = async () => {
    if (!confirm('Delete this album permanently?')) return;
    await adminService.deleteAlbum(id);
    navigate('/admin/albums', { replace: true });
  };

  const toggleStatus = async () => {
    const next = album.status === 'active' ? 'disabled' : 'active';
    const updated = await adminService.updateAlbum(id, { status: next });
    setAlbum(updated);
  };

  if (!album) return <div className="skeleton h-96 w-full rounded-xl" />;

  const sync = syncing || {
    sync_status: album.sync_status,
    sync_progress: album.sync_progress,
    sync_message: album.sync_message,
  };
  const isSyncing = sync.sync_status === 'pending' || sync.sync_status === 'syncing';

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/albums" className="text-sm" style={{ color: 'var(--muted)' }}>‹ Back to albums</Link>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="themed-surface overflow-hidden md:col-span-2">
          <div className="h-48 w-full bg-black/10">
            {album.cover_image_url && <img src={album.cover_image_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-3xl">{album.client_name}</h1>
                <p className="text-lg" style={{ color: 'var(--muted)' }}>{album.title}</p>
              </div>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs capitalize">{album.status}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Meta label="Photos" value={album.photo_count} />
              <Meta label="Events" value={album.event_count} />
              <Meta label="Theme" value={album.theme} />
              <Meta label="Drive" value={album.drive_auth_mode === 'demo' ? 'Demo' : 'Connected'} />
            </div>
            <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
              Last synced: {album.last_synced_at ? new Date(album.last_synced_at).toLocaleString() : '—'}
            </p>

            {isSyncing && (
              <div className="mt-5 rounded-lg bg-black/5 p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Syncing album…</span>
                  <span>{sync.sync_progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                  <div className="h-full bg-charcoal transition-all" style={{ width: `${sync.sync_progress}%` }} />
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>{sync.sync_message}</p>
              </div>
            )}
            {sync.sync_status === 'failed' && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{sync.sync_message}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <a href={album.public_url} target="_blank" rel="noreferrer" className="btn-accent !rounded-lg text-sm">View Album</a>
              <button onClick={triggerSync} disabled={isSyncing} className="rounded-lg border border-black/15 px-4 py-2 text-sm disabled:opacity-50">Sync Now</button>
              <Link to={`/admin/albums/${id}/edit`} className="rounded-lg border border-black/15 px-4 py-2 text-sm">Edit</Link>
              <button onClick={toggleStatus} className="rounded-lg border border-black/15 px-4 py-2 text-sm">
                {album.status === 'active' ? 'Disable' : 'Enable'}
              </button>
              <button onClick={remove} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600">Delete</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {share && <SharePanel album={album} share={share} />}

          {analytics && (
            <div className="themed-surface p-5">
              <h3 className="font-heading mb-3 text-xl">Analytics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Meta label="Total Views" value={analytics.total_views} />
                <Meta label="Unique Visitors" value={analytics.unique_visitors} />
                <Meta label="Photos Viewed" value={analytics.photos_viewed} />
                <Meta label="Downloads" value={analytics.downloads} />
              </div>
              {analytics.most_viewed_event && (
                <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                  Most viewed event: <strong>{analytics.most_viewed_event.name}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Meta = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</p>
    <p className="text-lg font-medium capitalize">{value ?? '—'}</p>
  </div>
);
