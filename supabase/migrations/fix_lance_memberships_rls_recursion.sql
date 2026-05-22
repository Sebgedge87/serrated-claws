-- Fix infinite recursion in lance_memberships RLS policies.
--
-- The previous memberships_lance_read and memberships_admin_write policies
-- queried lance_memberships from within a policy on lance_memberships itself,
-- causing PostgreSQL to recurse indefinitely.
--
-- Fix: use the existing is_admin_in() security-definer function which bypasses
-- RLS when checking membership, breaking the recursion.

drop policy if exists memberships_lance_read on public.lance_memberships;
create policy memberships_lance_read on public.lance_memberships
  for select using (
    public.is_admin_in(lance_id)
  );

drop policy if exists memberships_admin_write on public.lance_memberships;
create policy memberships_admin_write on public.lance_memberships
  for all using (
    public.is_admin_in(lance_id)
  ) with check (
    public.is_admin_in(lance_id)
  );
