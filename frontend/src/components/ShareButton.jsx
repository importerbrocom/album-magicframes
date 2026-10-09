import { useState } from 'react';
import { albumService } from '../services/albumService';

/**
 * Share sheet with WhatsApp / Copy Link / Email / QR (spec section 19).
 */
export default function ShareButton({ slug, album }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/album/${slug}`;
  const text = `${album?.client_name || ''}'s ${album?.title || 'wedding'} album is ready. View your memories here: ${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      albumService.trackAnalytics(slug, { type: 'share', meta: { channel: 'copy' } });
    } catch {
      /* ignore */
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: album?.title, text, url });
        albumService.trackAnalytics(slug, { type: 'share', meta: { channel: 'native' } });
        return;
      } catch {
        /* fall through to sheet */
      }
    }
    setOpen(true);
  };

  return (
    <>
      <button onClick={nativeShare} className="btn-accent text-sm" aria-label="Share album">
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="themed-surface w-full max-w-md animate-fadeUp rounded-t-3xl p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading mb-4 text-2xl">Share this album</h3>

            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => albumService.trackAnalytics(slug, { type: 'share', meta: { channel: 'whatsapp' } })}
                className="flex flex-col items-center gap-2"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl">💬</span>
                WhatsApp
              </a>
              <button onClick={copy} className="flex flex-col items-center gap-2">
                <span className="themed-accent-bg flex h-14 w-14 items-center justify-center rounded-full text-2xl">🔗</span>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(album?.title || 'Wedding album')}&body=${encodeURIComponent(text)}`}
                onClick={() => albumService.trackAnalytics(slug, { type: 'share', meta: { channel: 'email' } })}
                className="flex flex-col items-center gap-2"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-2xl text-white">✉️</span>
                Email
              </a>
              <div className="flex flex-col items-center gap-2">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src={albumService.qrUrl(slug)} alt="QR code" className="h-full w-full object-contain" />
                </span>
                QR Code
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm">
              <span className="truncate" style={{ color: 'var(--muted)' }}>{url}</span>
              <button onClick={copy} className="themed-accent-text ml-auto shrink-0 font-medium">Copy</button>
            </div>

            <button onClick={() => setOpen(false)} className="mt-5 w-full text-sm" style={{ color: 'var(--muted)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
