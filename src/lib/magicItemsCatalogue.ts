export type ItemTier = 'apprentice' | 'journeyman' | 'adept' | 'masterwork';
export type ItemForm =
  | 'weapon-1h'
  | 'weapon-great'
  | 'weapon-polearm'
  | 'weapon-spear'
  | 'weapon-implement'
  | 'weapon-paired'
  | 'armour'
  | 'talisman'
  | 'talisman-icon'
  | 'talisman-reliquary'
  | 'talisman-paraphernalia'
  | 'standard';

export interface MaterialCost {
  gi?: number;    // Green Iron
  or?: number;    // Orichalcum
  tj?: number;    // Tempest Jade
  ws?: number;    // Weltsilver
  am?: number;    // Ambergelt
  bl?: number;    // Beggar's Lye
  db?: number;    // Dragonbone
  ig?: number;    // Iridescent Gloaming
  ilium?: number; // rings of ilium (artefacts / special items)
}

export interface CatalogueItem {
  id: string;
  name: string;
  tier: ItemTier;
  form: ItemForm;
  effect: string;
  materials: MaterialCost;
  totalMaterials: number;
  nations: 'all' | string[];
  skillRequired?: string;
  notes?: string;
}

export const MATERIAL_NAMES: Record<keyof MaterialCost, string> = {
  gi: 'Green Iron',
  or: 'Orichalcum',
  tj: 'Tempest Jade',
  ws: 'Weltsilver',
  am: 'Ambergelt',
  bl: "Beggar's Lye",
  db: 'Dragonbone',
  ig: 'Iridescent Gloaming',
  ilium: 'Ilium'
};

export const TIER_LABELS: Record<ItemTier, string> = {
  apprentice: 'Apprentice',
  journeyman: 'Journeyman',
  adept: 'Adept',
  masterwork: 'Masterwork'
};

