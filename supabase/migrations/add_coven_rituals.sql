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
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'coven_rituals' and policyname = 'coven_rituals_read') then
    create policy coven_rituals_read on public.coven_rituals for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'coven_rituals' and policyname = 'coven_rituals_write') then
    create policy coven_rituals_write on public.coven_rituals for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

notify pgrst, 'reload schema';

-- Add wording field for coven leader casting notes
alter table public.coven_rituals add column if not exists wording text;
notify pgrst, 'reload schema';
