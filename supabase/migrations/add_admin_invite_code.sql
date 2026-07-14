-- Add a separate admin invite code to lances
alter table public.lances add column if not exists admin_invite_code text unique default null;

-- Update join function to grant admin role when admin code matches
create or replace function public.join_lance_by_code(p_code text)
returns public.lances
language plpgsql security definer set search_path = public as $$
declare
  v_lance public.lances;
  v_role  public.user_role;
begin
  -- Check regular invite code first
  select * into v_lance
  from public.lances
  where lower(trim(invite_code)) = lower(trim(p_code));

  if found then
    v_role := 'member'::public.user_role;
  else
    -- Check admin invite code
    select * into v_lance
    from public.lances
    where admin_invite_code is not null
      and lower(trim(admin_invite_code)) = lower(trim(p_code));

    if not found then
      raise exception 'Invalid invite code';
    end if;
    v_role := 'admin'::public.user_role;
  end if;

  insert into public.lance_memberships (lance_id, profile_id, role)
  values (v_lance.id, auth.uid(), v_role)
  on conflict (lance_id, profile_id) do update set role = v_role;

  return v_lance;
end;
$$;

-- Admin function to generate/regenerate the admin invite code
create or replace function public.regenerate_admin_invite_code(p_lance_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_new_code text;
begin
  if not public.is_admin_in(p_lance_id) then
    raise exception 'Only admins can manage the admin invite code';
  end if;

  v_new_code := lower(substring(md5('admin-' || gen_random_uuid()::text) from 1 for 8));
  update public.lances set admin_invite_code = v_new_code where id = p_lance_id;
  return v_new_code;
end;
$$;

-- Clear admin invite code (disable it)
create or replace function public.clear_admin_invite_code(p_lance_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_in(p_lance_id) then
    raise exception 'Only admins can manage the admin invite code';
  end if;
  update public.lances set admin_invite_code = null where id = p_lance_id;
end;
$$;
