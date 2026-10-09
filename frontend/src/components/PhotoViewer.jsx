import { useCallback, useEffect, useRef, useState } from 'react';
import { albumService } from '../services/albumService';

/**
 * Full-screen photo viewer (spec section 16):
 *  - prev / next / close, zoom, favorite, download, share
 *  - keyboard (arrows + Esc) on desktop, swipe on mobile
 *  - counter "n / total"
 */
export default function PhotoViewer({
  slug,
  photos,
  index,
  total,
  onClose,
  onNavigate,
  onLoadMore,
  allowDownload,
  isFavorite,
  onToggleFavorite,
}) {
  const [zoom, setZoom] = useState(1);
  const touchStart = useRef(null);
  const photo = photos[index];

  const goPrev = useCallback(() => {
    if (index > 0) {
      setZoom(1);
      onNavigate(index - 1);
    }
  }, [index, onNavigate]);

  const goNext = useCallback(() => {
    if (index < photos.length - 1) {
      setZoom(1);
      onNavigate(index + 1);
      // Prefetch more when nearing the end of the loaded set.
      if (index + 3 >= photos.length) onLoadMore?.();
    }
  }, [index, photos.length, onNavigate, onLoadMore]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [goPrev, goNext, onClose]);

  // Record a photo_view when the viewed photo changes.
  useEffect(() => {
    if (photo) {
      albumService.trackAnalytics(slug, { type: 'photo_view', photo_id: photo.id, event_id: photo.event_id });
    }
  }, [photo, slug]);

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) (dx > 0 ? goPrev : goNext)();
    touchStart.current = null;
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 animate-fadeIn">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <span className="text-sm tabular-nums">
          {index + 1} / {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleFavorite(photo.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Favorite"
          >
            {isFavorite(photo.id) ? '❤️' : '🤍'}
          </button>
          {allowDownload && (
            <button
              onClick={() => albumService.downloadPhoto(slug, photo.id, photo.file_name)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Download"
            >
              ⬇️
            </button>
          )}
          <button
            onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Zoom"
          >
            {zoom === 1 ? '🔍' : '➖'}
          </button>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Image stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {index > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex"
            aria-label="Previous"
          >
            ‹
          </button>
        )}

        <img
          key={photo.id}
          src={photo.preview_url || photo.thumbnail_url}
          alt={photo.file_name}
          className="max-h-full max-w-full select-none object-contain transition-transform duration-300 animate-fadeIn"
          style={{ transform: `scale(${zoom})` }}
          onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
        />

        {index < total - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:flex"
            aria-label="Next"
          >
            ›
          </button>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 py-3 text-center text-xs text-white/60">{photo.file_name}</div>
    </div>
  );
}
