import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

  // Forced first-login password change: staff (or anyone with a temporary
  // password) must set a new one before reaching any admin page.
  if (user.must_change_password && location.pathname !== '/admin/first-login') {
    return <Navigate to="/admin/first-login" replace />;
  }

  return children;
}
