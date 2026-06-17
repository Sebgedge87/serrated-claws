import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  BardWork,
  Business,
  CharInventoryItem,
  CharacterRitual,
  CharacterSkill,
  CharacterSpell,
  CovenRitual,
  CraftingQueueItem,
  Coven,
  Func,
  House,
  LanceData,
  LanceEvent,
  LanceMembership,
  LanceSettings,
  MagicItemStock,
  Member,
  UserRole
} from '@/lib/types';

/**
 * Centralised data hook. One-shot load on mount, then provides imperative
 * methods that round-trip through Supabase and update local cache.
 *
 * Could be upgraded to Supabase Realtime later — kept simple for now.
 */
export function useLanceData(lanceId: string | null) {
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
    characterRituals: [],
    characterSpells: [],
    magicItemsStock: [],
    craftingQueue: [],
    covenRituals: [],
    bardWorks: []
  });
  const [memberships, setMemberships] = useState<LanceMembership[]>([]);
  const [settings, setSettings] = useState<LanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (silent = false) => {
    if (!lanceId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [houses, members, covens, fns, biz, bizOwners, inv, invLog, ms, evts, charInv, charSkills, charSpells, charRituals, magicStock, craftingQ, covenRituals, bardWorksRes] = await Promise.all([
        supabase.from('houses').select('*').eq('lance_id', lanceId).order('sort_order'),
        supabase.from('members').select('*').eq('lance_id', lanceId).order('is_noble', { ascending: false }).order('name'),
        supabase.from('covens').select('*').eq('lance_id', lanceId),
        supabase.from('functions').select('*').eq('lance_id', lanceId),
        supabase.from('businesses').select('*').eq('lance_id', lanceId),
        supabase.from('business_owners').select('*'),
        supabase.from('inventory').select('*').eq('lance_id', lanceId),
        supabase.from('inventory_log').select('*').eq('lance_id', lanceId).order('ts', { ascending: false }).limit(50),
        supabase.from('lance_memberships').select('*, profile:profiles(id, email, display_name)').eq('lance_id', lanceId),
        supabase.from('events').select('*').eq('lance_id', lanceId).order('sort_order'),
        supabase.from('character_inventory').select('*'),
        supabase.from('character_skills').select('*'),
        supabase.from('character_spells').select('*'),
        supabase.from('character_rituals').select('*'),
        supabase.from('magic_items_stock').select('*').eq('lance_id', lanceId).order('created_at', { ascending: false }),
        supabase.from('crafting_queue').select('*').eq('lance_id', lanceId).order('created_at', { ascending: false }),
        supabase.from('coven_rituals').select('*'),
        supabase.from('bard_works').select('*')
      ]);

      // Scope character tables (no lance_id column) to this lance's members/covens
      const memberIds = new Set((members.data ?? []).map((m: { id: string }) => m.id));
      const covenIds  = new Set((covens.data  ?? []).map((c: { id: string }) => c.id));

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
        characterInventory: ((charInv.data ?? []) as CharInventoryItem[]).filter(r => memberIds.has(r.member_id)),
        characterSkills:    ((charSkills.data ?? []) as CharacterSkill[]).filter(r => memberIds.has(r.member_id)),
        characterSpells:    ((charSpells.data ?? []) as CharacterSpell[]).filter(r => memberIds.has(r.member_id)),
        characterRituals:   ((charRituals.data ?? []) as CharacterRitual[]).filter(r => memberIds.has(r.member_id)),
        magicItemsStock: (magicStock.data ?? []) as MagicItemStock[],
        craftingQueue: (craftingQ.data ?? []) as CraftingQueueItem[],
        covenRituals: ((covenRituals.data ?? []) as CovenRitual[]).filter(r => covenIds.has(r.coven_id)),
        bardWorks: ((bardWorksRes.data ?? []) as BardWork[]).filter(r => memberIds.has(r.author_member_id))
      });
      setMemberships((ms.data ?? []) as LanceMembership[]);

      // Auto-clear attending_event flags the day after each event ends.
      // Only run on the first (non-silent) load to avoid race conditions across tabs.
      if (!silent) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (const ev of (evts.data ?? []) as LanceEvent[]) {
          if (!ev.cleared) {
            const clearAfter = new Date(ev.end_date ?? ev.start_date);
            clearAfter.setDate(clearAfter.getDate() + 1);
            if (today >= clearAfter) {
              await supabase.from('members').update({ attending_event: null }).eq('attending_event', true).eq('lance_id', lanceId);
              await supabase.from('events').update({ cleared: true }).eq('id', ev.id);
            }
          }
        }
      }

      // Fetch settings from lances table
      try {
        const { data: lanceData } = await supabase.from('lances').select('*').eq('id', lanceId).single();
        if (lanceData) {
          setSettings({ id: lanceData.id, name: lanceData.name, motto: lanceData.motto ?? null, description: lanceData.description ?? null, nation: lanceData.nation ?? null });
        } else {
          setSettings(null);
        }
      } catch {
        setSettings(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [lanceId]);

  useEffect(() => {
    if (!lanceId) {
      setLoading(false);
      return;
    }
    reload();

    // Realtime: re-fetch silently whenever any lance-scoped table changes
    const TABLES = ['houses', 'members', 'covens', 'functions', 'businesses', 'business_owners', 'inventory', 'events', 'bard_works'];
    const channel = supabase
      .channel(`lance:${lanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', filter: `lance_id=eq.${lanceId}` }, () => reload(true));

    // Tables without lance_id use broader subscription (scoped by member/coven in reload)
    const charChannel = supabase
      .channel(`lance-chars:${lanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_inventory' }, () => reload(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_skills' }, () => reload(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_rituals' }, () => reload(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_spells' }, () => reload(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coven_rituals' }, () => reload(true));

    // Suppress unused variable warning — tables listed for documentation
    void TABLES;
    channel.subscribe();
    charChannel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(charChannel);
    };
  }, [lanceId, reload]);

  // ---- Houses ----
  const upsertHouse = useCallback(async (house: Partial<House> & { id: string; name: string }) => {
    const { error: err } = await supabase.from('houses').upsert({ ...house, lance_id: lanceId });
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

  const deleteHouse = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('houses').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Members ----
  const upsertMember = useCallback(async (member: Partial<Member> & { name: string }) => {
    // Read fresh inventory/members from DB to avoid stale closure values
    const [freshMembers, freshInventory] = await Promise.all([
      supabase.from('members').select('id,resource').eq('lance_id', lanceId!),
      supabase.from('inventory').select('item,current_qty,required_qty').eq('lance_id', lanceId!),
    ]);
    const oldMember = member.id ? (freshMembers.data ?? []).find((m: { id: string }) => m.id === member.id) : null;
    const oldResource = (oldMember as { resource?: string | null } | null)?.resource ?? null;
    const newResource = member.resource ?? null;

    // Strip attending_event on new inserts — let the DB default handle it
    const rawPayload = member.id
      ? { ...member, lance_id: lanceId }
      : (({ attending_event: _ae, ...rest }) => ({ ...rest, lance_id: lanceId }))(member as Member);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await supabase.from('members').upsert(rawPayload as any);
    if (err) throw new Error(err.message);

    // Sync inventory when resource changes
    if (oldResource !== newResource) {
      const inv = (freshInventory.data ?? []) as { item: string; current_qty: number; required_qty: number }[];
      if (oldResource) {
        const existing = inv.find(i => i.item === oldResource);
        await supabase.from('inventory').upsert(
          { lance_id: lanceId, item: oldResource, current_qty: Math.max(0, (existing?.current_qty ?? 0) - 1), required_qty: existing?.required_qty ?? 0 },
          { onConflict: 'lance_id,item' }
        );
      }
      if (newResource) {
        const existing = inv.find(i => i.item === newResource);
        await supabase.from('inventory').upsert(
          { lance_id: lanceId, item: newResource, current_qty: (existing?.current_qty ?? 0) + 1, required_qty: existing?.required_qty ?? 0 },
          { onConflict: 'lance_id,item' }
        );
      }
    }

    await reload(true);
  }, [lanceId, reload]);

  /** Soft-remove: unassign from house rather than delete (admin-only delete is also available). */
  const unassignMember = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('members').update({ house_id: null }).eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteMember = useCallback(async (id: string) => {
    const { error: membershipErr } = await supabase.from('lance_memberships').update({ member_id: null }).eq('member_id', id);
    if (membershipErr) throw new Error(membershipErr.message);
    const { error: err } = await supabase.from('members').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Businesses ----
  const upsertBusiness = useCallback(async (biz: Partial<Business> & { id: string; name: string }) => {
    const { owners, ...rest } = biz;
    const { error: err } = await supabase.from('businesses').upsert({ ...rest, lance_id: lanceId });
    if (err) throw new Error(err.message);

    if (owners) {
      await supabase.from('business_owners').delete().eq('business_id', biz.id);
      if (owners.length > 0) {
        await supabase.from('business_owners').insert(owners.map(member_id => ({ business_id: biz.id, member_id })));
      }
    }
    await reload(true);
  }, [lanceId, reload]);

  // ---- Covens ----
  const upsertCoven = useCallback(async (coven: Partial<Coven> & { id: string; name: string }) => {
    const { error: err } = await supabase.from('covens').upsert({ ...coven, lance_id: lanceId });
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

  const deleteCoven = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('covens').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Functions ----
  const upsertFunction = useCallback(async (fn: Partial<Func> & { id: string; name: string }) => {
    const { error: err } = await supabase.from('functions').upsert({ ...fn, lance_id: lanceId });
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

  const deleteFunction = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('functions').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Business delete ----
  const deleteBusiness = useCallback(async (id: string) => {
    await supabase.from('business_owners').delete().eq('business_id', id);
    const { error: err } = await supabase.from('businesses').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Memberships / Profiles ----
  const upsertProfile = useCallback(async (id: string, updates: { role?: UserRole; member_id?: string | null; display_name?: string | null }) => {
    if (updates.display_name !== undefined) {
      const { error: profileErr } = await supabase.from('profiles').update({ display_name: updates.display_name }).eq('id', id);
      if (profileErr) throw new Error(profileErr.message);
    }
    const membershipUpdate: Record<string, unknown> = {};
    if (updates.role !== undefined) membershipUpdate.role = updates.role;
    if (updates.member_id !== undefined) membershipUpdate.member_id = updates.member_id;
    if (Object.keys(membershipUpdate).length > 0) {
      const { error: membershipErr } = await supabase.from('lance_memberships')
        .upsert({ lance_id: lanceId, profile_id: id, ...membershipUpdate }, { onConflict: 'lance_id,profile_id' });
      if (membershipErr) throw new Error(membershipErr.message);
    }
    await reload(true);
  }, [lanceId, reload]);

  const addMembership = useCallback(async (profileId: string, role: UserRole = 'member') => {
    const { error } = await supabase.from('lance_memberships').upsert(
      { lance_id: lanceId, profile_id: profileId, role },
      { onConflict: 'lance_id,profile_id' }
    );
    if (error) throw new Error(error.message);
    await reload(true);
  }, [lanceId, reload]);

  // ---- Events ----
  const upsertEvent = useCallback(async (ev: Partial<LanceEvent> & { name: string; start_date: string }) => {
    const { error: err } = await supabase.from('events').upsert({ ...ev, date: ev.start_date, cleared: ev.cleared ?? false, lance_id: lanceId });
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

  const clearAttending = useCallback(async () => {
    const { error: err } = await supabase.from('members').update({ attending_event: null }).eq('lance_id', lanceId);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

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

  // ---- Character Rituals ----
  const upsertCharacterRitual = useCallback(async (ritual: Omit<CharacterRitual, 'id'> & { id?: string }) => {
    const { error: err } = await supabase.from('character_rituals').upsert(ritual);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteCharacterRitual = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('character_rituals').delete().eq('id', id);
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
    if (!lanceId) return;
    const { error: err } = await supabase.from('lances').update(updates).eq('id', lanceId);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

  // ---- Magic Items Stock ----
  const upsertMagicItemStock = useCallback(async (item: Partial<MagicItemStock> & { item_name: string; tier: string; form: string }) => {
    const { error } = await supabase.from('magic_items_stock').upsert({ ...item, lance_id: lanceId });
    if (error) throw new Error(error.message);
    await reload(true);
  }, [lanceId, reload]);

  const deleteMagicItemStock = useCallback(async (id: string) => {
    const { error } = await supabase.from('magic_items_stock').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await reload(true);
  }, [reload]);

  // ---- Crafting Queue ----
  const upsertCraftingQueueItem = useCallback(async (item: Partial<CraftingQueueItem> & { item_name: string; tier: string }) => {
    const { error } = await supabase.from('crafting_queue').upsert({ ...item, lance_id: lanceId });
    if (error) throw new Error(error.message);
    await reload(true);
  }, [lanceId, reload]);

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

  // ---- Bard Works ----
  const upsertBardWork = useCallback(async (work: Omit<BardWork, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    const payload = { ...work, updated_at: new Date().toISOString() };
    const { error: err } = work.id
      ? await supabase.from('bard_works').upsert(payload, { onConflict: 'id' })
      : await supabase.from('bard_works').insert(payload);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  const deleteBardWork = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('bard_works').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [reload]);

  // ---- Danger Zone ----
  const resetInventoryQty = useCallback(async () => {
    const { error: err } = await supabase.from('inventory').update({ current_qty: 0 }).eq('lance_id', lanceId).not('item', 'is', null);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

  const clearInventoryLog = useCallback(async () => {
    const { error: err } = await supabase.from('inventory_log').delete().eq('lance_id', lanceId).not('id', 'is', null);
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, reload]);

  // ---- Inventory ----
  const setInventory = useCallback(async (item: string, current_qty: number, required_qty: number) => {
    const existing = data.inventory.find(i => i.item === item);
    const { error: err } = await supabase.from('inventory').upsert(
      { lance_id: lanceId, item, current_qty, required_qty, unit_value: existing?.unit_value ?? 0 },
      { onConflict: 'lance_id,item' }
    );
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, data.inventory, reload]);

  const setInventoryPrice = useCallback(async (item: string, unit_value: number) => {
    const existing = data.inventory.find(i => i.item === item);
    const { error: err } = await supabase.from('inventory').upsert(
      { lance_id: lanceId, item, current_qty: existing?.current_qty ?? 0, required_qty: existing?.required_qty ?? 0, unit_value },
      { onConflict: 'lance_id,item' }
    );
    if (err) throw new Error(err.message);
    await reload(true);
  }, [lanceId, data.inventory, reload]);

  const logInventory = useCallback(async (item: string, amount: number, direction: 'In' | 'Out' | 'Adjustment', notes?: string) => {
    const delta = direction === 'In' ? amount : direction === 'Out' ? -amount : 0;
    const existing = data.inventory.find(i => i.item === item);
    const nextQty = Math.max(0, (existing?.current_qty ?? 0) + delta);
    const { error: upsertErr } = await supabase.from('inventory').upsert(
      { lance_id: lanceId, item, current_qty: nextQty, required_qty: existing?.required_qty ?? 0 },
      { onConflict: 'lance_id,item' }
    );
    if (upsertErr) throw new Error(upsertErr.message);
    const { error: logErr } = await supabase.from('inventory_log').insert({ lance_id: lanceId, item, amount, direction, notes: notes ?? null });
    if (logErr) throw new Error(logErr.message);
    await reload(true);
  }, [lanceId, data.inventory, reload]);

  return {
    data,
    memberships,
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
    setInventoryPrice,
    logInventory,
    upsertProfile,
    upsertSettings,
    addMembership,
    resetInventoryQty,
    clearInventoryLog,
    upsertEvent,
    deleteEvent,
    clearAttending,
    upsertCharInventory,
    deleteCharInventory,
    upsertCharacterSkill,
    deleteCharacterSkill,
    upsertCharacterRitual,
    deleteCharacterRitual,
    upsertCharacterSpell,
    deleteCharacterSpell,
    upsertMagicItemStock,
    deleteMagicItemStock,
    upsertCraftingQueueItem,
    deleteCraftingQueueItem,
    upsertCovenRitual,
    deleteCovenRitual,
    updateCovenMana,
    upsertBardWork,
    deleteBardWork
  };
}
