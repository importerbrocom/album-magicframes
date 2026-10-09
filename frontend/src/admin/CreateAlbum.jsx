import { useState } from 'react';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';
import SharePanel from './SharePanel';

const THEMES = ['classic', 'modern', 'cinematic', 'minimal', 'luxury', 'traditional'];

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3">
    <span className="text-sm">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-charcoal' : 'bg-black/20'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  </label>
);

export default function CreateAlbum() {
  usePageMeta({ title: 'Create Album | Magic Frames' });
  const [form, setForm] = useState({
    client_name: '',
    title: '',
    google_drive_url: '',
    password: '',
    description: '',
    tagline: '',
    cover_image_url: '',
    theme: 'classic',
    allow_download: true,
    allow_share: true,
    expires_at: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.expires_at) delete payload.expires_at;
      const res = await adminService.createAlbum(payload);
      setCreated(res);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || { _: [err.response.data.message] });
      } else {
        setErrors({ _: [err.response?.data?.message || 'Could not create album.'] });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-heading mb-6 text-3xl font-semibold">Album Created Successfully</h1>
        <SharePanel album={created.album.data || created.album} share={created.share} password={form.password} />
        <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
          Synchronization with Google Drive has started in the background. Photos will appear as they are detected.
        </p>
      </div>
    );
  }

  const err = (k) => errors[k]?.[0];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">Create New Album</h1>

      {errors._ && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors._[0]}</div>}

      <form onSubmit={submit} className="themed-surface space-y-5 p-6">
        <Field label="Client Name" error={err('client_name')}>
          <input value={form.client_name} onChange={set('client_name')} placeholder="Rahul & Anjali" className="inp" />
        </Field>
        <Field label="Album Title" error={err('title')}>
          <input value={form.title} onChange={set('title')} placeholder="Our Wedding Journey" className="inp" />
        </Field>
        <Field label="Google Drive Folder Link" error={err('google_drive_url')}>
          <input value={form.google_drive_url} onChange={set('google_drive_url')} placeholder="https://drive.google.com/drive/folders/…" className="inp" />
        </Field>
        <Field label="Access Password" error={err('password')}>
          <input value={form.password} onChange={set('password')} placeholder="RA2026" className="inp" />
        </Field>
        <Field label="Tagline" error={err('tagline')}>
          <input value={form.tagline} onChange={set('tagline')} placeholder="Memories that last forever." className="inp" />
        </Field>
        <Field label="Description" error={err('description')}>
          <textarea value={form.description} onChange={set('description')} rows={2} className="inp" />
        </Field>
        <Field label="Cover Image URL (optional)" error={err('cover_image_url')}>
          <input value={form.cover_image_url} onChange={set('cover_image_url')} placeholder="https://…" className="inp" />
        </Field>

        <Field label="Theme">
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm((f) => ({ ...f, theme: t }))}
                className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                  form.theme === t ? 'border-charcoal bg-black/5 font-medium' : 'border-black/15'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Expiry Date (optional)">
          <input type="date" value={form.expires_at} onChange={set('expires_at')} className="inp" />
        </Field>

        <div className="space-y-3 border-t border-black/10 pt-4">
          <Toggle label="Allow Downloads" checked={form.allow_download} onChange={(v) => setForm((f) => ({ ...f, allow_download: v }))} />
          <Toggle label="Allow Sharing" checked={form.allow_share} onChange={(v) => setForm((f) => ({ ...f, allow_share: v }))} />
        </div>

        <button type="submit" disabled={submitting} className="btn-accent w-full !rounded-lg disabled:opacity-50">
          {submitting ? 'Creating…' : 'CREATE ALBUM'}
        </button>
      </form>

      <style>{`.inp{width:100%;border:1px solid rgba(0,0,0,.15);border-radius:.5rem;padding:.6rem .75rem;font-size:.9rem;outline:none;background:transparent}.inp:focus{border-color:var(--text)}`}</style>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
