import { useState } from 'react';
import { useInfinitePhotos } from '../hooks/useInfinitePhotos';
import { useFavorites } from '../hooks/useFavorites';
import PhotoGrid from './PhotoGrid';
import PhotoViewer from './PhotoViewer';
import { GallerySkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';

const VIEWS = [
  { id: 'auto', label: 'Auto', icon: '▣' },
  { id: 'masonry', label: 'Masonry', icon: '▦' },
  { id: 'grid', label: 'Grid', icon: '▤' },
  { id: 'filmstrip', label: 'Film', icon: '▭' },
  { id: 'story', label: 'Story', icon: '▯' },
  { id: 'slideshow', label: 'Slides', icon: '▷' },
];

/**
 * Self-contained gallery: handles layout switching, infinite paging and the
 * full-screen viewer. Filters select the event/folder scope.
 */
export default function Gallery({ slug, filters, album }) {
  const [view, setView] = useState('auto');
  const [viewerIndex, setViewerIndex] = useState(null);
  const { photos, loading, loadMore, hasMore, total, error } = useInfinitePhotos(slug, filters);
  const { isFavorite, toggle } = useFavorites(slug);

  if (loading && photos.length === 0) return <GallerySkeleton />;

  if (error) {
    return <EmptyState icon="⚠️" title="Couldn't load photos" message="Please try again in a moment." />;
  }

  if (!loading && photos.length === 0) {
    return <EmptyState icon="📷" title="No photos available yet." message="This selection doesn't have any photos yet." />;
  }

  return (
    <div>
      {/* View switcher */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{total} Photos</p>
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-black/10 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition ${
                view === v.id ? 'themed-accent-bg' : ''
              }`}
            >
              <span className="mr-1">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <PhotoGrid
        photos={photos}
        view={view}
        onOpen={setViewerIndex}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isFavorite={isFavorite}
        slug={slug}
        allowDownload={album?.allow_download}
      />

      {viewerIndex !== null && (
        <PhotoViewer
          slug={slug}
          photos={photos}
          index={viewerIndex}
          total={total}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
          onLoadMore={loadMore}
          allowDownload={album?.allow_download}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
        />
      )}
    </div>
  );
}
