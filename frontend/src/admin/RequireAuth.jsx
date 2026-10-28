import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Route guard for the admin/staff area.
 *  - Redirects to /admin/login when not authenticated.
 *  - Forces a password change (first login / after reset) before anything else.
 *  - When adminOnly is set, blocks staff with a redirect to the dashboard.
 */
export default function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-charcoal border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // First-login / post-reset: must set a new password before using the app.
  if (user.must_change_password && location.pathname !== '/admin/force-password') {
    return <Navigate to="/admin/force-password" replace />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
