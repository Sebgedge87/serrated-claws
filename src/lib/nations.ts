export type Nation =
  | 'Dawn'
  | 'Highguard'
  | 'The Marches'
  | 'Wintermark'
  | 'Navarr'
  | 'The League'
  | 'Varushka'
  | 'Urizen'
  | 'The Brass Coast'
  | 'Imperial Orcs';

export interface NationConfig {
  nation: Nation;
  slug: string;            // data-nation attribute value (kebab-case)
  groupTerm: string;
  groupTermPlural: string;
  memberTerm: string;
  colors: string[];
  icon: string;
}

export const NATIONS: NationConfig[] = [
  { nation: 'Dawn',            slug: 'dawn',            groupTerm: 'House',     groupTermPlural: 'Houses',     memberTerm: 'Noble',       colors: ['#c9a961','#1a4f8a','#c41e3a','#2e6b3e','#5a2d82'], icon: '⚜️' },
  { nation: 'Highguard',       slug: 'highguard',       groupTerm: 'Chapter',   groupTermPlural: 'Chapters',   memberTerm: 'Battle-mage', colors: ['#e8e8e8','#1a1a1a','#b30000','#3a3a3a','#c8c8c8'], icon: '✝️' },
  { nation: 'The Marches',     slug: 'the-marches',     groupTerm: 'Household', groupTermPlural: 'Households', memberTerm: 'Yeoman',      colors: ['#5a8a3a','#8b5e2a','#d4a84b','#3a6b2a','#c8832a'], icon: '🌾' },
  { nation: 'Wintermark',      slug: 'wintermark',      groupTerm: 'Hall',      groupTermPlural: 'Halls',      memberTerm: 'Thane',       colors: ['#5b8db8','#8fb8d8','#b0c8d8','#2a4a6a','#c8d8e8'], icon: '❄️' },
  { nation: 'Navarr',          slug: 'navarr',          groupTerm: 'Striding',  groupTermPlural: 'Stridings',  memberTerm: 'Brand',       colors: ['#2a5a1e','#1a3a12','#4a8a36','#6aaa56','#0a2008'], icon: '🌿' },
  { nation: 'The League',      slug: 'the-league',      groupTerm: 'Guild',     groupTermPlural: 'Guilds',     memberTerm: 'Merchant',    colors: ['#7a3aaa','#c9a961','#4a1a7a','#aa6adc','#1a0a2a'], icon: '⚖️' },
  { nation: 'Varushka',        slug: 'varushka',        groupTerm: 'Steading',  groupTermPlural: 'Steadings',  memberTerm: 'Boyar',       colors: ['#8b1a1a','#5c1e1e','#c8402a','#3a1010','#b05030'], icon: '🐻' },
  { nation: 'Urizen',          slug: 'urizen',          groupTerm: 'Spire',     groupTermPlural: 'Spires',     memberTerm: 'Mage',        colors: ['#7868c8','#a898e8','#4848a8','#c8b8f8','#281868'], icon: '🔮' },
  { nation: 'The Brass Coast', slug: 'the-brass-coast', groupTerm: 'Family',    groupTermPlural: 'Families',   memberTerm: 'Freeborn',    colors: ['#d4622a','#e8962a','#c41e3a','#f0b830','#9a2010'], icon: '🔥' },
  { nation: 'Imperial Orcs',   slug: 'imperial-orcs',   groupTerm: 'Legion',    groupTermPlural: 'Legions',    memberTerm: 'Orc',         colors: ['#4a6a2a','#2a4a1a','#6a8a3a','#1a2a0a','#8aaa5a'], icon: '⚔️' },
];

export const NATION_MAP = Object.fromEntries(NATIONS.map(n => [n.nation, n])) as Record<Nation, NationConfig>;

export function nationConfig(nation: string | null | undefined): NationConfig {
  return (nation && NATION_MAP[nation as Nation]) ? NATION_MAP[nation as Nation] : NATION_MAP['Dawn'];
}
