export type SkillCategory = 'Combat' | 'Heroic' | 'Magic' | 'Artisan' | 'Physick' | 'Priest' | 'Leadership' | 'Other';

export interface CatalogueSkill {
  name: string;
  category: SkillCategory;
  maxRank?: number;
}

export const SKILL_CATEGORY_COLORS: Record<SkillCategory, { bg: string; text: string; border: string }> = {
  Combat:     { bg: 'rgba(168,65,63,0.18)',    text: '#e87070', border: 'rgba(168,65,63,0.4)' },
  Heroic:     { bg: 'rgba(230,120,50,0.18)',   text: '#e8864a', border: 'rgba(230,120,50,0.4)' },
  Magic:      { bg: 'rgba(155,89,182,0.18)',   text: '#c27dd4', border: 'rgba(155,89,182,0.4)' },
  Artisan:    { bg: 'rgba(52,152,219,0.18)',   text: '#6ab0e0', border: 'rgba(52,152,219,0.4)' },
  Physick:    { bg: 'rgba(46,160,67,0.18)',    text: '#6ad47e', border: 'rgba(46,160,67,0.4)' },
  Priest:     { bg: 'rgba(212,180,109,0.18)',  text: '#d4b46d', border: 'rgba(212,180,109,0.4)' },
  Leadership: { bg: 'rgba(52,200,180,0.18)',   text: '#5ddcc8', border: 'rgba(52,200,180,0.4)' },
  Other:      { bg: 'rgba(120,120,140,0.18)',  text: '#a0a0b8', border: 'rgba(120,120,140,0.4)' },
};

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  'Combat', 'Heroic', 'Magic', 'Artisan', 'Physick', 'Priest', 'Leadership', 'Other',
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
  { name: 'Ambidexterity',      category: 'Combat' },
  { name: 'Weapon Master',      category: 'Combat' },
  { name: 'Marksman',           category: 'Combat' },
  { name: 'Shield',             category: 'Combat' },
  { name: 'Fortitude',          category: 'Combat' },
  { name: 'Endurance',          category: 'Combat', maxRank: 8 },
  { name: 'Dreadnought',        category: 'Combat' },
  { name: 'Sentinel',           category: 'Combat' },
  { name: 'War Scout',          category: 'Combat' },
  { name: 'Mend Armour',        category: 'Combat' },
  { name: 'Battle Mage',        category: 'Combat' },
  // ── Heroic ──
  { name: 'Hero',               category: 'Heroic' },
  { name: 'Extra Hero Points',  category: 'Heroic', maxRank: 4 },
  { name: 'Stay With Me',       category: 'Heroic' },
  { name: 'Get It Together',    category: 'Heroic' },
  { name: 'Relentless',         category: 'Heroic' },
  { name: 'Unstoppable',        category: 'Heroic' },
  { name: 'Cleaving Strike',    category: 'Heroic' },
  { name: 'Mortal Blow',        category: 'Heroic' },
  { name: 'Mighty Strikedown',  category: 'Heroic' },
  // ── Magic ──
  { name: 'Magician',           category: 'Magic' },
  { name: 'Extra Mana',         category: 'Magic', maxRank: 6 },
  { name: 'Extra Spell',        category: 'Magic', maxRank: 3 },
  { name: 'Spring Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Summer Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Autumn Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Winter Lore',        category: 'Magic', maxRank: 3 },
  { name: 'Day Lore',           category: 'Magic', maxRank: 3 },
  { name: 'Night Lore',         category: 'Magic', maxRank: 3 },
  { name: 'Extra Ritual',       category: 'Magic', maxRank: 3 },
  // ── Artisan ──
  { name: 'Artisan',            category: 'Artisan' },
  { name: 'Extra Item',         category: 'Artisan', maxRank: 3 },
  // ── Physick ──
  { name: 'Chirurgeon',         category: 'Physick' },
  { name: 'Physick',            category: 'Physick' },
  { name: 'Apothecary',         category: 'Physick' },
  { name: 'Extra Recipes',      category: 'Physick', maxRank: 3 },
  // ── Priest ──
  { name: 'Dedication',         category: 'Priest' },
  { name: 'Anointing',          category: 'Priest' },
  { name: 'Consecration',       category: 'Priest' },
  { name: 'Exorcism',           category: 'Priest' },
  { name: 'Hallow',             category: 'Priest' },
  { name: 'Excommunicate',      category: 'Priest' },
  { name: 'Insight',            category: 'Priest' },
  { name: 'Testimony',          category: 'Priest' },
  // ── Leadership ──
  { name: 'Military Commander', category: 'Leadership' },
  { name: 'Seneschal',          category: 'Leadership' },
];
