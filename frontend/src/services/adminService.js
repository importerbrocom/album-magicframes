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

  // --- Forgot / reset password (open endpoints) ---
  forgotPassword: (email) =>
    api.post('/admin/forgot-password', { email }).then((r) => r.data),
  resetPassword: (payload) =>
    api.post('/admin/reset-password', payload).then((r) => r.data),

  // --- Self-service profile (admin or staff) ---
  profile: () => api.get('/admin/profile').then((r) => r.data.data),
  updateProfile: (formData) =>
    // multipart (may include an avatar file); Laravel reads method override.
    api
      .post('/admin/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data),
  changePassword: (payload) =>
    api.post('/admin/profile/password', payload).then((r) => r.data),

  // --- Staff management (admin only) ---
  staffMeta: () => api.get('/admin/staff/meta').then((r) => r.data),
  staff: (params = {}) => api.get('/admin/staff', { params }).then((r) => r.data),
  staffMember: (id) => api.get(`/admin/staff/${id}`).then((r) => r.data.data),
  createStaff: (formData) =>
    api
      .post('/admin/staff', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  updateStaff: (id, formData) =>
    api
      .post(`/admin/staff/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data),
  updateStaffStatus: (id, status) =>
    api.patch(`/admin/staff/${id}/status`, { status }).then((r) => r.data.data),
  resetStaffPassword: (id) =>
    api.post(`/admin/staff/${id}/reset-password`).then((r) => r.data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`).then((r) => r.data),

  // --- Audit logs ---
  auditLogs: (params = {}) => api.get('/admin/audit-logs', { params }).then((r) => r.data),

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
