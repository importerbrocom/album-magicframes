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

  // --- Self-service profile (admin + staff) ---
  updateProfile: (payload) =>
    api.put('/admin/profile', payload).then((r) => {
      localStorage.setItem('mf_admin_user', JSON.stringify(r.data.user));
      return r.data;
    }),
  changePassword: (payload) =>
    api.post('/admin/profile/password', payload).then((r) => {
      if (r.data.user) localStorage.setItem('mf_admin_user', JSON.stringify(r.data.user));
      return r.data;
    }),

  // --- Staff management (admin only) ---
  staff: (params = {}) => api.get('/admin/staff', { params }).then((r) => r.data.data),
  createStaff: (payload) => api.post('/admin/staff', payload).then((r) => r.data.data),
  updateStaff: (id, payload) => api.put(`/admin/staff/${id}`, payload).then((r) => r.data.data),
  resetStaffPassword: (id, password) =>
    api.post(`/admin/staff/${id}/reset-password`, { password }).then((r) => r.data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`).then((r) => r.data),

  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),

  albums: (params = {}) => api.get('/admin/albums', { params }).then((r) => r.data),
  albumCategories: () => api.get('/admin/albums/categories').then((r) => r.data.data),
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
  sections: (id) => api.get(`/admin/albums/${id}/sections`).then((r) => r.data.data),
  updateSection: (id, eventId, payload) =>
    api.put(`/admin/albums/${id}/sections/${eventId}`, payload).then((r) => r.data.data),
  updateSectionsOrder: (id, order) =>
    api.put(`/admin/albums/${id}/sections/order`, { order }).then((r) => r.data),
  galleryVideos: (id) => api.get(`/admin/albums/${id}/gallery-videos`).then((r) => r.data.data),
  updateGalleryPosters: (id, posters) =>
    api.put(`/admin/albums/${id}/gallery-videos`, { posters }).then((r) => r.data.data),
  updateGalleryOrder: (id, order) =>
    api.put(`/admin/albums/${id}/gallery-videos/order`, { order }).then((r) => r.data.data),

  getStoredUser: () => {
    try {
      return JSON.parse(localStorage.getItem('mf_admin_user'));
    } catch {
      return null;
    }
  },
};
