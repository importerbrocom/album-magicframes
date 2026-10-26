import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import categoryIcon, { sectionCaption, titleCase } from './categoryIcon';
import { parseFilm } from './parseFilm';

export default function EventCard({ slug, event, index = 0, wide = false }) {
  // Does this section have a video? (auto-detected film or an override)
  const hasFilm = !!parseFilm(event.film_src);

  return (
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

        {/* Section has video(s): a centered play cue. The whole card is a link,
            so clicking it (or the cue) opens the section page where the full
            Videos grid lives — it does not play inline. */}
        {hasFilm && (
          <span className="card-play pointer-events-none" aria-hidden="true">
            <span>▶</span>
          </span>
        )}

        {/* Gold corner arrow affordance */}
        <span className="card-arrow" aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}
