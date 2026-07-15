-- Fix self-write RLS on all character tables to use claimed_by in addition to
-- lance_memberships.member_id, so members can write to their own character data
-- even when the membership link isn't set.

-- Helper: is the current user the owner of a member record?
drop function if exists public.owns_member(uuid);
create or replace function public.owns_member(target_member_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.members
    where id = target_member_id and claimed_by = auth.uid()
  )
  or exists (
    select 1 from public.lance_memberships
    where profile_id = auth.uid() and member_id = target_member_id
  );
$$;

-- character_inventory
drop policy if exists char_inv_self_write on public.character_inventory;
create policy char_inv_self_write on public.character_inventory for all
  using (public.owns_member(member_id))
  with check (public.owns_member(member_id));

-- character_skills
drop policy if exists char_skills_self_write on public.character_skills;
create policy char_skills_self_write on public.character_skills for all
  using (public.owns_member(member_id))
  with check (public.owns_member(member_id));

-- character_rituals
drop policy if exists "Authenticated can manage character_rituals" on public.character_rituals;
create policy char_rituals_self_write on public.character_rituals for all
  using (
    public.owns_member(member_id)
    or exists (select 1 from public.members m where m.id = member_id and public.is_admin_in(m.lance_id))
  )
  with check (
    public.owns_member(member_id)
    or exists (select 1 from public.members m where m.id = member_id and public.is_admin_in(m.lance_id))
  );

-- character_spells
drop policy if exists "Members can manage own character_spells" on public.character_spells;
create policy char_spells_self_write on public.character_spells for all
  using (public.owns_member(member_id))
  with check (public.owns_member(member_id));

notify pgrst, 'reload schema';
