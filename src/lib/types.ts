export type MemberStatus = 'active' | 'inactive' | 'KIA';
export type UserRole = 'admin' | 'member' | 'viewer';

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
  leader: string | null;
  description: string | null;
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
  coin_per_event: string | null;
  coven: string | null;
  notes: string | null;
  claimed_by: string | null;
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

/** Aggregated lance data shape returned by useLanceData. */
export interface LanceData {
  houses: House[];
  members: Member[];
  covens: Coven[];
  functions: Func[];
  businesses: Business[];
  inventory: InventoryItem[];
  inventoryLog: InventoryLogEntry[];
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
