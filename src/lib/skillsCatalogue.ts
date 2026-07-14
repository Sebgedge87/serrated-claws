export type SkillCategory = 'Combat' | 'Heroic' | 'Magic' | 'Artisan' | 'Physick' | 'Priest';

export interface CatalogueSkill {
  name: string;
  category: SkillCategory;
  xpCost: number;
  maxRank?: number;
  /** undefined = single purchase only */
  scaling?: '*' | '**';
  /** This skill is a pre-requisite for all other skills in its category */
  isPrereq?: boolean;
  /** Names of other skills that must be purchased first */
  requires?: string[];
  /** One-line description of what the skill does in play */
  description?: string;
}

export const SKILL_CATEGORY_COLORS: Record<SkillCategory, { bg: string; text: string; border: string }> = {
  Combat:  { bg: 'rgba(168,65,63,0.18)',    text: '#e87070', border: 'rgba(168,65,63,0.4)' },
  Heroic:  { bg: 'rgba(230,120,50,0.18)',   text: '#e8864a', border: 'rgba(230,120,50,0.4)' },
  Magic:   { bg: 'rgba(155,89,182,0.18)',   text: '#c27dd4', border: 'rgba(155,89,182,0.4)' },
  Artisan: { bg: 'rgba(52,152,219,0.18)',   text: '#6ab0e0', border: 'rgba(52,152,219,0.4)' },
  Physick: { bg: 'rgba(46,160,67,0.18)',    text: '#6ad47e', border: 'rgba(46,160,67,0.4)' },
  Priest:  { bg: 'rgba(212,180,109,0.18)',  text: '#d4b46d', border: 'rgba(212,180,109,0.4)' },
};

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  'Combat', 'Heroic', 'Magic', 'Physick', 'Priest', 'Artisan',
];

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  Combat:  'Combat Skills',
  Heroic:  'Heroic Skills',
  Magic:   'Magical Skills',
  Artisan: 'Crafting Skills',
  Physick: 'Surgical Skills',
  Priest:  'Religious Skills',
};

