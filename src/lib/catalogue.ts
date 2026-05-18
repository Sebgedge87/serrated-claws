import type { CatalogueEntry } from './types';

export const EMPIRE_CATALOGUE: CatalogueEntry[] = [
  // Currency
  { item: 'Ring', type: 'Currency', subType: 'Imperial Money', unit: 'Coin', notes: '20 rings = 1 crown', track: true },
  { item: 'Crown', type: 'Currency', subType: 'Imperial Money', unit: 'Coin', notes: '8 crowns = 1 throne', track: true },
  { item: 'Throne', type: 'Currency', subType: 'Imperial Money', unit: 'Coin', notes: 'Main high-value coin', track: true },

  // Resource Sources
  { item: 'Business', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: 'Produces 9 crowns', track: false },
  { item: 'Farm', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: 'Produces 9 crowns', track: false },
  { item: 'Congregation', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: '5 liao + 10 Synod votes', track: false },
  { item: 'Fleet', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: 'Foreign trade, adventures, privateering', track: false },
  { item: 'Forest', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: '12 measures of one rare natural material', track: false },
  { item: 'Herb garden', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: '14 herbs', track: false },
  { item: 'Mana site', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: '7 mana crystals', track: false },
  { item: 'Military unit', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: 'Supports armies, adventures, paid work', track: false },
  { item: 'Mine', type: 'Resource Source', subType: 'Personal Resource', unit: 'Resource', notes: '12 ingots of one rare metal', track: false },

  // Building Materials
  { item: 'Mithril', type: 'Building Material', subType: 'Imperial Wain', unit: 'Wain', notes: 'Commissions, construction, resource upgrades', track: true },
  { item: 'Weirwood', type: 'Building Material', subType: 'Imperial Wain', unit: 'Wain', notes: 'Commissions, construction, resource upgrades', track: true },
  { item: 'White Granite', type: 'Building Material', subType: 'Imperial Wain', unit: 'Wain', notes: 'Commissions, construction, resource upgrades', track: true },

  // Crafting Materials — Rare Metals
  { item: 'Green Iron', type: 'Crafting Material', subType: 'Rare Metal', unit: 'Ingot', producedBy: 'Mine', track: true },
  { item: 'Orichalcum', type: 'Crafting Material', subType: 'Rare Metal', unit: 'Ingot', producedBy: 'Mine', track: true },
  { item: 'Tempest Jade', type: 'Crafting Material', subType: 'Rare Metal', unit: 'Ingot', producedBy: 'Mine', track: true },
  { item: 'Weltsilver', type: 'Crafting Material', subType: 'Rare Metal', unit: 'Ingot', producedBy: 'Mine', track: true },

  // Crafting Materials — Natural Materials
  { item: 'Ambergelt', type: 'Crafting Material', subType: 'Natural Material', unit: 'Measure', producedBy: 'Forest', track: true },
  { item: "Beggar's Lye", type: 'Crafting Material', subType: 'Natural Material', unit: 'Measure', producedBy: 'Forest', track: true },
  { item: 'Dragonbone', type: 'Crafting Material', subType: 'Natural Material', unit: 'Measure', producedBy: 'Forest', track: true },
  { item: 'Iridescent Gloaming', type: 'Crafting Material', subType: 'Natural Material', unit: 'Measure', producedBy: 'Forest', track: true },

  { item: 'Ilium', type: 'Crafting Material', subType: 'Rare Material', unit: 'Ring / dose', notes: 'Artefacts and schemata', track: true },

  // Herbs — Common
  { item: 'Bladeroot', type: 'Herb', subType: 'Common Herb', unit: 'Herb card', producedBy: 'Herb garden', track: true },
  { item: 'Cerulean Mazzarine', type: 'Herb', subType: 'Common Herb', unit: 'Herb card', producedBy: 'Herb garden', track: true },
  { item: 'Imperial Roseweald', type: 'Herb', subType: 'Common Herb', unit: 'Herb card', producedBy: 'Herb garden', track: true },
  { item: 'Marrowort', type: 'Herb', subType: 'Common Herb', unit: 'Herb card', producedBy: 'Herb garden', track: true },
  { item: 'True Vervain', type: 'Herb', subType: 'Common Herb', unit: 'Herb card', producedBy: 'Herb garden', track: true },
  { item: 'Realmsroot', type: 'Herb', subType: 'Rare Herb', unit: 'Potion lammy', track: true },

  // Carded / Consumable
  { item: 'Mana Crystal', type: 'Carded / Consumable Item', subType: 'Mana', unit: 'Card / lammy', track: true },
  { item: 'Liao', type: 'Carded / Consumable Item', subType: 'Religious Consumable', unit: 'Card / lammy', track: true },
  { item: 'Philtre', type: 'Carded / Consumable Item', subType: 'Battle Potion', unit: 'Card / lammy', track: true },
  { item: "Artisan's Oil", type: 'Carded / Consumable Item', subType: 'Crafting Consumable', unit: 'Card / lammy', track: true },

  // Vis — Realm Mana
  { item: 'Prismatic Ink', type: 'Vis', subType: 'Day Vis', unit: 'Vis card', notes: '3 mana for a Day ritual', track: true },
  { item: "Heart's Blood", type: 'Vis', subType: 'Winter Vis', unit: 'Vis card', notes: '3 mana for a Winter ritual', track: true },
  { item: 'Vital Honey', type: 'Vis', subType: 'Spring Vis', unit: 'Vis card', notes: '3 mana for a Spring ritual', track: true },
  { item: 'Crystal Fire', type: 'Vis', subType: 'Night Vis', unit: 'Vis card', notes: '3 mana for a Night ritual', track: true },
  { item: 'Golden Apples', type: 'Vis', subType: 'Summer Vis', unit: 'Vis card', notes: '3 mana for a Summer ritual', track: true },
  { item: 'Warm Ashes', type: 'Vis', subType: 'Autumn Vis', unit: 'Vis card', notes: '3 mana for an Autumn ritual', track: true },

  // Magic Items
  { item: 'Magic Weapon', type: 'Magic Item', subType: 'Personal', unit: 'Ribbon', track: true },
  { item: 'Magic Armour', type: 'Magic Item', subType: 'Personal', unit: 'Ribbon', track: true },
  { item: 'Magic Talisman', type: 'Magic Item', subType: 'Personal', unit: 'Ribbon', track: true },
  { item: 'Artefact', type: 'Magic Item', subType: 'Permanent', unit: 'Ribbon', track: true },
  { item: 'Schema', type: 'Magic Item', subType: 'Knowledge', unit: 'Ribbon', track: true },
  { item: 'Gonfalon', type: 'Magic Item', subType: 'Group', unit: 'Ribbon', track: true },
  { item: 'Paraphernalia', type: 'Magic Item', subType: 'Group', unit: 'Ribbon', track: true },
  { item: 'Reliquary', type: 'Magic Item', subType: 'Group', unit: 'Ribbon', track: true }
];

export const INVENTORY_TYPES: CatalogueEntry['type'][] = [
  'Currency',
  'Resource Source',
  'Building Material',
  'Crafting Material',
  'Herb',
  'Carded / Consumable Item',
  'Vis',
  'Magic Item'
];

export const TYPE_COLORS: Record<CatalogueEntry['type'], string> = {
  Currency: '#e0c66d',
  'Resource Source': '#7eb0d4',
  'Building Material': '#a89070',
  'Crafting Material': '#c0c0c0',
  Herb: '#7ed47e',
  'Carded / Consumable Item': '#ff8a6b',
  Vis: '#b56eb5',
  'Magic Item': '#e76eb5'
};
