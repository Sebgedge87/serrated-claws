create table if not exists public.ritual_catalogue (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  magnitude int not null default 2,
  realm text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.ritual_catalogue enable row level security;
create policy ritual_catalogue_read on public.ritual_catalogue for select using (auth.role() = 'authenticated');
create policy ritual_catalogue_write on public.ritual_catalogue for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

notify pgrst, 'reload schema';
