-- Remove skills that are no longer in the catalogue
delete from public.character_skills
where skill_name in (
  'One Handed Weapon',
  'Two Handed Weapon',
  'Weapon and Shield',
  'Spear',
  'Polearm',
  'Paired Weapons',
  'Bow',
  'Sentinel',
  'War Scout',
  'Mend Armour',
  'Military Commander',
  'Seneschal'
);

-- Remove any skills in removed categories (Leadership, Other)
delete from public.character_skills
where category in ('Leadership', 'Other');

-- Rename: Thrown Weapon → Thrown
update public.character_skills
set skill_name = 'Thrown'
where skill_name = 'Thrown Weapon';

-- Rename: Extra Recipes → Extra Recipe
update public.character_skills
set skill_name = 'Extra Recipe'
where skill_name = 'Extra Recipes';

-- Rename: Excommunicate → Excommunication
update public.character_skills
set skill_name = 'Excommunication'
where skill_name = 'Excommunicate';

-- Move Battle Mage from Combat to Magic category
update public.character_skills
set category = 'Magic'
where skill_name = 'Battle Mage' and category = 'Combat';
