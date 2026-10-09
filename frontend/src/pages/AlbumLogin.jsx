import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { albumService, getAlbumToken } from '../services/albumService';
import ThemeScope from '../components/ThemeScope';
import { usePageMeta } from '../hooks/usePageMeta';
import { HeroSkeleton } from '../components/LoadingSkeleton';

/**
 * Public album cover + password screen (spec section 11/44).
 */
export default function AlbumLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [landing, setLanding] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  usePageMeta({
    title: landing ? `${landing.client_name} | ${landing.title}` : 'Wedding Album',
    description: landing?.description || 'A private collection of wedding memories.',
    noindex: true,
  });

  useEffect(() => {
    // Already authenticated for this album? Skip to home.
    if (getAlbumToken(slug)) {
      navigate(`/album/${slug}`, { replace: true });
      return;
    }
    albumService
      .landing(slug)
      .then(setLanding)
      .catch(() => setNotFound(true));
  }, [slug, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await albumService.verify(slug, password);
      navigate(`/album/${slug}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <h1 className="font-heading text-3xl">Album not found</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            This album may have been removed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (!landing) {
    return (
      <div className="mx-auto max-w-md p-8 pt-24">
        <HeroSkeleton />
      </div>
    );
  }

  return (
    <ThemeScope theme={landing.theme}>
      <div className="relative min-h-screen">
        {/* Hero cover */}
        <div className="absolute inset-0">
          {landing.cover_image_url && (
            <img src={landing.cover_image_url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center text-white">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] opacity-80 animate-fadeIn">The Wedding of</p>
          <h1 className="font-heading text-5xl leading-tight sm:text-6xl animate-fadeUp">{landing.client_name}</h1>
          <p className="font-heading mt-3 text-2xl opacity-90 animate-fadeUp">{landing.title}</p>
          {landing.tagline && (
            <p className="mt-4 max-w-sm text-sm italic opacity-80 animate-fadeIn">“{landing.tagline}”</p>
          )}

          <form onSubmit={submit} className="mt-10 w-full max-w-xs animate-fadeUp">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Album Password"
              autoFocus
              className="w-full rounded-full border border-white/40 bg-white/15 px-5 py-3.5 text-center text-white placeholder-white/70 backdrop-blur focus:border-white focus:outline-none"
            />
            {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !password}
              className="btn-accent mt-5 w-full disabled:opacity-50"
            >
              {submitting ? 'Opening…' : 'VIEW ALBUM'}
            </button>
          </form>
        </div>
      </div>
    </ThemeScope>
  );
}
