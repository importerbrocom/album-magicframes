import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

const Card = ({ to, title, desc }) => (
  <Link to={to} className="themed-surface block p-5 transition hover:bg-black/[0.02]">
    <h2 className="font-heading text-lg">{title}</h2>
    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{desc}</p>
  </Link>
);

export default function Settings() {
  const { user, isAdmin, hasPermission } = useAuth();
  usePageMeta({ title: 'Settings | Admin' });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl font-semibold">Settings</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card to="/admin/profile" title="Profile Settings" desc="Update your name, email, photo and password." />
        {(isAdmin || hasPermission('staff.view')) && (
          <Card to="/admin/staff" title="Staff Management" desc="Add, edit and manage staff accounts." />
        )}
        {isAdmin && (
          <Card to="/admin/roles" title="Roles & Permissions" desc="Define what each role can access." />
        )}
        {isAdmin && (
          <Card to="/admin/activity" title="Activity Log" desc="Review staff and security activity." />
        )}
      </div>

      <div className="themed-surface p-6">
        <h2 className="font-heading mb-3 text-xl">Account</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt style={{ color: 'var(--muted)' }}>Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Email</dt><dd className="font-medium">{user?.email}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Role</dt><dd className="font-medium capitalize">{user?.role?.replace('_', ' ')}</dd></div>
        </dl>
      </div>
    </div>
  );
}
