import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';
import { firstError } from './Profile';
import Logo from '../components/Logo';

const INPUT = 'w-full rounded-lg border border-black/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-black/40';

/**
 * Shown right after a staff member's first login (or after an admin reset),
 * while user.must_change_password is true. They cannot reach the dashboard
 * until they set a new password. Reuses the same change-password endpoint.
 */
export default function ForcePasswordChange() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  usePageMeta({ title: 'Set a new password' });

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) { setErr('New password and confirmation do not match.'); return; }
    setSaving(true);
    try {
      const res = await adminService.changePassword({
        current_password: current,
        password,
        password_confirmation: confirm,
      });
      if (res.user) setUser(res.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (e2) {
      setErr(firstError(e2, 'Could not change password.'));
    } finally {
      setSaving(false);
    }
  };

  const doLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div data-theme="modern" className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4 text-[var(--text)]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo className="h-16 w-auto" /></div>
        <form onSubmit={submit} className="themed-surface space-y-4 p-6">
          <h1 className="font-heading text-2xl">Set a new password</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Welcome{user?.name ? `, ${user.name}` : ''}. For security, please change your
            temporary password before continuing.
          </p>
          {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}

          <label className="block">
            <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>Current (temporary) password</span>
            <input type="password" className={INPUT} value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>New password (min 8 characters)</span>
            <input type="password" className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>Confirm new password</span>
            <input type="password" className={INPUT} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </label>

          <button disabled={saving} className="btn-accent !rounded-lg w-full text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Change password & continue'}
          </button>
          <button type="button" onClick={doLogout} className="w-full text-center text-xs text-red-600">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
