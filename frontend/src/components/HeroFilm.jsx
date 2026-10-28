import { useEffect, useRef, useState } from 'react';
import { parseFilm } from './parseFilm';

/**
 * Inline hero film player for the album home cover.
 *
 * Direct / Google-Drive-proxy videos get a FULL custom player: it tries to
 * autoplay WITH sound (allowed because the client just clicked "VIEW ALBUM"),
 * and if the browser blocks sound it starts muted and shows a one-tap unmute.
 * A working control bar (play/pause, a real seek scrubber, time, volume/mute,
 * fullscreen) sits at the bottom — the same strip shown in the design.
 *
 * YouTube / Vimeo are cross-origin iframes we can't scrub, so they use their
 * own native controls with autoplay.
 */
export default function HeroFilm({ url, poster }) {
  const film = parseFilm(url);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  // Attempt autoplay with sound; fall back to muted autoplay if blocked.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    const tryPlay = async () => {
      try {
        await v.play();
        setMuted(false);
        setPlaying(true);
      } catch {
        // Sound autoplay blocked — start muted (always allowed).
        v.muted = true;
        setMuted(true);
        try { await v.play(); setPlaying(true); } catch { setPlaying(false); }
      }
    };
    tryPlay();
  }, [film?.src]);

  if (!film) return null;

  // --- YouTube / Vimeo: native controls + autoplay (can't custom-scrub) ---
  if (film.kind === 'iframe') {
    const src = withAutoplay(film.src);
    return (
      <div className="absolute inset-0 overflow-hidden">
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

  // --- Direct / Drive-proxy video: full custom player ---
  const v = () => videoRef.current;

  const togglePlay = () => {
    const el = v();
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const el = v();
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    if (!el.muted && el.volume === 0) el.volume = 1;
  };

  const onTimeUpdate = () => {
    const el = v();
    if (!el || !el.duration) return;
    setCur(el.currentTime);
    setDur(el.duration);
    setProgress(el.currentTime / el.duration);
  };

  const seek = (e) => {
    const el = v();
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  };

  const goFullscreen = () => {
    const el = v();
    if (el?.requestFullscreen) el.requestFullscreen();
    else if (el?.webkitEnterFullscreen) el.webkitEnterFullscreen();
  };

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={film.src}
        poster={poster || undefined}
        autoPlay
        loop
        playsInline
        preload="auto"
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
      />

      {/* Tap-to-unmute pill — only while muted (autoplay-with-sound was blocked) */}
      {muted && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white backdrop-blur"
        >
          🔈 Tap for sound
        </button>
      )}

      {/* Working control bar (bottom) */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 text-white">
        <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="text-sm">
          {playing ? '❚❚' : '▶'}
        </button>
        <span className="w-10 shrink-0 text-xs tabular-nums">{fmt(cur)}</span>
        <div className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/30" onClick={seek}>
          <div className="absolute left-0 top-0 h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="w-10 shrink-0 text-xs tabular-nums">{fmt(dur)}</span>
        <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="text-sm">
          {muted ? '🔇' : '🔊'}
        </button>
        <button type="button" onClick={goFullscreen} aria-label="Fullscreen" className="hidden text-sm sm:inline">⛶</button>
      </div>
    </div>
  );
}

function fmt(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** YouTube/Vimeo embed with autoplay (keep native controls + sound attempt). */
function withAutoplay(src) {
  try {
    const u = new URL(src, window.location.origin);
    u.searchParams.set('autoplay', '1');
    u.searchParams.set('playsinline', '1');
    return u.toString();
  } catch {
    return src;
  }
}
