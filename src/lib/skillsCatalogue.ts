export type SkillCategory = 'Combat' | 'Magic' | 'Artisan' | 'Physick' | 'Priest' | 'Leadership' | 'Other';

export interface CatalogueSkill {
  name: string;
  category: SkillCategory;
  maxRank?: number;
}

export const SKILL_CATEGORY_COLORS: Record<SkillCategory, { bg: string; text: string; border: string }> = {
  Combat:     { bg: 'rgba(168,65,63,0.18)',    text: '#e87070', border: 'rgba(168,65,63,0.4)' },
  Magic:      { bg: 'rgba(155,89,182,0.18)',   text: '#c27dd4', border: 'rgba(155,89,182,0.4)' },
  Artisan:    { bg: 'rgba(52,152,219,0.18)',   text: '#6ab0e0', border: 'rgba(52,152,219,0.4)' },
  Physick:    { bg: 'rgba(46,160,67,0.18)',    text: '#6ad47e', border: 'rgba(46,160,67,0.4)' },
  Priest:     { bg: 'rgba(212,180,109,0.18)',  text: '#d4b46d', border: 'rgba(212,180,109,0.4)' },
  Leadership: { bg: 'rgba(52,200,180,0.18)',   text: '#5ddcc8', border: 'rgba(52,200,180,0.4)' },
  Other:      { bg: 'rgba(120,120,140,0.18)',  text: '#a0a0b8', border: 'rgba(120,120,140,0.4)' },
};

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  'Combat', 'Magic', 'Artisan', 'Physick', 'Priest', 'Leadership', 'Other',
];

export const SKILLS_CATALOGUE: CatalogueSkill[] = [
  // ── Combat ──
  { name: 'One Handed Weapon',  category: 'Combat' },
  { name: 'Two Handed Weapon',  category: 'Combat' },
  { name: 'Weapon and Shield',  category: 'Combat' },
  { name: 'Spear',              category: 'Combat' },
  { name: 'Polearm',            category: 'Combat' },
  { name: 'Paired Weapons',     category: 'Combat' },
  { name: 'Bow',                category: 'Combat' },
  { name: 'Thrown Weapon',      category: 'Combat' },
  { name: 'Endurance',          category: 'Combat', maxRank: 8 },
  { name: 'Fortitude',          category: 'Combat' },
  { name: 'Cleave',             category: 'Combat' },
  { name: 'Mortal Blow',        category: 'Combat' },
  { name: 'Unstoppable',        category: 'Combat' },
  { name: 'Relentless',         category: 'Combat' },
  { name: 'Sentinel',           category: 'Combat' },
  { name: 'Battle Mage',        category: 'Combat' },
  { name: 'War Scout',          category: 'Combat' },
  { name: 'Mend Armour',        category: 'Combat' },
  // ── Magic ──
  { name: 'Magician',           category: 'Magic' },
  { name: 'Spring Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Summer Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Autumn Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Winter Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Day Lore',           category: 'Magic', maxRank: 3 },
  { name: 'Night Lore',         category: 'Magic', maxRank: 3 },
  // ── Artisan ──
  { name: 'Armoursmith',        category: 'Artisan' },
  { name: 'Weaponsmith',        category: 'Artisan' },
  { name: 'Apothecary',         category: 'Artisan' },
  { name: 'Warcaster',          category: 'Artisan' },
  { name: 'Mana Sink',          category: 'Artisan' },
  // ── Physick ──
  { name: 'Physick',            category: 'Physick' },
  // ── Priest ──
  { name: 'Dedication',         category: 'Priest' },
  // ── Leadership ──
  { name: 'Military Commander', category: 'Leadership' },
  { name: 'Seneschal',          category: 'Leadership' },
];