export const MAGIC_ITEMS_CATALOGUE: CatalogueItem[] = [
  // ============================================================
  // APPRENTICE TIER (0 materials — schema items, no cost)
  // ============================================================
  {
    id: 'acolytes-mercy',
    name: "Acolyte's Mercy",
    tier: 'apprentice',
    form: 'weapon-1h',
    effect: 'You may call CLEAVE once per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'agramants-bargain',
    name: "Agramant's Bargain",
    tier: 'apprentice',
    form: 'talisman',
    effect: 'Grants a hero point. You may spend it to call ENTRAPPING on a blow.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'apprentices-blade',
    name: "Apprentice's Blade",
    tier: 'apprentice',
    form: 'weapon-1h',
    effect: 'You may cast the Mend spell as if you knew it while wielding this weapon.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Magician'
  },
  {
    id: 'banner-of-the-bold',
    name: 'Banner of the Bold',
    tier: 'apprentice',
    form: 'standard',
    effect: 'Allies within the banner aura gain one additional hero point per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'butchers-cleaver',
    name: "Butcher's Cleaver",
    tier: 'apprentice',
    form: 'weapon-1h',
    effect: 'You may call CLEAVE once per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'circlet-of-falling-snow',
    name: 'Circlet of Falling Snow',
    tier: 'apprentice',
    form: 'talisman',
    effect: 'You may cast the Winter spell Hunger of the Drowned once per day without spending mana.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Magician'
  },
  {
    id: 'crystaltenders-vestment',
    name: "Crystaltender's Vestment",
    tier: 'apprentice',
    form: 'armour',
    effect: 'You regain one spent mana at the start of each encounter.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'dragonbone-symbol',
    name: 'Dragonbone Symbol',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'You may call WEAKNESS once per day when performing a religious ceremony.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'farmers-scythe',
    name: "Farmer's Scythe",
    tier: 'apprentice',
    form: 'weapon-great',
    effect: 'You may call CLEAVE once per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'forlorn-hope',
    name: 'Forlorn Hope',
    tier: 'apprentice',
    form: 'talisman',
    effect: 'You have one additional hero point. You may spend it to call IMPALE on a blow.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'heros-girdle',
    name: "Hero's Girdle",
    tier: 'apprentice',
    form: 'talisman',
    effect: 'You have one additional hero point.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'icon-of-the-judge',
    name: 'Icon of the Judge',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'You may use the anointing ceremony to remove the roleplaying effect of the Weakness enchantment.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'icon-of-the-justicar',
    name: 'Icon of the Justicar',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'You may call SMITE once per day when performing a religious ceremony.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'icon-of-the-pilgrim',
    name: 'Icon of the Pilgrim',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'While bonded to this item you gain one additional rank of the Liao ceremony skill.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'icon-of-the-seer',
    name: 'Icon of the Seer',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'You may use the anointing ceremony to grant the ability to cast Detect Magic once per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'icon-of-the-smith',
    name: 'Icon of the Smith',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'You may use the anointing ceremony to grant one additional hero point for a day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'icon-of-the-steward',
    name: 'Icon of the Steward',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'While performing a religious ceremony you may call HEAL once.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'icon-of-the-witness',
    name: 'Icon of the Witness',
    tier: 'apprentice',
    form: 'talisman-icon',
    effect: 'You may use the anointing ceremony to remove the roleplaying effect of the Weakness enchantment.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'lamias-whisper',
    name: "Lamia's Whisper",
    tier: 'apprentice',
    form: 'weapon-implement',
    effect: 'You may cast the spell Entangle once per day without spending mana.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Magician'
  },
  {
    id: 'landkeepers-oath',
    name: "Landskeeper's Oath",
    tier: 'apprentice',
    form: 'talisman',
    effect: 'Once per day you may use the Stay With Me skill without spending a hero point.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'litany-of-the-labyrinth',
    name: 'Litany of the Labyrinth',
    tier: 'apprentice',
    form: 'talisman-reliquary',
    effect: 'You may perform the Hallow ceremony as if you knew it.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'marauders-cote',
    name: "Marauder's Cote",
    tier: 'apprentice',
    form: 'armour',
    effect: 'You gain one additional hero point. You may spend it to call IMPALE on a blow.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'mazzarine-spindle',
    name: 'Mazzarine Spindle',
    tier: 'apprentice',
    form: 'talisman',
    effect: 'You may cast the Night spell Cloak of Night once per day without spending mana.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Magician'
  },
  {
    id: 'mendicant-cassock',
    name: 'Mendicant Cassock',
    tier: 'apprentice',
    form: 'armour',
    effect: 'While wearing this armour you may use the Lay on Hands skill without spending a hero point, once per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'mountebanks-surprise',
    name: "Mountebank's Surprise",
    tier: 'apprentice',
    form: 'weapon-1h',
    effect: 'You may call VENOM once per day on a blow with this weapon.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'pilgrims-shield',
    name: "Pilgrim's Shield",
    tier: 'apprentice',
    form: 'talisman',
    effect: 'You may perform the Consecration ceremony as if you knew it.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'pugilists-shillelagh',
    name: "Pugilist's Shillelagh",
    tier: 'apprentice',
    form: 'weapon-1h',
    effect: 'You may call STRIKEDOWN once per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'razorleaf-hasta',
    name: 'Razorleaf Hasta',
    tier: 'apprentice',
    form: 'weapon-spear',
    effect: 'You may call IMPALE once per day.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'runesmiths-gavel',
    name: "Runesmith's Gavel",
    tier: 'apprentice',
    form: 'weapon-implement',
    effect: 'You may cast the spell Mend once per day without spending mana.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Magician'
  },
  {
    id: 'storm-sceptre',
    name: 'Storm Sceptre',
    tier: 'apprentice',
    form: 'weapon-implement',
    effect: 'You may cast the spell Lightening Bolt once per day without spending mana.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Magician'
  },
  {
    id: 'stoutheart-gambeson',
    name: 'Stoutheart Gambeson',
    tier: 'apprentice',
    form: 'armour',
    effect: 'You have one additional hero point.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'straw-mask',
    name: 'Straw Mask',
    tier: 'apprentice',
    form: 'talisman',
    effect: 'You may perform the Hallow ceremony as if you knew it.',
    materials: {},
    totalMaterials: 0,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'swanfeather-schema',
    name: 'Swanfeather Schema',
    tier: 'apprentice',
    form: 'talisman',
    effect: 'Once per day you may call HEAL on yourself as if you had cast the Heal Wound spell.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'tacticians-demand',
    name: "Tactician's Demand",
    tier: 'apprentice',
    form: 'talisman',
    effect: 'Once per day you may use the Get it Together skill without spending a hero point.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'unseen-encasement',
    name: 'Unseen Encasement',
    tier: 'apprentice',
    form: 'armour',
    effect: 'Once per day you may call RESIST on any spell that targets you.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'warriors-plate',
    name: "Warrior's Plate",
    tier: 'apprentice',
    form: 'armour',
    effect: 'You have one additional hero point. You may spend it to call CLEAVE on a blow.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },
  {
    id: 'yeomans-bounty',
    name: "Yeoman's Bounty",
    tier: 'apprentice',
    form: 'weapon-1h',
    effect: 'Once per day you may call HEAL on a character you have just struck.',
    materials: {},
    totalMaterials: 0,
    nations: 'all'
  },

  // ============================================================
  // JOURNEYMAN TIER (1–10 materials)
  // ============================================================
  {
    id: 'guided-path',
    name: 'Guided Path',
    tier: 'journeyman',
    form: 'talisman',
    effect: 'You may perform the Consecration ceremony as if you knew it and gain one additional rank of the skill.',
    materials: { db: 4 },
    totalMaterials: 4,
    nations: 'all',
    skillRequired: 'Dedication'
  },
  {
    id: 'whelpmasters-fang',
    name: "Whelpmaster's Fang",
    tier: 'journeyman',
    form: 'weapon-1h',
    effect: 'You may call VENOM twice per day on blows with this weapon.',
    materials: { bl: 4 },
    totalMaterials: 4,
    nations: 'all'
  },
  {
    id: 'windreaping-sickle',
    name: 'Windreaping Sickle',
    tier: 'journeyman',
    form: 'weapon-1h',
    effect: 'You may call CLEAVE twice per day.',
    materials: { tj: 4 },
    totalMaterials: 4,
    nations: 'all'
  },
  {
    id: 'sanguine-spear',
    name: 'Sanguine Spear',
    tier: 'journeyman',
    form: 'weapon-spear',
    effect: 'You may call IMPALE twice per day with this weapon.',
    materials: { gi: 5 },
    totalMaterials: 5,
    nations: 'all'
  },
  {
    id: 'biting-blade',
    name: 'Biting Blade',
    tier: 'journeyman',
    form: 'weapon-1h',
    effect: 'You may call CLEAVE twice per day and IMPALE once per day.',
    materials: { or: 7 },
    totalMaterials: 7,
    nations: 'all'
  },
  {
    id: 'bloodamber-hauberk',
    name: 'Bloodamber Hauberk',
    tier: 'journeyman',
    form: 'armour',
    effect: 'You have two additional hero points.',
    materials: { or: 3, am: 4 },
    totalMaterials: 7,
    nations: 'all'
  },
  {
    id: 'bondring',
    name: 'Bondring',
    tier: 'journeyman',
    form: 'talisman',
    effect: 'You may bond two items simultaneously.',
    materials: { db: 7 },
    totalMaterials: 7,
    nations: 'all'
  },
  {
    id: 'enduring-breastplate',
    name: 'Enduring Breastplate',
    tier: 'journeyman',
    form: 'armour',
    effect: 'You may call RESIST on one blow per day. You have one additional hero point.',
    materials: { or: 7 },
    totalMaterials: 7,
    nations: 'all'
  },
  {
    id: 'escharotic-cauldron',
    name: 'Escharotic Cauldron',
    tier: 'journeyman',
    form: 'talisman-paraphernalia',
    effect: 'You may create twice as many doses of any potion using this paraphernalia.',
    materials: { am: 7 },
    totalMaterials: 7,
    nations: 'all',
    skillRequired: 'Apothecary'
  },
  {
    id: 'reaving-mattock',
    name: 'Reaving Mattock',
    tier: 'journeyman',
    form: 'weapon-great',
    effect: 'You may call CLEAVE twice per day and STRIKEDOWN once per day.',
    materials: { tj: 7 },
    totalMaterials: 7,
    nations: 'all'
  },
  {
    id: 'shears-of-winter',
    name: 'Shears of Winter',
    tier: 'journeyman',
    form: 'weapon-paired',
    effect: 'You may call VENOM twice per day and WEAKNESS once per day.',
    materials: { tj: 4, db: 3 },
    totalMaterials: 7,
    nations: 'all'
  },

  // ============================================================
  // ADEPT TIER (11–20 materials)
  // ============================================================
  {
    id: 'blade-of-the-tempest',
    name: 'Blade of the Tempest',
    tier: 'adept',
    form: 'weapon-1h',
    effect: 'You may call CLEAVE three times per day and may cast a lightning bolt once per day without mana.',
    materials: { tj: 8, gi: 6 },
    totalMaterials: 14,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'captains-command',
    name: "Captain's Command",
    tier: 'adept',
    form: 'standard',
    effect: 'Allies within the banner aura gain two additional hero points per day.',
    materials: { or: 8, am: 8 },
    totalMaterials: 16,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'chain-of-aesh',
    name: 'Chain of Aesh',
    tier: 'adept',
    form: 'talisman',
    effect: 'You may call ENTRAPPING twice per day and STRIKEDOWN once per day.',
    materials: { gi: 9, db: 6 },
    totalMaterials: 15,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'cloak-of-lead-and-gold',
    name: 'Cloak of Lead and Gold',
    tier: 'adept',
    form: 'armour',
    effect: 'You may call RESIST on two blows per day and have two additional hero points.',
    materials: { or: 10, am: 8 },
    totalMaterials: 18,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'deepstone-cauldron',
    name: 'Deepstone Cauldron',
    tier: 'adept',
    form: 'talisman-paraphernalia',
    effect: 'You may brew three times as many doses of any potion using this paraphernalia.',
    materials: { or: 7, am: 7 },
    totalMaterials: 14,
    nations: 'all',
    skillRequired: 'Apothecary',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'duelists-scales',
    name: "Duelist's Scales",
    tier: 'adept',
    form: 'weapon-paired',
    effect: 'You may call CLEAVE twice and IMPALE twice per day across both weapons.',
    materials: { gi: 8, or: 8 },
    totalMaterials: 16,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'forge-lore-mantle',
    name: 'Forge-Lore Mantle',
    tier: 'adept',
    form: 'armour',
    effect: 'You may cast one additional battle spell per day and have one additional mana.',
    materials: { or: 7, tj: 7 },
    totalMaterials: 14,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'glorious-gold-bright',
    name: 'Glorious Gold-Bright',
    tier: 'adept',
    form: 'armour',
    effect: 'You have three additional hero points and may call RESIST once per day.',
    materials: { or: 9, gi: 7 },
    totalMaterials: 16,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'guiding-light',
    name: 'Guiding Light',
    tier: 'adept',
    form: 'talisman-icon',
    effect: 'You may perform the Hallow ceremony and have one additional rank of the skill.',
    materials: { am: 8, db: 7 },
    totalMaterials: 15,
    nations: 'all',
    skillRequired: 'Dedication',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'kirkjuvagr-hammer',
    name: 'Kirkjuvagr Hammer',
    tier: 'adept',
    form: 'weapon-1h',
    effect: 'You may call CLEAVE twice and STRIKEDOWN once per day.',
    materials: { gi: 7, or: 6 },
    totalMaterials: 13,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'mages-paraphernalia',
    name: "Mage's Paraphernalia",
    tier: 'adept',
    form: 'talisman-paraphernalia',
    effect: 'You may perform rituals as if you had one additional rank of the Ritual Lore skill.',
    materials: { ig: 8, tj: 7 },
    totalMaterials: 15,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'palantine-chasuble',
    name: 'Palantine Chasuble',
    tier: 'adept',
    form: 'armour',
    effect: 'You may perform the Consecration ceremony and have one additional rank of the skill.',
    materials: { am: 9, db: 7 },
    totalMaterials: 16,
    nations: 'all',
    skillRequired: 'Dedication',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'rod-of-the-master-magister',
    name: 'Rod of the Master Magister',
    tier: 'adept',
    form: 'weapon-implement',
    effect: 'You may cast one additional ritual spell per day and have two additional mana.',
    materials: { ig: 8, or: 7 },
    totalMaterials: 15,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'shieldbreaker',
    name: 'Shieldbreaker',
    tier: 'adept',
    form: 'weapon-great',
    effect: 'You may call CLEAVE twice and STRIKEDOWN twice per day.',
    materials: { gi: 6, tj: 6 },
    totalMaterials: 12,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'shroud-of-mist-and-shadow',
    name: 'Shroud of Mist and Shadow',
    tier: 'adept',
    form: 'armour',
    effect: 'You may call RESIST twice per day and may use the Assassinate skill once per day without spending a hero point.',
    materials: { ig: 9, bl: 7 },
    totalMaterials: 16,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },

  // ============================================================
  // MASTERWORK TIER (21+ materials)
  // ============================================================
  {
    id: 'abraded-lens-of-the-master',
    name: 'Abraded Lens of the Master',
    tier: 'masterwork',
    form: 'talisman-paraphernalia',
    effect: 'You may perform rituals as if you had two additional ranks of the Ritual Lore skill.',
    materials: { ig: 12, or: 10, tj: 8 },
    totalMaterials: 30,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'adamant-aegis',
    name: 'Adamant Aegis',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call RESIST three times per day and have three additional hero points.',
    materials: { or: 14, gi: 10 },
    totalMaterials: 24,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'autumns-richness',
    name: "Autumn's Richness",
    tier: 'masterwork',
    form: 'talisman-paraphernalia',
    effect: 'You may perform Autumn rituals as if you had two additional ranks and brew extra potions.',
    materials: { am: 12, ig: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'crowned-in-tempest-and-flame',
    name: 'Crowned in Tempest and Flame',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may cast battle spells twice per day each without spending mana and have two additional mana.',
    materials: { tj: 12, or: 12 },
    totalMaterials: 24,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'crimson-legate',
    name: 'Crimson Legate',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You have four additional hero points and may call IMPALE once per day.',
    materials: { gi: 12, or: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'dawnforged-ring',
    name: 'Dawnforged Ring',
    tier: 'masterwork',
    form: 'talisman',
    effect: 'You may bond three items simultaneously.',
    materials: { or: 14, gi: 8 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'deepstorm-wand',
    name: 'Deepstorm Wand',
    tier: 'masterwork',
    form: 'weapon-implement',
    effect: 'You may cast battle spells three times per day each without mana and have three additional mana.',
    materials: { ig: 12, tj: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'dire-mantle-of-night',
    name: 'Dire Mantle of Night',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call RESIST three times per day and use Assassinate twice per day without spending hero points.',
    materials: { ig: 12, bl: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'ewer-of-lifes-blood',
    name: "Ewer of Life's Blood",
    tier: 'masterwork',
    form: 'talisman-paraphernalia',
    effect: 'You may brew four times as many doses of any potion.',
    materials: { am: 14, or: 8 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Apothecary',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'gilded-gonfalon',
    name: 'Gilded Gonfalon',
    tier: 'masterwork',
    form: 'standard',
    effect: 'Allies within the banner aura gain three additional hero points per day.',
    materials: { or: 12, am: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'giants-maul',
    name: "Giant's Maul",
    tier: 'masterwork',
    form: 'weapon-great',
    effect: 'You may call CLEAVE three times and STRIKEDOWN three times per day.',
    materials: { gi: 12, tj: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'glamourweave-robe',
    name: 'Glamourweave Robe',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call RESIST twice per day and cast two additional Night spells per day.',
    materials: { ig: 12, am: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'grandmasters-shield',
    name: "Grandmaster's Shield",
    tier: 'masterwork',
    form: 'talisman',
    effect: 'You may call RESIST twice per day and have three additional hero points.',
    materials: { or: 12, gi: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'hauberk-of-triumph',
    name: 'Hauberk of Triumph',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You have four additional hero points and may call CLEAVE twice per day.',
    materials: { gi: 12, or: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'kopis-of-the-corsairs',
    name: 'Kopis of the Corsairs',
    tier: 'masterwork',
    form: 'weapon-1h',
    effect: 'You may call CLEAVE three times and IMPALE twice per day.',
    materials: { gi: 12, or: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'lantern-of-lament',
    name: 'Lantern of Lament',
    tier: 'masterwork',
    form: 'talisman-reliquary',
    effect: 'You may perform the Hallow ceremony as if you had two additional ranks of the skill.',
    materials: { am: 12, db: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Dedication',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'mage-armour-of-the-storm',
    name: 'Mage Armour of the Storm',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may cast battle spells twice per day each and call RESIST once per day.',
    materials: { or: 12, tj: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'masterwork-battle-standard',
    name: 'Masterwork Battle Standard',
    tier: 'masterwork',
    form: 'standard',
    effect: 'Allies within the banner aura gain three additional hero points per day and may call RESIST once.',
    materials: { or: 14, am: 10 },
    totalMaterials: 24,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'moonlit-pavilion',
    name: 'Moonlit Pavilion',
    tier: 'masterwork',
    form: 'talisman-paraphernalia',
    effect: 'You may perform Night rituals as if you had two additional ranks.',
    materials: { ig: 12, am: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'navarri-thornweave',
    name: 'Navarri Thornweave',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call VENOM three times per day and have two additional hero points.',
    materials: { bl: 14, db: 8 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'phoenix-sceptre',
    name: 'Phoenix Sceptre',
    tier: 'masterwork',
    form: 'weapon-implement',
    effect: 'You may cast Summer spells twice per day without mana and have three additional mana.',
    materials: { or: 12, tj: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'plate-of-the-castellan',
    name: 'Plate of the Castellan',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call RESIST twice per day and have four additional hero points.',
    materials: { or: 14, gi: 10 },
    totalMaterials: 24,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'roaring-chimera-rod',
    name: 'Roaring Chimera Rod',
    tier: 'masterwork',
    form: 'weapon-implement',
    effect: 'You may cast battle spells three times per day without mana and have four additional mana.',
    materials: { ig: 12, or: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'runeplate',
    name: 'Runeplate',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call RESIST twice per day and have four additional hero points. Runes carved into the plate grant additional abilities.',
    materials: { gi: 24, or: 5, bl: 3, db: 3 },
    totalMaterials: 35,
    nations: ['Wintermark']
  },
  {
    id: 'shield-of-the-throne',
    name: 'Shield of the Throne',
    tier: 'masterwork',
    form: 'talisman',
    effect: 'You may call RESIST three times per day and have three additional hero points.',
    materials: { or: 14, gi: 10 },
    totalMaterials: 24,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'staff-of-the-magi',
    name: 'Staff of the Magi',
    tier: 'masterwork',
    form: 'weapon-implement',
    effect: 'You may cast battle spells three times per day without mana, have five additional mana, and perform rituals as if you had one additional rank.',
    materials: { ig: 15, tj: 9, or: 9, bl: 12 },
    totalMaterials: 45,
    nations: 'all',
    skillRequired: 'Magician'
  },
  {
    id: 'thunderous-tread',
    name: 'Thunderous Tread',
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call STRIKEDOWN twice per day and have three additional hero points.',
    materials: { gi: 12, tj: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'trappers-cloak',
    name: "Trapper's Cloak",
    tier: 'masterwork',
    form: 'armour',
    effect: 'You may call VENOM twice per day, WEAKNESS once per day, and have two additional hero points.',
    materials: { bl: 12, db: 10 },
    totalMaterials: 22,
    nations: 'all',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  },
  {
    id: 'white-granite-wand',
    name: 'White Granite Wand',
    tier: 'masterwork',
    form: 'weapon-implement',
    effect: 'You may cast Winter spells twice per day without mana and have three additional mana.',
    materials: { ig: 12, bl: 10 },
    totalMaterials: 22,
    nations: 'all',
    skillRequired: 'Magician',
    notes: 'Full details: profounddecisions.co.uk/empire-wiki/Crafting_skills'
  }
];
