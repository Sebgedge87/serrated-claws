-- Atomic lance creation: insert lance + add creator as admin in one call.
--
-- Without this, the two-step frontend flow (INSERT lances, then INSERT
-- lance_memberships) fails on the second step because is_admin_in() returns
-- false for a lance that has no members yet.
--
-- security definer runs as the function owner, bypassing RLS on both tables.

create or replace function public.create_lance(p_name text, p_motto text default null)
returns public.lances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lance public.lances;
begin
  insert into public.lances (name, motto)
  values (p_name, p_motto)
  returning * into v_lance;

  insert into public.lance_memberships (lance_id, profile_id, role)
  values (v_lance.id, auth.uid(), 'admin');

  return v_lance;
end;
$$;
