import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';

/**
 * The "Videos" card shown as the FIRST item in the gallery grid, alongside the
 * photo sections. Styled like EventCard; opens the dedicated Video Gallery
 * page (/album/:slug/videos).
 */
export default function VideosCard({ slug, album, index = 0, wide = false }) {
  return (
    <Link
      to={`/album/${slug}/videos`}
      className={`event-card group themed-surface relative block overflow-hidden opacity-0 animate-fadeUp ${wide ? 'is-wide' : ''}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative h-full bg-black/20">
        <LazyImage
          src={album.video_gallery_cover || album.cover_image_url}
          alt="Videos"
          aspectRatio={wide ? '24 / 7' : '16 / 7'}
          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
        />
        <div className="card-shade pointer-events-none absolute inset-0" />
        <div className="card-copy absolute inset-y-0 left-0 flex flex-col justify-center p-6 text-white">
          <span className="card-cat-icon" aria-hidden="true">▷</span>
          <h3 className="card-title font-heading leading-none">Videos</h3>
          <p className="card-caption">Films · Clips · Moments</p>
          <span className="card-view"><span>VIEW</span> <b>›</b></span>
        </div>
        {/* Play cue — whole card links to the Video Gallery page */}
        <span className="card-play pointer-events-none" aria-hidden="true"><span>▶</span></span>
        <span className="card-arrow" aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}
