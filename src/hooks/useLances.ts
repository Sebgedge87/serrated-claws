import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lance, LanceMembership } from '@/lib/types';

export interface MembershipWithLance extends LanceMembership {
  lance: Lance;
}

export function useLances(userId: string | null) {
  const [memberships, setMemberships] = useState<MembershipWithLance[]>([]);
  const [currentLanceId, setCurrentLanceIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); setMemberships([]); return; }
    let cancelled = false;
    supabase
      .from('lance_memberships')
      .select('*, lance:lances(*), profile:profiles(email, display_name)')
      .eq('profile_id', userId)
      .then(({ data }) => {
        if (cancelled) return;
        const ms = (data ?? []) as MembershipWithLance[];
        setMemberships(ms);
        const saved = typeof window !== 'undefined' ? localStorage.getItem('currentLanceId') : null;
        const validSaved = ms.find(m => m.lance_id === saved);
        if (validSaved) {
          setCurrentLanceIdState(validSaved.lance_id);
        } else if (ms.length > 0) {
          setCurrentLanceIdState(ms[0].lance_id);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  function setCurrentLanceId(id: string) {
    setCurrentLanceIdState(id);
    try { localStorage.setItem('currentLanceId', id); } catch (e) { console.warn('localStorage unavailable:', e) }
  }

  const currentMembership = memberships.find(m => m.lance_id === currentLanceId) ?? null;
  const currentLance = currentMembership?.lance ?? null;

  const reloadMemberships = useCallback(async () => {
    if (!userId) return;
    const { data: ms } = await supabase
      .from('lance_memberships')
      .select('*, lance:lances(*), profile:profiles(email, display_name)')
      .eq('profile_id', userId);
    setMemberships((ms ?? []) as MembershipWithLance[]);
  }, [userId]);

  const joinLance = useCallback(async (code: string) => {
    const { data, error } = await supabase.rpc('join_lance_by_code', { p_code: code });
    if (error) throw new Error(error.message);
    const lance = data as { id: string } | null;
    await reloadMemberships();
    if (lance) setCurrentLanceId(lance.id);
  }, [reloadMemberships]);

  const leaveLance = useCallback(async (lanceId: string) => {
    const { error } = await supabase.rpc('leave_lance', { p_lance_id: lanceId });
    if (error) throw new Error(error.message);
    await reloadMemberships();
    setCurrentLanceIdState(null);
  }, [reloadMemberships]);

  const moveCharacterToLance = useCallback(async (memberId: string, lanceId: string) => {
    const { error } = await supabase.rpc('move_member_to_lance', { p_member_id: memberId, p_target_lance_id: lanceId });
    if (error) throw new Error(error.message);
  }, []);

  const regenerateInviteCode = useCallback(async (lanceId: string) => {
    const { data, error } = await supabase.rpc('regenerate_invite_code', { p_lance_id: lanceId });
    if (error) throw new Error(error.message);
    await reloadMemberships();
    return data as string;
  }, [reloadMemberships]);

  const regenerateAdminInviteCode = useCallback(async (lanceId: string) => {
    const { data, error } = await supabase.rpc('regenerate_admin_invite_code', { p_lance_id: lanceId });
    if (error) throw new Error(error.message);
    await reloadMemberships();
    return data as string;
  }, [reloadMemberships]);

  const clearAdminInviteCode = useCallback(async (lanceId: string) => {
    const { error } = await supabase.rpc('clear_admin_invite_code', { p_lance_id: lanceId });
    if (error) throw new Error(error.message);
    await reloadMemberships();
  }, [reloadMemberships]);

  const createLance = useCallback(async (name: string, motto?: string): Promise<string> => {
    const { data, error } = await supabase.rpc('create_lance', { p_name: name, p_motto: motto ?? null });
    if (error) throw new Error(error.message);
    const lance = data as { id: string } | null;
    if (!lance) throw new Error('No lance returned');
    await reloadMemberships();
    setCurrentLanceId(lance.id);
    return lance.id;
  }, [reloadMemberships]);

  return { memberships, currentLanceId, currentLance, currentMembership, setCurrentLanceId, loading, createLance, joinLance, leaveLance, moveCharacterToLance, regenerateInviteCode, regenerateAdminInviteCode, clearAdminInviteCode, reloadMemberships };
}
