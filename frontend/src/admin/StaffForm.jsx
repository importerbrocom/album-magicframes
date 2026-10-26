import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import AvatarUploader from './components/AvatarUploader';

export default function StaffForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useAuth();
  usePageMeta({ title: `${isEdit ? 'Edit' : 'Add'} Staff | Admin` });

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    status: 'active',
    must_change_password: true,
    permissions: [],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null); // {email, temporary_password}
  const [loading, setLoading] = useState(isEdit);

  // Roles & permissions catalogue are admin-only endpoints; non-admin staff with
  // staff.* permissions still manage staff but without role/permission editing.
  useEffect(() => {
    if (!isAdmin) return;
    adminService.roles().then(setRoles).catch(() => setRoles([]));
    adminService.permissions().then(setPermissions).catch(() => setPermissions([]));
  }, [isAdmin]);

  useEffect(() => {
    if (!isEdit) return;
    adminService
      .staff(id)
      .then((s) => {
        setForm((f) => ({
          ...f,
          name: s.name,
          email: s.email,
          role_id: s.role_id || '',
          status: s.status,
          permissions: s.permissions || [],
        }));
        setCurrentAvatarUrl(s.avatar_url);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const permGroups = useMemo(() => {
    const groups = {};
    permissions.forEach((p) => {
      (groups[p.group || 'Other'] ||= []).push(p);
    });
    return groups;
  }, [permissions]);

  const togglePerm = (slug) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(slug)
        ? f.permissions.filter((s) => s !== slug)
        : [...f.permissions, slug],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role_id: form.role_id,
        status: form.status,
        permissions: form.permissions,
      };
      if (avatarFile) payload.avatar = avatarFile;

      if (isEdit) {
        if (removeAvatar) payload.remove_avatar = true;
        await adminService.updateStaff(id, payload);
        toast.success('Staff member updated.');
        navigate('/admin/staff');
      } else {
        payload.password = form.password || undefined;
        payload.must_change_password = form.must_change_password;
        const res = await adminService.createStaff(payload);
        setCreated(res.credentials);
        toast.success('Staff member created.');
      }
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      toast.error(err.response?.data?.message || 'Could not save staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k) => errors[k]?.[0];

  if (loading) {
    return <div className="themed-surface mx-auto h-64 max-w-xl skeleton" />;
  }

  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-heading mb-6 text-3xl font-semibold">Staff Account Created</h1>
        <div className="themed-surface space-y-4 p-6">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Share these one-time credentials securely. The temporary password is shown only now and is not
            retrievable later. The staff member must change it on first login.
          </p>
          <div className="rounded-lg bg-black/5 p-4 text-sm">
            <p><span style={{ color: 'var(--muted)' }}>Email:</span> <span className="font-medium">{created.email}</span></p>
            <p className="mt-1">
              <span style={{ color: 'var(--muted)' }}>Temporary password:</span>{' '}
              <span className="font-mono font-medium">{created.temporary_password}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                navigator.clipboard?.writeText(`Email: ${created.email}\nTemporary password: ${created.temporary_password}`)
              }
              className="rounded-lg border border-black/15 px-4 py-2 text-sm"
            >
              Copy credentials
            </button>
            <button onClick={() => navigate('/admin/staff')} className="btn-accent !rounded-lg text-sm">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">{isEdit ? 'Edit Staff' : 'Add Staff Member'}</h1>

      <form onSubmit={submit} className="themed-surface space-y-5 p-6">
        <AvatarUploader
          name={form.name}
          currentUrl={removeAvatar ? null : currentAvatarUrl}
          onSelect={(file) => {
            setAvatarFile(file);
            if (file) setRemoveAvatar(false);
          }}
          onRemove={() => {
            setAvatarFile(null);
            setRemoveAvatar(true);
            setCurrentAvatarUrl(null);
          }}
        />

        <Field label="Full Name" error={err('name')}>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="inp" />
        </Field>

        <Field label="Email Address" error={err('email')}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="inp"
          />
        </Field>

        {isAdmin && (
          <Field label="Role" error={err('role_id')}>
            <select
              value={form.role_id}
              onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}
              className="inp"
            >
              <option value="">Select a role…</option>
              {roles
                .filter((r) => r.slug !== 'super_admin')
                .map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </select>
          </Field>
        )}

        <Field label="Account Status" error={err('status')}>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="inp"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </Field>

        {!isEdit && (
          <>
            <Field
              label="Temporary Password (optional)"
              error={err('password')}
              hint="Leave blank to auto-generate a secure temporary password."
            >
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Auto-generate"
                className="inp"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.must_change_password}
                onChange={(e) => setForm((f) => ({ ...f, must_change_password: e.target.checked }))}
              />
              Require password change on first login
            </label>
          </>
        )}

        {isAdmin && permissions.length > 0 && (
          <div className="border-t border-black/10 pt-4">
            <p className="mb-2 text-sm font-medium">Extra Permissions (optional)</p>
            <p className="mb-3 text-xs" style={{ color: 'var(--muted)' }}>
              These are granted in addition to the role's default permissions.
            </p>
            <div className="space-y-4">
              {Object.entries(permGroups).map(([group, perms]) => (
                <div key={group}>
                  <p className="mb-1 text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{group}</p>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label key={p.slug} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(p.slug)}
                          onChange={() => togglePerm(p.slug)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Staff'}
          </button>
          <button type="button" onClick={() => navigate('/admin/staff')} className="rounded-lg border border-black/15 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </form>

      <style>{`.inp{width:100%;border:1px solid rgba(0,0,0,.15);border-radius:.5rem;padding:.6rem .75rem;font-size:.9rem;outline:none;background:transparent}.inp:focus{border-color:var(--text)}`}</style>
    </div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
