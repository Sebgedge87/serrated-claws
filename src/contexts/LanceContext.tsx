import { createContext, useContext, type ReactNode } from 'react';
import type { LanceData, LanceMembership, LanceSettings } from '@/lib/types';
import type { useLanceData } from '@/hooks/useLanceData';

type LanceDataHook = ReturnType<typeof useLanceData>;

export interface LanceContextValue {
  lanceId: string;
  data: LanceData;
  memberships: LanceMembership[];
  settings: LanceSettings | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  reload: LanceDataHook['reload'];
  upsertHouse: LanceDataHook['upsertHouse'];
  deleteHouse: LanceDataHook['deleteHouse'];
  upsertMember: LanceDataHook['upsertMember'];
  unassignMember: LanceDataHook['unassignMember'];
  deleteMember: LanceDataHook['deleteMember'];
  upsertBusiness: LanceDataHook['upsertBusiness'];
  deleteBusiness: LanceDataHook['deleteBusiness'];
  upsertCoven: LanceDataHook['upsertCoven'];
  deleteCoven: LanceDataHook['deleteCoven'];
  upsertFunction: LanceDataHook['upsertFunction'];
  deleteFunction: LanceDataHook['deleteFunction'];
  setInventory: LanceDataHook['setInventory'];
  setInventoryPrice: LanceDataHook['setInventoryPrice'];
  logInventory: LanceDataHook['logInventory'];
  upsertProfile: LanceDataHook['upsertProfile'];
  upsertSettings: LanceDataHook['upsertSettings'];
  addMembership: LanceDataHook['addMembership'];
  resetInventoryQty: LanceDataHook['resetInventoryQty'];
  clearInventoryLog: LanceDataHook['clearInventoryLog'];
  upsertEvent: LanceDataHook['upsertEvent'];
  deleteEvent: LanceDataHook['deleteEvent'];
  clearAttending: LanceDataHook['clearAttending'];
  upsertCharInventory: LanceDataHook['upsertCharInventory'];
  deleteCharInventory: LanceDataHook['deleteCharInventory'];
  upsertCharacterSkill: LanceDataHook['upsertCharacterSkill'];
  deleteCharacterSkill: LanceDataHook['deleteCharacterSkill'];
  upsertCharacterRitual: LanceDataHook['upsertCharacterRitual'];
  deleteCharacterRitual: LanceDataHook['deleteCharacterRitual'];
  upsertCharacterSpell: LanceDataHook['upsertCharacterSpell'];
  deleteCharacterSpell: LanceDataHook['deleteCharacterSpell'];
  upsertMagicItemStock: LanceDataHook['upsertMagicItemStock'];
  deleteMagicItemStock: LanceDataHook['deleteMagicItemStock'];
  upsertCraftingQueueItem: LanceDataHook['upsertCraftingQueueItem'];
  deleteCraftingQueueItem: LanceDataHook['deleteCraftingQueueItem'];
  upsertCovenRitual: LanceDataHook['upsertCovenRitual'];
  deleteCovenRitual: LanceDataHook['deleteCovenRitual'];
  updateCovenMana: LanceDataHook['updateCovenMana'];
  upsertBardWork: LanceDataHook['upsertBardWork'];
  deleteBardWork: LanceDataHook['deleteBardWork'];
}

const LanceContext = createContext<LanceContextValue | null>(null);

export function LanceProvider({ value, children }: { value: LanceContextValue; children: ReactNode }) {
  return <LanceContext.Provider value={value}>{children}</LanceContext.Provider>;
}

export function useLance(): LanceContextValue {
  const ctx = useContext(LanceContext);
  if (!ctx) throw new Error('useLance must be used inside <LanceProvider>');
  return ctx;
}
