import { createContext, useContext, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(adminService.getStoredUser());
  const [loading, setLoading] = useState(true);

  const persist = (u) => {
    setUser(u);
    if (u) localStorage.setItem('mf_admin_user', JSON.stringify(u));
  };

  useEffect(() => {
    const token = localStorage.getItem('mf_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    adminService
      .me()
      .then(persist)
      .catch(() => {
        localStorage.removeItem('mf_admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await adminService.login(email, password);
    persist(data.user);
    return data;
  };

  const logout = async () => {
    await adminService.logout();
    setUser(null);
  };

  // Re-fetch the authenticated user (after profile edits / password changes).
  const refreshUser = async () => {
    const u = await adminService.me();
    persist(u);
    return u;
  };

  const isAdmin = user?.role === 'super_admin';
  const hasPermission = (perm) =>
    isAdmin || (Array.isArray(user?.permissions) && user.permissions.includes(perm));

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, setUser: persist, isAdmin, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}
