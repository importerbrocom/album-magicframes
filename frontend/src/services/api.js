import axios from 'axios';

// Base URL: in dev, Vite proxies /api to Laravel. In prod set VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
});

// Attach the admin bearer token (if present) to admin requests.
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('mf_admin_token');
  if (adminToken && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

// On 401 for admin routes, clear the session and bounce to the login page.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && url.startsWith('/admin') && !url.endsWith('/login')) {
      localStorage.removeItem('mf_admin_token');
      localStorage.removeItem('mf_admin_user');
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.assign('/admin/login');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
