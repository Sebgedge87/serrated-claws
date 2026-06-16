-- Enable Supabase Realtime publication for all tables the client subscribes to.
--
-- Supabase Realtime only broadcasts changes for tables that are part of the
-- supabase_realtime publication.  Run this once; adding a table that is
-- already in the publication is a no-op.
--
-- Tables subscribed to in useLanceData.ts:
--   Lance-scoped (filtered by lance_id column):
--     members, houses, covens, functions, inventory, inventory_log,
--     businesses, business_owners, events, bard_works, lance_settings
--   Character tables (no lance_id — filtered client-side):
--     character_inventory, character_skills, character_rituals,
--     character_spells, coven_rituals

alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.houses;
alter publication supabase_realtime add table public.covens;
alter publication supabase_realtime add table public.functions;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.inventory_log;
alter publication supabase_realtime add table public.businesses;
alter publication supabase_realtime add table public.business_owners;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.bard_works;
alter publication supabase_realtime add table public.lance_settings;
alter publication supabase_realtime add table public.character_inventory;
alter publication supabase_realtime add table public.character_skills;
alter publication supabase_realtime add table public.character_rituals;
alter publication supabase_realtime add table public.character_spells;
alter publication supabase_realtime add table public.coven_rituals;

-- Verify with:
--   select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename;
