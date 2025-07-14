-- WBDoc Baseball Seed Data
-- Run this after the initial schema migration

-- Sample Players
INSERT INTO players (name, nickname, email, current_town, hometown, championships_won, profile_picture) VALUES
  ('Jesse Lusa', 'JLus', 'jesse@example.com', 'San Francisco, CA', 'Oakland, CA', 3, 'https://i.pravatar.cc/300?u=jesse'),
  ('Alex Johnson', 'AJ', 'alex@example.com', 'New York, NY', 'Boston, MA', 2, 'https://i.pravatar.cc/300?u=alex'),
  ('Sam Wilson', 'Sammy', 'sam@example.com', 'Los Angeles, CA', 'San Diego, CA', 1, 'https://i.pravatar.cc/300?u=sam'),
  ('Taylor Brown', 'TB', 'taylor@example.com', 'Chicago, IL', 'Milwaukee, WI', 1, 'https://i.pravatar.cc/300?u=taylor'),
  ('Jordan Lee', 'JLee', 'jordan@example.com', 'Austin, TX', 'Houston, TX', 0, 'https://i.pravatar.cc/300?u=jordan'),
  ('Casey Davis', 'CD', 'casey@example.com', 'Seattle, WA', 'Portland, OR', 2, 'https://i.pravatar.cc/300?u=casey'),
  ('Riley Martinez', 'Riles', 'riley@example.com', 'Miami, FL', 'Tampa, FL', 1, 'https://i.pravatar.cc/300?u=riley'),
  ('Morgan Clark', 'MC', 'morgan@example.com', 'Denver, CO', 'Colorado Springs, CO', 0, 'https://i.pravatar.cc/300?u=morgan'),
  ('Avery Garcia', 'Ave', 'avery@example.com', 'Phoenix, AZ', 'Tucson, AZ', 1, 'https://i.pravatar.cc/300?u=avery'),
  ('Parker Smith', 'Parks', 'parker@example.com', 'Nashville, TN', 'Memphis, TN', 0, 'https://i.pravatar.cc/300?u=parker'),
  ('Quinn Rodriguez', 'Q', 'quinn@example.com', 'Atlanta, GA', 'Savannah, GA', 2, 'https://i.pravatar.cc/300?u=quinn'),
  ('Drew Thompson', 'DT', 'drew@example.com', 'Detroit, MI', 'Grand Rapids, MI', 1, 'https://i.pravatar.cc/300?u=drew'),
  ('Sage Anderson', 'Sage', 'sage@example.com', 'Portland, OR', 'Eugene, OR', 0, 'https://i.pravatar.cc/300?u=sage'),
  ('River Jackson', 'River', 'river@example.com', 'Minneapolis, MN', 'Duluth, MN', 1, 'https://i.pravatar.cc/300?u=river'),
  ('Phoenix White', 'Nix', 'phoenix@example.com', 'Las Vegas, NV', 'Reno, NV', 3, 'https://i.pravatar.cc/300?u=phoenix'),
  ('Rowan Harris', 'Row', 'rowan@example.com', 'Salt Lake City, UT', 'Provo, UT', 0, 'https://i.pravatar.cc/300?u=rowan'),
  ('Sky Miller', 'Sky', 'sky@example.com', 'San Antonio, TX', 'Austin, TX', 1, 'https://i.pravatar.cc/300?u=sky'),
  ('Dakota Wilson', 'Kota', 'dakota@example.com', 'Charlotte, NC', 'Raleigh, NC', 0, 'https://i.pravatar.cc/300?u=dakota'),
  ('Cameron Moore', 'Cam', 'cameron@example.com', 'Pittsburgh, PA', 'Philadelphia, PA', 2, 'https://i.pravatar.cc/300?u=cameron'),
  ('Emery Taylor', 'Em', 'emery@example.com', 'Kansas City, MO', 'St. Louis, MO', 1, 'https://i.pravatar.cc/300?u=emery');

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
    INSERT INTO game_events (game_id, type, payload, umpire_id) VALUES
    (sample_game_id, 'game_start', '{"message": "Game started"}', batter_id),
    (sample_game_id, 'at_bat', '{"result": "single", "batter_id": "' || batter_id || '", "runs_scored": 1}', batter_id),
    (sample_game_id, 'at_bat', '{"result": "out", "batter_id": "' || catcher_id || '", "runs_scored": 0}', batter_id);
    
END $$; 