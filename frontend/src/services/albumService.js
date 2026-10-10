import api from './api';

// --- Public album token storage (per-slug, album-scoped) ---
const tokenKey = (slug) => `mf_album_token_${slug}`;

export function getAlbumToken(slug) {
  const raw = localStorage.getItem(tokenKey(slug));
  if (!raw) return null;
  try {
    const { token, expires_at } = JSON.parse(raw);
    if (expires_at && new Date(expires_at) < new Date()) {
      localStorage.removeItem(tokenKey(slug));
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function setAlbumToken(slug, access) {
  localStorage.setItem(tokenKey(slug), JSON.stringify(access));
}

export function clearAlbumToken(slug) {
  localStorage.removeItem(tokenKey(slug));
}

// Build an auth header for album-scoped requests.
function albumAuth(slug) {
  const token = getAlbumToken(slug);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const albumService = {
  landing: (slug) => api.get(`/public/albums/${slug}/landing`).then((r) => r.data),

  verify: (slug, password) =>
    api.post(`/public/albums/${slug}/verify`, { password }).then((r) => {
      setAlbumToken(slug, r.data.access);
      return r.data;
    }),

  show: (slug) =>
    api.get(`/public/albums/${slug}`, { headers: albumAuth(slug) }).then((r) => r.data),

  events: (slug) =>
    api.get(`/public/albums/${slug}/events`, { headers: albumAuth(slug) }).then((r) => r.data.data),

  event: (slug, eventSlug) =>
    api.get(`/public/albums/${slug}/events/${eventSlug}`, { headers: albumAuth(slug) }).then((r) => r.data),

  photos: (slug, params = {}) =>
    api.get(`/public/albums/${slug}/photos`, { headers: albumAuth(slug), params }).then((r) => r.data),

  photo: (slug, id) =>
    api.get(`/public/albums/${slug}/photos/${id}`, { headers: albumAuth(slug) }).then((r) => r.data),

  downloadUrl: (slug, id) => `${api.defaults.baseURL}/public/albums/${slug}/photos/${id}/download`,

  // Fetches an original as a blob through the authorized proxy, then triggers save.
  downloadPhoto: async (slug, id, fileName) => {
    const res = await api.get(`/public/albums/${slug}/photos/${id}/download`, {
      headers: albumAuth(slug),
      responseType: 'blob',
    });
    // Demo mode returns JSON with a url; detect that.
    if (res.data?.type === 'application/json') {
      const text = await res.data.text();
      const { url } = JSON.parse(text);
      window.open(url, '_blank');
      return;
    }
    const blobUrl = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  },

  trackAnalytics: (slug, payload) =>
    api.post(`/public/albums/${slug}/analytics`, payload, { headers: albumAuth(slug) }).catch(() => {}),

  qrUrl: (slug) => `${api.defaults.baseURL}/public/albums/${slug}/qr`,

  // --- Engagement (open to anyone with the shared/reshared link) ---
  comments: (slug, page = 1) =>
    api.get(`/public/albums/${slug}/comments`, { params: { page } }).then((r) => r.data),

  addComment: (slug, payload) =>
    api.post(`/public/albums/${slug}/comments`, payload).then((r) => r.data),

  submitEnquiry: (slug, payload) =>
    api.post(`/public/albums/${slug}/enquiries`, payload).then((r) => r.data),
};
