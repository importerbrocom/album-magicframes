import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlbum } from '../contexts/AlbumContext';
import { albumService } from '../services/albumService';
import AlbumHeader from '../components/AlbumHeader';
import EmptyState from '../components/EmptyState';
import FilmModal from '../components/FilmModal';

/**
 * Dedicated Video Gallery page (opened from the "Videos" card in the gallery
 * grid). Lists all videos from the album's video-gallery Drive folder in a
 * grid, each with a play overlay; playback opens in a full-screen lightbox.
 */
export default function VideoGalleryPage() {
  const { slug } = useParams();
  const { album } = useAlbum();
  const [videos, setVideos] = useState(null);
  const [openSrc, setOpenSrc] = useState(null);

  useEffect(() => {
    albumService.videoGallery(slug).then(setVideos).catch(() => setVideos([]));
  }, [slug]);

  return (
    <div className="min-h-screen pb-16">
      <AlbumHeader slug={slug} album={album} back={`/album/${slug}`} />

      <main className="mx-auto max-w-6xl px-4 pt-6">
        <div className="mf-reveal mb-7 text-center">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>Watch</p>
          <h1 className="font-heading mt-1 text-4xl sm:text-5xl">Videos</h1>
          <span className="section-rule" aria-hidden="true" />
        </div>

        {videos === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton aspect-video w-full rounded-lg" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <EmptyState icon="🎬" title="No videos yet." message="Videos will appear here once they're added." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setOpenSrc(v.src)}
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
        )}
      </main>

      {openSrc && <FilmModal url={openSrc} onClose={() => setOpenSrc(null)} />}
    </div>
  );
}
