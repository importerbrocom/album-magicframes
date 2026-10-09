import { useEffect, useRef, useState } from 'react';

/**
 * Progressive, lazy-loaded image using IntersectionObserver (spec section 17).
 * Shows a shimmer placeholder until the image enters the viewport and loads.
 */
export default function LazyImage({ src, alt, className = '', aspectRatio, onClick, eager = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (eager || visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, visible]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      {visible && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
