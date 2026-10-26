import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';
import { AMBIENT_EFFECTS, AMBIENT_SPEEDS } from '../components/ambientEffects';

const THEMES = ['classic', 'modern', 'cinematic', 'minimal', 'luxury', 'traditional', 'akhila'];

export default function EditAlbum() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  usePageMeta({ title: 'Edit Album | Admin' });

  useEffect(() => {
    adminService.album(id).then((a) =>
      setForm({
        client_name: a.client_name || '',
        title: a.title || '',
        category: a.category || '',
        event_date: a.event_date || '',
        google_drive_url: a.google_drive_url || '',
        password: '',
        description: a.description || '',
        tagline: a.tagline || '',
        cover_image_url: a.cover_image_url || '',
        film_url: a.film_url || '',
        theme: a.theme || 'classic',
        ambient_effect: a.ambient_effect || 'auto',
        ambient_speed: a.ambient_speed || 'normal',
        ambient_count: a.ambient_count ?? '',
        status: a.status || 'active',
        allow_download: !!a.allow_download,
        allow_share: !!a.allow_share,
        allow_comments: a.allow_comments !== false,
        allow_enquiries: a.allow_enquiries !== false,
        google_review_url: a.google_review_url || '',
      }),
    );
  }, [id]);

  if (!form) return <div className="skeleton h-96 w-full rounded-xl" />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await adminService.updateAlbum(id, payload);
      navigate(`/admin/albums/${id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || { _: [err.response?.data?.message || 'Save failed.'] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">Edit Album</h1>
      {errors._ && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors._[0]}</div>}
      <form onSubmit={save} className="themed-surface space-y-4 p-6">
        {[
          ['client_name', 'Client Name'],
          ['title', 'Album Title'],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <input value={form[k]} onChange={set(k)} className="inp" />
            {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>}
          </div>
        ))}

        {/* Photo gallery source */}
        <div className="rounded-lg border border-black/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Photo Gallery</p>
          <label className="mb-1 block text-sm font-medium">Google Drive Folder Link (photos)</label>
          <input value={form.google_drive_url} onChange={set('google_drive_url')} className="inp" />
          {errors.google_drive_url && <p className="mt-1 text-xs text-red-600">{errors.google_drive_url[0]}</p>}
        </div>

        {/* Teaser film — a SEPARATE upload from the photo folder */}
        <div className="rounded-lg border border-black/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Teaser Film</p>
          <label className="mb-1 block text-sm font-medium">Teaser Video Link — Google Drive / YouTube / Vimeo / .mp4</label>
          <input value={form.film_url} onChange={set('film_url')} className="inp" placeholder="https://drive.google.com/file/d/… or /folders/… · YouTube · Vimeo · .mp4" />
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            A separate video for the hero. Drive file or folder link, or YouTube/Vimeo/.mp4.
          </p>
          {errors.film_url && <p className="mt-1 text-xs text-red-600">{errors.film_url[0]}</p>}
        </div>

        {[
          ['tagline', 'Tagline'],
          ['cover_image_url', 'Cover Image URL'],
          ['google_review_url', 'Google Review Link (optional)'],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <input value={form[k]} onChange={set(k)} className="inp" />
            {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>}
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Category (optional)</label>
            <input value={form.category} onChange={set('category')} className="inp" placeholder="Wedding · Birthday · Maternity…" list="mf-categories" />
            <datalist id="mf-categories">
              {['Wedding', 'Engagement', 'Pre Wedding', 'Birthday', 'Maternity', 'Baby Shower', 'Newborn', 'Anniversary', 'Graduation', 'Family', 'Event'].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category[0]}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Event Date (optional)</label>
            <input type="date" value={form.event_date} onChange={set('event_date')} className="inp" />
            {errors.event_date && <p className="mt-1 text-xs text-red-600">{errors.event_date[0]}</p>}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New Password (leave blank to keep)</label>
          <input value={form.password} onChange={set('password')} className="inp" placeholder="••••••" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={2} className="inp" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Theme</label>
            <select value={form.theme} onChange={set('theme')} className="inp capitalize">
              {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select value={form.status} onChange={set('status')} className="inp capitalize">
              {['active', 'disabled', 'draft'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Ambient Effect</label>
          <select value={form.ambient_effect} onChange={set('ambient_effect')} className="inp">
            {AMBIENT_EFFECTS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            Floating decorative motion on the album (e.g. petals, snow, balloons, confetti). “Auto” matches the category.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Effect Speed</label>
            <select value={form.ambient_speed} onChange={set('ambient_speed')} className="inp">
              {AMBIENT_SPEEDS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Particle Count</label>
            <input type="number" min="0" max="60" value={form.ambient_count} onChange={set('ambient_count')} className="inp" placeholder="Auto" />
            {errors.ambient_count && <p className="mt-1 text-xs text-red-600">{errors.ambient_count[0]}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-black/10 pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_download} onChange={(e) => setForm((f) => ({ ...f, allow_download: e.target.checked }))} />
            Allow Downloads
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_share} onChange={(e) => setForm((f) => ({ ...f, allow_share: e.target.checked }))} />
            Allow Sharing
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_comments} onChange={(e) => setForm((f) => ({ ...f, allow_comments: e.target.checked }))} />
            Allow Comments
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_enquiries} onChange={(e) => setForm((f) => ({ ...f, allow_enquiries: e.target.checked }))} />
            Allow Enquiries
          </label>
        </div>
        <button disabled={saving} className="btn-accent w-full !rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
      <style>{`.inp{width:100%;border:1px solid rgba(0,0,0,.15);border-radius:.5rem;padding:.6rem .75rem;font-size:.9rem;outline:none;background:transparent}.inp:focus{border-color:var(--text)}`}</style>
    </div>
  );
}