export const SKILLS_CATALOGUE: CatalogueSkill[] = [
  // ── Combat Skills ──
  { name: 'Thrown',           category: 'Combat', xpCost: 1, description: 'Use thrown weapons as ranged attacks.' },
  { name: 'Ambidexterity',    category: 'Combat', xpCost: 1, description: 'Use one-handed weapons in either hand without restriction.' },
  { name: 'Weapon Master',    category: 'Combat', xpCost: 2, description: 'Call CLEAVE once per hit with a one-handed weapon, destroying a limb.' },
  { name: 'Marksman',         category: 'Combat', xpCost: 4, description: 'Call CLEAVE with a bow or thrown weapon.' },
  { name: 'Shield',           category: 'Combat', xpCost: 2, description: 'Use a large shield to protect yourself and allies.' },
  { name: 'Endurance',        category: 'Combat', xpCost: 2, scaling: '*', description: 'Once per day, spend 10 seconds to restore all lost hits.' },
  { name: 'Fortitude',        category: 'Combat', xpCost: 1, scaling: '*', description: '+1 global hit per rank.' },
  { name: 'Dreadnought',      category: 'Combat', xpCost: 1, description: 'Wear heavy armour (requires appropriate phys-rep).' },
  // ── Heroic Skills ──
  { name: 'Hero',             category: 'Heroic', xpCost: 2, isPrereq: true, description: 'Gain 1 hero point per event. Prerequisite for all Heroic abilities.' },
  { name: 'Extra Hero Points',category: 'Heroic', xpCost: 1, scaling: '*',  description: '+1 hero point per rank per event.' },
  { name: 'Cleaving Strike',  category: 'Heroic', xpCost: 1, description: 'Spend 1 hero point to call CLEAVE on your next hit.' },
  { name: 'Mortal Blow',      category: 'Heroic', xpCost: 1, requires: ['Weapon Master'], description: 'Spend 1 hero point to call IMPALE, instantly killing the target.' },
  { name: 'Mighty Strikedown',category: 'Heroic', xpCost: 1, requires: ['Weapon Master'], description: 'Spend 1 hero point to call STRIKEDOWN with a two-handed weapon.' },
  { name: 'Relentless',       category: 'Heroic', xpCost: 2, description: 'Spend 1 hero point to immediately stand from a STRIKEDOWN or KNOCKDOWN.' },
  { name: 'Unstoppable',      category: 'Heroic', xpCost: 2, description: 'Spend 1 hero point to ignore the next hit that would take you to 0 hits.' },
  { name: 'Stay With Me',     category: 'Heroic', xpCost: 1, description: 'Spend 1 hero point to restore a dying character to 1 hit with a touch.' },
  { name: 'Get It Together',  category: 'Heroic', xpCost: 1, description: 'Spend 1 hero point to remove WEAKNESS or VENOM from yourself or an ally.' },
  // ── Magical Skills ──
  { name: 'Magician',         category: 'Magic',  xpCost: 2, isPrereq: true, description: 'Cast the three free spells: Create Bond, Detect Magic, Operate Portal.' },
  { name: 'Extra Mana',       category: 'Magic',  xpCost: 1, scaling: '*',  description: '+1 personal mana per rank per event.' },
  { name: 'Extra Spell',      category: 'Magic',  xpCost: 1, scaling: '**', description: 'Learn one additional personal spell per rank.' },
  { name: 'Battle Mage',      category: 'Magic',  xpCost: 2, description: 'Cast personal spells whilst wearing armour.' },
  { name: 'Spring Lore',      category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Spring realm rituals per rank.' },
  { name: 'Summer Lore',      category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Summer realm rituals per rank.' },
  { name: 'Autumn Lore',      category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Autumn realm rituals per rank.' },
  { name: 'Winter Lore',      category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Winter realm rituals per rank.' },
  { name: 'Day Lore',         category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Day realm rituals per rank.' },
  { name: 'Night Lore',       category: 'Magic',  xpCost: 1, maxRank: 3, scaling: '*', description: '+1 effective rank in Night realm rituals per rank.' },
  { name: 'Extra Ritual',     category: 'Magic',  xpCost: 1, scaling: '**', description: 'Contribute to one additional ritual per event per rank.' },
  // ── Surgical Skills ──
  { name: 'Chirurgeon',       category: 'Physick', xpCost: 1, isPrereq: true, description: 'Stabilise a dying character with a slow count, preventing death.' },
  { name: 'Physick',          category: 'Physick', xpCost: 3, description: 'Use surgical tools to restore limbs, cure diseases, and complex conditions.' },
  { name: 'Apothecary',       category: 'Physick', xpCost: 2, description: 'Brew herbal remedies and potions during downtime.' },
  { name: 'Extra Recipe',     category: 'Physick', xpCost: 1, scaling: '**', description: 'Learn one additional apothecary recipe per rank.' },
  // ── Religious Skills ──
  { name: 'Dedication',       category: 'Priest',  xpCost: 2, isPrereq: true, description: 'Follow a Way virtue; perform and receive religious ceremonies.' },
  { name: 'Anointing',        category: 'Priest',  xpCost: 1, description: 'Apply a personal aura aligned to a virtue to a willing character.' },
  { name: 'Consecration',     category: 'Priest',  xpCost: 1, description: 'Consecrate a tent or building to a virtue for the event.' },
  { name: 'Excommunication',  category: 'Priest',  xpCost: 1, description: 'Revoke a character\'s spiritual protection as a Synod judgement.' },
  { name: 'Exorcism',         category: 'Priest',  xpCost: 1, description: 'Remove malign spiritual influences (curses, vallorn taint) from a target.' },
  { name: 'Hallow',           category: 'Priest',  xpCost: 1, description: 'Apply a hallow to a character at the start of an event.' },
  { name: 'Insight',          category: 'Priest',  xpCost: 1, description: 'Determine the aura, dedication, and spiritual state of a character.' },
  { name: 'Testimony',        category: 'Priest',  xpCost: 1, description: 'Provide a magically-witnessed account of a soul\'s deeds to the Synod.' },
  // ── Crafting Skills ──
  { name: 'Artisan',          category: 'Artisan', xpCost: 4, isPrereq: true, description: 'Craft one magic item between events using the crafting system.' },
  { name: 'Extra Item',       category: 'Artisan', xpCost: 1, scaling: '**', description: 'Craft one additional magic item per rank each downtime.' },
];

/** XP cost to buy a skill at a given rank (1-indexed, cumulative). */
export function skillXpCost(skill: CatalogueSkill, rank: number): number {
  if (rank <= 0) return 0;
  if (!skill.scaling) return skill.xpCost;
  if (skill.scaling === '**') return rank * skill.xpCost;
  // '*' = cost increases by 1 each purchase
  return rank * skill.xpCost + (rank * (rank - 1)) / 2;
}

/** XP cost of one additional rank on top of existing ones. */
export function nextRankXpCost(skill: CatalogueSkill, currentRank: number): number {
  return skillXpCost(skill, currentRank + 1) - skillXpCost(skill, currentRank);
}
