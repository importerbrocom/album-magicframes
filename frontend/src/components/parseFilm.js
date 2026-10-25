/**
 * Parse a wedding-film URL into an embeddable form.
 * Supports YouTube, Vimeo and direct video files. Returns null if the URL is
 * empty/invalid, so callers can use it as a "has a playable film?" check.
 */
export function parseFilm(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();

  // YouTube: youtu.be/ID, watch?v=ID, /embed/ID, /shorts/ID, /v/ID
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) {
    return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&autoplay=1&playsinline=1` };
  }

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };
  }

  // Direct video file
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(u)) {
    return { kind: 'video', src: u };
  }

  // Unknown host — try an iframe as a best effort (e.g. a hosted player page).
  return { kind: 'iframe', src: u };
}
