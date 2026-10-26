/**
 * Decorative glyph for an event/section name, echoing the reference design's
 * botanical card icons. Purely cosmetic: matched loosely by keyword across a
 * broad range of album types, with an elegant default so ANY custom name still
 * gets a tasteful mark. Only surfaced under the `akhila` theme (hidden
 * elsewhere via CSS).
 */
const MAP = [
  [/birthday|cake|turning|bday/i, '✦'],
  [/baby.?shower|shower/i, '✿'],
  [/newborn|baby|infant/i, '❀'],
  [/maternity|expecting|bump/i, '❧'],
  [/graduation|convocation|degree/i, '✧'],
  [/anniversary/i, '❦'],
  [/family|portrait/i, '❧'],
  [/reception|party|sangeet|celebrat/i, '♧'],
  [/wedding|nikah|marriage|vivah/i, '♡'],
  [/engage|ring|proposal/i, '♡'],
  [/haldi|turmeric/i, '❋'],
  [/mehendi|mehndi|henna/i, '✿'],
  [/pre.?wedding|save.?the.?date/i, '⚒'],
  [/candid|moment|street/i, '◎'],
  [/ceremony|ritual|pooja|puja/i, '✧'],
];

export default function categoryIcon(name = '') {
  for (const [re, glyph] of MAP) if (re.test(name)) return glyph;
  return '❧';
}
