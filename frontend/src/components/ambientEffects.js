/**
 * Ambient motion effects for the album viewer.
 *
 * Each effect is a CSS class (`mf-fx-<key>`) plus a glyph that the particles
 * render. The photographer picks one per album (admin "Ambient Effect"); when
 * set to `auto` (or left empty) we choose a tasteful default from the album
 * category so any event type gets a fitting flourish.
 */

export const AMBIENT_EFFECTS = [
  { key: 'auto', label: 'Auto (match category)' },
  { key: 'none', label: 'None' },
  { key: 'leaves', label: 'Gold Leaves' },
  { key: 'flowers', label: 'Flowers' },
  { key: 'petals', label: 'Rose Petals' },
  { key: 'snow', label: 'Snow' },
  { key: 'confetti', label: 'Confetti' },
  { key: 'sprinkles', label: 'Sprinkles' },
  { key: 'balloons', label: 'Balloons' },
  { key: 'bubbles', label: 'Bubbles' },
  { key: 'hearts', label: 'Hearts' },
];

// Glyph used for each effect's particles.
const GLYPH = {
  leaves: '',        // CSS-drawn leaf shape (no glyph)
  flowers: '✿',
  petals: '❀',
  snow: '❄',
  confetti: '',      // CSS-drawn confetti rectangles
  sprinkles: '',     // CSS-drawn sprinkle capsules
  balloons: '🎈',
  bubbles: '',       // CSS-drawn circles
  hearts: '♥',
};

/** Map an album category to a sensible default effect for `auto`. */
function autoForCategory(category = '') {
  const c = category.toLowerCase();
  if (/birthday|bday/.test(c)) return 'balloons';
  if (/baby.?shower|newborn|baby/.test(c)) return 'bubbles';
  if (/maternity/.test(c)) return 'petals';
  if (/wedding|engage|anniversary|pre.?wedding/.test(c)) return 'petals';
  if (/graduation/.test(c)) return 'confetti';
  if (/haldi|mehendi|mehndi/.test(c)) return 'flowers';
  return 'leaves';
}

// Speed presets -> animation-duration multiplier (smaller = faster).
export const AMBIENT_SPEEDS = [
  { key: 'slow', label: 'Slow' },
  { key: 'normal', label: 'Normal' },
  { key: 'fast', label: 'Fast' },
];
const SPEED_FACTOR = { slow: 1.6, normal: 1, fast: 0.55 };

/**
 * Resolve the active effect for an album, applying the admin's speed and
 * count overrides when set.
 * @returns {{ key:string, glyph:string, count:number, speed:number } | null}
 *          null = no effect
 */
export function resolveEffect(album) {
  let key = (album?.ambient_effect || 'auto').toLowerCase();
  if (key === 'none') return null;
  if (key === 'auto') key = autoForCategory(album?.category || '');

  const defaults = { balloons: 6, confetti: 16, sprinkles: 16, snow: 20, bubbles: 12 };
  const defaultCount = defaults[key] ?? 10;

  // Count: admin override (0–60) wins; 0 means "no particles" => no effect.
  let count = defaultCount;
  const raw = album?.ambient_count;
  if (raw !== null && raw !== undefined && raw !== '') {
    const n = Math.max(0, Math.min(60, parseInt(raw, 10) || 0));
    if (n === 0) return null;
    count = n;
  }

  const speed = SPEED_FACTOR[(album?.ambient_speed || 'normal').toLowerCase()] ?? 1;

  return { key, glyph: GLYPH[key] ?? '', count, speed };
}
