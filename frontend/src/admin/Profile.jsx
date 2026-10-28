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
      <AvatarForm user={user} onSaved={setUser} />
      <ProfileForm user={user} onSaved={setUser} />
      <PasswordForm />
    </div>
  );
}

function Avatar({ user, size = 'h-20 w-20' }) {
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="" className={`${size} rounded-full object-cover`} />;
  }
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-black/10 text-xl font-medium`}>
      {initial}
    </div>
  );
}

function AvatarForm({ user, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setMsg({ type: 'err', text: 'Image must be 4MB or smaller.' });
      return;
    }
    setMsg(null);
    setBusy(true);
    try {
      const res = await adminService.uploadAvatar(file);
      onSaved?.(res.user);
      setMsg({ type: 'ok', text: res.message || 'Profile photo updated.' });
    } catch (err) {
      setMsg({ type: 'err', text: firstError(err, 'Could not upload photo.') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await adminService.removeAvatar();
      onSaved?.(res.user);
      setMsg({ type: 'ok', text: res.message || 'Profile photo removed.' });
    } catch (err) {
      setMsg({ type: 'err', text: firstError(err, 'Could not remove photo.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="themed-surface space-y-4 p-6">
      <h2 className="font-heading text-xl">Profile Photo</h2>
      <Feedback msg={msg} />
      <div className="flex items-center gap-5">
        <Avatar user={user} />
        <div className="flex flex-wrap gap-2">
          <label className={`cursor-pointer rounded-lg border border-black/15 px-4 py-2 text-sm ${busy ? 'pointer-events-none opacity-50' : ''}`}>
            {user?.avatar_url ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPick} disabled={busy} />
          </label>
          {user?.avatar_url && (
            <button onClick={remove} disabled={busy} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 disabled:opacity-50">
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>JPG, PNG or WebP. Max 4MB.</p>
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
