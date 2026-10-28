import { useEffect, useState } from 'react';
import { useAlbum } from '../contexts/AlbumContext';
import { albumService } from '../services/albumService';
import AlbumHeader from '../components/AlbumHeader';
import EventCard from '../components/EventCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import CommentBox from '../components/CommentBox';
import EnquiryForm from '../components/EnquiryForm';
import GoogleReviewButton from '../components/GoogleReviewButton';
import Logo from '../components/Logo';
import HeroFilm from '../components/HeroFilm';
import { parseFilm } from '../components/parseFilm';
import { heroEyebrow, galleryHeading, formatEventDate } from '../components/albumCopy';
import VideosCard from '../components/VideosCard';

/**
 * Album home: cinematic hero + gallery section cards. All copy is driven by the
 * album's own data (title, tagline, category, date). No event-type is assumed.
 */
export default function AlbumHome() {
  const { album, slug } = useAlbum();
  const [events, setEvents] = useState(null);
  const filmSrc = album.film_src || album.film_url;
  const hasFilm = !!parseFilm(filmSrc);
  const eventDate = formatEventDate(album.event_date);

  useEffect(() => {
    albumService.events(slug).then(setEvents).catch(() => setEvents([]));
  }, [slug]);

  const syncing = album.sync_status === 'syncing' || album.sync_status === 'pending';

  return (
    <div className="min-h-screen pb-16">
      <AlbumHeader slug={slug} album={album} />

      {/* Cinematic full-viewport hero. When the album has a teaser film it plays
          inline (muted, looping) as the hero background; otherwise the cover
          image is shown. The play button / scrubber open the full film with sound. */}
      <section className="hero-stage relative w-full overflow-hidden">
        {hasFilm ? (
          <HeroFilm url={filmSrc} poster={album.cover_image_url} />
        ) : (
          album.cover_image_url && (
            <img src={album.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )
        )}
        <div className="hero-shade absolute inset-0" />

        {/* Decorative script note (akhila theme only, generic) */}
        <span className="hero-note" aria-hidden="true">Love<br />Laugh<br />Forever ♡</span>

        {/* Centered title block — pointer-events off so the video + control bar
            underneath stay interactive (the title is just an overlay). */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <p className="mb-3 text-[0.65rem] uppercase tracking-[0.4em] opacity-85">{heroEyebrow(album)}</p>
          <h1 className="hero-title animate-fadeUp text-5xl sm:text-6xl md:text-7xl">{album.client_name}</h1>
          {album.title && <p className="font-heading mt-2 text-lg uppercase tracking-[0.3em] opacity-90 sm:text-xl">{album.title}</p>}
          <span className="hero-rule" aria-hidden="true" />
          {album.tagline && <p className="mt-3 text-sm italic opacity-80">“{album.tagline}”</p>}
          {eventDate && <p className="mt-2 text-[0.7rem] uppercase tracking-[0.3em] opacity-70">{eventDate}</p>}
        </div>

      </section>

      <main className="mx-auto max-w-6xl px-4 pt-10">
        <div className="mf-reveal mb-7 text-center">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>
            Explore the collection
          </p>
          <h2 className="font-heading mt-1 text-4xl sm:text-5xl">{galleryHeading(album)}</h2>
          <span className="gallery-rings" aria-hidden="true"><i /><i /></span>
          {album.description && (
            <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: 'var(--muted)' }}>
              {album.description}
            </p>
          )}
        </div>

        {syncing && (
          <div className="themed-surface mb-6 p-5 text-center">
            <p className="font-heading text-lg">Your album is being prepared…</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{album.sync_message}</p>
          </div>
        )}

        {events === null ? (
          <CardSkeleton />
        ) : events.length === 0 ? (
          <EmptyState icon="📸" title="No photos available yet." message="Your album is being prepared. Please check back soon." />
        ) : (
          <div className="mf-reveal gallery-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Videos card as the FIRST card in the grid, when the album has a
                video gallery. It opens the dedicated Video Gallery page. */}
            {album.has_video_gallery && (
              <VideosCard slug={slug} album={album} index={0} wide />
            )}
            {events.map((ev, i) => (
              <EventCard
                key={ev.id}
                slug={slug}
                event={ev}
                index={album.has_video_gallery ? i + 1 : i}
                wide={!album.has_video_gallery && i === 0}
              />
            ))}
          </div>
        )}

        {/* ---- Engagement: comments, enquiry, Google review ----
            Default-on: show unless the album explicitly disables the feature
            (older album rows may return null/undefined for these flags). */}
        <div className="mt-12 space-y-6">
          {album.allow_comments !== false && <CommentBox slug={slug} />}

          {album.allow_enquiries !== false && <EnquiryForm slug={slug} />}

          <GoogleReviewButton slug={slug} url={album.google_review_url} />
        </div>

        {/* Studio footer branding — invert the black wordmark so it reads on the dark page */}
        <footer className="mt-12 flex flex-col items-center gap-2 pb-4 text-center">
          <Logo className="h-20 w-auto opacity-90" transparent />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Captured with care</p>
        </footer>
      </main>

    </div>
  );
}
