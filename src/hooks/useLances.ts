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
    try { localStorage.setItem('currentLanceId', id); } catch { /* ignore */ }
  }

  const currentMembership = memberships.find(m => m.lance_id === currentLanceId) ?? null;
  const currentLance = currentMembership?.lance ?? null;

  const createLance = useCallback(async (name: string, motto?: string) => {
    const { data, error } = await supabase.rpc('create_lance', { p_name: name, p_motto: motto ?? null });
    if (error) throw new Error(error.message);
    const lance = data as { id: string } | null;
    if (lance && userId) {
      const { data: ms } = await supabase
        .from('lance_memberships')
        .select('*, lance:lances(*), profile:profiles(email, display_name)')
        .eq('profile_id', userId);
      setMemberships((ms ?? []) as MembershipWithLance[]);
      setCurrentLanceId(lance.id);
    }
  }, [userId]);

  return { memberships, currentLanceId, currentLance, currentMembership, setCurrentLanceId, loading, createLance };
}
