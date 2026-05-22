-- 1. Allow authenticated users to insert their own member row
--    (claimed_by must equal the inserting user so they can't create rows for others)
create policy members_self_insert on public.members
  for insert
  with check (claimed_by = auth.uid());

-- 2. Change the new-user trigger to default role = 'member' instead of 'viewer'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member'
  );
  return new;
end;
$$;

-- 3. Upgrade any existing viewer accounts to member
--    (leaves admins/super_admins untouched)
update public.profiles set role = 'member' where role = 'viewer';
