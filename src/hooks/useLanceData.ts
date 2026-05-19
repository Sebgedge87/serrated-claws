import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Business,
  Coven,
  Func,
  House,
  LanceData,
  LanceSettings,
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
    inventoryLog: []
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<LanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [houses, members, covens, fns, biz, bizOwners, inv, invLog, profs] = await Promise.all([
        supabase.from('houses').select('*').order('sort_order'),
        supabase.from('members').select('*').order('is_noble', { ascending: false }).order('name'),
        supabase.from('covens').select('*'),
        supabase.from('functions').select('*'),
        supabase.from('businesses').select('*'),
        supabase.from('business_owners').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('inventory_log').select('*').order('ts', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').order('email')
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
        inventoryLog: (invLog.data ?? [])
      });
      setProfiles((profs.data ?? []) as Profile[]);

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

    const { error: err } = await supabase.from('members').upsert(member);
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

  // ---- Lance Settings ----
  const upsertSettings = useCallback(async (updates: Partial<Omit<LanceSettings, 'id'>>) => {
    const { error: err } = await supabase.from('lance_settings').upsert({ id: 'default', ...updates });
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
    clearInventoryLog
  };
}
