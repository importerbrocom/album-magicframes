import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { can, isAdmin } from '../lib/permissions';

/**
 * Route guard for pages that need a specific capability. Renders children only
 * if the user is an admin (when `adminOnly`) or holds the given `permission`.
 * The backend still authorizes every request — this only prevents navigating
 * to a page the user can't use.
 */
export default function RequireAccess({ children, permission, adminOnly = false }) {
  const { user } = useAuth();

  const allowed = adminOnly ? isAdmin(user) : permission ? can(user, permission) : true;

  if (!allowed) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
