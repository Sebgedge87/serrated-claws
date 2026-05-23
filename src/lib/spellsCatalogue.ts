export type SpellRealm = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Day' | 'Night';

export interface Spell {
  name: string;
  type: 'Regular' | 'Offensive';
  manaCost: number;
  realm: SpellRealm | null; // null = available to all realms
  skillRequired: string;
  effect: string;
}

// Realm-universal spells (all mages)
const ALL: Spell[] = [
  { name: 'Create Bond',     type: 'Regular',   manaCost: 1, realm: null, skillRequired: 'Magician (free)',       effect: 'Bonds a character to a magic item, or breaks an existing bond.' },
  { name: 'Detect Magic',    type: 'Regular',   manaCost: 1, realm: null, skillRequired: 'Magician (free)',       effect: 'Detects presence and nature of magic on an item, place or person.' },
  { name: 'Operate Portal',  type: 'Regular',   manaCost: 1, realm: null, skillRequired: 'Magician (free)',       effect: 'Activates a magical portal (e.g. Sentinel Gate).' },
];

// Realm-specific spells
const REALM: Spell[] = [
  // Spring — healing, restoration
  { name: 'Heal',             type: 'Regular',   manaCost: 1, realm: 'Spring', skillRequired: 'Magician + Extra Spell', effect: 'Restores 3 hits. Swift cast (2 mana) restores 1 hit instantly.' },
  { name: 'Restore Limb',     type: 'Regular',   manaCost: 1, realm: 'Spring', skillRequired: 'Magician + Extra Spell', effect: 'Restores a limb ruined by CLEAVE or IMPALE. Swift cast is instant.' },
  { name: 'Purify',           type: 'Regular',   manaCost: 1, realm: 'Spring', skillRequired: 'Magician + Extra Spell', effect: 'Removes VENOM or WEAKNESS condition.' },
  { name: 'Mend',             type: 'Regular',   manaCost: 1, realm: 'Spring', skillRequired: 'Magician + Extra Spell', effect: 'Repairs a damaged or broken item.' },
  { name: 'Voice for the Dead', type: 'Regular', manaCost: 1, realm: 'Spring', skillRequired: 'Magician + Extra Spell', effect: 'Allows a recently dead character to briefly speak.' },

  // Summer — endurance, force
  { name: 'Empower',          type: 'Offensive', manaCost: 1, realm: 'Summer', skillRequired: 'Magician + Extra Spell', effect: 'Grants target ability to use a hero point they have already spent once more.' },
  { name: 'Shatter',          type: 'Offensive', manaCost: 2, realm: 'Summer', skillRequired: 'Magician + Extra Spell', effect: 'Calls SHATTER – destroys a single item (weapon, shield, or armour).' },
  { name: 'Repel',            type: 'Offensive', manaCost: 1, realm: 'Summer', skillRequired: 'Magician + Extra Spell', effect: 'Calls REPEL – target is pushed back away from the caster.' },

  // Autumn — entanglement, knowledge
  { name: 'Entangle',         type: 'Offensive', manaCost: 1, realm: 'Autumn', skillRequired: 'Magician + Extra Spell', effect: 'Calls ENTANGLE – target cannot move their feet for the duration.' },
  { name: 'Skein of Years',   type: 'Regular',   manaCost: 1, realm: 'Autumn', skillRequired: 'Magician + Extra Spell', effect: 'Read the magical history of an item by touch.' },

  // Winter — paralysis, weakness, cursing
  { name: 'Paralysis',        type: 'Offensive', manaCost: 2, realm: 'Winter', skillRequired: 'Magician + Extra Spell', effect: 'Calls PARALYSIS – target cannot move or take any action.' },
  { name: 'Weakness',         type: 'Offensive', manaCost: 1, realm: 'Winter', skillRequired: 'Magician + Extra Spell', effect: 'Calls WEAKNESS – target suffers the weakness condition.' },

  // Day — aura, divination
  { name: 'Bright Lance',     type: 'Offensive', manaCost: 2, realm: 'Day',    skillRequired: 'Magician + Extra Spell', effect: 'Calls THROUGH – passes through armour to deal a wound.' },
  { name: 'Zone of Sanctity', type: 'Regular',   manaCost: 2, realm: 'Day',    skillRequired: 'Magician + Extra Spell', effect: 'Creates a 10-foot aura that repels the Vallorn or similar creatures.' },

  // Night — concealment, deception
  { name: 'Night Pouch',      type: 'Regular',   manaCost: 1, realm: 'Night',  skillRequired: 'Magician + Extra Spell', effect: 'Creates a magical pouch concealing one item until next dawn.' },
  { name: 'Venom',            type: 'Offensive', manaCost: 1, realm: 'Night',  skillRequired: 'Magician + Extra Spell', effect: 'Calls VENOM – target suffers the venom condition.' },
  { name: 'Distort Fate',     type: 'Regular',   manaCost: 2, realm: 'Night',  skillRequired: 'Magician + Extra Spell', effect: 'Forces a reroll of a Lineage or ritual random element.' },
];

export const SPELLS_CATALOGUE: Spell[] = [...ALL, ...REALM];

export function spellsForRealm(realm: SpellRealm | null): Spell[] {
  if (!realm) return ALL;
  return SPELLS_CATALOGUE.filter(s => s.realm === null || s.realm === realm);
}
