import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';

const ACTION_LABELS = {
  'auth.login': 'Logged in',
  'auth.logout': 'Logged out',
  'auth.login_failed': 'Failed login',
  'auth.login_blocked': 'Blocked login (inactive)',
  'staff.created': 'Created staff',
  'staff.updated': 'Updated staff',
  'staff.deleted': 'Deleted staff',
  'staff.status_changed': 'Changed staff status',
  'staff.password_reset': 'Reset staff password',
  'profile.updated': 'Updated own profile',
  'profile.avatar_updated': 'Updated avatar',
  'profile.avatar_removed': 'Removed avatar',
  'password.changed': 'Changed own password',
  'password.reset': 'Reset password',
  'password.reset_requested': 'Requested password reset',
  'role.created': 'Created role',
  'role.updated': 'Updated role',
  'role.deleted': 'Deleted role',
};

export default function AuditLogs() {
  usePageMeta({ title: 'Activity Log | Admin' });
  const [logs, setLogs] = useState(null);
  const [q, setQ] = useState('');

  const load = () =>
    adminService
      .auditLogs({ q })
      .then((r) => setLogs(r.data))
      .catch(() => setLogs([]));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-semibold">Staff Activity Log</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by actor, target or action…"
        className="mb-5 w-full max-w-sm rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none"
      />

      <div className="themed-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="hidden px-4 py-3 md:table-cell">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs === null &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="px-4 py-3" colSpan={5}><div className="skeleton h-6 w-full rounded" /></td>
                </tr>
              ))}
            {logs?.map((log) => (
              <tr key={log.id} className="border-b border-black/5">
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{log.actor_name || log.actor_email || 'System'}</td>
                <td className="px-4 py-3">{ACTION_LABELS[log.action] || log.action}</td>
                <td className="px-4 py-3 text-xs">{log.target_label || '—'}</td>
                <td className="hidden px-4 py-3 text-xs md:table-cell" style={{ color: 'var(--muted)' }}>
                  {log.ip_address || '—'}
                </td>
              </tr>
            ))}
            {logs?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm" style={{ color: 'var(--muted)' }} colSpan={5}>
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
