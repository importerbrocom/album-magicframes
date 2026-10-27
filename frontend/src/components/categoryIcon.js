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

/**
 * A short, dotted keyword caption for a section card (reference style, e.g.
 * "TRADITION · FUN · COLORS"). Matched loosely to the section/category name;
 * a neutral default keeps every custom album looking intentional. Decorative
 * only — shown on the akhila theme.
 */
const CAPTIONS = [
  [/reception|party|sangeet/i, 'Celebration · Joy · Together'],
  [/wedding|nikah|marriage|vivah/i, 'Tradition · Emotion · Love'],
  [/engage|ring|proposal/i, 'The Beginning · Forever'],
  [/pre.?wedding|save.?the.?date/i, 'Dreams · Adventure · Us'],
  [/haldi|turmeric/i, 'Tradition · Fun · Colors'],
  [/mehendi|mehndi|henna/i, 'Art · Tradition · Beauty'],
  [/candid|moment|street/i, 'Real · Natural · Timeless'],
  [/birthday|bday/i, 'Smiles · Cake · Joy'],
  [/baby.?shower/i, 'Love · Blessings · New Beginnings'],
  [/newborn|baby/i, 'Tiny · Precious · New'],
  [/maternity|expecting/i, 'Glow · Anticipation · Love'],
  [/graduation|convocation/i, 'Pride · Achievement · Future'],
  [/anniversary/i, 'Years · Love · Together'],
  [/family|portrait/i, 'Bonds · Warmth · Forever'],
];

export function sectionCaption(name = '') {
  for (const [re, text] of CAPTIONS) if (re.test(name)) return text;
  return 'Memories · Moments · Forever';
}

/** Title-case a section name for display without mutating the stored value. */
export function titleCase(name = '') {
  return String(name)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}
