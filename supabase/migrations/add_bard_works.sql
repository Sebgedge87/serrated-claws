drop table if exists public.bard_works cascade;

create table public.bard_works (
  id               uuid        primary key default gen_random_uuid(),
  lance_id         uuid        not null references public.lances(id) on delete cascade,
  house_id         text        not null references public.houses(id) on delete cascade,
  author_member_id uuid        not null references public.members(id) on delete cascade,
  title            text        not null default '',
  work_type        text        not null default 'story',
  content          text        not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.bard_works enable row level security;

drop policy if exists "Lance members can read bard_works"     on public.bard_works;
drop policy if exists "Author can insert bard_works"          on public.bard_works;
drop policy if exists "Author can update own bard_works"      on public.bard_works;
drop policy if exists "Author or admin can delete bard_works" on public.bard_works;
drop policy if exists bard_works_select        on public.bard_works;
drop policy if exists bard_works_select_bard   on public.bard_works;
drop policy if exists bard_works_select_admin  on public.bard_works;
drop policy if exists bard_works_insert        on public.bard_works;
drop policy if exists bard_works_insert_bard   on public.bard_works;
drop policy if exists bard_works_insert_admin  on public.bard_works;
drop policy if exists bard_works_update        on public.bard_works;
drop policy if exists bard_works_delete_author on public.bard_works;
drop policy if exists bard_works_delete_admin  on public.bard_works;

-- SELECT: bards in the lance or admins only
create policy bard_works_select_bard on public.bard_works
  for select using (
    exists (
      select 1 from public.profiles pr
      join public.members m on m.id = pr.member_id
      where pr.id = auth.uid()
        and m.lance_id = bard_works.lance_id
        and lower(m.function) like '%bard%'
    )
  );

create policy bard_works_select_admin on public.bard_works
  for select using (
    exists (
      select 1 from public.lance_memberships
      where lance_id  = bard_works.lance_id
        and profile_id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- INSERT: bard writing as themselves, or admin
create policy bard_works_insert_bard on public.bard_works
  for insert with check (
    exists (
      select 1 from public.profiles pr
      join public.members m on m.id = pr.member_id
      where pr.id = auth.uid()
        and pr.member_id = bard_works.author_member_id
        and m.lance_id = bard_works.lance_id
        and lower(m.function) like '%bard%'
    )
  );

create policy bard_works_insert_admin on public.bard_works
  for insert with check (
    exists (
      select 1 from public.lance_memberships
      where lance_id  = bard_works.lance_id
        and profile_id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- UPDATE: author only (bard status at insert time is sufficient)
create policy bard_works_update on public.bard_works
  for update using (
    exists (
      select 1 from public.profiles
      where id        = auth.uid()
        and member_id = bard_works.author_member_id
    )
  );

-- DELETE: author or admin
create policy bard_works_delete_author on public.bard_works
  for delete using (
    exists (
      select 1 from public.profiles
      where id        = auth.uid()
        and member_id = bard_works.author_member_id
    )
  );

create policy bard_works_delete_admin on public.bard_works
  for delete using (
    exists (
      select 1 from public.lance_memberships
      where lance_id  = bard_works.lance_id
        and profile_id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );
