import { useEffect } from 'react';
import { parseFilm } from './parseFilm';

/**
 * Full-screen film player. Supports YouTube, Vimeo, Google Drive (via the
 * backend proxy) and direct video files (mp4/webm/ogg/mov). Opened from the
 * album hero when a film is set. Closes on overlay click or Escape; locks body
 * scroll while open.
 */
export default function FilmModal({ url, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const film = parseFilm(url);
  if (!film) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 animate-fadeIn sm:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Film player"
      style={{ backdropFilter: 'blur(18px)' }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close film"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-2xl text-white"
        style={{ border: '1px solid var(--accent)', background: 'rgba(17,17,17,0.55)' }}
      >
        ×
      </button>

      <div
        className="aspect-video w-full max-w-5xl overflow-hidden bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {film.kind === 'video' ? (
          <video src={film.src} controls autoPlay playsInline className="h-full w-full">
            <track kind="captions" />
          </video>
        ) : (
          <iframe
            src={film.src}
            title="Album film"
            className="h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
