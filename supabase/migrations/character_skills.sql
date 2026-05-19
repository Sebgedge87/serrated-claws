-- Character skills per member
create table public.character_skills (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  skill_name text not null,
  category text not null default 'Other',
  rank int not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.character_skills enable row level security;

create policy char_skills_read on public.character_skills
  for select using (auth.role() = 'authenticated');

create policy char_skills_admin_write on public.character_skills
  for all using (public.is_admin()) with check (public.is_admin());

create policy char_skills_self_write on public.character_skills
  for all
  using (public.owns_member(member_id)) with check (public.owns_member(member_id));
