import { useState } from 'react';

/**
 * Magic Frames logo. Prefers the real raster logo at /logo.jpg (upload the
 * company logo to the web root); falls back to the bundled SVG mark so the
 * brand always renders even before the file is uploaded.
 */
export default function Logo({ className = 'h-10 w-10', rounded = true }) {
  const [src, setSrc] = useState('/logo.jpg');
  return (
    <img
      src={src}
      onError={() => src !== '/logo.svg' && setSrc('/logo.svg')}
      alt="Magic Frames"
      className={`${className} object-cover ${rounded ? 'rounded-full' : ''}`}
    />
  );
}
