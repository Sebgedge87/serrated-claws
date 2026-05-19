alter table public.covens add column if not exists domain text;

notify pgrst, 'reload schema';
