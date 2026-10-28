import { parseFilm } from './parseFilm';

/**
 * Inline hero background film. Plays the teaser automatically inside the album
 * home cover (muted + looping, so browsers allow autoplay). Direct/Drive-proxy
 * videos use a real <video>; YouTube/Vimeo/Drive-preview use an iframe with
 * autoplay+mute+loop params. Falls back to the cover image if no film.
 *
 * Sound-on playback is still available via the hero play button / scrubber,
 * which open the full-screen FilmModal.
 */
export default function HeroFilm({ url, poster }) {
  const film = parseFilm(url);
  if (!film) return null;

  if (film.kind === 'video') {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={film.src}
        poster={poster || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
    );
  }

  // iframe (YouTube/Vimeo/Drive preview) — force autoplay + mute + loop.
  const src = withAutoplayMute(film.src);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Scale up so the 16:9 iframe always covers the hero with no letterbox. */}
      <iframe
        title="Album teaser film"
        src={src}
        className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        frameBorder="0"
      />
    </div>
  );
}

/** Ensure the embed URL autoplays muted and loops (YouTube + Vimeo). */
function withAutoplayMute(src) {
  try {
    const u = new URL(src, window.location.origin);
    const isYouTube = /youtube(-nocookie)?\.com/.test(u.hostname);
    const isVimeo = /vimeo\.com/.test(u.hostname);

    u.searchParams.set('autoplay', '1');
    u.searchParams.set('playsinline', '1');

    if (isYouTube) {
      u.searchParams.set('mute', '1');
      u.searchParams.set('controls', '0');
      u.searchParams.set('loop', '1');
      u.searchParams.set('modestbranding', '1');
      // YouTube loop needs the playlist param set to the same video id.
      const id = u.pathname.split('/').pop();
      if (id) u.searchParams.set('playlist', id);
    }
    if (isVimeo) {
      u.searchParams.set('muted', '1');
      u.searchParams.set('loop', '1');
      u.searchParams.set('background', '1'); // Vimeo: chromeless, autoplay, loop
    }
    return u.toString();
  } catch {
    return src;
  }
}
