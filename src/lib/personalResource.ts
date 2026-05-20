export const ALL_TERRITORIES = ['Astolat', 'Semmerholm', 'The Barrens', 'Weirwater', 'Casinea', 'Miaren', 'Mournwold', 'Upwold', 'Kahraman', 'Madruga', 'Segura', 'Feroz', 'Bregasland', 'Hahnmark', 'Kallavesa', 'Sermersuaq', 'Bastion', 'Reikos', 'Holberg', 'Sarvos', 'Tassato', 'Temeschwar', 'Zenith', 'Lustri', 'Proceris'] as const;
export type Territory = typeof ALL_TERRITORIES[number];

// Keep backward compat alias
export const TERRITORIES = ALL_TERRITORIES;

// Fleets require coastal/maritime access
const COASTAL: Territory[] = ['Madruga', 'Feroz', 'Segura', 'Sarvos', 'Tassato', 'Temeschwar', 'Holberg', 'Kallavesa', 'Sermersuaq', 'Bregasland'];

// Mana Sites are most concentrated in Urizen but exist elsewhere
const MANA_TERRITORIES: Territory[] = ['Zenith', 'Lustri', 'Proceris', 'Miaren', 'Hahnmark', 'Reikos', 'Casinea', 'Weirwater', 'Astolat', 'Semmerholm', 'Upwold'];

// Forests require wooded territories
const FOREST_TERRITORIES: Territory[] = ['Miaren', 'Upwold', 'Mournwold', 'Weirwater', 'Astolat', 'Sermersuaq', 'Hahnmark', 'Reikos', 'Casinea', 'The Barrens'];

// Mines require upland/mountainous territories
const MINE_TERRITORIES: Territory[] = ['Kahraman', 'Hahnmark', 'Mournwold', 'Holberg', 'Temeschwar', 'The Barrens', 'Semmerholm', 'Proceris', 'Zenith'];

export function territoriesForResource(type: ResourceType | null): Territory[] {
  if (!type) return [...ALL_TERRITORIES];
  if (type === 'Fleet')      return COASTAL;
  if (type === 'Mana Site')  return MANA_TERRITORIES;
  if (type === 'Forest')     return FOREST_TERRITORIES;
  if (type === 'Mine')       return MINE_TERRITORIES;
  return [...ALL_TERRITORIES]; // Farm, Business, Congregation, Herb Garden, Military Unit
}

export const RESOURCE_TYPES = ['Business', 'Congregation', 'Farm', 'Fleet', 'Herb Garden', 'Mana Site', 'Military Unit', 'Forest', 'Mine'] as const;

export type ResourceType = typeof RESOURCE_TYPES[number];

export const FOREST_OPTIONS = ['Ambergelt Forest', "Beggar's Lye Forest", 'Dragonbone Forest', 'Iridescent Gleaming Forest'];
export const MINE_OPTIONS = ['Green Iron Mine', 'Orichalcum Mine', 'Tempest Jade Mine', 'Weltsilver Mine'];

export function resourceSubOptions(type: ResourceType | null): string[] {
  if (type === 'Forest') return FOREST_OPTIONS;
  if (type === 'Mine') return MINE_OPTIONS;
  return [];
}

export function buildResourceString(type: ResourceType | null, sub: string | null): string | null {
  if (!type) return null;
  if (sub) return `${type}: ${sub}`;
  return type;
}

export function parseResourceString(value: string | null): { type: ResourceType | null; sub: string | null } {
  if (!value) return { type: null, sub: null };
  const colonIdx = value.indexOf(': ');
  if (colonIdx >= 0) {
    const type = value.substring(0, colonIdx) as ResourceType;
    const sub = value.substring(colonIdx + 2);
    return { type: RESOURCE_TYPES.includes(type) ? type : null, sub };
  }
  const type = value as ResourceType;
  return { type: RESOURCE_TYPES.includes(type) ? type : null, sub: null };
}
