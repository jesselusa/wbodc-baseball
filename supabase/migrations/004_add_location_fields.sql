-- Add location and championship fields to players table
ALTER TABLE players ADD COLUMN current_town TEXT;
ALTER TABLE players ADD COLUMN current_state TEXT;
ALTER TABLE players ADD COLUMN hometown TEXT;
ALTER TABLE players ADD COLUMN state TEXT;
ALTER TABLE players ADD COLUMN championships_won INTEGER DEFAULT 0;

-- Add comments to explain the column usage
COMMENT ON COLUMN players.current_town IS 'Current city where player lives';
COMMENT ON COLUMN players.current_state IS 'Current state where player lives';
COMMENT ON COLUMN players.hometown IS 'Player hometown or origin city';
COMMENT ON COLUMN players.state IS 'Player hometown state';
COMMENT ON COLUMN players.championships_won IS 'Number of championships won by player';

-- Update RLS policies to include new fields (existing policies use SELECT * so no changes needed)
-- No additional RLS changes needed since existing policies use SELECT * and INSERT/UPDATE with all columns

-- Enable real-time for location updates (already enabled for players table)
-- No additional real-time configuration needed 