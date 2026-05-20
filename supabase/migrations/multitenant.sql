-- ── Multi-tenant migration ────────────────────────────────────────────────────
-- Run AFTER: leader_name_to_id.sql and relational_cleanup.sql

-- 1. Lances table (the tenant)
create table if not exists public.lances (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Lance',
  motto text,
  description text,
  created_at timestamptz not null default now()
);

-- Seed from existing lance_settings
insert into public.lances (name, motto, description)
select name, motto, description from public.lance_settings where id = 'default';

-- 2. Lance memberships (per-user, per-lance role + character link)
create table if not exists public.lance_memberships (
  id uuid primary key default gen_random_uuid(),
  lance_id uuid not null references public.lances(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null default 'viewer',
  member_id uuid,
  created_at timestamptz not null default now(),
  unique(lance_id, profile_id)
);

-- 3. Add lance_id to all data tables
do $$
declare lid uuid;
begin
  select id into lid from public.lances order by created_at limit 1;

  if not exists (select 1 from information_schema.columns where table_name='houses' and column_name='lance_id') then
    alter table public.houses add column lance_id uuid references public.lances(id) on delete cascade;
    update public.houses set lance_id = lid;
    alter table public.houses alter column lance_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='covens' and column_name='lance_id') then
    alter table public.covens add column lance_id uuid references public.lances(id) on delete cascade;
    update public.covens set lance_id = lid;
    alter table public.covens alter column lance_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='functions' and column_name='lance_id') then
    alter table public.functions add column lance_id uuid references public.lances(id) on delete cascade;
    update public.functions set lance_id = lid;
    alter table public.functions alter column lance_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='members' and column_name='lance_id') then
    alter table public.members add column lance_id uuid references public.lances(id) on delete cascade;
    update public.members set lance_id = lid;
    alter table public.members alter column lance_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='businesses' and column_name='lance_id') then
    alter table public.businesses add column lance_id uuid references public.lances(id) on delete cascade;
    update public.businesses set lance_id = lid;
    alter table public.businesses alter column lance_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='events' and column_name='lance_id') then
    alter table public.events add column lance_id uuid references public.lances(id) on delete cascade;
    update public.events set lance_id = lid;
    alter table public.events alter column lance_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='magic_items_stock' and column_name='lance_id') then
    alter table public.magic_items_stock add column lance_id uuid references public.lances(id) on delete cascade;
    update public.magic_items_stock set lance_id = lid;
    alter table public.magic_items_stock alter column lance_id set not null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='crafting_queue' and column_name='lance_id') then
    alter table public.crafting_queue add column lance_id uuid references public.lances(id) on delete cascade;
    update public.crafting_queue set lance_id = lid;
    alter table public.crafting_queue alter column lance_id set not null;
  end if;

  -- Inventory has text PK: migrate to composite PK (lance_id, item)
  if not exists (select 1 from information_schema.columns where table_name='inventory' and column_name='lance_id') then
    alter table public.inventory drop constraint if exists inventory_pkey;
    alter table public.inventory add column lance_id uuid references public.lances(id) on delete cascade;
    update public.inventory set lance_id = lid;
    alter table public.inventory alter column lance_id set not null;
    alter table public.inventory add primary key (lance_id, item);
  end if;

  if not exists (select 1 from information_schema.columns where table_name='inventory_log' and column_name='lance_id') then
    alter table public.inventory_log add column lance_id uuid references public.lances(id) on delete cascade;
    update public.inventory_log set lance_id = lid;
    alter table public.inventory_log alter column lance_id set not null;
  end if;
end;
$$;

-- FK on lance_memberships.member_id now that members has lance_id
alter table public.lance_memberships
  add constraint if not exists lance_memberships_member_id_fkey
  foreign key (member_id) references public.members(id) on delete set null;

-- Migrate existing profiles → lance_memberships
insert into public.lance_memberships (lance_id, profile_id, role, member_id)
select l.id, p.id, p.role, p.member_id
from public.profiles p
cross join (select id from public.lances order by created_at limit 1) l
on conflict (lance_id, profile_id) do nothing;

