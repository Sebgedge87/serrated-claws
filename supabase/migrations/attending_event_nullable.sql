-- Make attending_event nullable so we can distinguish:
--   null  = not yet answered (show the banner)
--   true  = confirmed attending
--   false = confirmed not attending
--
-- Previously defaulted to false (non-null), which meant "unanswered" and
-- "declined" were indistinguishable. The app's clearAttending operation
-- now sets null (reset to unanswered) rather than false.

alter table public.members
  alter column attending_event drop not null,
  alter column attending_event set default null;

-- Reset all existing false values to null (treat as unanswered).
-- Leave true values intact — those members have confirmed attendance.
update public.members set attending_event = null where attending_event = false;
