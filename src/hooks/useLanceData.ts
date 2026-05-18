import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Business,
  House,
  LanceData,
  Member
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [houses, members, covens, fns, biz, bizOwners, inv, invLog] = await Promise.all([
        supabase.from('houses').select('*').order('sort_order'),
        supabase.from('members').select('*').order('is_noble', { ascending: false }).order('name'),
        supabase.from('covens').select('*'),
        supabase.from('functions').select('*'),
        supabase.from('businesses').select('*'),
        supabase.from('business_owners').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('inventory_log').select('*').order('ts', { ascending: false }).limit(50)
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
    await reload();
  }, [reload]);

  const deleteHouse = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('houses').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload();
  }, [reload]);

  // ---- Members ----
  const upsertMember = useCallback(async (member: Partial<Member> & { name: string }) => {
    const { error: err } = await supabase.from('members').upsert(member);
    if (err) throw new Error(err.message);
    await reload();
  }, [reload]);

  /** Soft-remove: unassign from house rather than delete (admin-only delete is also available). */
  const unassignMember = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('members').update({ house_id: null }).eq('id', id);
    if (err) throw new Error(err.message);
    await reload();
  }, [reload]);

  const deleteMember = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('members').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await reload();
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
    await reload();
  }, [reload]);

  // ---- Inventory ----
  const setInventory = useCallback(async (item: string, current_qty: number, required_qty: number) => {
    const { error: err } = await supabase.from('inventory').upsert({ item, current_qty, required_qty });
    if (err) throw new Error(err.message);
    await reload();
  }, [reload]);

  const logInventory = useCallback(async (item: string, amount: number, direction: 'In' | 'Out' | 'Adjustment', notes?: string) => {
    const delta = direction === 'In' ? amount : direction === 'Out' ? -amount : 0;
    const existing = data.inventory.find(i => i.item === item);
    const nextQty = Math.max(0, (existing?.current_qty ?? 0) + delta);
    await supabase.from('inventory').upsert({ item, current_qty: nextQty, required_qty: existing?.required_qty ?? 0 });
    await supabase.from('inventory_log').insert({ item, amount, direction, notes: notes ?? null });
    await reload();
  }, [data.inventory, reload]);

  return {
    data,
    loading,
    error,
    reload,
    upsertHouse,
    deleteHouse,
    upsertMember,
    unassignMember,
    deleteMember,
    upsertBusiness,
    setInventory,
    logInventory
  };
}
