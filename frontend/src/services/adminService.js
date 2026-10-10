import api from './api';

export const adminService = {
  login: (email, password) =>
    api.post('/admin/login', { email, password }).then((r) => {
      localStorage.setItem('mf_admin_token', r.data.token);
      localStorage.setItem('mf_admin_user', JSON.stringify(r.data.user));
      return r.data;
    }),

  me: () => api.get('/admin/me').then((r) => r.data),

  logout: () =>
    api.post('/admin/logout').finally(() => {
      localStorage.removeItem('mf_admin_token');
      localStorage.removeItem('mf_admin_user');
    }),

  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),

  albums: (params = {}) => api.get('/admin/albums', { params }).then((r) => r.data),
  album: (id) => api.get(`/admin/albums/${id}`).then((r) => r.data.data),
  createAlbum: (payload) => api.post('/admin/albums', payload).then((r) => r.data),
  updateAlbum: (id, payload) => api.put(`/admin/albums/${id}`, payload).then((r) => r.data.data),
  deleteAlbum: (id) => api.delete(`/admin/albums/${id}`).then((r) => r.data),
  sync: (id) => api.post(`/admin/albums/${id}/sync`).then((r) => r.data),
  syncStatus: (id) => api.get(`/admin/albums/${id}/sync-status`).then((r) => r.data),
  analytics: (id) => api.get(`/admin/albums/${id}/analytics`).then((r) => r.data),
  share: (id) => api.get(`/admin/albums/${id}/share`).then((r) => r.data),
  enquiries: (id) => api.get(`/admin/albums/${id}/enquiries`).then((r) => r.data),
  comments: (id) => api.get(`/admin/albums/${id}/comments`).then((r) => r.data),

  getStoredUser: () => {
    try {
      return JSON.parse(localStorage.getItem('mf_admin_user'));
    } catch {
      return null;
    }
  },
};
