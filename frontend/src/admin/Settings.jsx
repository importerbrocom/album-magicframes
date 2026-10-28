import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';
import { firstError } from './Profile';

const INPUT = 'w-full rounded-lg border border-black/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-black/40';

export default function Settings() {
  const { user } = useAuth();
  usePageMeta({ title: 'Settings | Admin' });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl font-semibold">Settings</h1>

      <div className="themed-surface p-6">
        <h2 className="font-heading mb-3 text-xl">Account</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt style={{ color: 'var(--muted)' }}>Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Email</dt><dd className="font-medium">{user?.email}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Role</dt><dd className="font-medium">{user?.is_admin ? 'Admin' : 'Staff'}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Status</dt><dd className="font-medium capitalize">{user?.status}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/admin/profile" className="rounded-lg border border-black/15 px-4 py-2 text-sm">
            Edit profile &amp; password
          </Link>
          {user?.is_admin && (
            <Link to="/admin/staff" className="rounded-lg border border-black/15 px-4 py-2 text-sm">
              Manage staff
            </Link>
          )}
        </div>
      </div>

      {user?.is_admin && <SocialLinksSettings />}
    </div>
  );
}

function SocialLinksSettings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    adminService
      .settings()
      .then((r) => setForm({
        instagram: r.social_links?.instagram || '',
        whatsapp: r.social_links?.whatsapp || '',
        facebook: r.social_links?.facebook || '',
        pinterest: r.social_links?.pinterest || '',
      }))
      .catch(() => setForm({ instagram: '', whatsapp: '', facebook: '', pinterest: '' }));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await adminService.updateSettings(form);
      setMsg({ type: 'ok', text: res.message || 'Settings saved.' });
    } catch (err) {
      setMsg({ type: 'err', text: firstError(err, 'Could not save settings.') });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="skeleton h-48 w-full rounded-xl" />;

  return (
    <form onSubmit={save} className="themed-surface space-y-4 p-6">
      <div>
        <h2 className="font-heading text-xl">Social Media Links</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          These icons appear on every album. A single album can still override a
          link from its own Edit page. Only filled links are shown.
        </p>
      </div>
      {msg && (
        <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </p>
      )}
      {[
        ['instagram', 'Instagram URL', 'https://instagram.com/yourstudio'],
        ['whatsapp', 'WhatsApp URL', 'https://wa.me/919999999999'],
        ['facebook', 'Facebook URL', 'https://facebook.com/yourstudio'],
        ['pinterest', 'Pinterest URL', 'https://pinterest.com/yourstudio'],
      ].map(([k, label, ph]) => (
        <label key={k} className="block">
          <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
          <input type="url" className={INPUT} value={form[k]} onChange={set(k)} placeholder={ph} />
        </label>
      ))}
      <button disabled={saving} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
        {saving ? 'Saving…' : 'Save social links'}
      </button>
    </form>
  );
}
