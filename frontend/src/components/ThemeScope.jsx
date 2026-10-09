import { useEffect } from 'react';

/**
 * Applies the album's chosen theme (spec section 20) by setting data-theme on
 * the document root, which switches the CSS variable palette/typography.
 */
export default function ThemeScope({ theme = 'classic', children }) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', theme);
    return () => {
      if (prev) root.setAttribute('data-theme', prev);
      else root.removeAttribute('data-theme');
    };
  }, [theme]);

  return children;
}
