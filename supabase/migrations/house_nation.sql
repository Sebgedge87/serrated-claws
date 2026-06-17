-- Add nation field to houses for cosmetic nation theming.
-- Stores the Empire nation name (e.g. 'Dawn', 'Wintermark', 'Urizen').
-- Defaults to null which the app treats as Dawn (original behaviour).

alter table public.houses
  add column if not exists nation text default null;
