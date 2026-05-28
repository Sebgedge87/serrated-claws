create table if not exists public.bard_works (
  id uuid primary key default gen_random_uuid(),
  lance_id uuid not null references public.lances(id) on delete cascade,
  house_id uuid not null references public.houses(id) on delete cascade,
  author_member_id uuid not null references public.members(id) on delete cascade,
  title text not null default '',
  work_type text not null default 'story',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bard_works enable row level security;

drop policy if exists "Lance members can read bard_works" on public.bard_works;
drop policy if exists "Author can insert bard_works" on public.bard_works;
drop policy if exists "Author can update own bard_works" on public.bard_works;
drop policy if exists "Author or admin can delete bard_works" on public.bard_works;

create policy "Lance members can read bard_works" on public.bard_works
  for select using (
    exists (
      select 1 from public.lance_memberships lm
      join public.profiles p on p.id = lm.profile_id
      where lm.lance_id = bard_works.lance_id and p.id = auth.uid()
    )
  );

create policy "Author can insert bard_works" on public.bard_works
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.member_id = bard_works.author_member_id
    )
  );

create policy "Author can update own bard_works" on public.bard_works
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.member_id = bard_works.author_member_id
    )
  );

create policy "Author or admin can delete bard_works" on public.bard_works
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.member_id = bard_works.author_member_id
    )
    or exists (
      select 1 from public.lance_memberships lm
      join public.profiles p on p.id = lm.profile_id
      where lm.lance_id = bard_works.lance_id
        and p.id = auth.uid()
        and lm.role in ('admin', 'super_admin')
    )
  );

notify pgrst, 'reload schema';
