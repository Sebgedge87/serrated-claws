create table if not exists public.character_rituals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  ritual_name text not null,
  realm text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.character_rituals enable row level security;

create policy "Authenticated can read character_rituals"
  on public.character_rituals for select using (auth.role() = 'authenticated');

create policy "Authenticated can manage character_rituals"
  on public.character_rituals for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

notify pgrst, 'reload schema';
