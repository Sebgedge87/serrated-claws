-- ── 1. leader fields: text → uuid FK ─────────────────────────────────────────
-- Run leader_name_to_id.sql first to clear any name-based values.

alter table public.covens
  alter column leader type uuid using leader::uuid;

alter table public.covens
  add constraint covens_leader_fkey
  foreign key (leader) references public.members(id) on delete set null;

alter table public.functions
  alter column leader type uuid using leader::uuid;

alter table public.functions
  add constraint functions_leader_fkey
  foreign key (leader) references public.members(id) on delete set null;

-- ── 2. magic_items_stock event references: text → uuid FK ────────────────────
-- Null out any values that aren't valid UUIDs (i.e. event names) first.

update public.magic_items_stock
  set created_at_event = null
  where created_at_event is not null
    and created_at_event !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

update public.magic_items_stock
  set expires_after_event = null
  where expires_after_event is not null
    and expires_after_event !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

alter table public.magic_items_stock
  alter column created_at_event type uuid using created_at_event::uuid,
  alter column expires_after_event type uuid using expires_after_event::uuid;

alter table public.magic_items_stock
  add constraint magic_items_created_at_event_fkey
    foreign key (created_at_event) references public.events(id) on delete set null,
  add constraint magic_items_expires_after_event_fkey
    foreign key (expires_after_event) references public.events(id) on delete set null;

-- ── 3. crafting_queue target_event: text → uuid FK ───────────────────────────

update public.crafting_queue
  set target_event = null
  where target_event is not null
    and target_event !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

alter table public.crafting_queue
  alter column target_event type uuid using target_event::uuid;

alter table public.crafting_queue
  add constraint crafting_queue_target_event_fkey
  foreign key (target_event) references public.events(id) on delete set null;
