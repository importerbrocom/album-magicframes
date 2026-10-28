import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';

/**
 * Self-service profile page for both admin and staff:
 *  - View account info
 *  - Edit own name + email
 *  - Change own password
 * Shows success / error feedback after every action.
 */
export default function Profile() {
  const { user, setUser } = useAuth();
  usePageMeta({ title: 'My Profile | Admin' });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl font-semibold">My Profile</h1>

      <AccountInfo user={user} />
      <ProfileForm user={user} onSaved={setUser} />
      <PasswordForm />
    </div>
  );
}

function AccountInfo({ user }) {
  return (
    <div className="themed-surface p-6">
      <h2 className="font-heading mb-3 text-xl">Account</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt style={{ color: 'var(--muted)' }}>Role</dt>
          <dd className="font-medium capitalize">{user?.is_admin ? 'Admin' : 'Staff'}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--muted)' }}>Status</dt>
          <dd className="font-medium capitalize">{user?.status}</dd>
        </div>
      </dl>
    </div>
  );
}

function ProfileForm({ user, onSaved }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await adminService.updateProfile({ name, email });
      onSaved?.(res.user);
      setMsg({ type: 'ok', text: res.message || 'Profile updated.' });
    } catch (err) {
      setMsg({ type: 'err', text: firstError(err, 'Could not update profile.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="themed-surface space-y-4 p-6">
      <h2 className="font-heading text-xl">Edit Profile</h2>
      <Feedback msg={msg} />
      <Field label="Full name">
        <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email">
        <input type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <button disabled={saving} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) {
      setMsg({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }
    setSaving(true);
    try {
      const res = await adminService.changePassword({
        current_password: current,
        password,
        password_confirmation: confirm,
      });
      setMsg({ type: 'ok', text: res.message || 'Password changed.' });
      setCurrent('');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setMsg({ type: 'err', text: firstError(err, 'Could not change password.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="themed-surface space-y-4 p-6">
      <h2 className="font-heading text-xl">Change Password</h2>
      <Feedback msg={msg} />
      <Field label="Current password">
        <input type="password" className={INPUT} value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </Field>
      <Field label="New password (min 8 characters)">
        <input type="password" className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </Field>
      <Field label="Confirm new password">
        <input type="password" className={INPUT} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </Field>
      <button disabled={saving} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
        {saving ? 'Updating…' : 'Change password'}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
      {children}
    </label>
  );
}

// Shared input styling (self-contained so it doesn't depend on a global class).
const INPUT = 'w-full rounded-lg border border-black/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-black/40';

function Feedback({ msg }) {
  if (!msg) return null;
  const ok = msg.type === 'ok';
  return (
    <p className={`rounded-lg p-3 text-sm ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {msg.text}
    </p>
  );
}

export function firstError(err, fallback) {
  const data = err?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return data?.message || fallback;
}
