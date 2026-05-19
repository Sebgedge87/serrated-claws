alter table public.covens add column if not exists mana_available int not null default 0;

create table if not exists public.coven_rituals (
  id uuid primary key default gen_random_uuid(),
  coven_id text references public.covens(id) on delete cascade not null,
  ritual_name text not null,
  magnitude int not null default 1,
  realm text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.coven_rituals enable row level security;
create policy coven_rituals_read on public.coven_rituals for select using (auth.role() = 'authenticated');
create policy coven_rituals_write on public.coven_rituals for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

notify pgrst, 'reload schema';
