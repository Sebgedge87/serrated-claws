-- Tighten RLS on character tables so reads are scoped to the same lance.
--
-- Currently character_skills, character_rituals, character_inventory, and
-- character_spells allow any authenticated user to SELECT all rows.  This
-- migration replaces the broad read policy with one that only exposes rows
-- whose owning member belongs to a lance the current user is a member of.
--
-- Run this once against your Supabase project.

-- ── Helper: is the viewer a member of the same lance as the target member? ──
-- We reuse this logic across all four tables via a helper function.

create or replace function public.same_lance_as_member(target_member_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.members m
    join public.lance_memberships lm_target on lm_target.lance_id = m.lance_id
    join public.lance_memberships lm_viewer on lm_viewer.lance_id = lm_target.lance_id
    where m.id = target_member_id
      and lm_viewer.profile_id = auth.uid()
  );
$$;

-- ── character_skills ──────────────────────────────────────────────────────────

drop policy if exists char_skills_read on public.character_skills;

create policy char_skills_read on public.character_skills
  for select using (public.same_lance_as_member(member_id));

-- ── character_rituals ─────────────────────────────────────────────────────────

drop policy if exists char_rituals_read on public.character_rituals;

create policy char_rituals_read on public.character_rituals
  for select using (public.same_lance_as_member(member_id));

-- ── character_inventory ───────────────────────────────────────────────────────
-- This table may not exist yet; the CREATE is guarded.

do $$ begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'character_inventory') then
    execute $q$
      drop policy if exists char_inv_read on public.character_inventory;
      create policy char_inv_read on public.character_inventory
        for select using (public.same_lance_as_member(member_id));
    $q$;
  end if;
end $$;

-- ── character_spells ──────────────────────────────────────────────────────────

drop policy if exists char_spells_read on public.character_spells;

create policy char_spells_read on public.character_spells
  for select using (public.same_lance_as_member(member_id));
