-- Lance invite codes + join/leave/move-character functions

-- 1. Add invite_code to lances
alter table public.lances add column if not exists invite_code text unique;

-- Generate codes for existing lances (8 random hex chars)
update public.lances
set invite_code = lower(substring(md5(id::text || random()::text) from 1 for 8))
where invite_code is null;

alter table public.lances alter column invite_code set not null;
alter table public.lances alter column invite_code
  set default lower(substring(md5(gen_random_uuid()::text) from 1 for 8));

-- 2. Join a lance by invite code (any authenticated user)
create or replace function public.join_lance_by_code(p_code text)
returns public.lances
language plpgsql security definer set search_path = public as $$
declare
  v_lance public.lances;
begin
  select * into v_lance
  from public.lances
  where lower(trim(invite_code)) = lower(trim(p_code));

  if not found then
    raise exception 'Invalid invite code';
  end if;

  insert into public.lance_memberships (lance_id, profile_id, role)
  values (v_lance.id, auth.uid(), 'member')
  on conflict (lance_id, profile_id) do nothing;

  return v_lance;
end;
$$;

-- 3. Leave a lance (blocks if last admin)
create or replace function public.leave_lance(p_lance_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_is_admin boolean;
  v_admin_count int;
begin
  select role in ('admin', 'super_admin') into v_is_admin
  from public.lance_memberships
  where lance_id = p_lance_id and profile_id = auth.uid();

  select count(*) into v_admin_count
  from public.lance_memberships
  where lance_id = p_lance_id and role in ('admin', 'super_admin');

  if v_is_admin and v_admin_count <= 1 then
    raise exception 'You are the only admin — transfer admin rights before leaving.';
  end if;

  delete from public.lance_memberships
  where lance_id = p_lance_id and profile_id = auth.uid();
end;
$$;

-- 4. Move a character to a different lance (must own character + be in target lance)
create or replace function public.move_member_to_lance(p_member_id uuid, p_target_lance_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.members where id = p_member_id and claimed_by = auth.uid()
  ) then
    raise exception 'You can only move your own character';
  end if;

  if not exists (
    select 1 from public.lance_memberships
    where lance_id = p_target_lance_id and profile_id = auth.uid()
  ) then
    raise exception 'You are not a member of the target lance';
  end if;

  -- Move the member record; clear house (house is lance-scoped)
  update public.members
  set lance_id = p_target_lance_id, house_id = null
  where id = p_member_id;

  -- Link membership in the new lance
  update public.lance_memberships
  set member_id = p_member_id
  where lance_id = p_target_lance_id and profile_id = auth.uid();
end;
$$;

-- 5. Regenerate invite code (admins only)
create or replace function public.regenerate_invite_code(p_lance_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_new_code text;
begin
  if not public.is_admin_in(p_lance_id) then
    raise exception 'Only admins can regenerate the invite code';
  end if;

  v_new_code := lower(substring(md5(gen_random_uuid()::text) from 1 for 8));
  update public.lances set invite_code = v_new_code where id = p_lance_id;
  return v_new_code;
end;
$$;
