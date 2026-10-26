import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { isAdmin, roleLabel } from '../lib/permissions';

export default function Settings() {
  const { user } = useAuth();
  usePageMeta({ title: 'Settings | Admin' });
  const admin = isAdmin(user);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">Settings</h1>

      <div className="themed-surface mb-6 p-6">
        <h2 className="font-heading mb-3 text-xl">Account</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt style={{ color: 'var(--muted)' }}>Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Email</dt><dd className="font-medium">{user?.email}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Role</dt><dd className="font-medium">{roleLabel(user?.role)}</dd></div>
        </dl>
        <div className="mt-6">
          <Link to="/admin/profile" className="btn-accent inline-block">Manage profile</Link>
        </div>
      </div>

      {admin && (
        <div className="themed-surface p-6">
          <h2 className="font-heading mb-3 text-xl">Administration</h2>
          <p className="mb-4 text-sm" style={{ color: 'var(--muted)' }}>
            Manage staff accounts, assign roles and permissions, and review the security activity log.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/staff" className="rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/5">
              Staff management
            </Link>
            <Link to="/admin/activity" className="rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/5">
              Activity log
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
