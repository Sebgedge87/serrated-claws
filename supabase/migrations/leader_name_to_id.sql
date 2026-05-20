-- Null out any leader values that are names rather than UUIDs.
-- After running this, reassign leaders via the UI (they will now store member IDs).
UPDATE covens
SET leader = NULL
WHERE leader IS NOT NULL
  AND leader !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE functions
SET leader = NULL
WHERE leader IS NOT NULL
  AND leader !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
