/**
 * Decorative glyph for an event/category name, echoing the reference design's
 * botanical card icons. Purely cosmetic: matched loosely by keyword, with an
 * elegant default so any custom event name still gets a tasteful mark.
 *
 * Only surfaced visually under the `akhila` theme (hidden elsewhere via CSS),
 * so it never clutters the other themes.
 */
const MAP = [
  [/reception|party|sangeet|celebrat/i, '♧'],
  [/wedding|nikah|marriage|vivah/i, '♡'],
  [/engage|ring|proposal/i, '♡'],
  [/haldi|turmeric/i, '❋'],
  [/mehendi|mehndi|henna/i, '✿'],
  [/pre.?wedding|save.?the.?date/i, '⚒'],
  [/candid|moment|street/i, '◎'],
  [/portrait|bride|groom|couple/i, '❧'],
  [/ceremony|ritual|pooja|puja/i, '✧'],
];

export default function categoryIcon(name = '') {
  for (const [re, glyph] of MAP) if (re.test(name)) return glyph;
  return '❧';
}
