import { useEffect } from 'react';

/**
 * Decorative cinematic flourishes for the album-viewing experience.
 *
 * - Renders two ambient floating "gold leaf" particles (CSS-animated; only
 *   visible under the `akhila` theme via `.mf-ambient` styling in index.css).
 * - Activates scroll-reveal: any element with the `.mf-reveal` class fades/
 *   slides in via an IntersectionObserver that toggles `.mf-in`.
 *
 * Content on these pages loads asynchronously (events/photos arrive after the
 * first paint), so we also watch the DOM with a MutationObserver to pick up
 * `.mf-reveal` nodes added later, and run a safety pass so anything already in
 * view is revealed even if its intersection callback never fires. Without this
 * an async-rendered grid can stay stuck at opacity:0 (invisible).
 *
 * Purely additive — inert on non-akhila themes (particles are display:none and
 * `.mf-reveal` has no transition there, so it's visible regardless).
 */
export default function AmbientFx() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const reveal = (el) => el.classList.add('mf-in');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );

    const observeAll = () => {
      document.querySelectorAll('.mf-reveal:not(.mf-in)').forEach((n) => io.observe(n));
    };

    // Initial pass, then keep watching for async-rendered nodes.
    observeAll();

    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: after a short delay, reveal any still-hidden node that is at
    // or above the current viewport (covers edge cases where IO doesn't fire).
    const safety = setTimeout(() => {
      document.querySelectorAll('.mf-reveal:not(.mf-in)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.2) reveal(el);
      });
    }, 1200);

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return (
    <>
      <span className="mf-ambient one" aria-hidden="true" />
      <span className="mf-ambient two" aria-hidden="true" />
    </>
  );
}
