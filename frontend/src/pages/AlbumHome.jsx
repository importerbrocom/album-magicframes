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
import FilmModal from '../components/FilmModal';
import { parseFilm } from '../components/parseFilm';

/**
 * Album home: cover + event cards (spec section 13).
 */
export default function AlbumHome() {
  const { album, slug } = useAlbum();
  const [events, setEvents] = useState(null);
  const [filmOpen, setFilmOpen] = useState(false);
  const hasFilm = !!parseFilm(album.film_url);

  useEffect(() => {
    albumService.events(slug).then(setEvents).catch(() => setEvents([]));
  }, [slug]);

  const syncing = album.sync_status === 'syncing' || album.sync_status === 'pending';

  return (
    <div className="min-h-screen pb-16">
      <AlbumHeader slug={slug} album={album} />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-72 w-full overflow-hidden sm:h-96">
          {album.cover_image_url && (
            <img src={album.cover_image_url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {/* Cinematic flourishes — shown only on the akhila theme (CSS-gated) */}
          <span className="hero-note" aria-hidden="true">Love<br />Laugh<br />Forever ♡</span>
          {hasFilm ? (
            <button
              type="button"
              className="hero-play hero-play-active"
              aria-label="Play wedding film"
              onClick={() => setFilmOpen(true)}
            >
              <span>▶</span>
            </button>
          ) : (
            <span className="hero-play" aria-hidden="true"><span>▶</span></span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white">
            <p className="mb-2 text-[0.65rem] uppercase tracking-[0.4em] opacity-80">A story in every frame</p>
            <h1 className="hero-title text-4xl sm:text-5xl animate-fadeUp">{album.client_name}</h1>
            <p className="font-heading mt-1 text-xl opacity-90">{album.title}</p>
            <span className="hero-rule" aria-hidden="true" />
            {album.tagline && <p className="mt-2 text-sm italic opacity-80">“{album.tagline}”</p>}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pt-8">
        <div className="mf-reveal mb-5 text-center">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>
            Welcome to our memories
          </p>
          <h2 className="font-heading mt-1 text-3xl">The Events</h2>
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
          <div className="mf-reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <EventCard key={ev.id} slug={slug} event={ev} index={i} />
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

        {/* Studio footer branding */}
        <footer className="mt-12 flex flex-col items-center gap-2 pb-4 text-center">
          <Logo className="h-12 w-12 opacity-90" />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Captured by <span className="font-medium">Magic Frames™</span>
          </p>
        </footer>
      </main>

      {filmOpen && <FilmModal url={album.film_url} onClose={() => setFilmOpen(false)} />}
    </div>
  );
}
