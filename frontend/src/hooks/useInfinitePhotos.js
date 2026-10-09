import { useCallback, useEffect, useRef, useState } from 'react';
import { albumService } from '../services/albumService';

/**
 * Paginated/infinite photo loading. Never loads thousands at once; fetches
 * pages of `perPage` and appends as the user scrolls (spec sections 15/49).
 */
export function useInfinitePhotos(slug, filters, perPage = 40) {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const filterKey = JSON.stringify(filters);

  const load = useCallback(
    async (pageToLoad) => {
      const myReq = ++reqId.current;
      setLoading(true);
      try {
        const res = await albumService.photos(slug, {
          ...filters,
          page: pageToLoad,
          per_page: perPage,
        });
        if (myReq !== reqId.current) return; // stale response, discard
        setLastPage(res.meta?.last_page || 1);
        setTotal(res.meta?.total || res.data.length);
        setPhotos((prev) => (pageToLoad === 1 ? res.data : [...prev, ...res.data]));
        setError(null);
      } catch (e) {
        if (myReq !== reqId.current) return;
        setError(e);
      } finally {
        if (myReq === reqId.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, filterKey, perPage],
  );

  // Reset + load page 1 whenever filters change.
  useEffect(() => {
    setPhotos([]);
    setPage(1);
    load(1);
  }, [load]);

  const loadMore = useCallback(() => {
    if (loading || page >= lastPage) return;
    const next = page + 1;
    setPage(next);
    load(next);
  }, [loading, page, lastPage, load]);

  const hasMore = page < lastPage;

  return { photos, loading, error, loadMore, hasMore, total };
}
