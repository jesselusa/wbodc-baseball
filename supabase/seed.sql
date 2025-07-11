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
    team_uuid uuid;
    i integer := 1;
BEGIN
    -- Get the tournament ID
    SELECT id INTO tournament_uuid FROM tournaments WHERE name LIKE 'Halloweekend%' LIMIT 1;
    
    -- Get team IDs
    SELECT ARRAY(SELECT id FROM teams ORDER BY name) INTO team_uuids;
    
    -- Get player IDs
    SELECT ARRAY(SELECT id FROM players ORDER BY name) INTO player_uuids;
    
    -- Only proceed if we don't already have team memberships
    IF NOT EXISTS (SELECT 1 FROM team_memberships WHERE tournament_id = tournament_uuid) THEN
        -- Assign players to teams (2-3 players per team for 8 teams)
        FOR j IN 1..array_length(team_uuids, 1) LOOP
            team_uuid := team_uuids[j];
            -- Add 2-3 players per team
            FOR k IN 1..3 LOOP
                IF i <= array_length(player_uuids, 1) THEN
                    INSERT INTO team_memberships (team_id, player_id, tournament_id) 
                    VALUES (team_uuid, player_uuids[i], tournament_uuid);
                    i := i + 1;
                END IF;
            END LOOP;
        END LOOP;
    END IF;
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
    
    -- Only create games if they don't exist
    IF NOT EXISTS (SELECT 1 FROM games WHERE tournament_id = tournament_uuid) THEN
        -- Create first round games
        INSERT INTO games (tournament_id, home_team_id, away_team_id, total_innings, status) VALUES
          (tournament_uuid, team_uuids[1], team_uuids[2], 7, 'scheduled'), -- Game 1
          (tournament_uuid, team_uuids[3], team_uuids[4], 7, 'scheduled'), -- Game 2  
          (tournament_uuid, team_uuids[5], team_uuids[6], 7, 'scheduled'), -- Game 3
          (tournament_uuid, team_uuids[7], team_uuids[8], 7, 'scheduled'); -- Game 4
    END IF;
END $$;

-- Update tournament standings for all teams
DO $$
DECLARE
    tournament_uuid uuid;
BEGIN
    SELECT id INTO tournament_uuid FROM tournaments WHERE name LIKE 'Halloweekend%' LIMIT 1;
    
    -- Only create standings if they don't exist
    IF NOT EXISTS (SELECT 1 FROM tournament_standings WHERE tournament_id = tournament_uuid) THEN
        INSERT INTO tournament_standings (tournament_id, team_id, wins, losses, runs_scored, runs_allowed)
        SELECT 
          tournament_uuid,
          teams.id as team_id,
          0 as wins,
          0 as losses, 
          0 as runs_scored,
          0 as runs_allowed
        FROM teams;
    END IF;
END $$;

-- Create game snapshots for each game
DO $$
DECLARE
    game_record RECORD;
    home_players uuid[];
    away_players uuid[];
BEGIN
    -- Loop through each game and create a snapshot
    FOR game_record IN 
        SELECT g.id as game_id, g.home_team_id, g.away_team_id, g.status
        FROM games g
        JOIN tournaments t ON g.tournament_id = t.id
        WHERE t.name LIKE 'Halloweekend%'
    LOOP
        -- Get players for home team
        SELECT ARRAY(
            SELECT tm.player_id 
            FROM team_memberships tm 
            WHERE tm.team_id = game_record.home_team_id 
            LIMIT 3
        ) INTO home_players;
        
        -- Get players for away team  
        SELECT ARRAY(
            SELECT tm.player_id 
            FROM team_memberships tm 
            WHERE tm.team_id = game_record.away_team_id 
            LIMIT 3
        ) INTO away_players;
        
        -- Create game snapshot
        INSERT INTO game_snapshots (
            game_id,
            current_inning,
            is_top_of_inning,
            outs,
            balls,
            strikes,
            score_home,
            score_away,
            home_team_id,
            away_team_id,
            batter_id,
            catcher_id,
            base_runners,
            home_lineup,
            away_lineup,
            home_lineup_position,
            away_lineup_position,
            status,
            last_updated
        ) VALUES (
            game_record.game_id,
            1, -- current_inning
            true, -- is_top_of_inning (away team batting)
            0, -- outs
            0, -- balls
            0, -- strikes
            0, -- score_home
            0, -- score_away
            game_record.home_team_id,
            game_record.away_team_id,
            away_players[1], -- first away player batting
            home_players[1], -- first home player catching
            '{"first": null, "second": null, "third": null}', -- no runners on base
            home_players, -- home lineup
            away_players, -- away lineup
            0, -- home_lineup_position
            0, -- away_lineup_position
            'not_started', -- status
            now() -- last_updated
        );
    END LOOP;
END $$;

-- Create a sample in-progress game with some events
DO $$
DECLARE
    sample_game_id uuid;
    sample_event_id uuid;
    home_team_id uuid;
    away_team_id uuid;
    batter_id uuid;
    catcher_id uuid;
BEGIN
    -- Get the first game
    SELECT g.id, g.home_team_id, g.away_team_id 
    INTO sample_game_id, home_team_id, away_team_id
    FROM games g
    JOIN tournaments t ON g.tournament_id = t.id
    WHERE t.name LIKE 'Halloweekend%'
    LIMIT 1;
    
    -- Get batter and catcher
    SELECT gs.batter_id, gs.catcher_id 
    INTO batter_id, catcher_id
    FROM game_snapshots gs 
    WHERE gs.game_id = sample_game_id;
    
    -- Update this game to be in progress
    UPDATE games 
    SET status = 'active', 
        started_at = now() - interval '15 minutes',
        home_score = 2,
        away_score = 1
    WHERE id = sample_game_id;
    
    -- Update the game snapshot to show in-progress state
    UPDATE game_snapshots 
    SET 
        status = 'in_progress',
        score_home = 2,
        score_away = 1,
        current_inning = 3,
        is_top_of_inning = false, -- bottom of 3rd
        outs = 1,
        balls = 2,
        strikes = 1,
        base_runners = '{"first": null, "second": null, "third": null}',
        last_updated = now()
    WHERE game_id = sample_game_id;
    
    -- Add some sample events
    INSERT INTO game_events (game_id, event_type, type, payload, umpire_id) VALUES
    (sample_game_id, 'game_end', 'game_start', '{"message": "Game started"}'::jsonb, batter_id),
    (sample_game_id, 'base_running', 'at_bat', ('{"result": "single", "batter_id": "' || batter_id || '", "runs_scored": 1}')::jsonb, batter_id),
    (sample_game_id, 'base_running', 'at_bat', ('{"result": "out", "batter_id": "' || catcher_id || '", "runs_scored": 0}')::jsonb, batter_id);
    
END $$; 