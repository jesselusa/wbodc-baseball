-- Fix RLS policies for games table - Development Mode
-- This adds the missing INSERT/UPDATE policies for the games table

-- Add development write policies for games table
CREATE POLICY "Allow all writes during development" ON games 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all updates during development" ON games 
  FOR UPDATE USING (true);

-- For completeness, also allow DELETE (though we probably won't need it)
CREATE POLICY "Allow all deletes during development" ON games 
  FOR DELETE USING (true);

-- Also fix any other tables that might be missing write policies
-- (checking all tables that might need write access during development)

-- Teams table (needed for game setup)
CREATE POLICY IF NOT EXISTS "Allow all writes during development" ON teams 
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all updates during development" ON teams 
  FOR UPDATE USING (true);

-- Players table (needed for lineups)
CREATE POLICY IF NOT EXISTS "Allow all writes during development" ON players 
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all updates during development" ON players 
  FOR UPDATE USING (true);

-- Tournament memberships (needed for game setup)
CREATE POLICY IF NOT EXISTS "Allow all writes during development" ON team_memberships 
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all updates during development" ON team_memberships 
  FOR UPDATE USING (true);

-- Comment for documentation
COMMENT ON POLICY "Allow all writes during development" ON games IS 
  'Development-only policy - replace with proper authentication before production'; 