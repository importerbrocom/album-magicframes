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

  // The show endpoint returns a Laravel resource wrapped in { data: {...} }.
  // Unwrap it (fall back to the raw body if an envelope isn't present) so
  // callers get the flat album object with theme/client_name/etc.
  show: (slug) =>
    api.get(`/public/albums/${slug}`, { headers: albumAuth(slug) }).then((r) => r.data?.data ?? r.data),

  events: (slug) =>
    api.get(`/public/albums/${slug}/events`, { headers: albumAuth(slug) }).then((r) => r.data.data),

  videoGallery: (slug) =>
    api.get(`/public/albums/${slug}/video-gallery`, { headers: albumAuth(slug) }).then((r) => r.data.data),

  event: (slug, eventSlug) =>
    api.get(`/public/albums/${slug}/events/${eventSlug}`, { headers: albumAuth(slug) }).then((r) => r.data),

  photos: (slug, params = {}) =>
    api.get(`/public/albums/${slug}/photos`, { headers: albumAuth(slug), params }).then((r) => r.data),

  photo: (slug, id) =>
    api.get(`/public/albums/${slug}/photos/${id}`, { headers: albumAuth(slug) }).then((r) => r.data),

  downloadUrl: (slug, id) => `${api.defaults.baseURL}/public/albums/${slug}/photos/${id}/download`,

  // Fetches an original as a blob through the authorized proxy, then triggers save.
  // Throws an Error with a user-friendly message on failure.
  downloadPhoto: async (slug, id, fileName) => {
    // Preferred: ask for a short-lived signed link and let the browser download
    // it natively (no memory blob; works on mobile and for large originals).
    try {
      const { data } = await api.post(
        `/public/albums/${slug}/photos/${id}/download-link`,
        {},
        { headers: albumAuth(slug) },
      );
      if (data?.path) {
        // `path` is the app-relative URL (e.g. /api/public/...). Resolve against
        // the API origin when VITE_API_URL is absolute, else the current origin.
        const base = api.defaults.baseURL || '/api';
        const origin = /^https?:\/\//i.test(base) ? new URL(base).origin : window.location.origin;
        const a = document.createElement('a');
        a.href = origin + data.path;
        a.download = fileName || 'photo.jpg';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) throw new Error('Your session expired. Please re-open the album and enter the password.');
      if (status === 403) throw new Error('Downloads are disabled for this album.');
      // Otherwise fall through to the blob method below.
    }

    const saveBlob = (blob, name) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name || 'photo.jpg';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoking immediately cancels the save in Safari/Firefox; wait a bit.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    };

    let res;
    try {
      res = await api.get(`/public/albums/${slug}/photos/${id}/download`, {
        headers: albumAuth(slug),
        responseType: 'blob',
      });
    } catch (err) {
      // With responseType 'blob', error bodies are blobs too — decode the message.
      let message = 'Download failed. Please try again.';
      const status = err.response?.status;
      try {
        const text = await err.response?.data?.text?.();
        if (text) message = JSON.parse(text).message || message;
      } catch {
        /* keep default message */
      }
      if (status === 401) message = 'Your session expired. Please re-open the album and enter the password.';
      throw new Error(message);
    }

    const contentType = res.headers?.['content-type'] || res.data?.type || '';

    // Demo mode returns JSON with a public url instead of bytes.
    if (contentType.includes('application/json')) {
      const { url } = JSON.parse(await res.data.text());
      if (!url) throw new Error('Download link unavailable.');
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error('fetch failed');
        saveBlob(await r.blob(), fileName);
      } catch {
        // Cross-origin without CORS: fall back to a direct link navigation.
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'photo.jpg';
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      return;
    }

    saveBlob(res.data, fileName);
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
