import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';

export default function EventCard({ slug, event, index = 0 }) {
  return (
    <Link
      to={`/album/${slug}/event/${event.slug}`}
      className="group themed-surface block overflow-hidden opacity-0 animate-fadeUp"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative">
        <LazyImage
          src={event.cover_image_url}
          alt={event.name}
          aspectRatio="4 / 3"
          className="w-full transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-heading text-2xl leading-tight">{event.name}</h3>
          <p className="text-sm opacity-90">{event.photo_count} Photos</p>
        </div>
      </div>
    </Link>
  );
}
