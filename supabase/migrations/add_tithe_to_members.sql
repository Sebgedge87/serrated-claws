alter table public.members
  add column if not exists tithe_paid boolean not null default false,
  add column if not exists tithe_notes text;

notify pgrst, 'reload schema';
