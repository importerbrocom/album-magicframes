import { Link } from 'react-router-dom';
import ShareButton from './ShareButton';

/**
 * Sticky album header shown across the public album (spec section 21).
 */
export default function AlbumHeader({ slug, album, back }) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{ background: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {back ? (
          <Link to={back} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-lg" aria-label="Back">
            ‹
          </Link>
        ) : null}
        <Link to={`/album/${slug}`} className="min-w-0 flex-1">
          <h1 className="font-heading truncate text-xl leading-none">{album?.client_name}</h1>
          <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{album?.title}</p>
        </Link>
        {album?.allow_share && <ShareButton slug={slug} album={album} />}
      </div>
    </header>
  );
}
