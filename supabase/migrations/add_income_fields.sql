alter table public.members
  add column if not exists rings_per_event int,
  add column if not exists crowns_per_event int,
  add column if not exists thrones_per_event int;

notify pgrst, 'reload schema';
