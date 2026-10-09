import { useEffect } from 'react';

/**
 * Sets document title + meta description, and forces noindex for private
 * album pages (spec section 41).
 */
export function usePageMeta({ title, description, noindex = false }) {
  useEffect(() => {
    if (title) document.title = title;

    const setMeta = (name, content) => {
      if (content == null) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) setMeta('description', description);
    if (noindex) setMeta('robots', 'noindex,nofollow');

    return () => {
      if (noindex) {
        const el = document.querySelector('meta[name="robots"]');
        if (el) el.setAttribute('content', 'index,follow');
      }
    };
  }, [title, description, noindex]);
}
