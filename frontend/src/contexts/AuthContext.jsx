import { createContext, useContext, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(adminService.getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mf_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    adminService
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('mf_admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await adminService.login(email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await adminService.logout();
    setUser(null);
  };

  // Keep the stored user in sync when the profile is updated elsewhere.
  const updateUser = (next) => {
    setUser(next);
    if (next) localStorage.setItem('mf_admin_user', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
