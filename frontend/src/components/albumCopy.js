/**
 * Small, generic copy helpers for the album viewer.
 *
 * These NEVER replace the photographer's manually entered title / tagline /
 * description. They only provide small, neutral framing labels (the hero
 * eyebrow and gallery-intro heading) that adapt to any album category and are
 * omitted gracefully when there's nothing meaningful to show.
 */

/**
 * Hero eyebrow: a short, letter-spaced label above the album title.
 * Uses the album's own category when present ("A Birthday Story",
 * "An Engagement Story"); otherwise a neutral, non-event-specific line.
 * Returns null so the element can be hidden when there's nothing to show.
 */
export function heroEyebrow(album) {
  const cat = (album?.category || '').trim();
  if (cat) {
    const a = /^[aeiou]/i.test(cat) ? 'An' : 'A';
    return `${a} ${cat} Story`;
  }
  return 'A Story in Every Frame';
}

/** Gallery-section intro heading — neutral and category-agnostic. */
export function galleryHeading(album) {
  const cat = (album?.category || '').trim();
  return cat ? `The ${cat} Gallery` : 'The Gallery';
}

/** Format an ISO date (YYYY-MM-DD) for display; null if absent/invalid. */
export function formatEventDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
