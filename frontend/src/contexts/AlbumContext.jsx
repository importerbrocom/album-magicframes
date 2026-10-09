import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { albumService, getAlbumToken } from '../services/albumService';
import ThemeScope from '../components/ThemeScope';
import { usePageMeta } from '../hooks/usePageMeta';
import { HeroSkeleton } from '../components/LoadingSkeleton';

const AlbumContext = createContext(null);

export const useAlbum = () => useContext(AlbumContext);

/**
 * Protects public album content routes: requires a valid album-scoped token,
 * loads the album once, applies its theme and provides it via context.
 */
export default function AlbumLayout() {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | unauthorized | error

  usePageMeta({
    title: album ? `${album.client_name} | ${album.title}` : 'Wedding Album',
    description: album?.description,
    noindex: true,
  });

  useEffect(() => {
    if (!getAlbumToken(slug)) {
      setStatus('unauthorized');
      return;
    }
    let active = true;
    albumService
      .show(slug)
      .then((data) => {
        if (!active) return;
        setAlbum(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        setStatus(err.response?.status === 401 ? 'unauthorized' : 'error');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (status === 'unauthorized') return <Navigate to={`/album/${slug}/login`} replace />;

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-md p-8 pt-24">
        <HeroSkeleton />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="font-heading text-3xl">Something went wrong</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Please refresh and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeScope theme={album.theme}>
      <AlbumContext.Provider value={{ album, slug }}>
        <Outlet />
      </AlbumContext.Provider>
    </ThemeScope>
  );
}
