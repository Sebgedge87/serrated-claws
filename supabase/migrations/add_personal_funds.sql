alter table public.members
  add column if not exists personal_rings   int default 0,
  add column if not exists personal_crowns  int default 0,
  add column if not exists personal_thrones int default 0;

notify pgrst, 'reload schema';
