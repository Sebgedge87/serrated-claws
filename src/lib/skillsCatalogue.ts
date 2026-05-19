export type SkillCategory = 'Combat' | 'Heroic' | 'Magic' | 'Artisan' | 'Physick' | 'Priest' | 'Leadership' | 'Other';

export interface CatalogueSkill {
  name: string;
  category: SkillCategory;
  xpCost: number;
  maxRank?: number;
  /** undefined = single purchase only */
  scaling?: '*' | '**';
  /** This skill is the prerequisite for all others in its category */
  isPrereq?: boolean;
  /** Names of other skills that must be purchased first */
  requires?: string[];
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
  { name: 'One Handed Weapon',  category: 'Combat', xpCost: 1 },
  { name: 'Two Handed Weapon',  category: 'Combat', xpCost: 1 },
  { name: 'Weapon and Shield',  category: 'Combat', xpCost: 1 },
  { name: 'Spear',              category: 'Combat', xpCost: 1 },
  { name: 'Polearm',            category: 'Combat', xpCost: 1 },
  { name: 'Paired Weapons',     category: 'Combat', xpCost: 1 },
  { name: 'Bow',                category: 'Combat', xpCost: 1 },
  { name: 'Thrown Weapon',      category: 'Combat', xpCost: 1 },
  { name: 'Ambidexterity',      category: 'Combat', xpCost: 1 },
  { name: 'Weapon Master',      category: 'Combat', xpCost: 2 },
  { name: 'Marksman',           category: 'Combat', xpCost: 4 },
  { name: 'Shield',             category: 'Combat', xpCost: 2 },
  { name: 'Fortitude',          category: 'Combat', xpCost: 1, scaling: '*' },
  { name: 'Endurance',          category: 'Combat', xpCost: 2, maxRank: 8, scaling: '*' },
  { name: 'Dreadnought',        category: 'Combat', xpCost: 1 },
  { name: 'Sentinel',           category: 'Combat', xpCost: 1 },
  { name: 'War Scout',          category: 'Combat', xpCost: 1 },
  { name: 'Mend Armour',        category: 'Combat', xpCost: 1 },
  { name: 'Battle Mage',        category: 'Combat', xpCost: 2 },
  // ── Heroic ──
  { name: 'Hero',               category: 'Heroic', xpCost: 2, isPrereq: true },
  { name: 'Extra Hero Points',  category: 'Heroic', xpCost: 1, maxRank: 4, scaling: '*' },
  { name: 'Stay With Me',       category: 'Heroic', xpCost: 1 },
  { name: 'Get It Together',    category: 'Heroic', xpCost: 1 },
  { name: 'Relentless',         category: 'Heroic', xpCost: 2 },
  { name: 'Unstoppable',        category: 'Heroic', xpCost: 2 },
  { name: 'Cleaving Strike',    category: 'Heroic', xpCost: 1 },
  { name: 'Mortal Blow',        category: 'Heroic', xpCost: 1, requires: ['Weapon Master'] },
  { name: 'Mighty Strikedown',  category: 'Heroic', xpCost: 1, requires: ['Weapon Master'] },
  // ── Magic ──
  { name: 'Magician',           category: 'Magic',  xpCost: 2, isPrereq: true },
  { name: 'Extra Mana',         category: 'Magic',  xpCost: 1, maxRank: 6, scaling: '*' },
  { name: 'Extra Spell',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '**' },
  { name: 'Spring Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*' },
  { name: 'Summer Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*' },
  { name: 'Autumn Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*' },
  { name: 'Winter Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*' },
  { name: 'Day Lore',           category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*' },
  { name: 'Night Lore',         category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*' },
  { name: 'Extra Ritual',       category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '**' },
  // ── Artisan ──
  { name: 'Artisan',            category: 'Artisan', xpCost: 4, isPrereq: true },
  { name: 'Extra Item',         category: 'Artisan', xpCost: 1, maxRank: 3, scaling: '**' },
  // ── Physick ──
  { name: 'Chirurgeon',         category: 'Physick', xpCost: 1, isPrereq: true },
  { name: 'Physick',            category: 'Physick', xpCost: 3 },
  { name: 'Apothecary',         category: 'Physick', xpCost: 2 },
  { name: 'Extra Recipes',      category: 'Physick', xpCost: 1, maxRank: 3, scaling: '**' },
  // ── Priest ──
  { name: 'Dedication',         category: 'Priest',  xpCost: 2, isPrereq: true },
  { name: 'Anointing',          category: 'Priest',  xpCost: 1 },
  { name: 'Consecration',       category: 'Priest',  xpCost: 1 },
  { name: 'Exorcism',           category: 'Priest',  xpCost: 1 },
  { name: 'Hallow',             category: 'Priest',  xpCost: 1 },
  { name: 'Excommunicate',      category: 'Priest',  xpCost: 1 },
  { name: 'Insight',            category: 'Priest',  xpCost: 1 },
  { name: 'Testimony',          category: 'Priest',  xpCost: 1 },
  // ── Leadership ──
  { name: 'Military Commander', category: 'Leadership', xpCost: 2 },
  { name: 'Seneschal',          category: 'Leadership', xpCost: 2 },
];

/** XP cost to buy a skill at a given rank (1-indexed, cumulative). */
export function skillXpCost(skill: CatalogueSkill, rank: number): number {
  if (rank <= 0) return 0;
  if (!skill.scaling) return skill.xpCost; // single purchase
  if (skill.scaling === '**') return rank * skill.xpCost; // flat per rank
  // '*' = cost increases by 1 each purchase: rank1=base, rank2=base+1, ...
  // total = sum(base + i) for i in 0..rank-1 = rank*base + rank*(rank-1)/2
  return rank * skill.xpCost + (rank * (rank - 1)) / 2;
}

/** XP cost of one additional rank on top of existing ones. */
export function nextRankXpCost(skill: CatalogueSkill, currentRank: number): number {
  return skillXpCost(skill, currentRank + 1) - skillXpCost(skill, currentRank);
}
