import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import { roleLabel } from '../lib/permissions';

/**
 * Add / edit staff modal. `meta` carries roles, statuses, the permission
 * catalog and per-role default permissions (from GET /admin/staff/meta).
 * `staff` is null for create, or the staff object for edit.
 */
export default function StaffForm({ meta, staff, onClose, onSubmit }) {
  const editing = !!staff;

  const [name, setName] = useState(staff?.name || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [role, setRole] = useState(staff?.role || meta.roles?.[0] || 'assistant');
  const [status, setStatus] = useState(staff?.status || 'active');
  const [permissions, setPermissions] = useState(
    staff?.permissions || meta.role_defaults?.[staff?.role || meta.roles?.[0]] || [],
  );
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // When creating, switching role auto-applies that role's default permissions.
  const prevRole = useRef(role);
  useEffect(() => {
    if (!editing && prevRole.current !== role) {
      setPermissions(meta.role_defaults?.[role] || []);
    }
    prevRole.current = role;
  }, [role, editing, meta.role_defaults]);

  const togglePermission = (key) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      fd.append('role', role);
      fd.append('status', status);
      permissions.forEach((p) => fd.append('permissions[]', p));
      if (!editing && password) fd.append('password', password);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (editing && removeAvatar) fd.append('remove_avatar', '1');

      await onSubmit(fd);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          Object.values(err.response?.data?.errors || {})?.[0]?.[0] ||
          'Could not save the staff member.',
      );
      setSubmitting(false);
    }
  };

  const shownAvatar = removeAvatar ? null : avatarPreview || staff?.avatar_url;
  const permissionEntries = Object.entries(meta.permissions || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl">{editing ? 'Edit staff member' : 'Add staff member'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={shownAvatar} name={name} size={64} />
            <div className="text-sm">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                {shownAvatar ? 'Change photo' : 'Upload photo'}
              </button>
              {shownAvatar && editing && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    setRemoveAvatar(true);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="ml-3 text-red-600"
                >
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
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
            />
          </div>

          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Temporary password <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                The staff member will be required to change it on first login.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
              >
                {(meta.roles || []).map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 capitalize focus:border-gray-900 focus:outline-none"
              >
                {(meta.statuses || []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {permissionEntries.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={permissions.includes(key)}
                    onChange={() => togglePermission(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[#161c2d] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
