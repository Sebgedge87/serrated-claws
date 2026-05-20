-- Allow lance members to insert their own character record.
--
-- The previous members_admin_write policy (for all) covered INSERT, meaning
-- only admins could create member rows. Regular members joining a lance need
-- to be able to create their own character.
--
-- Constraint: claimed_by must equal the inserting user and the lance_id must
-- correspond to a lance the user already belongs to.

drop policy if exists members_self_insert on public.members;
create policy members_self_insert on public.members for insert with check (
  claimed_by = auth.uid() and
  exists (
    select 1 from public.lance_memberships
    where profile_id = auth.uid() and lance_id = members.lance_id
  )
);
