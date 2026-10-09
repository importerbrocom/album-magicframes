import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';

const THEMES = ['classic', 'modern', 'cinematic', 'minimal', 'luxury', 'traditional'];

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
        google_drive_url: a.google_drive_url || '',
        password: '',
        description: a.description || '',
        tagline: a.tagline || '',
        cover_image_url: a.cover_image_url || '',
        theme: a.theme || 'classic',
        status: a.status || 'active',
        allow_download: !!a.allow_download,
        allow_share: !!a.allow_share,
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
          ['google_drive_url', 'Google Drive Folder Link'],
          ['tagline', 'Tagline'],
          ['cover_image_url', 'Cover Image URL'],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <input value={form[k]} onChange={set(k)} className="inp" />
            {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>}
          </div>
        ))}
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
        <div className="flex gap-6 border-t border-black/10 pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_download} onChange={(e) => setForm((f) => ({ ...f, allow_download: e.target.checked }))} />
            Allow Downloads
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_share} onChange={(e) => setForm((f) => ({ ...f, allow_share: e.target.checked }))} />
            Allow Sharing
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
