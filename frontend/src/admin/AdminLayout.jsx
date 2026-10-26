import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { can, isAdmin } from '../lib/permissions';
import Logo from '../components/Logo';
import Avatar from '../components/Avatar';

// `show` decides visibility per user. Admins see everything; staff see items
// gated by a permission (the backend still authorizes every request).
const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '◧', show: () => true },
  { to: '/admin/albums', label: 'Albums', icon: '▦', show: (u) => can(u, 'albums.view') },
  { to: '/admin/albums/create', label: 'Create', icon: '＋', show: (u) => can(u, 'albums.create') },
  { to: '/admin/google', label: 'Google Drive', icon: '☁', show: (u) => can(u, 'google.manage') },
  { to: '/admin/staff', label: 'Staff', icon: '👥', show: (u) => isAdmin(u) },
  { to: '/admin/activity', label: 'Activity', icon: '📜', show: (u) => isAdmin(u) },
  { to: '/admin/profile', label: 'Profile', icon: '◔', show: () => true },
  { to: '/admin/settings', label: 'Settings', icon: '⚙', show: () => true },
];

/**
 * Admin chrome: sidebar on desktop, bottom nav on mobile (spec section 22).
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nav = NAV.filter((item) => item.show(user));

  const doLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div data-theme="modern" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/10 p-5 md:flex">
          <div className="mb-8">
            <Logo className="h-16 w-auto" />
          </div>
          <nav className="flex-1 space-y-1">
            {nav.map((item) => (
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
            <Avatar src={user?.avatar_url} name={user?.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{user?.email}</p>
              <button onClick={doLogout} className="mt-1 text-sm text-red-600">Logout</button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) — horizontally scrollable when many items */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-black/10 bg-[var(--surface)] px-2 py-2 md:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin/albums'}
            className={({ isActive }) =>
              `flex shrink-0 flex-col items-center gap-0.5 px-3 text-[10px] ${isActive ? 'themed-accent-text' : ''}`
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
