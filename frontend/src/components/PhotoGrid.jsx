import { useEffect, useRef, useState } from 'react';
import LazyImage from './LazyImage';

/**
 * Responsive photo gallery with multiple layouts (spec section 15):
 * grid, masonry, filmstrip, slideshow, story. Uses an IntersectionObserver
 * sentinel for infinite scrolling.
 */
export default function PhotoGrid({ photos, view, onOpen, onLoadMore, hasMore, isFavorite }) {
  const sentinel = useRef(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && onLoadMore()),
      { rootMargin: '600px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, onLoadMore]);

  const favBadge = (p) =>
    isFavorite?.(p.id) ? (
      <span className="absolute right-2 top-2 text-sm drop-shadow">❤️</span>
    ) : null;

  // Classify orientation from stored dimensions (falls back to square).
  const orientation = (p) => {
    if (!p.width || !p.height) return 'square';
    const r = p.width / p.height;
    if (r >= 1.3) return 'wide';   // landscape / panorama
    if (r <= 0.8) return 'tall';   // portrait
    return 'square';
  };

  return (
    <>
      {view === 'auto' && (
        // Orientation-aware layout: wide images span 2 columns, tall images
        // span 2 rows, so each photo displays in a shape suited to it.
        <div className="grid auto-rows-[11rem] grid-cols-2 gap-2 sm:auto-rows-[12rem] sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p, i) => {
            const o = orientation(p);
            const span =
              o === 'wide'
                ? 'col-span-2 row-span-1'
                : o === 'tall'
                  ? 'col-span-1 row-span-2'
                  : 'col-span-1 row-span-1';
            return (
              <div key={p.id} className={`relative ${span}`}>
                <LazyImage
                  src={p.thumbnail_url}
                  alt={p.file_name}
                  className="h-full w-full rounded-lg"
                  onClick={() => onOpen(i)}
                />
                {favBadge(p)}
              </div>
            );
          })}
        </div>
      )}

      {view === 'grid' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p, i) => (
            <div key={p.id} className="relative">
              <LazyImage
                src={p.thumbnail_url}
                alt={p.file_name}
                aspectRatio="1 / 1"
                className="rounded-lg"
                onClick={() => onOpen(i)}
              />
              {favBadge(p)}
            </div>
          ))}
        </div>
      )}

      {view === 'masonry' && (
        <div className="columns-2 gap-2 sm:columns-3 lg:columns-4 [&>*]:mb-2">
          {photos.map((p, i) => (
            <div key={p.id} className="relative break-inside-avoid">
              <LazyImage
                src={p.thumbnail_url}
                alt={p.file_name}
                aspectRatio={p.width && p.height ? `${p.width} / ${p.height}` : '3 / 4'}
                className="rounded-lg"
                onClick={() => onOpen(i)}
              />
              {favBadge(p)}
            </div>
          ))}
        </div>
      )}

      {view === 'filmstrip' && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {photos.map((p, i) => (
            <div key={p.id} className="relative h-64 w-48 shrink-0 sm:h-80 sm:w-60">
              <LazyImage
                src={p.thumbnail_url}
                alt={p.file_name}
                className="h-full w-full rounded-xl"
                onClick={() => onOpen(i)}
              />
              {favBadge(p)}
            </div>
          ))}
        </div>
      )}

      {view === 'story' && (
        <div className="mx-auto max-w-2xl space-y-6">
          {photos.map((p, i) => (
            <div key={p.id} className="relative">
              <LazyImage
                src={p.preview_url || p.thumbnail_url}
                alt={p.file_name}
                aspectRatio={p.width && p.height ? `${p.width} / ${p.height}` : '3 / 2'}
                className="w-full rounded-2xl"
                onClick={() => onOpen(i)}
              />
              {favBadge(p)}
            </div>
          ))}
        </div>
      )}

      {view === 'slideshow' && photos.length > 0 && (
        <Slideshow photos={photos} onOpen={onOpen} />
      )}

      {hasMore && view !== 'slideshow' && (
        <div ref={sentinel} className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
        </div>
      )}
    </>
  );
}

function Slideshow({ photos, onOpen }) {
  const [i, setI] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setI((v) => (v + 1) % photos.length), 3500);
    return () => clearInterval(timer.current);
  }, [photos.length]);

  const p = photos[i];
  return (
    <div className="relative mx-auto max-w-4xl">
      <LazyImage
        key={p.id}
        src={p.preview_url || p.thumbnail_url}
        alt={p.file_name}
        aspectRatio="3 / 2"
        className="w-full rounded-2xl animate-fadeIn"
        onClick={() => onOpen(i)}
        eager
      />
      <div className="mt-3 flex items-center justify-center gap-2">
        {photos.slice(0, 12).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === i % 12 ? 'w-6 bg-current' : 'w-1.5 bg-current/30'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
