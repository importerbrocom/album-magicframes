import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Gates the admin/staff area. Besides requiring a logged-in user, it enforces
 * the first-login password change: if `must_change_password` is set the user is
 * sent to the dedicated change-password screen and cannot reach anything else.
 */
export default function RequireAuth({ children }) {
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

  const onChangeScreen = location.pathname === '/admin/first-login';
  if (user.must_change_password && !onChangeScreen) {
    return <Navigate to="/admin/first-login" replace />;
  }

  return children;
}
