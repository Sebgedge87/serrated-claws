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
  /** One-line description of what the skill does in play */
  description?: string;
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
  { name: 'One Handed Weapon',  category: 'Combat', xpCost: 1, description: 'Use a one-handed weapon (sword, axe, mace, etc.) in battle.' },
  { name: 'Two Handed Weapon',  category: 'Combat', xpCost: 1, description: 'Use a two-handed weapon (great sword, maul, etc.) in battle.' },
  { name: 'Weapon and Shield',  category: 'Combat', xpCost: 1, description: 'Use a one-handed weapon alongside a shield.' },
  { name: 'Spear',              category: 'Combat', xpCost: 1, description: 'Use a spear (longer reach weapon) in battle.' },
  { name: 'Polearm',            category: 'Combat', xpCost: 1, description: 'Use a polearm (halberd, glaive, etc.) in battle.' },
  { name: 'Paired Weapons',     category: 'Combat', xpCost: 1, description: 'Fight with a weapon in each hand simultaneously.' },
  { name: 'Bow',                category: 'Combat', xpCost: 1, description: 'Use a bow to make ranged attacks.' },
  { name: 'Thrown Weapon',      category: 'Combat', xpCost: 1, description: 'Use thrown weapons as ranged attacks.' },
  { name: 'Ambidexterity',      category: 'Combat', xpCost: 1, description: 'Use one-handed weapons in either hand without restriction.' },
  { name: 'Weapon Master',      category: 'Combat', xpCost: 2, description: 'Call CLEAVE once per hit with a one-handed weapon, destroying a limb.' },
  { name: 'Marksman',           category: 'Combat', xpCost: 4, description: 'Call CLEAVE with a bow or thrown weapon.' },
  { name: 'Shield',             category: 'Combat', xpCost: 2, description: 'Use a large shield to protect yourself and allies.' },
  { name: 'Fortitude',          category: 'Combat', xpCost: 1, scaling: '*',  description: '+1 global hit per rank. Stacks with Endurance.' },
  { name: 'Endurance',          category: 'Combat', xpCost: 2, maxRank: 8, scaling: '*', description: 'Once per day, spend 10 seconds to restore all lost hits.' },
  { name: 'Dreadnought',        category: 'Combat', xpCost: 1, description: 'Wear heavy armour (requires appropriate phys-rep).' },
  { name: 'Sentinel',           category: 'Combat', xpCost: 1, description: 'Immune to REPEL and STRIKEDOWN calls.' },
  { name: 'War Scout',          category: 'Combat', xpCost: 1, description: 'Use ambush abilities; move unseen in skirmish situations.' },
  { name: 'Mend Armour',        category: 'Combat', xpCost: 1, description: 'Repair a damaged armour location in the field with tools.' },
  { name: 'Battle Mage',        category: 'Combat', xpCost: 2, description: 'Cast personal spells whilst wearing armour.' },
  // ── Heroic ──
  { name: 'Hero',               category: 'Heroic', xpCost: 2, isPrereq: true, description: 'Gain 1 hero point per event. Prerequisite for all Heroic abilities.' },
  { name: 'Extra Hero Points',  category: 'Heroic', xpCost: 1, maxRank: 4, scaling: '*', description: '+1 hero point per rank per event.' },
  { name: 'Stay With Me',       category: 'Heroic', xpCost: 1, description: 'Spend 1 hero point to restore a dying character to 1 hit with a touch.' },
  { name: 'Get It Together',    category: 'Heroic', xpCost: 1, description: 'Spend 1 hero point to remove WEAKNESS or VENOM from yourself or an ally.' },
  { name: 'Relentless',         category: 'Heroic', xpCost: 2, description: 'Spend 1 hero point to immediately stand from a STRIKEDOWN or KNOCKDOWN.' },
  { name: 'Unstoppable',        category: 'Heroic', xpCost: 2, description: 'Spend 1 hero point to ignore the next hit that would take you to 0 hits.' },
  { name: 'Cleaving Strike',    category: 'Heroic', xpCost: 1, description: 'Spend 1 hero point to call CLEAVE on your next hit, destroying a limb.' },
  { name: 'Mortal Blow',        category: 'Heroic', xpCost: 1, requires: ['Weapon Master'], description: 'Spend 1 hero point to call IMPALE, instantly killing the target.' },
  { name: 'Mighty Strikedown',  category: 'Heroic', xpCost: 1, requires: ['Weapon Master'], description: 'Spend 1 hero point to call STRIKEDOWN with a two-handed weapon.' },
  // ── Magic ──
  { name: 'Magician',           category: 'Magic',  xpCost: 2, isPrereq: true, description: 'Cast the three free spells: Create Bond, Detect Magic, Operate Portal.' },
  { name: 'Extra Mana',         category: 'Magic',  xpCost: 1, maxRank: 6, scaling: '*', description: '+1 personal mana per rank per event.' },
  { name: 'Extra Spell',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '**', description: 'Learn one additional personal spell per rank.' },
  { name: 'Spring Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Spring realm rituals per rank.' },
  { name: 'Summer Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Summer realm rituals per rank.' },
  { name: 'Autumn Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Autumn realm rituals per rank.' },
  { name: 'Winter Lore',        category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Winter realm rituals per rank.' },
  { name: 'Day Lore',           category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Day realm rituals per rank.' },
  { name: 'Night Lore',         category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Night realm rituals per rank.' },
  { name: 'Extra Ritual',       category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '**', description: 'Contribute to one additional ritual per event per rank.' },
  // ── Artisan ──
  { name: 'Artisan',            category: 'Artisan', xpCost: 4, isPrereq: true, description: 'Craft one magic item between events using the crafting system.' },
  { name: 'Extra Item',         category: 'Artisan', xpCost: 1, maxRank: 3, scaling: '**', description: 'Craft one additional magic item per rank each downtime.' },
  // ── Physick ──
  { name: 'Chirurgeon',         category: 'Physick', xpCost: 1, isPrereq: true, description: 'Stabilise a dying character with a slow count, preventing death.' },
  { name: 'Physick',            category: 'Physick', xpCost: 3, description: 'Use surgical tools to restore limbs, cure diseases, and complex conditions.' },
  { name: 'Apothecary',         category: 'Physick', xpCost: 2, description: 'Brew herbal remedies and potions during downtime.' },
  { name: 'Extra Recipes',      category: 'Physick', xpCost: 1, maxRank: 3, scaling: '**', description: 'Learn one additional apothecary recipe per rank.' },
  // ── Priest ──
  { name: 'Dedication',         category: 'Priest',  xpCost: 2, isPrereq: true, description: 'Follow a Way virtue; perform and receive religious ceremonies.' },
  { name: 'Anointing',          category: 'Priest',  xpCost: 1, description: 'Apply a personal aura aligned to a virtue to a willing character.' },
  { name: 'Consecration',       category: 'Priest',  xpCost: 1, description: 'Consecrate a tent or building to a virtue for the event.' },
  { name: 'Exorcism',           category: 'Priest',  xpCost: 1, description: 'Remove malign spiritual influences (curses, vallorn taint) from a target.' },
  { name: 'Hallow',             category: 'Priest',  xpCost: 1, description: 'Apply a hallow to a character at the start of an event.' },
  { name: 'Excommunicate',      category: 'Priest',  xpCost: 1, description: 'Revoke a character\'s spiritual protection as a Synod judgement.' },
  { name: 'Insight',            category: 'Priest',  xpCost: 1, description: 'Determine the aura, dedication, and spiritual state of a character.' },
  { name: 'Testimony',          category: 'Priest',  xpCost: 1, description: 'Provide a magically-witnessed account of a soul\'s deeds to the Synod.' },
  // ── Leadership ──
  { name: 'Military Commander', category: 'Leadership', xpCost: 2, description: 'Lead a military unit in downtime to take campaign actions.' },
  { name: 'Seneschal',          category: 'Leadership', xpCost: 2, description: 'Direct a business, congregation, or fleet during downtime.' },
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
