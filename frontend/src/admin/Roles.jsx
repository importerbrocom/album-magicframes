import { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Roles() {
  const toast = useToast();
  usePageMeta({ title: 'Roles & Permissions | Admin' });

  const [roles, setRoles] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [editing, setEditing] = useState(null); // role being edited {id, permissions:[]}
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminService.roles().then(setRoles).catch(() => setRoles([]));
    adminService.permissions().then(setPermissions).catch(() => setPermissions([]));
  };

  useEffect(load, []);

  const permGroups = useMemo(() => {
    const groups = {};
    permissions.forEach((p) => {
      (groups[p.group || 'Other'] ||= []).push(p);
    });
    return groups;
  }, [permissions]);

  const openEdit = (role) => setEditing({ ...role, permissions: [...(role.permissions || [])] });

  const togglePerm = (slug) =>
    setEditing((r) => ({
      ...r,
      permissions: r.permissions.includes(slug)
        ? r.permissions.filter((s) => s !== slug)
        : [...r.permissions, slug],
    }));

  const save = async () => {
    setSaving(true);
    try {
      await adminService.updateRole(editing.id, { permissions: editing.permissions });
      toast.success('Role permissions updated.');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update role.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-semibold">Roles &amp; Permissions</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {roles === null &&
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="themed-surface h-40 skeleton" />)}
        {roles?.map((role) => (
          <div key={role.id} className="themed-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-xl">{role.name}</h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{role.description}</p>
              </div>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {role.users_count ?? 0} member{(role.users_count ?? 0) === 1 ? '' : 's'}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {role.slug === 'super_admin' ? (
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs">All permissions</span>
              ) : (
                (role.permissions || []).map((p) => (
                  <span key={p} className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{p}</span>
                ))
              )}
              {role.slug !== 'super_admin' && (role.permissions || []).length === 0 && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>No permissions assigned.</span>
              )}
            </div>

            {role.slug !== 'super_admin' && (
              <button onClick={() => openEdit(role)} className="mt-4 text-sm underline">
                Edit permissions
              </button>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="themed-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading mb-4 text-xl">Edit {editing.name} permissions</h3>
            <div className="space-y-4">
              {Object.entries(permGroups).map(([group, perms]) => (
                <div key={group}>
                  <p className="mb-1 text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{group}</p>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label key={p.slug} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editing.permissions.includes(p.slug)}
                          onChange={() => togglePerm(p.slug)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-black/15 px-4 py-2 text-sm">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
