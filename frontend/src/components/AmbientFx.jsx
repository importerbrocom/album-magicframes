import { useEffect, useState } from 'react';
import { useAlbum } from '../contexts/AlbumContext';
import { resolveEffect } from './ambientEffects';

/** Build randomized particle styles for an effect (called off the render path). */
function buildParticles(fx) {
  if (!fx) return [];
  const speed = fx.speed ?? 1; // <1 faster, >1 slower
  return Array.from({ length: fx.count }).map((_, i) => ({
    key: i,
    style: {
      left: `${Math.round(Math.random() * 96) + 2}%`,
      animationDuration: `${((9 + Math.random() * 10) * speed).toFixed(1)}s`,
      animationDelay: `${(Math.random() * 10).toFixed(2)}s`,
      fontSize: `${12 + Math.round(Math.random() * 16)}px`,
      '--mf-drift': `${Math.round(Math.random() * 120 - 60)}px`,
    },
  }));
}

/**
 * Decorative ambient motion for the album viewer + scroll-reveal activation.
 *
 * - Renders floating particles for the album's chosen `ambient_effect`
 *   (leaves, flowers, petals, snow, confetti, sprinkles, balloons, bubbles,
 *   hearts) — or an auto pick based on the album category. Each effect is a
 *   `.mf-fx-<key>` class in index.css; particles get randomized positions,
 *   sizes and delays so the motion feels organic. Works on every theme.
 * - Scroll-reveal: `.mf-reveal` elements fade/slide in. Because events/photos
 *   render after first paint, we re-observe via a MutationObserver and run a
 *   safety pass so async grids never stay stuck invisible.
 *
 * Respects prefers-reduced-motion (particles hidden via CSS).
 */
export default function AmbientFx() {
  const { album } = useAlbum();
  const fx = resolveEffect(album);

  // Build randomized particles when the effect/speed/count changes (lazy init).
  const [particles, setParticles] = useState(() => buildParticles(fx));
  const fxSig = fx ? `${fx.key}:${fx.count}:${fx.speed}` : null;
  useEffect(() => {
    setParticles(buildParticles(fx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fxSig]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const reveal = (el) => el.classList.add('mf-in');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      }),
      { threshold: 0.08 },
    );
    const observeAll = () => document.querySelectorAll('.mf-reveal:not(.mf-in)').forEach((n) => io.observe(n));
    observeAll();
    const mo = new MutationObserver(() => observeAll());
    mo.observe(document.body, { childList: true, subtree: true });
    const safety = setTimeout(() => {
      document.querySelectorAll('.mf-reveal:not(.mf-in)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.2) reveal(el);
      });
    }, 1200);
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(safety); };
  }, []);

  if (!fx) return null;

  return (
    <div className={`mf-fx mf-fx-${fx.key}`} aria-hidden="true">
      {particles.map((p) => (
        <span key={p.key} className="mf-particle" style={p.style}>
          {fx.glyph}
        </span>
      ))}
    </div>
  );
}
