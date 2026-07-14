export type VisRealm = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Day' | 'Night';

export interface VisItem {
  name: string;
  realm: VisRealm;
  mana: number; // mana value per unit
  effect: string;
}

export const VIS_CATALOGUE: VisItem[] = [
  {
    name: "Vital Honey",
    realm: 'Spring',
    mana: 3,
    effect: "Counts as three mana when used as part of a Spring ritual. All the vis is consumed in the ritual, regardless of how much mana is required, but the benefits may be shared by multiple contributors.",
  },
  {
    name: "Golden Apple",
    realm: 'Summer',
    mana: 3,
    effect: "Counts as three mana when used as part of a Summer ritual. All the vis is consumed in the ritual, regardless of how much mana is required, but the benefits may be shared by multiple contributors.",
  },
  {
    name: "Warm Ashes",
    realm: 'Autumn',
    mana: 3,
    effect: "Counts as three mana when used as part of an Autumn ritual. All the vis is consumed in the ritual, regardless of how much mana is required, but the benefits may be shared by multiple contributors.",
  },
  {
    name: "Heart's Blood",
    realm: 'Winter',
    mana: 3,
    effect: "Counts as three mana when used as part of a Winter ritual. All the vis is consumed in the ritual, regardless of how much mana is required, but the benefits may be shared by multiple contributors.",
  },
  {
    name: "Prismatic Ink",
    realm: 'Day',
    mana: 3,
    effect: "Counts as three mana when used as part of a Day ritual. All the vis is consumed in the ritual, regardless of how much mana is required, but the benefits may be shared by multiple contributors.",
  },
  {
    name: "Crystal Fire",
    realm: 'Night',
    mana: 3,
    effect: "Counts as three mana when used as part of a Night ritual. All the vis is consumed in the ritual, regardless of how much mana is required, but the benefits may be shared by multiple contributors.",
  },
];

export const VIS_REALM_NAMES: Record<VisRealm, string[]> = {
  Spring: ['vital honey'],
  Summer: ['golden apple', 'golden apples', 'sun apple'],
  Autumn: ['warm ashes', 'ashes of estavus'],
  Winter: ["heart's blood", 'hearts blood'],
  Day: ['prismatic ink'],
  Night: ['crystal fire'],
};
