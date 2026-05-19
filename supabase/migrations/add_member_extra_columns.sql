-- Add columns that were missing from the original schema deployment
alter table public.members add column if not exists attending_event boolean not null default false;
alter table public.members add column if not exists territory text;
alter table public.members add column if not exists total_xp int not null default 8;

-- Notify PostgREST to reload its schema cache
notify pgrst, 'reload schema';
