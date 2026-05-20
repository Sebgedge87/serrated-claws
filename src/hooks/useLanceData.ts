import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Business,
  CharInventoryItem,
  CharacterSkill,
  CharacterSpell,
  CovenRitual,
  CraftingQueueItem,
  Coven,
  Func,
  House,
  LanceData,
  LanceEvent,
  LanceSettings,
  MagicItemStock,
  Member,
  Profile,
  UserRole
} from '@/lib/types';

/**
 * Centralised data hook. One-shot load on mount, then provides imperative
 * methods that round-trip through Supabase and update local cache.
 *
 * Could be upgraded to Supabase Realtime later — kept simple for now.
 */
export function useLanceData() {
  const [data, setData] = useState<LanceData>({
    houses: [],
    members: [],
    covens: [],
    functions: [],
    businesses: [],
    inventory: [],
    inventoryLog: [],
    events: [],
    characterInventory: [],
    characterSkills: [],
    characterSpells: [],
    magicItemsStock: [],
    craftingQueue: [],
    covenRituals: []
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<LanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [houses, members, covens, fns, biz, bizOwners, inv, invLog, profs, evts, charInv, charSkills, charSpells, magicStock, craftingQ, covenRituals] = await Promise.all([
        supabase.from('houses').select('*').order('sort_order'),
        supabase.from('members').select('*').order('is_noble', { ascending: false }).order('name'),
        supabase.from('covens').select('*'),
        supabase.from('functions').select('*'),
        supabase.from('businesses').select('*'),
        supabase.from('business_owners').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('inventory_log').select('*').order('ts', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').order('email'),
        supabase.from('events').select('*').order('sort_order'),
        supabase.from('character_inventory').select('*'),
        supabase.from('character_skills').select('*'),
        supabase.from('character_spells').select('*'),
        supabase.from('magic_items_stock').select('*').order('created_at', { ascending: false }),
        supabase.from('crafting_queue').select('*').order('created_at', { ascending: false }),
        supabase.from('coven_rituals').select('*')
      ]);

      const businesses: Business[] = (biz.data ?? []).map(b => ({
        ...(b as Omit<Business, 'owners'>),
        owners: (bizOwners.data ?? [])
          .filter((o: { business_id: string; member_id: string }) => o.business_id === b.id)
          .map((o: { member_id: string }) => o.member_id)
      }));

      setData({
        houses: (houses.data ?? []) as House[],
        members: (members.data ?? []) as Member[],
        covens: (covens.data ?? []),
        functions: (fns.data ?? []),
        businesses,
        inventory: (inv.data ?? []),
        inventoryLog: (invLog.data ?? []),
        events: (evts.data ?? []) as LanceEvent[],
        characterInventory: (charInv.data ?? []) as CharInventoryItem[],
        characterSkills: (charSkills.data ?? []) as CharacterSkill[],
        characterSpells: (charSpells.data ?? []) as CharacterSpell[],
        magicItemsStock: (magicStock.data ?? []) as MagicItemStock[],
        craftingQueue: (craftingQ.data ?? []) as CraftingQueueItem[],
        covenRituals: (covenRituals.data ?? []) as CovenRitual[]
      });
      setProfiles((profs.data ?? []) as Profile[]);


      // Auto-clear attending_event flags the day after each event ends
      const today = new Date(); today.setHours(0, 0, 0, 0);
      for (const ev of (evts.data ?? []) as LanceEvent[]) {
        if (!ev.cleared) {
          const clearAfter = new Date(ev.end_date ?? ev.start_date);
          clearAfter.setDate(clearAfter.getDate() + 1);
          if (today >= clearAfter) {
            await supabase.from('members').update({ attending_event: false }).eq('attending_event', true);
            await supabase.from('events').update({ cleared: true }).eq('id', ev.id);
          }
        }
      }

      // lance_settings may not exist yet on existing installs — degrade gracefully
      try {
        const { data: settingsData } = await supabase.from('lance_settings').select('*').eq('id', 'default').single();
        setSettings((settingsData as LanceSettings) ?? null);
      } catch {
        setSettings(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ---- Houses ----
  const upsertHouse = useCallback(async (house: Partial<House> & { id: string; name: string }) => {
    const { error: err } = await supabase.from('houses').upsert(house);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteHouse = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('houses').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Members ----
  const upsertMember = useCallback(async (member: Partial<Member> & { name: string }) => {
    const oldMember = member.id ? data.members.find(m => m.id === member.id) : null;
    const oldResource = oldMember?.resource ?? null;
    const newResource = member.resource ?? null;

    // Strip attending_event on new inserts — let the DB default handle it
    // (avoids schema cache errors on fresh deployments where the column may not yet be cached)
    const payload = member.id ? member : (({ attending_event: _ae, ...rest }) => rest)(member as Member);
    const { error: err } = await supabase.from('members').upsert(payload);
    if (err) throw new Error(err.message);

    // Sync inventory when resource changes
    if (oldResource !== newResource) {
      if (oldResource) {
        const existing = data.inventory.find(i => i.item === oldResource);
        await supabase.from('inventory').upsert({ item: oldResource, current_qty: Math.max(0, (existing?.current_qty ?? 0) - 1), required_qty: existing?.required_qty ?? 0 });
      }
      if (newResource) {
        const existing = data.inventory.find(i => i.item === newResource);
        await supabase.from('inventory').upsert({ item: newResource, current_qty: (existing?.current_qty ?? 0) + 1, required_qty: existing?.required_qty ?? 0 });
      }
    }

    await reload(true);
  }, [data.members, data.inventory, reload]);

  /** Soft-remove: unassign from house rather than delete (admin-only delete is also available). */
  const unassignMember = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('members').update({ house_id: null }).eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteMember = useCallback(async (id: string) => {
    await supabase.from('profiles').update({ member_id: null }).eq('member_id', id);
    const { error: err } = await supabase.from('members').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Businesses ----
  const upsertBusiness = useCallback(async (biz: Partial<Business> & { id: string; name: string }) => {
    const { owners, ...rest } = biz;
    const { error: err } = await supabase.from('businesses').upsert(rest);
    if (err) throw new Error(err.message);

    if (owners) {
      await supabase.from('business_owners').delete().eq('business_id', biz.id);
      if (owners.length > 0) {
        await supabase.from('business_owners').insert(owners.map(member_id => ({ business_id: biz.id, member_id })));
      }
    }
    await reload(true);
  }, [reload]);

  // ---- Covens ----
  const upsertCoven = useCallback(async (coven: Partial<Coven> & { id: string; name: string }) => {
    const { error: err } = await supabase.from('covens').upsert(coven);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteCoven = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('covens').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Functions ----
  const upsertFunction = useCallback(async (fn: Partial<Func> & { id: string; name: string }) => {
    const { error: err } = await supabase.from('functions').upsert(fn);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteFunction = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('functions').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Business delete ----
  const deleteBusiness = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('businesses').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Profiles ----
  const upsertProfile = useCallback(async (id: string, updates: { role?: UserRole; member_id?: string | null; display_name?: string | null }) => {
    const { error: err } = await supabase.from('profiles').update(updates).eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Events ----
  const upsertEvent = useCallback(async (ev: Partial<LanceEvent> & { name: string; start_date: string }) => {
    const { error: err } = await supabase.from('events').upsert({ ...ev, cleared: ev.cleared ?? false });
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const clearAttending = useCallback(async () => {
    const { error: err } = await supabase.from('members').update({ attending_event: false }).eq('attending_event', true);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteEvent = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('events').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Character Inventory ----
  const upsertCharInventory = useCallback(async (item: Omit<CharInventoryItem, 'id'> & { id?: string }) => {
    const { error: err } = await supabase.from('character_inventory').upsert(item);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteCharInventory = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('character_inventory').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Character Skills ----
  const upsertCharacterSkill = useCallback(async (skill: Omit<CharacterSkill, 'id'> & { id?: string }) => {
    const { error: err } = await supabase.from('character_skills').upsert(skill);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteCharacterSkill = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('character_skills').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Character Spells ----
  const upsertCharacterSpell = useCallback(async (spell: Omit<CharacterSpell, 'id'> & { id?: string }) => {
    const { error: err } = await supabase.from('character_spells').upsert(spell);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteCharacterSpell = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('character_spells').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Lance Settings ----
  const upsertSettings = useCallback(async (updates: Partial<Omit<LanceSettings, 'id'>>) => {
    const { error: err } = await supabase.from('lance_settings').upsert({ id: 'default', ...updates });
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Magic Items Stock ----
  const upsertMagicItemStock = useCallback(async (item: Partial<MagicItemStock> & { item_name: string; tier: string; form: string }) => {
    const { error } = await supabase.from('magic_items_stock').upsert(item);
    if (error) throw new Error(error.message);
    await reload(true);
  }, [reload]);

  const deleteMagicItemStock = useCallback(async (id: string) => {
    const { error } = await supabase.from('magic_items_stock').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await reload(true);
  }, [reload]);

  // ---- Crafting Queue ----
  const upsertCraftingQueueItem = useCallback(async (item: Partial<CraftingQueueItem> & { item_name: string; tier: string }) => {
    const { error } = await supabase.from('crafting_queue').upsert(item);
    if (error) throw new Error(error.message);
    await reload(true);
  }, [reload]);

  const deleteCraftingQueueItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('crafting_queue').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await reload(true);
  }, [reload]);

  // ---- Coven Rituals ----
  const upsertCovenRitual = useCallback(async (ritual: Omit<CovenRitual, 'id'> & { id?: string }) => {
    const { error: err } = await supabase.from('coven_rituals').upsert(ritual);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteCovenRitual = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('coven_rituals').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const updateCovenMana = useCallback(async (covenId: string, mana_available: number) => {
    const { error: err } = await supabase.from('covens').update({ mana_available }).eq('id', covenId);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Danger Zone ----
  const resetInventoryQty = useCallback(async () => {
    const { error: err } = await supabase.from('inventory').update({ current_qty: 0 }).not('item', 'is', null);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const clearInventoryLog = useCallback(async () => {
    const { error: err } = await supabase.from('inventory_log').delete().not('id', 'is', null);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Inventory ----
  const setInventory = useCallback(async (item: string, current_qty: number, required_qty: number) => {
    const { error: err } = await supabase.from('inventory').upsert({ item, current_qty, required_qty });
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const logInventory = useCallback(async (item: string, amount: number, direction: 'In' | 'Out' | 'Adjustment', notes?: string) => {
    const delta = direction === 'In' ? amount : direction === 'Out' ? -amount : 0;
    const existing = data.inventory.find(i => i.item === item);
    const nextQty = Math.max(0, (existing?.current_qty ?? 0) + delta);
    await supabase.from('inventory').upsert({ item, current_qty: nextQty, required_qty: existing?.required_qty ?? 0 });
    await supabase.from('inventory_log').insert({ item, amount, direction, notes: notes ?? null });
    await reload(true);
  }, [data.inventory, reload]);

  return {
    data,
    profiles,
    settings,
    loading,
    error,
    reload,
    upsertHouse,
    deleteHouse,
    upsertMember,
    unassignMember,
    deleteMember,
    upsertBusiness,
    deleteBusiness,
    upsertCoven,
    deleteCoven,
    upsertFunction,
    deleteFunction,
    setInventory,
    logInventory,
    upsertProfile,
    upsertSettings,
    resetInventoryQty,
    clearInventoryLog,
    upsertEvent,
    deleteEvent,
    clearAttending,
    upsertCharInventory,
    deleteCharInventory,
    upsertCharacterSkill,
    deleteCharacterSkill,
    upsertCharacterSpell,
    deleteCharacterSpell,
    upsertMagicItemStock,
    deleteMagicItemStock,
    upsertCraftingQueueItem,
    deleteCraftingQueueItem,
    upsertCovenRitual,
    deleteCovenRitual,
    updateCovenMana
  };
}
