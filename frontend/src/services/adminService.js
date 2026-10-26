import api from './api';

export const adminService = {
  login: (email, password) =>
    api.post('/admin/login', { email, password }).then((r) => {
      localStorage.setItem('mf_admin_token', r.data.token);
      localStorage.setItem('mf_admin_user', JSON.stringify(r.data.user));
      return r.data;
    }),

  me: () => api.get('/admin/me').then((r) => r.data.data ?? r.data),

  logout: () =>
    api.post('/admin/logout').finally(() => {
      localStorage.removeItem('mf_admin_token');
      localStorage.removeItem('mf_admin_user');
    }),

  forgotPassword: (email) =>
    api.post('/admin/forgot-password', { email }).then((r) => r.data),
  resetPassword: (payload) =>
    api.post('/admin/reset-password', payload).then((r) => r.data),

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

  // ---- Own profile (admin + staff) --------------------------------------
  profile: () => api.get('/admin/profile').then((r) => r.data.data ?? r.data),
  updateProfile: (payload) =>
    api.put('/admin/profile', payload).then((r) => r.data),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post('/admin/profile/avatar', fd).then((r) => r.data);
  },
  removeAvatar: () => api.delete('/admin/profile/avatar').then((r) => r.data),
  changePassword: (payload) =>
    api.post('/admin/profile/password', payload).then((r) => r.data),

  // ---- Staff management (admin / staff.* permission) --------------------
  staffList: (params = {}) => api.get('/admin/staff', { params }).then((r) => r.data),
  staff: (id) => api.get(`/admin/staff/${id}`).then((r) => r.data.data),
  createStaff: (payload) => {
    const fd = toFormData(payload);
    return api.post('/admin/staff', fd).then((r) => r.data);
  },
  updateStaff: (id, payload) => {
    const fd = toFormData(payload);
    // Laravel needs _method override to accept multipart on PUT.
    fd.append('_method', 'PUT');
    return api.post(`/admin/staff/${id}`, fd).then((r) => r.data);
  },
  updateStaffStatus: (id, status) =>
    api.patch(`/admin/staff/${id}/status`, { status }).then((r) => r.data),
  resetStaffPassword: (id, mode = 'temporary') =>
    api.post(`/admin/staff/${id}/reset-password`, { mode }).then((r) => r.data),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`).then((r) => r.data),

  // ---- Roles & permissions (admin only) ---------------------------------
  roles: () => api.get('/admin/roles').then((r) => r.data.data ?? r.data),
  permissions: () => api.get('/admin/permissions').then((r) => r.data.data ?? r.data),
  createRole: (payload) => api.post('/admin/roles', payload).then((r) => r.data),
  updateRole: (id, payload) => api.put(`/admin/roles/${id}`, payload).then((r) => r.data),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`).then((r) => r.data),

  // ---- Audit logs (admin only) ------------------------------------------
  auditLogs: (params = {}) => api.get('/admin/audit-logs', { params }).then((r) => r.data),

  getStoredUser: () => {
    try {
      return JSON.parse(localStorage.getItem('mf_admin_user'));
    } catch {
      return null;
    }
  },
};

/** Build a FormData body, handling arrays (permissions[]) and File objects. */
function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      fd.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => fd.append(`${key}[]`, v));
    } else if (typeof value === 'boolean') {
      fd.append(key, value ? '1' : '0');
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}
