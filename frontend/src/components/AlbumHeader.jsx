import { Link } from 'react-router-dom';
import Logo from './Logo';
import SocialLinks from './SocialLinks';

/**
 * Sticky album header shown across the public album (spec section 21).
 * The old generic Share button is replaced by admin-configured social icons
 * (Instagram / WhatsApp / Facebook / Pinterest). A logo sits on the left.
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

        <Link to={`/album/${slug}`} className="shrink-0" aria-label="Home">
          <Logo className="h-9 w-auto" />
        </Link>

        <Link to={`/album/${slug}`} className="min-w-0 flex-1">
          <h1 className="font-heading truncate text-xl leading-none">{album?.client_name}</h1>
          <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{album?.title}</p>
        </Link>

        {album?.category && (
          <span
            className="hidden shrink-0 rounded-full px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.25em] sm:inline-block"
            style={{ color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)' }}
          >
            {album.category}
          </span>
        )}

        <SocialLinks links={album?.social_links} className="shrink-0" />
      </div>
    </header>
  );
}
