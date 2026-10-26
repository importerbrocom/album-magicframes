import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlbum } from '../contexts/AlbumContext';
import { albumService } from '../services/albumService';
import AlbumHeader from '../components/AlbumHeader';
import FolderCard from '../components/FolderCard';
import Gallery from '../components/Gallery';
import { CardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import FilmModal from '../components/FilmModal';

/**
 * Event page: shows folder cards and/or photos directly in the event
 * (spec section 14).
 */
export default function EventPage() {
  const { slug, eventSlug } = useParams();
  const { album } = useAlbum();
  const [data, setData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playSrc, setPlaySrc] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setData(null);
    setVideos([]);
    albumService
      .event(slug, eventSlug)
      .then(setData)
      .catch(() => setNotFound(true));
    // Videos in this section's folder (independent of photos).
    albumService.eventVideos(slug, eventSlug).then((v) => setVideos(v || [])).catch(() => setVideos([]));
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
            <div className="mf-reveal mb-6 text-center">
              {album?.category && (
                <p className="mb-1 text-[0.65rem] uppercase tracking-[0.35em]" style={{ color: 'var(--accent)' }}>
                  {album.category}
                </p>
              )}
              <h1 className="font-heading text-4xl">{event.name}</h1>
              <span className="section-rule" aria-hidden="true" />
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
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

            {/* All videos in this section — shown on the section's own page. */}
            {videos.length > 0 && (
              <div className="mf-reveal mb-10">
                <div className="mb-4 text-center">
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>Watch</p>
                  <h2 className="font-heading mt-1 text-3xl">Videos</h2>
                  <span className="section-rule" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setPlaySrc(v.src)}
                      className="video-tile group relative block aspect-video w-full overflow-hidden text-left"
                      aria-label={`Play ${v.name}`}
                    >
                      {v.poster ? (
                        <img src={v.poster} alt={v.name} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <video src={`${v.src}#t=0.5`} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                      )}
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                      <span className="video-tile-play pointer-events-none">▶</span>
                      <span className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 text-sm text-white">{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photos sitting directly in the event (no sub-folder). */}
            {data.has_direct_photos && (
              <Gallery slug={slug} album={album} filters={{ event_id: event.id, direct_only: true }} />
            )}

            {folders.length === 0 && !data.has_direct_photos && videos.length === 0 && (
              <EmptyState icon="📷" title="This event doesn't have any photos yet." />
            )}
          </>
        )}
      </main>

      {playSrc && <FilmModal url={playSrc} onClose={() => setPlaySrc(null)} />}
    </div>
  );
}
