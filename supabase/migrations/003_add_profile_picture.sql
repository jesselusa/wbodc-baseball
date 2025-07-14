-- Add profile picture column to players table
ALTER TABLE players ADD COLUMN profile_picture TEXT;

-- Add comment to explain the column usage
COMMENT ON COLUMN players.profile_picture IS 'URL or path to player profile picture';

-- Update RLS policies to include profile_picture access
-- Players table policies already exist and include all columns by default
-- No additional RLS changes needed since existing policies use SELECT * and INSERT/UPDATE with all columns

-- Enable real-time for profile picture updates (already enabled for players table)
-- No additional real-time configuration needed 