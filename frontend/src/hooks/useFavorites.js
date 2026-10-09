import { useCallback, useEffect, useState } from 'react';

/**
 * Favorites stored in localStorage, scoped per album slug (spec section 24).
 * Architecture leaves room to later sync these to a server "favorites session".
 */
export function useFavorites(slug) {
  const key = `mf_favorites_${slug}`;
  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key)) || []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify([...favorites]));
  }, [favorites, key]);

  const toggle = useCallback((photoId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(photoId) ? next.delete(photoId) : next.add(photoId);
      return next;
    });
  }, []);

  const isFavorite = useCallback((photoId) => favorites.has(photoId), [favorites]);

  return { favorites, toggle, isFavorite, count: favorites.size };
}
