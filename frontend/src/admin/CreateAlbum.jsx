import { useState } from 'react';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';
import SharePanel from './SharePanel';
import { AMBIENT_EFFECTS, AMBIENT_SPEEDS } from '../components/ambientEffects';

/** Date 1 year from today as YYYY-MM-DD (default album expiry). */
function oneYearFromToday() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

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
    event_date: '',
    google_drive_url: '',
    password: '',
    description: '',
    tagline: '',
    cover_image_url: '',
    film_url: '',
    video_gallery_url: '',
    theme: 'akhila', // fixed theme — no picker
    ambient_effect: 'auto',
    ambient_speed: 'normal',
    ambient_count: '',
    allow_download: true,
    allow_share: true,
    instagram_url: '',
    whatsapp_url: '',
    facebook_url: '',
    pinterest_url: '',
    expires_at: oneYearFromToday(), // default: 1 year, editable below
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
      if (!payload.film_url) delete payload.film_url;
      if (!payload.video_gallery_url) delete payload.video_gallery_url;
      if (!payload.event_date) delete payload.event_date;
      if (payload.ambient_count === '') delete payload.ambient_count;
      // Drop empty optional URL fields so they don't fail the 'url' rule.
      for (const k of ['instagram_url', 'whatsapp_url', 'facebook_url', 'pinterest_url']) {
        if (!payload[k]) delete payload[k];
      }
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
          <input value={form.title} onChange={set('title')} placeholder="Our Wedding Journey · A Day to Remember · …" className="inp" />
        </Field>
        <Field label="Event Date (optional)" error={err('event_date')}>
          <input type="date" value={form.event_date} onChange={set('event_date')} className="inp" />
        </Field>
        {/* Photos source */}
        <div className="rounded-lg border border-black/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Photo Gallery</p>
          <Field label="Google Drive Folder Link (photos)" error={err('google_drive_url')}>
            <input value={form.google_drive_url} onChange={set('google_drive_url')} placeholder="https://drive.google.com/drive/folders/…" className="inp" />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              The folder that holds your event sub-folders and photos.
            </p>
          </Field>
        </div>

        {/* Teaser film source — a SEPARATE upload from the photo folder */}
        <div className="rounded-lg border border-black/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Teaser Film</p>
          <Field label="Teaser Video Link — Google Drive / YouTube / Vimeo / .mp4" error={err('film_url')}>
            <input value={form.film_url} onChange={set('film_url')} placeholder="https://drive.google.com/file/d/… or /folders/… · YouTube · Vimeo · .mp4" className="inp" />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              A separate video for the hero. Paste a <b>Google Drive video</b> link (file or folder), or a YouTube/Vimeo/.mp4 link. Plays over your cover image; streamed securely. Drive folder → the first video inside is used.
            </p>
          </Field>
        </div>

        {/* Video Gallery — a THIRD separate upload: a folder of videos */}
        <div className="rounded-lg border border-black/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Video Gallery</p>
          <Field label="Google Drive Folder Link (videos)" error={err('video_gallery_url')}>
            <input value={form.video_gallery_url} onChange={set('video_gallery_url')} placeholder="https://drive.google.com/drive/folders/…" className="inp" />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              A separate folder of videos shown as their own “Video Gallery” section (distinct from the photos and the teaser). All videos in the folder are listed.
            </p>
          </Field>
        </div>

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

        {/* Social media links — shown as icons on the public album */}
        <div className="rounded-lg border border-black/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Social Media Links (optional)</p>
          <p className="mb-3 text-xs" style={{ color: 'var(--muted)' }}>
            Only the links you fill in appear as icons on the album.
          </p>
          <Field label="Instagram URL" error={err('instagram_url')}>
            <input value={form.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/yourstudio" className="inp" />
          </Field>
          <Field label="WhatsApp URL" error={err('whatsapp_url')}>
            <input value={form.whatsapp_url} onChange={set('whatsapp_url')} placeholder="https://wa.me/919999999999" className="inp" />
          </Field>
          <Field label="Facebook URL" error={err('facebook_url')}>
            <input value={form.facebook_url} onChange={set('facebook_url')} placeholder="https://facebook.com/yourstudio" className="inp" />
          </Field>
          <Field label="Pinterest URL" error={err('pinterest_url')}>
            <input value={form.pinterest_url} onChange={set('pinterest_url')} placeholder="https://pinterest.com/yourstudio" className="inp" />
          </Field>
        </div>

        <Field label="Ambient Effect">
          <select value={form.ambient_effect} onChange={set('ambient_effect')} className="inp">
            {AMBIENT_EFFECTS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            Floating decorative motion (petals, snow, balloons, confetti…).
          </p>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Effect Speed">
            <select value={form.ambient_speed} onChange={set('ambient_speed')} className="inp">
              {AMBIENT_SPEEDS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Particle Count" error={err('ambient_count')}>
            <input type="number" min="0" max="60" value={form.ambient_count} onChange={set('ambient_count')} placeholder="Auto" className="inp" />
          </Field>
        </div>

        <Field label="Expiry Date">
          <input type="date" value={form.expires_at} onChange={set('expires_at')} className="inp" />
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            Defaults to 1 year from today — change it if you need a different expiry.
          </p>
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
