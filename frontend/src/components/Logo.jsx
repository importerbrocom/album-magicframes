import { useState } from 'react';

/**
 * Magic Frames logo — shown as the FULL wordmark (not a cropped circle).
 *
 * Tries the real raster logo uploaded to the web root in order:
 *   /logo.png → /logo.jpg → bundled /logo.svg (always exists).
 * So dropping either a logo.png or logo.jpg into the doc root works, and the
 * SVG wordmark renders until then. `object-contain` keeps the whole wordmark
 * visible; set `rounded` for a circular badge.
 */
const SOURCES = ['/logo.png', '/logo.jpg', '/logo.svg'];

export default function Logo({ className = 'h-12 w-auto', rounded = false }) {
  const [i, setI] = useState(0);
  return (
    <img
      src={SOURCES[i]}
      onError={() => setI((n) => (n < SOURCES.length - 1 ? n + 1 : n))}
      alt="Magic Frames"
      className={`${className} object-contain ${rounded ? 'rounded-full object-cover' : ''}`}
    />
  );
}
