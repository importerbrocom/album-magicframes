import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlbum } from '../contexts/AlbumContext';
import { albumService } from '../services/albumService';
import AlbumHeader from '../components/AlbumHeader';
import FolderCard from '../components/FolderCard';
import Gallery from '../components/Gallery';
import { CardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

/**
 * Event page: shows folder cards and/or photos directly in the event
 * (spec section 14).
 */
export default function EventPage() {
  const { slug, eventSlug } = useParams();
  const { album } = useAlbum();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setData(null);
    albumService
      .event(slug, eventSlug)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [slug, eventSlug]);

  if (notFound) {
    return (
      <div className="min-h-screen">
        <AlbumHeader slug={slug} album={album} back={`/album/${slug}`} />
        <EmptyState icon="🔍" title="Event not found" />
      </div>
    );
  }

  const event = data?.event;
  const folders = event?.folders || [];

  return (
    <div className="min-h-screen pb-16">
      <AlbumHeader slug={slug} album={album} back={`/album/${slug}`} />

      <main className="mx-auto max-w-6xl px-4 pt-6">
        {!data ? (
          <>
            <div className="skeleton mb-6 h-8 w-48 rounded" />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="font-heading text-4xl">{event.name}</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {event.photo_count} Photos
                {data.folder_count > 0 && ` · ${data.folder_count} Folders`}
              </p>
            </div>

            {folders.length > 0 && (
              <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {folders.map((f, i) => (
                  <FolderCard key={f.id} slug={slug} eventSlug={eventSlug} folder={f} index={i} />
                ))}
              </div>
            )}

            {/* Photos sitting directly in the event (no sub-folder). */}
            {data.has_direct_photos && (
              <Gallery slug={slug} album={album} filters={{ event_id: event.id, direct_only: true }} />
            )}

            {folders.length === 0 && !data.has_direct_photos && (
              <EmptyState icon="📷" title="This event doesn't have any photos yet." />
            )}
          </>
        )}
      </main>
    </div>
  );
}
