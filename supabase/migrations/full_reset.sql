-- Full lance reset — wipes all data including user accounts.
-- Run in Supabase SQL editor. Auth users are deleted last via cascade.

truncate table
  public.character_skills,
  public.character_rituals,
  public.character_spells,
  public.character_inventory,
  public.bard_works,
  public.coven_ritual_scripts,
  public.coven_script_permissions,
  public.coven_rituals,
  public.business_owners,
  public.magic_items_stock,
  public.crafting_queue,
  public.inventory,
  public.inventory_log,
  public.events,
  public.members,
  public.businesses,
  public.functions,
  public.covens,
  public.houses,
  public.lance_memberships,
  public.lance_settings,
  public.profiles
cascade;

-- Delete auth users (cascades to profiles via foreign key)
delete from auth.users;