-- 4. RLS for new tables
alter table if exists public.lances enable row level security;
alter table if exists public.lance_memberships enable row level security;

create policy if not exists lances_member_read on public.lances
  for select using (
    id in (select lance_id from public.lance_memberships where profile_id = auth.uid())
  );

create policy if not exists lances_superadmin_write on public.lances
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

create policy if not exists memberships_self_read on public.lance_memberships
  for select using (profile_id = auth.uid());

create policy if not exists memberships_lance_read on public.lance_memberships
  for select using (
    lance_id in (
      select lm2.lance_id from public.lance_memberships lm2
      where lm2.profile_id = auth.uid() and lm2.role in ('admin', 'super_admin')
    )
  );

create policy if not exists memberships_admin_write on public.lance_memberships
  for all using (
    lance_id in (
      select lm2.lance_id from public.lance_memberships lm2
      where lm2.profile_id = auth.uid() and lm2.role in ('admin', 'super_admin')
    )
  ) with check (
    lance_id in (
      select lm2.lance_id from public.lance_memberships lm2
      where lm2.profile_id = auth.uid() and lm2.role in ('admin', 'super_admin')
    )
  );

-- 5. Admin helper scoped to lance
create or replace function public.is_admin_in(p_lance_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lance_memberships
    where profile_id = auth.uid() and lance_id = p_lance_id
      and role in ('admin', 'super_admin')
  ) or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- 6. Update RLS on data tables

-- Houses
drop policy if exists houses_read on public.houses;
drop policy if exists houses_admin_write on public.houses;
create policy houses_read on public.houses for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = houses.lance_id)
);
create policy houses_admin_write on public.houses for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));

-- Covens
drop policy if exists covens_read on public.covens;
drop policy if exists covens_admin_write on public.covens;
create policy covens_read on public.covens for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = covens.lance_id)
);
create policy covens_admin_write on public.covens for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));

-- Functions
drop policy if exists functions_read on public.functions;
drop policy if exists functions_admin_write on public.functions;
create policy functions_read on public.functions for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = functions.lance_id)
);
create policy functions_admin_write on public.functions for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));

-- Members
drop policy if exists members_read on public.members;
drop policy if exists members_admin_write on public.members;
drop policy if exists members_self_update on public.members;
create policy members_read on public.members for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = members.lance_id)
);
create policy members_admin_write on public.members for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));
create policy members_self_update on public.members for update using (
  exists (
    select 1 from public.lance_memberships
    where profile_id = auth.uid() and lance_id = members.lance_id and member_id = members.id
  )
);

-- Businesses
drop policy if exists biz_read on public.businesses;
drop policy if exists biz_admin_write on public.businesses;
create policy biz_read on public.businesses for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = businesses.lance_id)
);
create policy biz_admin_write on public.businesses for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));

-- Business owners
drop policy if exists biz_owners_read on public.business_owners;
drop policy if exists biz_owners_admin_write on public.business_owners;
create policy biz_owners_read on public.business_owners for select using (
  exists (
    select 1 from public.businesses b
    join public.lance_memberships lm on lm.lance_id = b.lance_id
    where b.id = business_owners.business_id and lm.profile_id = auth.uid()
  )
);
create policy biz_owners_admin_write on public.business_owners for all using (
  exists (
    select 1 from public.businesses b
    where b.id = business_owners.business_id and public.is_admin_in(b.lance_id)
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_owners.business_id and public.is_admin_in(b.lance_id)
  )
);

-- Inventory
drop policy if exists inv_read on public.inventory;
drop policy if exists inv_admin_write on public.inventory;
create policy inv_read on public.inventory for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = inventory.lance_id)
);
create policy inv_admin_write on public.inventory for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));

