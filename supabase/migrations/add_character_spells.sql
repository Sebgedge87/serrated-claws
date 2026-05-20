create table if not exists public.character_spells (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  spell_name text not null,
  school text not null,
  magnitude int not null default 1,
  notes text,
  created_at timestamptz default now()
);

alter table public.character_spells enable row level security;

create policy "Lance members can read character_spells"
  on public.character_spells for select using (true);

create policy "Admins can manage character_spells"
  on public.character_spells for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

create policy "Members can manage own character_spells"
  on public.character_spells for all using (
    exists (select 1 from public.profiles where id = auth.uid() and member_id = character_spells.member_id)
  );

notify pgrst, 'reload schema';
