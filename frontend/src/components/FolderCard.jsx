import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';

export default function FolderCard({ slug, eventSlug, folder, index = 0 }) {
  return (
    <Link
      to={`/album/${slug}/event/${eventSlug}/folder/${folder.slug}`}
      className="group themed-surface block overflow-hidden opacity-0 animate-fadeUp"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <LazyImage
        src={folder.cover_image_url}
        alt={folder.name}
        aspectRatio="1 / 1"
        className="w-full transition-transform duration-500 group-hover:scale-105"
      />
      <div className="p-3">
        <h4 className="font-heading text-lg leading-tight">{folder.name}</h4>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {folder.photo_count} Photos
        </p>
      </div>
    </Link>
  );
}
