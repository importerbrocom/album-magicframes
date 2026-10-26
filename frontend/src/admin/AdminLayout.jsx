import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Admin / staff chrome: sidebar on desktop, bottom nav on mobile. Menu items
 * are filtered by the signed-in user's role & permissions (the backend
 * enforces the same rules; hiding items is only a UX convenience).
 */
export default function AdminLayout() {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();

  const canManageStaff = isAdmin || hasPermission('staff.view');

  const NAV = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '◧', show: true },
    { to: '/admin/albums', label: 'Albums', icon: '▦', show: isAdmin || hasPermission('albums.view') },
    { to: '/admin/albums/create', label: 'Create', icon: '＋', show: isAdmin || hasPermission('albums.create') },
    { to: '/admin/staff', label: 'Staff', icon: '👥', show: canManageStaff },
    { to: '/admin/roles', label: 'Roles', icon: '🔑', show: isAdmin },
    { to: '/admin/activity', label: 'Activity', icon: '📜', show: isAdmin },
    { to: '/admin/google', label: 'Google Drive', icon: '☁', show: isAdmin || hasPermission('albums.view') },
    { to: '/admin/profile', label: 'Profile', icon: '⚙', show: true },
  ].filter((i) => i.show);

  const doLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const initials = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div data-theme="modern" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/10 p-5 md:flex">
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-semibold">Magic Frames</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAdmin ? 'Studio Admin' : 'Staff Portal'}
            </p>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin/albums'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive ? 'themed-accent-bg' : 'hover:bg-black/5'
                  }`
                }
              >
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 border-t border-black/10 pt-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10 text-xs">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={doLogout} className="mt-3 text-left text-sm text-red-600">Logout</button>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around overflow-x-auto border-t border-black/10 bg-[var(--surface)] py-2 md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin/albums'}
            className={({ isActive }) =>
              `flex shrink-0 flex-col items-center gap-0.5 px-2 text-[10px] ${isActive ? 'themed-accent-text' : ''}`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
