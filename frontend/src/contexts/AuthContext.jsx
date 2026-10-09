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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
