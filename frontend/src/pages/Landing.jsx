import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import Logo from '../components/Logo';

/**
 * Marketing/entry landing for the app root. Guests reach albums via their
 * private links; this page just orients photographers and visitors.
 */
export default function Landing() {
  usePageMeta({
    title: 'Magic Frames — Digital Wedding Albums',
    description: 'Premium, private, mobile-first digital wedding photo albums powered by Google Drive.',
  });

  return (
    <div data-theme="classic" className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <Logo className="mb-2 h-24 w-auto sm:h-28" />
        <h1 className="font-heading mt-2 text-5xl leading-tight sm:text-6xl">
          Premium digital wedding albums
        </h1>
        <p className="mt-5 max-w-lg text-base" style={{ color: 'var(--muted)' }}>
          Share a private, beautifully designed album with your clients — their photos stream straight
          from your Google Drive, organized automatically into events and galleries.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/admin/login" className="btn-accent">Studio Login</Link>
        </div>
        <p className="mt-10 text-sm" style={{ color: 'var(--muted)' }}>
          Have an album link? Open it to enter your password and view your memories.
        </p>
      </div>
    </div>
  );
}
