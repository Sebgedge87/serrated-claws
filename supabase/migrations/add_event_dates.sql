-- Add start_date and end_date to events, migrating existing date column
alter table public.events
  add column if not exists start_date date,
  add column if not exists end_date date;

-- Migrate existing data
update public.events set start_date = date::date where start_date is null and date is not null;

-- Stored procedure to clear attending flags after event ends
create or replace function public.clear_stale_attending()
returns void language plpgsql security definer as $$
begin
  if exists (
    select 1 from public.events
    where coalesce(end_date, start_date) < current_date
      and not cleared
  ) then
    update public.members set attending_event = false where attending_event = true;
    update public.events
      set cleared = true
      where coalesce(end_date, start_date) < current_date
        and not cleared;
  end if;
end;
$$;

-- To schedule daily at 01:00 UTC, run once in Supabase SQL editor:
-- select cron.schedule('clear-attending-daily', '0 1 * * *', 'select public.clear_stale_attending()');

notify pgrst, 'reload schema';
