import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';
import { firstError } from './Profile';

const INPUT = 'w-full rounded-lg border border-black/15 bg-white/60 px-3 py-2 text-sm outline-none focus:border-black/40';

/**
 * Staff management (admin only). List, search/filter, create (email + temp
 * password), edit, activate/suspend, reset password, delete.
 */
export default function Staff() {
  const { user } = useAuth();
  usePageMeta({ title: 'Staff | Admin' });

  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [banner, setBanner] = useState(null);

  const load = () =>
    adminService
      .staff({ q: q || undefined, status: status || undefined })
      .then(setList)
      .catch((e) => setBanner({ type: 'err', text: firstError(e, 'Could not load staff.') }));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  if (!user?.is_admin) {
    return <p className="text-sm text-red-600">You do not have access to staff management.</p>;
  }

  const onSaved = (text) => {
    setShowForm(false);
    setEditing(null);
    setBanner({ type: 'ok', text });
    load();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold">Staff</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-accent !rounded-lg text-sm"
        >
          ＋ Add staff
        </button>
      </div>

      {banner && (
        <p className={`rounded-lg p-3 text-sm ${banner.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {banner.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className={`${INPUT} max-w-xs`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${INPUT} max-w-[10rem]`}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {!list ? (
        <div className="skeleton h-40 w-full rounded-xl" />
      ) : list.length === 0 ? (
        <p className="themed-surface p-6 text-sm" style={{ color: 'var(--muted)' }}>
          No staff members yet. Click “Add staff” to create one.
        </p>
      ) : (
        <div className="themed-surface divide-y divide-black/10 overflow-hidden">
          {list.map((s) => (
            <StaffRow
              key={s.id}
              staff={s}
              onEdit={() => { setEditing(s); setShowForm(true); }}
              onChanged={load}
              onBanner={setBanner}
            />
          ))}
        </div>
      )}

      {showForm && (
        <StaffForm
          staff={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function StaffRow({ staff, onEdit, onChanged, onBanner }) {
  const [busy, setBusy] = useState(false);

  const toggleStatus = async () => {
    const next = staff.status === 'active' ? 'suspended' : 'active';
    setBusy(true);
    try {
      await adminService.updateStaff(staff.id, { status: next });
      onBanner({ type: 'ok', text: `Staff ${next === 'active' ? 'activated' : 'suspended'}.` });
      onChanged();
    } catch (e) {
      onBanner({ type: 'err', text: firstError(e, 'Could not update status.') });
    } finally {
      setBusy(false);
    }
  };

  const resetPw = async () => {
    const pw = window.prompt(`Set a new temporary password for ${staff.name} (min 8 chars). They must change it on next login.`);
    if (!pw) return;
    if (pw.length < 8) { onBanner({ type: 'err', text: 'Password must be at least 8 characters.' }); return; }
    setBusy(true);
    try {
      await adminService.resetStaffPassword(staff.id, pw);
      onBanner({ type: 'ok', text: 'Password reset. Share the new temporary password with the staff member.' });
    } catch (e) {
      onBanner({ type: 'err', text: firstError(e, 'Could not reset password.') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${staff.name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminService.deleteStaff(staff.id);
      onBanner({ type: 'ok', text: 'Staff member deleted.' });
      onChanged();
    } catch (e) {
      onBanner({ type: 'err', text: firstError(e, 'Could not delete.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{staff.name}</p>
        <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{staff.email}</p>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
        {staff.status}
      </span>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={onEdit} className="rounded-lg border border-black/15 px-3 py-1.5 text-xs disabled:opacity-50">Edit</button>
        <button disabled={busy} onClick={toggleStatus} className="rounded-lg border border-black/15 px-3 py-1.5 text-xs disabled:opacity-50">
          {staff.status === 'active' ? 'Suspend' : 'Activate'}
        </button>
        <button disabled={busy} onClick={resetPw} className="rounded-lg border border-black/15 px-3 py-1.5 text-xs disabled:opacity-50">Reset password</button>
        <button disabled={busy} onClick={remove} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50">Delete</button>
      </div>
    </div>
  );
}

function StaffForm({ staff, onClose, onSaved }) {
  const isEdit = !!staff;
  const [name, setName] = useState(staff?.name || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      if (isEdit) {
        await adminService.updateStaff(staff.id, { name, email });
        onSaved('Staff member updated.');
      } else {
        await adminService.createStaff({ name, email, password });
        onSaved('Staff member created. They must change the temporary password on first login.');
      }
    } catch (e2) {
      setErr(firstError(e2, 'Could not save staff member.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-xl bg-[var(--surface)] p-6 shadow-xl"
      >
        <h2 className="font-heading text-xl">{isEdit ? 'Edit staff member' : 'Add staff member'}</h2>
        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}

        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>Full name</span>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>Email</span>
          <input type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {!isEdit && (
          <label className="block">
            <span className="mb-1 block text-sm" style={{ color: 'var(--muted)' }}>Temporary password (min 8 chars)</span>
            <input type="text" className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <span className="mt-1 block text-xs" style={{ color: 'var(--muted)' }}>
              The staff member will be required to change this on their first login.
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-black/15 px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving} className="btn-accent !rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
