import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Route guard for role- or permission-restricted pages. Server-side checks are
 * the real enforcement; this just prevents staff from seeing admin-only screens.
 *
 * Usage:
 *   <RequireRole roles={['super_admin']}>…</RequireRole>
 *   <RequireRole permission="staff.view">…</RequireRole>
 */
export default function RequireRole({ roles, permission, children }) {
  const { user, isAdmin, hasPermission } = useAuth();

  let allowed = true;
  if (roles) allowed = roles.includes(user?.role);
  if (permission) allowed = allowed && (isAdmin || hasPermission(permission));

  if (!allowed) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
