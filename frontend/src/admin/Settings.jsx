import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Settings() {
  const { user } = useAuth();
  usePageMeta({ title: 'Settings | Admin' });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">Settings</h1>
      <div className="themed-surface p-6">
        <h2 className="font-heading mb-3 text-xl">Account</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt style={{ color: 'var(--muted)' }}>Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Email</dt><dd className="font-medium">{user?.email}</dd></div>
          <div><dt style={{ color: 'var(--muted)' }}>Role</dt><dd className="font-medium capitalize">{user?.role?.replace('_', ' ')}</dd></div>
        </dl>
        <p className="mt-6 text-xs" style={{ color: 'var(--muted)' }}>
          Role-based access control (super admin, photographer, editor, assistant) is wired into the
          backend policies and ready to expand.
        </p>
      </div>
    </div>
  );
}
