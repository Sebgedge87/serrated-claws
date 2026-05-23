create table public.character_rituals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  ritual_name text not null,
  realm text not null default 'Spring',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.character_rituals enable row level security;

create policy char_rituals_read on public.character_rituals
  for select using (auth.role() = 'authenticated');

create policy char_rituals_admin_all on public.character_rituals
  for all using (public.is_admin()) with check (public.is_admin());

create policy char_rituals_self_write on public.character_rituals
  for all
  using (member_id = (select member_id from public.profiles where id = auth.uid()))
  with check (member_id = (select member_id from public.profiles where id = auth.uid()));
