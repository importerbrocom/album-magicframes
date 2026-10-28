import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Settings() {
  const { user } = useAuth();
  usePageMeta({ title: 'Settings | Admin' });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl font-semibold">Settings</h1>

      <div className="themed-surface p-6">
        <h2 className="font-heading mb-3 text-xl">Account</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt style={{ color: 'var(--muted)' }}>Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Email</dt><dd className="font-medium">{user?.email}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Role</dt><dd className="font-medium">{user?.is_admin ? 'Admin' : 'Staff'}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Status</dt><dd className="font-medium capitalize">{user?.status}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/admin/profile" className="rounded-lg border border-black/15 px-4 py-2 text-sm">
            Edit profile & password
          </Link>
          {user?.is_admin && (
            <Link to="/admin/staff" className="rounded-lg border border-black/15 px-4 py-2 text-sm">
              Manage staff
            </Link>
          )}
        </div>
      </div>

      {user?.is_admin && (
        <div className="themed-surface p-6">
          <h2 className="font-heading mb-2 text-xl">Staff accounts</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Create logins for your team. Staff get the same dashboard as you, but cannot manage
            other staff accounts or change admin settings. New staff must set their own password on
            first login.
          </p>
        </div>
      )}
    </div>
  );
}
