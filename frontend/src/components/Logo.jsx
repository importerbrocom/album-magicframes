import { useState } from 'react';

/**
 * Magic Frames logo — shown as the FULL wordmark (not a cropped circle).
 * Prefers the real raster logo at /logo.jpg (upload the company logo to the
 * web root); falls back to the bundled SVG wordmark so the brand always
 * renders even before the file is uploaded. `object-contain` keeps the whole
 * wordmark visible; set `rounded` only if you want a circular badge.
 */
export default function Logo({ className = 'h-12 w-auto', rounded = false }) {
  const [src, setSrc] = useState('/logo.jpg');
  return (
    <img
      src={src}
      onError={() => src !== '/logo.svg' && setSrc('/logo.svg')}
      alt="Magic Frames"
      className={`${className} object-contain ${rounded ? 'rounded-full object-cover' : ''}`}
    />
  );
}
