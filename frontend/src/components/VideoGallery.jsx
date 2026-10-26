import { useEffect, useState } from 'react';
import { useAlbum } from '../contexts/AlbumContext';
import { albumService } from '../services/albumService';
import FilmModal from './FilmModal';

/**
 * A separate "Video Gallery" section — the videos from the album's dedicated
 * video-gallery Drive folder (distinct from the photo gallery and the single
 * teaser film). Each tile opens the clip in the full-screen FilmModal.
 * Renders nothing if the album has no video gallery or it is empty.
 */
export default function VideoGallery() {
  const { album, slug } = useAlbum();
  const [videos, setVideos] = useState(null);
  const [openSrc, setOpenSrc] = useState(null);

  useEffect(() => {
    if (!album?.has_video_gallery) return;
    albumService.videoGallery(slug).then(setVideos).catch(() => setVideos([]));
  }, [slug, album?.has_video_gallery]);

  if (!album?.has_video_gallery) return null;
  if (videos !== null && videos.length === 0) return null;

  return (
    <section className="mf-reveal mt-14">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>Watch</p>
        <h2 className="font-heading mt-1 text-4xl sm:text-5xl">Video Gallery</h2>
        <span className="section-rule" aria-hidden="true" />
      </div>

      {videos === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton aspect-video w-full rounded-lg" />
          ))}
        </div>
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
              {/* Chosen poster if set, else a muted first-frame of the video */}
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

      {openSrc && <FilmModal url={openSrc} onClose={() => setOpenSrc(null)} />}
    </section>
  );
}
