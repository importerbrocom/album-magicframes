import { useState } from 'react';

/**
 * Magic Frames logo — the black script wordmark on a transparent background.
 *
 * Source order: /logo.png (the real uploaded file) → /logo.jpg → /logo.svg fallback.
 * The black wordmark needs a light surface to be visible.
 *
 * `object-contain` keeps the whole wordmark visible; `rounded` → circular badge.
 */
// Cache-busting token: bump when the logo file is replaced on the server so
// browsers fetch the new image instead of a stale cached copy.
const LOGO_VERSION = '3';
const SOURCES = ['/logo.png', '/logo.jpg', '/logo.svg'];

export default function Logo({ className = 'h-12 w-auto', rounded = false }) {
  const [i, setI] = useState(0);
  const src = `${SOURCES[i]}?v=${LOGO_VERSION}`;

  return (
    <img
      src={src}
      onError={() => setI((n) => (n < SOURCES.length - 1 ? n + 1 : n))}
      alt="Magic Frames"
      className={`${className} object-contain ${rounded ? 'rounded-full object-cover' : ''}`}
    />
  );
}
