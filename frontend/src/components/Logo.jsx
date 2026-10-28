import { useState } from 'react';

/**
 * Magic Frames logo.
 *
 * - Default (admin, light surfaces): the black wordmark (`/logo.png` → .jpg → .svg).
 * - `transparent` variant: the transparent-background logo (`/logotrans.png`),
 *   used on dark public surfaces (album cover + header). It already reads
 *   correctly on dark, so it needs NO `invert`.
 *
 * `object-contain` keeps the whole wordmark visible; `rounded` → circular badge.
 */
// Bump when a logo file is replaced on the server so browsers refetch it.
const LOGO_VERSION = '4';
const DEFAULT_SOURCES = ['/logo.png', '/logo.jpg', '/logo.svg'];
const TRANSPARENT_SOURCES = ['/logotrans.png', '/logo.svg'];

export default function Logo({ className = 'h-12 w-auto', rounded = false, transparent = false }) {
  const sources = transparent ? TRANSPARENT_SOURCES : DEFAULT_SOURCES;
  const [i, setI] = useState(0);
  const src = `${sources[i]}?v=${LOGO_VERSION}`;

  return (
    <img
      src={src}
      onError={() => setI((n) => (n < sources.length - 1 ? n + 1 : n))}
      alt="Magic Frames"
      className={`${className} object-contain ${rounded ? 'rounded-full object-cover' : ''}`}
    />
  );
}
