-- Fix: coven_rituals write policy allowed any authenticated user to write any coven's rituals
drop policy if exists coven_rituals_write on public.coven_rituals;

-- Admins can manage all coven rituals in their lance
create policy coven_rituals_admin_write on public.coven_rituals
  for all using (public.is_admin()) with check (public.is_admin());

-- Coven leaders can manage their own coven's rituals
create policy coven_rituals_leader_write on public.coven_rituals
  for all using (
    exists (
      select 1 from public.covens c
      join public.members m on m.id = c.leader
      join public.profiles p on p.member_id = m.id
      where c.id = coven_rituals.coven_id and p.id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.covens c
      join public.members m on m.id = c.leader
      join public.profiles p on p.member_id = m.id
      where c.id = coven_rituals.coven_id and p.id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
