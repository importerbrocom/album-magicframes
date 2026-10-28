import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

// Nav items. `adminOnly` entries are hidden from staff accounts.
const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '◧' },
  { to: '/admin/albums', label: 'Albums', icon: '▦' },
  { to: '/admin/albums/create', label: 'Create', icon: '＋' },
  { to: '/admin/staff', label: 'Staff', icon: '👥', adminOnly: true },
  { to: '/admin/profile', label: 'Profile', icon: '◉' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙' },
];

/**
 * Admin chrome: sidebar on desktop, bottom nav on mobile (spec section 22).
 * Staff accounts see the same shell minus the admin-only Staff item.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Staff don't see admin-only items (e.g. Staff management).
  const nav = NAV.filter((item) => !item.adminOnly || user?.is_admin);

  const doLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div data-theme="modern" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Top header (mobile only) — the desktop sidebar already shows the logo. */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-[var(--surface)] px-4 py-2.5 md:hidden">
        <Logo className="h-9 w-auto" />
        <button onClick={doLogout} className="text-xs font-medium text-red-600">Logout</button>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/10 p-5 md:flex">
          <div className="mb-8">
            {/* Real logo.png (black wordmark) on the light sidebar. */}
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
          <div className="mt-auto border-t border-black/10 pt-4">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{user?.email}</p>
            <button onClick={doLogout} className="mt-3 text-sm text-red-600">Logout</button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-black/10 bg-[var(--surface)] py-2 md:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin/albums'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 text-[10px] ${isActive ? 'themed-accent-text' : ''}`
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
