import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';
import Avatar from '../components/Avatar';
import { roleLabel, statusLabel } from '../lib/permissions';

export default function Profile() {
  const { user, updateUser } = useAuth();
  usePageMeta({ title: 'Profile | Admin' });

  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileRef = useRef(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // {type, text}

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // Load fresh profile once.
  useEffect(() => {
    adminService
      .profile()
      .then((p) => {
        setProfile(p);
        setName(p.name || '');
        setEmail(p.email || '');
      })
      .catch(() => {});
  }, []);

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (removeAvatar) fd.append('remove_avatar', '1');

      const updated = await adminService.updateProfile(fd);
      setProfile(updated);
      updateUser({ ...user, ...updated });
      setAvatarFile(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Could not update your profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setSavingPw(true);
    try {
      await adminService.changePassword({
        current_password: currentPw,
        password: newPw,
        password_confirmation: confirmPw,
      });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setPwMsg({
        type: 'error',
        text:
          err.response?.data?.errors?.current_password?.[0] ||
          err.response?.data?.message ||
          'Could not change your password.',
      });
    } finally {
      setSavingPw(false);
    }
  };

  const shownAvatar = removeAvatar ? null : avatarPreview || profile?.avatar_url;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">Profile</h1>

      {/* Account info */}
      <div className="themed-surface mb-6 p-6">
        <h2 className="font-heading mb-4 text-xl">Account information</h2>
        <div className="flex items-center gap-4">
          <Avatar src={profile?.avatar_url} name={profile?.name} size={64} />
          <dl className="grid flex-1 grid-cols-2 gap-3 text-sm">
            <div>
              <dt style={{ color: 'var(--muted)' }}>Role</dt>
              <dd className="font-medium">{roleLabel(profile?.role)}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted)' }}>Status</dt>
              <dd className="font-medium">{statusLabel(profile?.status)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Edit profile */}
      <form onSubmit={saveProfile} className="themed-surface mb-6 p-6">
        <h2 className="font-heading mb-4 text-xl">Edit profile</h2>

        <div className="mb-5 flex items-center gap-4">
          <Avatar src={shownAvatar} name={name} size={72} />
          <div className="space-x-3 text-sm">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5"
            >
              {shownAvatar ? 'Change photo' : 'Upload photo'}
            </button>
            {shownAvatar && (
              <button type="button" onClick={onRemoveAvatar} className="text-red-600">
                Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPickAvatar}
            />
            <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              JPG, PNG or WEBP, up to 4 MB.
            </p>
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
        />

        <label className="mb-1 block text-sm font-medium">Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
        />

        {profileMsg && (
          <p className={`mb-3 text-sm ${profileMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {profileMsg.text}
          </p>
        )}

        <button type="submit" disabled={savingProfile} className="btn-accent disabled:opacity-50">
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={savePassword} className="themed-surface p-6">
        <h2 className="font-heading mb-4 text-xl">Change password</h2>

        <label className="mb-1 block text-sm font-medium">Current password</label>
        <input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          autoComplete="current-password"
          className="mb-4 w-full rounded-md border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
        />

        <label className="mb-1 block text-sm font-medium">New password</label>
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          autoComplete="new-password"
          className="mb-1 w-full rounded-md border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <p className="mb-4 text-xs" style={{ color: 'var(--muted)' }}>
          At least 8 characters, including letters and numbers.
        </p>

        <label className="mb-1 block text-sm font-medium">Confirm new password</label>
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          autoComplete="new-password"
          className="mb-4 w-full rounded-md border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
        />

        {pwMsg && (
          <p className={`mb-3 text-sm ${pwMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {pwMsg.text}
          </p>
        )}

        <button type="submit" disabled={savingPw} className="btn-accent disabled:opacity-50">
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
