-- Add nation field to lances table for app-wide terminology theming.
-- Stores the Empire nation name (e.g. 'Dawn', 'Wintermark', 'Urizen').
-- Null defaults to Dawn behaviour throughout the app.

alter table public.lances
  add column if not exists nation text default null;
