import { useEffect, useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';
import EmptyState from '../components/EmptyState';

const ACTION_LABELS = {
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'profile.updated': 'Updated profile',
  'password.changed': 'Changed password',
  'password.reset': 'Reset password (forgot flow)',
  'staff.created': 'Created staff',
  'staff.updated': 'Updated staff',
  'staff.status_changed': 'Changed staff status',
  'staff.password_reset': 'Reset staff password',
  'staff.deleted': 'Deleted staff',
};

function label(action) {
  return ACTION_LABELS[action] || action;
}

export default function AuditLogs() {
  usePageMeta({ title: 'Activity Log | Admin' });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      adminService
        .auditLogs({ search })
        .then((res) => setLogs(res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading mb-6 text-3xl font-semibold">Activity Log</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by actor, target or action…"
        className="mb-4 w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon="📜" title="No activity yet" message="Security and staff actions will appear here." />
      ) : (
        <div className="themed-surface overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase" style={{ color: 'var(--muted)' }}>
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{label(l.action)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                    {l.actor_label || '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                    {l.target_label || '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                    {l.created_at ? new Date(l.created_at).toLocaleString() : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
