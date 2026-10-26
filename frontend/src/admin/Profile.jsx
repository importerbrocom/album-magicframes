import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import AvatarUploader from './components/AvatarUploader';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  usePageMeta({ title: 'Profile | Admin' });

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailErrors, setDetailErrors] = useState({});

  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    adminService.profile().then((p) => {
      setProfile(p);
      setForm({ name: p.name, email: p.email });
    });
  }, []);

  const saveDetails = async (e) => {
    e.preventDefault();
    setDetailErrors({});
    setSavingDetails(true);
    try {
      const res = await adminService.updateProfile(form);
      setProfile(res.data ?? res);
      await refreshUser();
      toast.success(res.message || 'Profile updated.');
    } catch (err) {
      if (err.response?.status === 422) setDetailErrors(err.response.data.errors || {});
      toast.error(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSavingDetails(false);
    }
  };

  const onAvatar = async (file) => {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const res = await adminService.uploadAvatar(file);
      setProfile(res.data ?? res);
      await refreshUser();
      toast.success('Profile photo updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try {
      const res = await adminService.removeAvatar();
      setProfile(res.data ?? res);
      await refreshUser();
      toast.success('Profile photo removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove photo.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setSavingPw(true);
    try {
      const res = await adminService.changePassword(pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast.success(res.message || 'Password changed.');
    } catch (err) {
      if (err.response?.status === 422) setPwErrors(err.response.data.errors || {});
      toast.error(err.response?.data?.message || 'Could not change password.');
    } finally {
      setSavingPw(false);
    }
  };

  const err = (obj, k) => obj[k]?.[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl font-semibold">Profile Settings</h1>

      {/* Profile photo */}
      <div className="themed-surface p-6">
        <h2 className="font-heading mb-4 text-xl">Profile Photo</h2>
        <AvatarUploader
          name={form.name || user?.name}
          currentUrl={profile?.avatar_url}
          onSelect={onAvatar}
          onRemove={removeAvatar}
          disabled={avatarBusy}
        />
      </div>

      {/* Details */}
      <form onSubmit={saveDetails} className="themed-surface space-y-4 p-6">
        <h2 className="font-heading text-xl">Account Details</h2>
        <Field label="Full Name" error={err(detailErrors, 'name')}>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="inp"
          />
        </Field>
        <Field label="Email Address" error={err(detailErrors, 'email')}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="inp"
          />
        </Field>
        <button type="submit" disabled={savingDetails} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
          {savingDetails ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={changePassword} className="themed-surface space-y-4 p-6">
        <h2 className="font-heading text-xl">Change Password</h2>
        <Field label="Current Password" error={err(pwErrors, 'current_password')}>
          <input
            type="password"
            value={pw.current_password}
            onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
            className="inp"
          />
        </Field>
        <Field label="New Password" error={err(pwErrors, 'password')}>
          <input
            type="password"
            value={pw.password}
            onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))}
            className="inp"
          />
        </Field>
        <Field label="Confirm New Password" error={err(pwErrors, 'password_confirmation')}>
          <input
            type="password"
            value={pw.password_confirmation}
            onChange={(e) => setPw((p) => ({ ...p, password_confirmation: e.target.value }))}
            className="inp"
          />
        </Field>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Use at least 8 characters with upper &amp; lower case letters and a number.
        </p>
        <button type="submit" disabled={savingPw} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
          {savingPw ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      {/* Account info */}
      <div className="themed-surface p-6">
        <h2 className="font-heading mb-3 text-xl">Account Information</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt style={{ color: 'var(--muted)' }}>Role</dt>
            <dd className="font-medium capitalize">{(profile?.role_name || profile?.role || '').replace('_', ' ')}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)' }}>Status</dt>
            <dd className="font-medium capitalize">{profile?.status}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)' }}>Last Login</dt>
            <dd className="font-medium">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : '—'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--muted)' }}>Member Since</dt>
            <dd className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</dd>
          </div>
        </dl>
      </div>

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