-- Inventory log
drop policy if exists inv_log_read on public.inventory_log;
drop policy if exists inv_log_insert on public.inventory_log;
drop policy if exists inv_log_admin_delete on public.inventory_log;
create policy inv_log_read on public.inventory_log for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = inventory_log.lance_id)
);
create policy inv_log_insert on public.inventory_log for insert with check (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = inventory_log.lance_id)
);
create policy inv_log_admin_delete on public.inventory_log for delete
  using (public.is_admin_in(lance_id));

-- Events
drop policy if exists events_read on public.events;
drop policy if exists events_admin_write on public.events;
create policy events_read on public.events for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = events.lance_id)
);
create policy events_admin_write on public.events for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));

-- Magic items
drop policy if exists mis_read on public.magic_items_stock;
drop policy if exists mis_admin_write on public.magic_items_stock;
create policy mis_read on public.magic_items_stock for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = magic_items_stock.lance_id)
);
create policy mis_admin_write on public.magic_items_stock for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));

-- Crafting queue
drop policy if exists cq_read on public.crafting_queue;
drop policy if exists cq_admin_write on public.crafting_queue;
drop policy if exists cq_member_insert on public.crafting_queue;
create policy cq_read on public.crafting_queue for select using (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = crafting_queue.lance_id)
);
create policy cq_admin_write on public.crafting_queue for all
  using (public.is_admin_in(lance_id)) with check (public.is_admin_in(lance_id));
create policy cq_member_insert on public.crafting_queue for insert with check (
  exists (select 1 from public.lance_memberships where profile_id = auth.uid() and lance_id = crafting_queue.lance_id)
);

-- Character inventory (scoped via member FK)
drop policy if exists char_inv_read on public.character_inventory;
drop policy if exists char_inv_admin_write on public.character_inventory;
drop policy if exists char_inv_self_write on public.character_inventory;
create policy char_inv_read on public.character_inventory for select using (
  exists (
    select 1 from public.members m
    join public.lance_memberships lm on lm.lance_id = m.lance_id
    where m.id = character_inventory.member_id and lm.profile_id = auth.uid()
  )
);
create policy char_inv_admin_write on public.character_inventory for all using (
  exists (select 1 from public.members m where m.id = member_id and public.is_admin_in(m.lance_id))
) with check (
  exists (select 1 from public.members m where m.id = member_id and public.is_admin_in(m.lance_id))
);
create policy char_inv_self_write on public.character_inventory for all using (
  exists (
    select 1 from public.lance_memberships lm
    join public.members m on m.id = character_inventory.member_id
    where lm.profile_id = auth.uid() and lm.lance_id = m.lance_id and lm.member_id = character_inventory.member_id
  )
) with check (
  exists (
    select 1 from public.lance_memberships lm
    join public.members m on m.id = character_inventory.member_id
    where lm.profile_id = auth.uid() and lm.lance_id = m.lance_id and lm.member_id = character_inventory.member_id
  )
);

-- Character skills
drop policy if exists char_skills_read on public.character_skills;
drop policy if exists char_skills_admin_write on public.character_skills;
drop policy if exists char_skills_self_write on public.character_skills;
create policy char_skills_read on public.character_skills for select using (
  exists (
    select 1 from public.members m
    join public.lance_memberships lm on lm.lance_id = m.lance_id
    where m.id = character_skills.member_id and lm.profile_id = auth.uid()
  )
);
create policy char_skills_admin_write on public.character_skills for all using (
  exists (select 1 from public.members m where m.id = member_id and public.is_admin_in(m.lance_id))
) with check (
  exists (select 1 from public.members m where m.id = member_id and public.is_admin_in(m.lance_id))
);
create policy char_skills_self_write on public.character_skills for all using (
  exists (
    select 1 from public.lance_memberships lm
    join public.members m on m.id = character_skills.member_id
    where lm.profile_id = auth.uid() and lm.lance_id = m.lance_id and lm.member_id = character_skills.member_id
  )
) with check (
  exists (
    select 1 from public.lance_memberships lm
    join public.members m on m.id = character_skills.member_id
    where lm.profile_id = auth.uid() and lm.lance_id = m.lance_id and lm.member_id = character_skills.member_id
  )
);
