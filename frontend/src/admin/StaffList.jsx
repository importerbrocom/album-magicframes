import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import ConfirmDialog from './components/ConfirmDialog';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-200 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

function StatusPill({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[status] || ''}`}>
      {status}
    </span>
  );
}

function Avatar({ url, name, size = 40 }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10 text-sm"
      style={{ width: size, height: size }}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span>{initials}</span>}
    </div>
  );
}

export default function StaffList() {
  const { isAdmin, hasPermission } = useAuth();
  const toast = useToast();
  usePageMeta({ title: 'Staff | Admin' });

  const [staff, setStaff] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null); // staff row to delete
  const [busy, setBusy] = useState(false);

  const canCreate = isAdmin || hasPermission('staff.create');
  const canDelete = isAdmin || hasPermission('staff.delete');
  const canReset = isAdmin || hasPermission('staff.reset_password');
  const canUpdate = isAdmin || hasPermission('staff.update');

  const load = () =>
    adminService
      .staffList({ q, status })
      .then((r) => setStaff(r.data))
      .catch(() => setStaff([]));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  const changeStatus = async (row, next) => {
    try {
      await adminService.updateStaffStatus(row.id, next);
      toast.success(`${row.name} set to ${next}.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.');
    }
  };

  const resetPw = async (row) => {
    try {
      const res = await adminService.resetStaffPassword(row.id, 'temporary');
      if (res.credentials?.temporary_password) {
        toast.info(`Temp password for ${row.email}: ${res.credentials.temporary_password}`, 12000);
      } else {
        toast.success(res.message || 'Password reset.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password.');
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await adminService.deleteStaff(confirm.id);
      toast.success(`${confirm.name} deleted.`);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete staff member.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold">Staff Management</h1>
        {canCreate && (
          <Link to="/admin/staff/new" className="btn-accent !rounded-lg text-sm">
            + Add Staff
          </Link>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-xs rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="themed-surface overflow-hidden">
        {/* Desktop table */}
        <table className="hidden w-full text-left text-sm md:table">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff === null &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="px-4 py-3" colSpan={5}>
                    <div className="skeleton h-8 w-full rounded" />
                  </td>
                </tr>
              ))}
            {staff?.map((row) => (
              <tr key={row.id} className="border-b border-black/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={row.avatar_url} name={row.name} />
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{row.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{(row.role_name || row.role || '').replace('_', ' ')}</td>
                <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                  {row.last_login_at ? new Date(row.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {canUpdate && (
                      <Link to={`/admin/staff/${row.id}`} className="text-xs underline">Edit</Link>
                    )}
                    {canUpdate && row.status === 'active' && (
                      <button onClick={() => changeStatus(row, 'suspended')} className="text-xs text-amber-700">Suspend</button>
                    )}
                    {canUpdate && row.status !== 'active' && (
                      <button onClick={() => changeStatus(row, 'active')} className="text-xs text-green-700">Activate</button>
                    )}
                    {canReset && (
                      <button onClick={() => resetPw(row)} className="text-xs text-charcoal underline">Reset PW</button>
                    )}
                    {canDelete && (
                      <button onClick={() => setConfirm(row)} className="text-xs text-red-600">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {staff?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm" style={{ color: 'var(--muted)' }} colSpan={5}>
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="divide-y divide-black/5 md:hidden">
          {staff?.map((row) => (
            <div key={row.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar url={row.avatar_url} name={row.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.name}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{row.email}</p>
                </div>
                <StatusPill status={row.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="capitalize" style={{ color: 'var(--muted)' }}>
                  {(row.role_name || row.role || '').replace('_', ' ')}
                </span>
                {canUpdate && <Link to={`/admin/staff/${row.id}`} className="underline">Edit</Link>}
                {canUpdate && row.status === 'active' && (
                  <button onClick={() => changeStatus(row, 'suspended')} className="text-amber-700">Suspend</button>
                )}
                {canUpdate && row.status !== 'active' && (
                  <button onClick={() => changeStatus(row, 'active')} className="text-green-700">Activate</button>
                )}
                {canReset && <button onClick={() => resetPw(row)} className="underline">Reset PW</button>}
                {canDelete && <button onClick={() => setConfirm(row)} className="text-red-600">Delete</button>}
              </div>
            </div>
          ))}
          {staff?.length === 0 && (
            <p className="p-4 text-sm" style={{ color: 'var(--muted)' }}>No staff members found.</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Delete staff member?"
        message={confirm ? `This permanently removes ${confirm.name}'s account. Audit records are preserved.` : ''}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
