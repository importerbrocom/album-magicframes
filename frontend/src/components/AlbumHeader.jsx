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

        {/* Logo + name link to the company website (opens in a new tab). */}
        <a
          href="https://magicframes.co.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3"
          aria-label="Visit Magic Frames website"
        >
          <Logo className="h-16 w-auto shrink-0 sm:h-20" transparent />
          <span
            className="whitespace-nowrap text-2xl leading-none tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 100, color: 'var(--accent)' }}
          >
            magicframes.co.in
          </span>
        </a>

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
