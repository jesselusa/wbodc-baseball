-- WBDoc Baseball Seed Data
-- Run this after the initial schema migration

-- Sample Players
INSERT INTO players (name, nickname, email) VALUES
  ('Jesse Lusa', 'JLus', 'jesse@example.com'),
  ('Alex Johnson', 'AJ', 'alex@example.com'),
  ('Sam Wilson', 'Sammy', 'sam@example.com'),
  ('Taylor Brown', 'TB', 'taylor@example.com'),
  ('Jordan Lee', 'JLee', 'jordan@example.com'),
  ('Casey Davis', 'CD', 'casey@example.com'),
  ('Riley Martinez', 'Riles', 'riley@example.com'),
  ('Morgan Clark', 'MC', 'morgan@example.com'),
  ('Avery Garcia', 'Ave', 'avery@example.com'),
  ('Parker Smith', 'Parks', 'parker@example.com'),
  ('Quinn Rodriguez', 'Q', 'quinn@example.com'),
  ('Drew Thompson', 'DT', 'drew@example.com'),
  ('Sage Anderson', 'Sage', 'sage@example.com'),
  ('River Jackson', 'River', 'river@example.com'),
  ('Phoenix White', 'Nix', 'phoenix@example.com'),
  ('Rowan Harris', 'Row', 'rowan@example.com'),
  ('Sky Miller', 'Sky', 'sky@example.com'),
  ('Dakota Wilson', 'Kota', 'dakota@example.com'),
  ('Cameron Moore', 'Cam', 'cameron@example.com'),
  ('Emery Taylor', 'Em', 'emery@example.com');

-- Sample Tournament
INSERT INTO tournaments (name, description, start_date, end_date, status) VALUES
  ('Halloweekend 2024 WBDoc Baseball Championship', 
   'Annual reunion tournament featuring the classic WBDoc Baseball format', 
   '2024-10-26', 
   '2024-10-27', 
   'upcoming');

-- Sample Teams
INSERT INTO teams (name, color) VALUES
  ('Thunder Bolts', '#FFD700'),  -- Gold
  ('Lightning Strikes', '#FF6B35'), -- Orange-Red
  ('Storm Chasers', '#4ECDC4'),  -- Teal
  ('Wind Warriors', '#45B7D1'),  -- Blue
  ('Rain Makers', '#96CEB4'),    -- Green
  ('Tornado Alley', '#FECA57'),  -- Yellow
  ('Hurricane Force', '#FF9FF3'), -- Pink
  ('Cyclone Squad', '#54A0FF');  -- Light Blue

-- Get tournament and team IDs for team memberships
DO $$
DECLARE
    tournament_uuid uuid;
    team_uuids uuid[];
    player_uuids uuid[];
    i integer := 1;
BEGIN
    -- Get the tournament ID
    SELECT id INTO tournament_uuid FROM tournaments WHERE name LIKE 'Halloweekend%' LIMIT 1;
    
    -- Get team IDs
    SELECT ARRAY(SELECT id FROM teams ORDER BY name) INTO team_uuids;
    
    -- Get player IDs
    SELECT ARRAY(SELECT id FROM players ORDER BY name) INTO player_uuids;
    
    -- Assign players to teams (2-3 players per team for 8 teams)
    FOREACH team_uuid IN ARRAY team_uuids
    LOOP
        -- Add 2-3 players per team
        FOR j IN 1..3 LOOP
            IF i <= array_length(player_uuids, 1) THEN
                INSERT INTO team_memberships (team_id, player_id, tournament_id) 
                VALUES (team_uuid, player_uuids[i], tournament_uuid);
                i := i + 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Sample Games (Tournament Bracket - First Round)
DO $$
DECLARE
    tournament_uuid uuid;
    team_uuids uuid[];
BEGIN
    -- Get tournament ID
    SELECT id INTO tournament_uuid FROM tournaments WHERE name LIKE 'Halloweekend%' LIMIT 1;
    
    -- Get team IDs
    SELECT ARRAY(SELECT id FROM teams ORDER BY name LIMIT 8) INTO team_uuids;
    
    -- Create first round games
    INSERT INTO games (tournament_id, home_team_id, away_team_id, total_innings, status) VALUES
      (tournament_uuid, team_uuids[1], team_uuids[2], 7, 'scheduled'), -- Game 1
      (tournament_uuid, team_uuids[3], team_uuids[4], 7, 'scheduled'), -- Game 2  
      (tournament_uuid, team_uuids[5], team_uuids[6], 7, 'scheduled'), -- Game 3
      (tournament_uuid, team_uuids[7], team_uuids[8], 7, 'scheduled'); -- Game 4
END $$;

-- Update tournament standings for all teams
INSERT INTO tournament_standings (tournament_id, team_id, wins, losses, runs_scored, runs_allowed)
SELECT 
  t.id as tournament_id,
  teams.id as team_id,
  0 as wins,
  0 as losses, 
  0 as runs_scored,
  0 as runs_allowed
FROM tournaments t
CROSS JOIN teams
WHERE t.name LIKE 'Halloweekend%'; 