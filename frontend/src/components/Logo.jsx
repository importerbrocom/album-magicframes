import { useState } from 'react';

/**
 * Magic Frames logo — shown as the FULL wordmark (not a cropped circle).
 *
 * variant="dark" (default): the uploaded raster logo (/logo.png → /logo.jpg)
 *   with the bundled dark SVG wordmark as fallback. Best on dark surfaces.
 * variant="light": a white-background, black-text SVG wordmark for use on
 *   light surfaces (e.g. the admin sidebar).
 *
 * `object-contain` keeps the whole wordmark visible; `rounded` → circular badge.
 */
const DARK_SOURCES = ['/logo.png', '/logo.jpg', '/logo.svg'];

export default function Logo({ className = 'h-12 w-auto', rounded = false, variant = 'dark' }) {
  const [i, setI] = useState(0);
  const src = variant === 'light' ? '/logo-light.svg' : DARK_SOURCES[i];

  return (
    <img
      src={src}
      onError={variant === 'light' ? undefined : () => setI((n) => (n < DARK_SOURCES.length - 1 ? n + 1 : n))}
      alt="Magic Frames"
      className={`${className} object-contain ${rounded ? 'rounded-full object-cover' : ''}`}
    />
  );
}
