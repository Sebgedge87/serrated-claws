-- Seed reference data + initial roster. Run AFTER schema.sql.
-- Idempotent: re-running upserts.

-- Functions (Claws)
insert into public.functions (id, name, description, leader) values
  ('1st Claws', '1st Claws', 'Frontline sword and board', 'Viktor Montagne'),
  ('2nd Claws', '2nd Claws', 'Battlemage or polearm', 'Garro'),
  ('3rd Claws', '3rd Claws', 'Support, healers, archers', 'Butcher'),
  ('The Immortals', 'The Immortals', 'Skirmishers, dual wielders (ambi)', null),
  ('Leadership', 'Leadership', 'Earl/King/Queen — Too cool for school', null)
on conflict (id) do update set name = excluded.name, description = excluded.description, leader = excluded.leader;

-- Covens
insert into public.covens (id, name, leader, description) values
  ('mournival', 'The Mournival', 'Lucien Ventris', 'The Coven'),
  ('golden-grove', 'Golden Grove', null, 'Ritual magic coven')
on conflict (id) do update set name = excluded.name, leader = excluded.leader, description = excluded.description;

-- Houses
insert into public.houses (id, name, primary_color, sort_order) values
  ('du-hyre', 'House Du Hyre', '#7eb0d4', 0),
  ('serrated-suns', 'House Serrated Suns', '#d4b46d', 1),
  ('de-la-montagne', 'House De La Montagne', '#9c7eb0', 2),
  ('maddox', 'House Maddox', '#a8413f', 3),
  ('vortekar', 'House Vortekar', '#7ea88e', 4)
on conflict (id) do update set name = excluded.name, primary_color = excluded.primary_color;

-- Businesses
insert into public.businesses (id, name, type) values
  ('ragged-talon', 'The Ragged Talon', 'Bar'),
  ('talon-bank', 'Talon Bank', 'Currency'),
  ('corvaine-trades', 'Corvaine Trades', 'Resources')
on conflict (id) do update set name = excluded.name, type = excluded.type;

-- NOTE: member rows are seeded from the app on first run (see src/lib/seed.ts).
-- Run the in-app "Seed roster" button or import via Supabase Studio CSV.
