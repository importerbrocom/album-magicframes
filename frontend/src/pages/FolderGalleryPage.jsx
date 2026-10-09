import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlbum } from '../contexts/AlbumContext';
import { albumService } from '../services/albumService';
import AlbumHeader from '../components/AlbumHeader';
import Gallery from '../components/Gallery';
import EmptyState from '../components/EmptyState';

/**
 * Folder photo gallery (spec section 15). Resolves the folder from the event
 * payload, then renders the infinite gallery scoped to that folder.
 */
export default function FolderGalleryPage() {
  const { slug, eventSlug, folderSlug } = useParams();
  const { album } = useAlbum();
  const [event, setEvent] = useState(null);
  const [folder, setFolder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    albumService
      .event(slug, eventSlug)
      .then((data) => {
        setEvent(data.event);
        const f = (data.event.folders || []).find((x) => x.slug === folderSlug);
        if (!f) setNotFound(true);
        else setFolder(f);
      })
      .catch(() => setNotFound(true));
  }, [slug, eventSlug, folderSlug]);

  if (notFound) {
    return (
      <div className="min-h-screen">
        <AlbumHeader slug={slug} album={album} back={`/album/${slug}/event/${eventSlug}`} />
        <EmptyState icon="🔍" title="Folder not found" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <AlbumHeader slug={slug} album={album} back={`/album/${slug}/event/${eventSlug}`} />
      <main className="mx-auto max-w-6xl px-4 pt-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{event?.name}</p>
          <h1 className="font-heading text-4xl">{folder?.name || 'Photos'}</h1>
        </div>
        {folder && <Gallery slug={slug} album={album} filters={{ folder_id: folder.id }} />}
      </main>
    </div>
  );
}
