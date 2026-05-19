export interface Spell {
  name: string;
  type: 'Regular' | 'Offensive';
  manaCost: string;
  skillRequired: string;
  effect: string;
}

// All spells cost 1 personal mana unless stated. Offensive spells require an implement.
export const SPELLS_CATALOGUE: Spell[] = [
  { name: 'Create Bond', type: 'Regular', manaCost: '1', skillRequired: 'Magician (free)', effect: 'Bonds a character to a magic item, or breaks an existing bond. Allows artisan to bond items they made.' },
  { name: 'Detect Magic', type: 'Regular', manaCost: '1', skillRequired: 'Magician (free)', effect: 'Detects presence and nature of magic on an item, place or person.' },
  { name: 'Operate Portal', type: 'Regular', manaCost: '1', skillRequired: 'Magician (free)', effect: 'Activates a magical portal (e.g. Sentinel Gate).' },
  { name: 'Heal', type: 'Regular', manaCost: '1 (2 swift)', skillRequired: 'Magician + Extra Spell', effect: 'Restores 3 hits. Swift cast (2 mana) restores 1 hit instantly.' },
  { name: 'Mend', type: 'Regular', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Repairs a damaged or broken item.' },
  { name: 'Night Pouch', type: 'Regular', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Creates a magical pouch concealing one item until next dawn.' },
  { name: 'Purify', type: 'Regular', manaCost: '1 (2 swift)', skillRequired: 'Magician + Extra Spell', effect: 'Removes VENOM or WEAKNESS condition. Swift cast removes only one condition.' },
  { name: 'Restore Limb', type: 'Regular', manaCost: '1 (2 swift)', skillRequired: 'Magician + Extra Spell', effect: 'Restores a limb ruined by CLEAVE or IMPALE. Swift cast is instant.' },
  { name: 'Voice for the Dead', type: 'Regular', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Allows a recently dead character to briefly speak.' },
  { name: 'Empower', type: 'Offensive', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Grants target ability to use a hero point they have already spent once more.' },
  { name: 'Entangle', type: 'Offensive', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Calls ENTANGLE – target cannot move their feet for the duration.' },
  { name: 'Paralysis', type: 'Offensive', manaCost: '2', skillRequired: 'Magician + Extra Spell', effect: 'Calls PARALYSIS – target cannot move or take any action.' },
  { name: 'Repel', type: 'Offensive', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Calls REPEL – target is pushed back away from the caster.' },
  { name: 'Shatter', type: 'Offensive', manaCost: '2', skillRequired: 'Magician + Extra Spell', effect: 'Calls SHATTER – destroys a single item (weapon, shield, or armour).' },
  { name: 'Venom', type: 'Offensive', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Calls VENOM – target suffers the venom condition.' },
  { name: 'Weakness', type: 'Offensive', manaCost: '1', skillRequired: 'Magician + Extra Spell', effect: 'Calls WEAKNESS – target suffers the weakness condition.' },
];
