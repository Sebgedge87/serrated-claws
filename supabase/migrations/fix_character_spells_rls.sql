-- Fix: character_spells had using (true) which allowed unauthenticated reads
drop policy if exists "Lance members can read character_spells" on public.character_spells;
create policy "Authenticated can read character_spells"
  on public.character_spells for select using (auth.role() = 'authenticated');
notify pgrst, 'reload schema';
