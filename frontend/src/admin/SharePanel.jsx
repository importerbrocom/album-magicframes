import { useState } from 'react';
import { albumService } from '../services/albumService';

/**
 * Post-creation share panel: copy link / copy password / WhatsApp / QR
 * (spec section 43).
 */
export default function SharePanel({ album, share, password }) {
  const [copied, setCopied] = useState('');

  const copy = (text, which) => {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(''), 1600);
  };

  const url = share?.url || album?.public_url;

  return (
    <div className="themed-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">🎉</span>
        <h2 className="font-heading text-2xl">Album Ready to Share</h2>
      </div>

      <div className="space-y-3">
        <Field label="Share Link" value={url} onCopy={() => copy(url, 'link')} copied={copied === 'link'} />
        {password && (
          <Field label="Password" value={password} onCopy={() => copy(password, 'pw')} copied={copied === 'pw'} />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a href={share?.whatsapp} target="_blank" rel="noreferrer" className="btn-accent !rounded-lg text-sm">
          Share on WhatsApp
        </a>
        <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-black/15 px-4 py-2 text-sm">
          Open Album
        </a>
      </div>

      {album?.slug && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>QR Code</p>
          <img
            src={albumService.qrUrl(album.slug)}
            alt="Album QR code"
            className="h-40 w-40 rounded-xl border border-black/10 bg-white p-2"
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onCopy, copied }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2">
        <span className="truncate text-sm">{value}</span>
        <button onClick={onCopy} className="themed-accent-text ml-auto shrink-0 text-sm font-medium">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
