-- Add unit_value (market price in rings) to inventory items
-- Stored as rings — 20r = 1 crown, 160r = 1 throne

alter table public.inventory add column if not exists unit_value integer not null default 0;
