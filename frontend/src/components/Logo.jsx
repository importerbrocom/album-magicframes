import { useState } from 'react';

/**
 * Magic Frames logo — the black script wordmark on a transparent background.
 *
 * Source order: /logo.svg (bundled transparent vector) → /logo.png → /logo.jpg.
 * The black wordmark needs a light surface to be visible.
 *
 * `object-contain` keeps the whole wordmark visible; `rounded` → circular badge.
 */
const SOURCES = ['/logo.svg', '/logo.png', '/logo.jpg'];

export default function Logo({ className = 'h-12 w-auto', rounded = false }) {
  const [i, setI] = useState(0);
  const src = SOURCES[i];

  return (
    <img
      src={src}
      onError={() => setI((n) => (n < SOURCES.length - 1 ? n + 1 : n))}
      alt="Magic Frames"
      className={`${className} object-contain ${rounded ? 'rounded-full object-cover' : ''}`}
    />
  );
}
