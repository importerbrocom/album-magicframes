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

/**
 * Resolve the active effect for an album.
 * @returns {{ key:string, glyph:string, count:number } | null} null = no effect
 */
export function resolveEffect(album) {
  let key = (album?.ambient_effect || 'auto').toLowerCase();
  if (key === 'none') return null;
  if (key === 'auto') key = autoForCategory(album?.category || '');

  const counts = { balloons: 6, confetti: 16, sprinkles: 16, snow: 20, bubbles: 12 };
  return { key, glyph: GLYPH[key] ?? '', count: counts[key] ?? 10 };
}
