import { useCallback, useEffect, useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import StaffForm from './StaffForm';
import { roleLabel, statusLabel, STATUS_STYLES } from '../lib/permissions';

export default function Staff() {
  usePageMeta({ title: 'Staff | Admin' });

  const [meta, setMeta] = useState({ roles: [], statuses: [], permissions: {}, role_defaults: {} });
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null); // {type, text}
  const [credentials, setCredentials] = useState(null); // {email, password}
  const [confirmDelete, setConfirmDelete] = useState(null); // staff object
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    adminService.staffMeta().then(setMeta).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    adminService
      .staff({ search, role: roleFilter, status: statusFilter })
      .then((res) => setList(res.data || []))
      .catch(() => setNotice({ type: 'error', text: 'Could not load staff.' }))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  // Debounced reload on filter change.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const flash = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCreate = async (fd) => {
    const res = await adminService.createStaff(fd);
    setFormOpen(false);
    load();
    if (res.temporary_password) {
      setCredentials({ email: res.data?.email, password: res.temporary_password });
    }
    flash('success', 'Staff member created.');
  };

  const handleUpdate = async (fd) => {
    await adminService.updateStaff(editing.id, fd);
    setFormOpen(false);
    setEditing(null);
    load();
    flash('success', 'Staff member updated.');
  };

  const changeStatus = async (staff, status) => {
    setBusyId(staff.id);
    try {
      await adminService.updateStaffStatus(staff.id, status);
      load();
      flash('success', `Status set to ${statusLabel(status)}.`);
    } catch (err) {
      flash('error', err.response?.data?.message || 'Could not change status.');
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (staff) => {
    setBusyId(staff.id);
    try {
      const res = await adminService.resetStaffPassword(staff.id);
      setCredentials({ email: staff.email, password: res.temporary_password });
      flash('success', 'Temporary password generated.');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Could not reset password.');
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    const staff = confirmDelete;
    setConfirmDelete(null);
    setBusyId(staff.id);
    try {
      await adminService.deleteStaff(staff.id);
      load();
      flash('success', 'Staff account deleted.');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Could not delete the account.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-semibold">Staff Management</h1>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn-accent"
        >
          + Add staff
        </button>
      </div>

      {notice && (
        <p
          className={`mb-4 rounded-md p-3 text-sm ${
            notice.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
        </p>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="min-w-[200px] flex-1 rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {meta.roles.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 text-sm capitalize"
        >
          <option value="">All statuses</option>
          {meta.statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="👥" title="No staff yet" message="Add your first staff member to get started." />
      ) : (
        <div className="themed-surface overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase" style={{ color: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={s.avatar_url} name={s.name} size={36} />
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {s.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{roleLabel(s.role)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[s.status] || ''
                      }`}
                    >
                      {statusLabel(s.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => {
                          setEditing(s);
                          setFormOpen(true);
                        }}
                        className="rounded border border-black/15 px-2 py-1 hover:bg-black/5"
                      >
                        Edit
                      </button>
                      <select
                        value={s.status}
                        disabled={busyId === s.id}
                        onChange={(e) => changeStatus(s, e.target.value)}
                        className="rounded border border-black/15 px-1.5 py-1 capitalize"
                        title="Change status"
                      >
                        {meta.statuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => resetPassword(s)}
                        disabled={busyId === s.id}
                        className="rounded border border-black/15 px-2 py-1 hover:bg-black/5"
                      >
                        Reset pw
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        disabled={busyId === s.id}
                        className="rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / edit modal */}
      {formOpen && (
        <StaffForm
          meta={meta}
          staff={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={editing ? handleUpdate : handleCreate}
        />
      )}

      {/* Credentials reveal (shown once) */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="font-heading mb-2 text-xl">Login credentials</h2>
            <p className="mb-4 text-sm text-gray-500">
              Share these with the staff member now — the temporary password is shown only once and
              cannot be retrieved later. They must change it on first login.
            </p>
            <dl className="space-y-2 rounded-md bg-gray-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium">{credentials.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Temporary password</dt>
                <dd className="font-mono font-semibold">{credentials.password}</dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => navigator.clipboard?.writeText(`${credentials.email} / ${credentials.password}`)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Copy
              </button>
              <button
                onClick={() => setCredentials(null)}
                className="rounded-md bg-[#161c2d] px-5 py-2 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="font-heading mb-2 text-xl">Delete staff account?</h2>
            <p className="mb-5 text-sm text-gray-600">
              This will permanently remove <span className="font-medium">{confirmDelete.name}</span>
              &apos;s account. Audit records are preserved. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
