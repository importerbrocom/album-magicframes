import { useState } from 'react';
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import categoryIcon, { sectionCaption, titleCase } from './categoryIcon';
import FilmModal from './FilmModal';
import { parseFilm } from './parseFilm';

export default function EventCard({ slug, event, index = 0, wide = false }) {
  const [filmOpen, setFilmOpen] = useState(false);
  const hasFilm = !!parseFilm(event.film_src);

  return (
    <>
      <Link
        to={`/album/${slug}/event/${event.slug}`}
        className={`event-card group themed-surface relative block overflow-hidden opacity-0 animate-fadeUp ${wide ? 'is-wide' : ''}`}
        style={{ animationDelay: `${index * 70}ms` }}
      >
        <div className="relative h-full bg-black/20">
          <LazyImage
            src={event.cover_image_url}
            alt={event.name}
            aspectRatio={wide ? '24 / 7' : '16 / 7'}
            className="h-full w-full transition-transform duration-700 group-hover:scale-105"
          />
          {/* Left-weighted cinematic shade (reference style) */}
          <div className="card-shade pointer-events-none absolute inset-0" />
          <div className="card-copy absolute inset-y-0 left-0 flex flex-col justify-center p-6 text-white">
            <span className="card-cat-icon" aria-hidden="true">{categoryIcon(event.name)}</span>
            <h3 className="card-title font-heading leading-none">{titleCase(event.name)}</h3>
            <p className="card-caption">{sectionCaption(event.name)}</p>
            <span className="card-view"><span>VIEW</span> <b>›</b></span>
          </div>

          {/* Section film: a video was found in this section's Drive folder.
              Tapping the play button opens it without navigating into the gallery. */}
          {hasFilm && (
            <button
              type="button"
              className="card-play"
              aria-label={`Play ${event.name} film`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilmOpen(true); }}
            >
              <span>▶</span>
            </button>
          )}

          {/* Gold corner arrow affordance */}
          <span className="card-arrow" aria-hidden="true">↗</span>
        </div>
      </Link>

      {filmOpen && <FilmModal url={event.film_src} onClose={() => setFilmOpen(false)} />}
    </>
  );
}
