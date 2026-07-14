create table if not exists public.coven_script_permissions (
  coven_id text not null references public.covens(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  can_write boolean not null default false,
  can_export boolean not null default false,
  primary key (coven_id, member_id)
);

alter table public.coven_script_permissions enable row level security;

create policy "Lance members can read script permissions"
  on public.coven_script_permissions for select
  using (
    coven_id in (
      select id from public.covens where lance_id in (
        select lance_id from public.lance_memberships where profile_id = auth.uid()
      )
    )
  );

create policy "Lance members can upsert script permissions"
  on public.coven_script_permissions for insert
  with check (
    coven_id in (
      select id from public.covens where lance_id in (
        select lance_id from public.lance_memberships where profile_id = auth.uid()
      )
    )
  );

create policy "Lance members can update script permissions"
  on public.coven_script_permissions for update
  using (
    coven_id in (
      select id from public.covens where lance_id in (
        select lance_id from public.lance_memberships where profile_id = auth.uid()
      )
    )
  );
