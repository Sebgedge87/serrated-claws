export type MemberStatus = 'active' | 'inactive' | 'KIA';

export interface LanceEvent {
  id: string;
  name: string;
  start_date: string; // ISO date
  end_date: string | null; // ISO date
  sort_order: number;
  cleared: boolean;
}

export interface CharInventoryItem {
  id: string;
  member_id: string;
  item: string;
  qty: number;
  category: string | null;
  notes: string | null;
  include_in_lance: boolean;
}

export interface CharacterSkill {
  id: string;
  member_id: string;
  skill_name: string;
  category: string;
  rank: number;
  notes: string | null;
}

export interface CharacterRitual {
  id: string;
  member_id: string;
  ritual_name: string;
  realm: string;
  notes: string | null;
}

export interface CharacterSpell {
  id: string;
  member_id: string;
  spell_name: string;
  school: string;
  magnitude: number;
  notes: string | null;
}

export interface CharacterRitual {
  id: string;
  member_id: string;
  ritual_name: string;
  realm: string;
  notes: string | null;
}

export interface LanceSettings {
  id: string;
  name: string;
  motto: string | null;
  description: string | null;
}
export type UserRole = 'super_admin' | 'admin' | 'member' | 'viewer';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  member_id: string | null;
}

export interface House {
  id: string;
  name: string;
  motto: string | null;
  description: string | null;
  primary_color: string;
  sort_order: number;
}

export interface Coven {
  id: string;
  name: string;
  domain: string | null;
  leader: string | null;
  description: string | null;
  mana_available: number;
}

export interface CovenRitual {
  id: string;
  coven_id: string;
  ritual_name: string;
  magnitude: number;
  realm: string | null;
  notes: string | null;
  wording: string | null;
}

export interface Func {
  id: string;
  name: string;
  description: string | null;
  leader: string | null;
}

export interface Member {
  id: string;
  house_id: string | null;
  name: string;
  player_name: string | null;
  pid: string | null;
  rank: string | null;
  function: string | null;
  military_function: string | null;
  is_noble: boolean;
  status: MemberStatus;
  hp: number | null;
  mp: number | null;
  resource: string | null;
  rings_per_event: number | null;
  crowns_per_event: number | null;
  thrones_per_event: number | null;
  personal_rings?: number | null;
  personal_crowns?: number | null;
  personal_thrones?: number | null;
  coven: string | null;
  notes: string | null;
  claimed_by: string | null;
  attending_event: boolean;
  territory: string | null;
  total_xp: number | null;
  tithe_paid: boolean;
  tithe_notes: string | null;
}

export interface Business {
  id: string;
  name: string;
  type: string | null;
  resources: string | null;
  notes: string | null;
  owners: string[]; // member ids (joined)
}

export interface InventoryItem {
  item: string;
  current_qty: number;
  required_qty: number;
  unit_value: number;
}

export interface InventoryLogEntry {
  id: string;
  ts: string;
  item: string;
  amount: number;
  direction: 'In' | 'Out' | 'Adjustment';
  notes: string | null;
  actor: string | null;
}

export interface BardWork {
  id: string;
  lance_id: string;
  house_id: string;
  author_member_id: string;
  title: string;
  work_type: 'story' | 'feat' | 'song' | 'poem' | 'other';
  content: string;
  created_at: string;
  updated_at: string;
}

/** Aggregated lance data shape returned by useLanceData. */
export interface LanceData {
  houses: House[];
  members: Member[];
  covens: Coven[];
  functions: Func[];
  businesses: Business[];
  inventory: InventoryItem[];
  inventoryLog: InventoryLogEntry[];
  events: LanceEvent[];
  characterInventory: CharInventoryItem[];
  characterSkills: CharacterSkill[];
  characterRituals: CharacterRitual[];
  characterSpells: CharacterSpell[];
  magicItemsStock: MagicItemStock[];
  craftingQueue: CraftingQueueItem[];
  covenRituals: CovenRitual[];
  bardWorks: BardWork[];
}

export interface MagicItemStock {
  id: string;
  item_name: string;
  tier: string;
  form: string;
  bonded_to: string | null;
  status: 'available' | 'bonded' | 'reserved' | 'expired';
  created_at_event: string | null;
  expires_after_event: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CraftingQueueItem {
  id: string;
  item_name: string;
  tier: string;
  crafter_id: string | null;
  recipient_id: string | null;
  status: 'planned' | 'materials-sourced' | 'in-progress' | 'complete' | 'cancelled';
  materials_required: Record<string, number>;
  notes: string | null;
  target_event: string | null;
  created_at: string;
  updated_at: string;
}

/** Empire LARP catalogue reference data — used for inventory dropdowns. */
export interface CatalogueEntry {
  item: string;
  type: CatalogueType;
  subType?: string;
  unit?: string;
  producedBy?: string;
  notes?: string;
  track: boolean;
}

export type CatalogueType =
  | 'Currency'
  | 'Resource Source'
  | 'Building Material'
  | 'Crafting Material'
  | 'Herb'
  | 'Carded / Consumable Item'
  | 'Vis'
  | 'Magic Item';

export interface Lance {
  id: string;
  name: string;
  motto: string | null;
  description: string | null;
  created_at: string;
  invite_code: string;
}

export interface LanceMembership {
  id: string;
  lance_id: string;
  profile_id: string;
  role: UserRole;
  member_id: string | null;
  // joined fields when fetched with profile
  profile?: { email: string | null; display_name: string | null };
}
