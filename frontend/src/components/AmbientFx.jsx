import { useEffect } from 'react';

/**
 * Decorative cinematic flourishes for the album-viewing experience.
 *
 * - Renders two ambient floating "gold leaf" particles (CSS-animated; only
 *   visible under the `akhila` theme via `.mf-ambient` styling in index.css).
 * - Activates scroll-reveal: any element with the `.mf-reveal` class fades/
 *   slides in via an IntersectionObserver that toggles `.mf-in`.
 *
 * Purely additive — no effect on data flow, and inert on non-akhila themes
 * (the particles are display:none and .mf-reveal has no transition there).
 */
export default function AmbientFx() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mf-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    const nodes = document.querySelectorAll('.mf-reveal:not(.mf-in)');
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  });

  return (
    <>
      <span className="mf-ambient one" aria-hidden="true" />
      <span className="mf-ambient two" aria-hidden="true" />
    </>
  );
}
