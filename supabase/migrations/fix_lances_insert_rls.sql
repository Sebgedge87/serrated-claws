-- Allow any authenticated user to create a lance.
--
-- The previous lances_superadmin_write (for all) was the only write policy,
-- blocking new users from creating their first lance. Split into:
--   lances_insert  — any signed-in user can create a lance
--   lances_admin_update — lance admins can edit their own lance details

drop policy if exists lances_insert on public.lances;
create policy lances_insert on public.lances
  for insert with check (auth.uid() is not null);

drop policy if exists lances_admin_update on public.lances;
create policy lances_admin_update on public.lances
  for update using (public.is_admin_in(id)) with check (public.is_admin_in(id));
