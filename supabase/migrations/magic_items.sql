-- Magic Items migration — apply after base schema
-- ============================================================================
-- Magic Items Stock
-- ============================================================================
create table public.magic_items_stock (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  tier text not null,
  form text not null,
  bonded_to uuid references public.members(id) on delete set null,
  status text not null default 'available' check (status in ('available', 'bonded', 'reserved', 'expired')),
  created_at_event text,
  expires_after_event text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.magic_items_stock enable row level security;
create policy mis_read on public.magic_items_stock for select using (auth.role() = 'authenticated');
create policy mis_admin_write on public.magic_items_stock for all using (public.is_admin()) with check (public.is_admin());

create trigger magic_items_stock_touch before update on public.magic_items_stock
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Crafting Queue
-- ============================================================================
create table public.crafting_queue (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  tier text not null,
  crafter_id uuid references public.members(id) on delete set null,
  recipient_id uuid references public.members(id) on delete set null,
  status text not null default 'planned' check (status in ('planned', 'materials-sourced', 'in-progress', 'complete', 'cancelled')),
  materials_required jsonb not null default '{}',
  notes text,
  target_event text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crafting_queue enable row level security;
create policy cq_read on public.crafting_queue for select using (auth.role() = 'authenticated');
create policy cq_admin_write on public.crafting_queue for all using (public.is_admin()) with check (public.is_admin());
create policy cq_member_insert on public.crafting_queue for insert
  with check (auth.role() = 'authenticated');

create trigger crafting_queue_touch before update on public.crafting_queue
  for each row execute function public.touch_updated_at();
