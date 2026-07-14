-- Extend members_self_update policy to also allow update when claimed_by matches,
-- covering the case where lance_memberships.member_id isn't linked yet.
drop policy if exists members_self_update on public.members;
create policy members_self_update on public.members for update using (
  claimed_by = auth.uid()
  or exists (
    select 1 from public.lance_memberships
    where profile_id = auth.uid() and lance_id = members.lance_id and member_id = members.id
  )
);
