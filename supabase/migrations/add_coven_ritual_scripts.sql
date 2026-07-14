create table if not exists public.coven_ritual_scripts (
  id uuid primary key default gen_random_uuid(),
  coven_id text not null references public.covens(id) on delete cascade,
  ritual_name text not null,
  script text not null default '',
  updated_at timestamptz default now(),
  unique (coven_id, ritual_name)
);

alter table public.coven_ritual_scripts enable row level security;

create policy "Lance members can read ritual scripts"
  on public.coven_ritual_scripts for select
  using (
    coven_id in (select id from public.covens where lance_id in (
      select lance_id from public.members where user_id = auth.uid()
    ))
  );

create policy "Coven managers can upsert ritual scripts"
  on public.coven_ritual_scripts for insert
  with check (
    coven_id in (select id from public.covens where lance_id in (
      select lance_id from public.members where user_id = auth.uid()
    ))
  );

create policy "Coven managers can update ritual scripts"
  on public.coven_ritual_scripts for update
  using (
    coven_id in (select id from public.covens where lance_id in (
      select lance_id from public.members where user_id = auth.uid()
    ))
  );
