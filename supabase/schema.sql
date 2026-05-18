-- Serrated Claws — Lance Manager schema
-- Run in the Supabase SQL editor on a fresh project (or migrate carefully).
-- Requires the default `auth.users` table provided by Supabase Auth.

-- ============================================================================
-- Profiles (one per auth user)
-- ============================================================================
create type public.user_role as enum ('admin', 'member', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  role user_role not null default 'viewer',
  member_id uuid,  -- set later when linked to a roster entry
  created_at timestamptz not null default now()
);

-- Auto-create a profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Houses
-- ============================================================================
create table public.houses (
  id text primary key,
  name text not null,
  motto text,
  description text,
  primary_color text default '#d4b46d',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Covens
-- ============================================================================
create table public.covens (
  id text primary key,
  name text not null,
  leader text,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Functions (Claws etc) — reference data
-- ============================================================================
create table public.functions (
  id text primary key,
  name text not null,
  description text,
  leader text
);

-- ============================================================================
-- Members
-- ============================================================================
create type public.member_status as enum ('active', 'inactive', 'KIA');

create table public.members (
  id uuid primary key default gen_random_uuid(),
  house_id text references public.houses(id) on delete set null,
  name text not null,
  player_name text,
  pid text,
  rank text,
  function text references public.functions(id) on delete set null,
  military_function text,
  is_noble boolean not null default false,
  status member_status not null default 'active',
  hp int,
  mp int,
  resource text,
  coin_per_event text,
  coven text references public.covens(id) on delete set null,
  notes text,
  claimed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_house_idx on public.members(house_id);
create index members_coven_idx on public.members(coven);

-- Now that members exists we can finish the FK on profiles
alter table public.profiles
  add constraint profiles_member_id_fkey foreign key (member_id) references public.members(id) on delete set null;

-- ============================================================================
-- Businesses + owners
-- ============================================================================
create table public.businesses (
  id text primary key,
  name text not null,
  type text,
  resources text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_owners (
  business_id text references public.businesses(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  primary key (business_id, member_id)
);

-- ============================================================================
-- Inventory (Empire LARP catalogue stock)
-- ============================================================================
create table public.inventory (
  item text primary key,
  current_qty int not null default 0,
  required_qty int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.inventory_log (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  item text not null,
  amount int not null,
  direction text not null check (direction in ('In', 'Out', 'Adjustment')),
  notes text,
  actor uuid references public.profiles(id) on delete set null
);

create index inventory_log_ts_idx on public.inventory_log(ts desc);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger houses_touch before update on public.houses for each row execute function public.touch_updated_at();
create trigger members_touch before update on public.members for each row execute function public.touch_updated_at();
create trigger businesses_touch before update on public.businesses for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.covens enable row level security;
alter table public.functions enable row level security;
alter table public.members enable row level security;
alter table public.businesses enable row level security;
alter table public.business_owners enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_log enable row level security;

-- helper: is the calling user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- helper: is the calling user the claimer of a member row?
create or replace function public.claimed_member(target_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = target_member and claimed_by = auth.uid());
$$;

-- helper: does the calling user own this member row?
create or replace function public.owns_member(target_member uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (member_id = target_member or claimed_member(target_member))
  );
$$;

-- Profiles: each user sees & edits their own profile; admins see all
create policy profiles_self_read on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy profiles_self_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Reference data (houses, covens, functions): everyone authenticated can read; admins write
create policy houses_read on public.houses for select using (auth.role() = 'authenticated');
create policy houses_admin_write on public.houses for all using (public.is_admin()) with check (public.is_admin());

create policy covens_read on public.covens for select using (auth.role() = 'authenticated');
create policy covens_admin_write on public.covens for all using (public.is_admin()) with check (public.is_admin());

create policy functions_read on public.functions for select using (auth.role() = 'authenticated');
create policy functions_admin_write on public.functions for all using (public.is_admin()) with check (public.is_admin());

-- Members: everyone authenticated can read; admins write all; users can update their own
create policy members_read on public.members for select using (auth.role() = 'authenticated');
create policy members_admin_write on public.members for all using (public.is_admin()) with check (public.is_admin());
create policy members_self_update on public.members for update
  using (claimed_by = auth.uid() or id = (select member_id from public.profiles where id = auth.uid()))
  with check (claimed_by = auth.uid() or id = (select member_id from public.profiles where id = auth.uid()));

-- Businesses + owners: read for all, admin writes
create policy biz_read on public.businesses for select using (auth.role() = 'authenticated');
create policy biz_admin_write on public.businesses for all using (public.is_admin()) with check (public.is_admin());
create policy biz_owners_read on public.business_owners for select using (auth.role() = 'authenticated');
create policy biz_owners_admin_write on public.business_owners for all using (public.is_admin()) with check (public.is_admin());

-- Inventory: members can read, admins write; log is append-only for any authenticated user
create policy inv_read on public.inventory for select using (auth.role() = 'authenticated');
create policy inv_admin_write on public.inventory for all using (public.is_admin()) with check (public.is_admin());

create policy inv_log_read on public.inventory_log for select using (auth.role() = 'authenticated');
create policy inv_log_insert on public.inventory_log for insert with check (auth.role() = 'authenticated');
create policy inv_log_admin_delete on public.inventory_log for delete using (public.is_admin());

-- ============================================================================
-- Bootstrap: promote your first user to admin manually after sign-up:
--   update public.profiles set role = 'admin' where email = '[email protected]';
-- ============================================================================
