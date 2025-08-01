-- Historical Games Seed Data
-- This creates sample historical tournament games for 2024 and 2023

-- Insert historical tournaments (one per year)
INSERT INTO tournaments (id, name, description, start_date, end_date, status, created_at, updated_at) VALUES
  ('2024-tournament', 'WBDoc Baseball Championship 2024', 'Annual WBDoc Baseball Tournament - Summer 2024', '2024-07-15', '2024-07-16', 'completed', '2024-01-01T00:00:00Z', '2024-07-16T20:00:00Z'),
  ('2023-tournament', 'WBDoc Baseball Championship 2023', 'Annual WBDoc Baseball Tournament - Summer 2023', '2023-07-20', '2023-07-21', 'completed', '2023-01-01T00:00:00Z', '2023-07-21T19:30:00Z');

-- Insert historical teams for 2024
INSERT INTO teams (id, name, created_at, updated_at) VALUES
  ('2024-team-1', 'Thunder Hawks', '2024-07-01T00:00:00Z', '2024-07-01T00:00:00Z'),
  ('2024-team-2', 'Lightning Bolts', '2024-07-01T00:00:00Z', '2024-07-01T00:00:00Z'),
  ('2024-team-3', 'Storm Riders', '2024-07-01T00:00:00Z', '2024-07-01T00:00:00Z'),
  ('2024-team-4', 'Fire Eagles', '2024-07-01T00:00:00Z', '2024-07-01T00:00:00Z'),
  ('2024-team-5', 'Ice Dragons', '2024-07-01T00:00:00Z', '2024-07-01T00:00:00Z'),
  ('2024-team-6', 'Wind Wolves', '2024-07-01T00:00:00Z', '2024-07-01T00:00:00Z');

-- Insert historical teams for 2023
INSERT INTO teams (id, name, created_at, updated_at) VALUES
  ('2023-team-1', 'Crimson Crushers', '2023-07-01T00:00:00Z', '2023-07-01T00:00:00Z'),
  ('2023-team-2', 'Golden Griffins', '2023-07-01T00:00:00Z', '2023-07-01T00:00:00Z'),
  ('2023-team-3', 'Silver Spartans', '2023-07-01T00:00:00Z', '2023-07-01T00:00:00Z'),
  ('2023-team-4', 'Blue Bombers', '2023-07-01T00:00:00Z', '2023-07-01T00:00:00Z'),
  ('2023-team-5', 'Green Giants', '2023-07-01T00:00:00Z', '2023-07-01T00:00:00Z'),
  ('2023-team-6', 'Purple Panthers', '2023-07-01T00:00:00Z', '2023-07-01T00:00:00Z');

-- Insert historical games for 2024 tournament
INSERT INTO games (id, tournament_id, home_team_id, away_team_id, status, game_type, innings, scheduled_start, actual_start, actual_end, home_score, away_score, created_at, updated_at) VALUES
  -- Pool Play Round 1
  ('2024-game-1', '2024-tournament', '2024-team-1', '2024-team-2', 'completed', 'tournament', 5, '2024-07-15T10:00:00Z', '2024-07-15T10:05:00Z', '2024-07-15T11:15:00Z', 8, 5, '2024-07-15T09:00:00Z', '2024-07-15T11:15:00Z'),
  ('2024-game-2', '2024-tournament', '2024-team-3', '2024-team-4', 'completed', 'tournament', 5, '2024-07-15T11:30:00Z', '2024-07-15T11:35:00Z', '2024-07-15T12:45:00Z', 6, 9, '2024-07-15T09:00:00Z', '2024-07-15T12:45:00Z'),
  ('2024-game-3', '2024-tournament', '2024-team-5', '2024-team-6', 'completed', 'tournament', 5, '2024-07-15T13:00:00Z', '2024-07-15T13:10:00Z', '2024-07-15T14:20:00Z', 7, 4, '2024-07-15T09:00:00Z', '2024-07-15T14:20:00Z'),
  
  -- Pool Play Round 2
  ('2024-game-4', '2024-tournament', '2024-team-1', '2024-team-3', 'completed', 'tournament', 5, '2024-07-15T14:45:00Z', '2024-07-15T14:50:00Z', '2024-07-15T16:00:00Z', 5, 7, '2024-07-15T09:00:00Z', '2024-07-15T16:00:00Z'),
  ('2024-game-5', '2024-tournament', '2024-team-2', '2024-team-4', 'completed', 'tournament', 5, '2024-07-15T16:15:00Z', '2024-07-15T16:20:00Z', '2024-07-15T17:30:00Z', 9, 6, '2024-07-15T09:00:00Z', '2024-07-15T17:30:00Z'),
  ('2024-game-6', '2024-tournament', '2024-team-5', '2024-team-1', 'completed', 'tournament', 5, '2024-07-15T17:45:00Z', '2024-07-15T17:50:00Z', '2024-07-15T19:00:00Z', 4, 8, '2024-07-15T09:00:00Z', '2024-07-15T19:00:00Z'),
  
  -- Semifinals
  ('2024-game-7', '2024-tournament', '2024-team-4', '2024-team-1', 'completed', 'tournament', 7, '2024-07-16T10:00:00Z', '2024-07-16T10:10:00Z', '2024-07-16T11:45:00Z', 8, 12, '2024-07-15T09:00:00Z', '2024-07-16T11:45:00Z'),
  ('2024-game-8', '2024-tournament', '2024-team-5', '2024-team-3', 'completed', 'tournament', 7, '2024-07-16T12:00:00Z', '2024-07-16T12:15:00Z', '2024-07-16T13:50:00Z', 9, 7, '2024-07-15T09:00:00Z', '2024-07-16T13:50:00Z'),
  
  -- Championship Final
  ('2024-game-9', '2024-tournament', '2024-team-1', '2024-team-5', 'completed', 'tournament', 9, '2024-07-16T15:00:00Z', '2024-07-16T15:15:00Z', '2024-07-16T17:30:00Z', 14, 11, '2024-07-15T09:00:00Z', '2024-07-16T17:30:00Z');

-- Insert historical games for 2023 tournament
INSERT INTO games (id, tournament_id, home_team_id, away_team_id, status, game_type, innings, scheduled_start, actual_start, actual_end, home_score, away_score, created_at, updated_at) VALUES
  -- Pool Play Round 1
  ('2023-game-1', '2023-tournament', '2023-team-1', '2023-team-2', 'completed', 'tournament', 5, '2023-07-20T10:00:00Z', '2023-07-20T10:08:00Z', '2023-07-20T11:20:00Z', 6, 8, '2023-07-20T09:00:00Z', '2023-07-20T11:20:00Z'),
  ('2023-game-2', '2023-tournament', '2023-team-3', '2023-team-4', 'completed', 'tournament', 5, '2023-07-20T11:30:00Z', '2023-07-20T11:40:00Z', '2023-07-20T12:50:00Z', 9, 4, '2023-07-20T09:00:00Z', '2023-07-20T12:50:00Z'),
  ('2023-game-3', '2023-tournament', '2023-team-5', '2023-team-6', 'completed', 'tournament', 5, '2023-07-20T13:00:00Z', '2023-07-20T13:12:00Z', '2023-07-20T14:25:00Z', 5, 7, '2023-07-20T09:00:00Z', '2023-07-20T14:25:00Z'),
  
  -- Pool Play Round 2
  ('2023-game-4', '2023-tournament', '2023-team-1', '2023-team-3', 'completed', 'tournament', 5, '2023-07-20T14:45:00Z', '2023-07-20T14:55:00Z', '2023-07-20T16:10:00Z', 7, 5, '2023-07-20T09:00:00Z', '2023-07-20T16:10:00Z'),
  ('2023-game-5', '2023-tournament', '2023-team-2', '2023-team-4', 'completed', 'tournament', 5, '2023-07-20T16:30:00Z', '2023-07-20T16:35:00Z', '2023-07-20T17:45:00Z', 8, 6, '2023-07-20T09:00:00Z', '2023-07-20T17:45:00Z'),
  ('2023-game-6', '2023-tournament', '2023-team-6', '2023-team-1', 'completed', 'tournament', 5, '2023-07-20T18:00:00Z', '2023-07-20T18:10:00Z', '2023-07-20T19:20:00Z', 4, 9, '2023-07-20T09:00:00Z', '2023-07-20T19:20:00Z'),
  
  -- Semifinals
  ('2023-game-7', '2023-tournament', '2023-team-2', '2023-team-6', 'completed', 'tournament', 7, '2023-07-21T10:00:00Z', '2023-07-21T10:12:00Z', '2023-07-21T11:50:00Z', 11, 8, '2023-07-20T09:00:00Z', '2023-07-21T11:50:00Z'),
  ('2023-game-8', '2023-tournament', '2023-team-3', '2023-team-1', 'completed', 'tournament', 7, '2023-07-21T12:15:00Z', '2023-07-21T12:25:00Z', '2023-07-21T14:00:00Z', 6, 10, '2023-07-20T09:00:00Z', '2023-07-21T14:00:00Z'),
  
  -- Championship Final
  ('2023-game-9', '2023-tournament', '2023-team-2', '2023-team-1', 'completed', 'tournament', 9, '2023-07-21T15:00:00Z', '2023-07-21T15:20:00Z', '2023-07-21T17:45:00Z', 13, 16, '2023-07-20T09:00:00Z', '2023-07-21T17:45:00Z');

-- Insert some historical inning data for demonstrating the scoreboard functionality
-- We'll create inning_scores table for storing inning-by-inning scoring
CREATE TABLE IF NOT EXISTS inning_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  inning INTEGER NOT NULL,
  home_runs INTEGER NOT NULL DEFAULT 0,
  away_runs INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, inning)
);

-- Insert inning scoring data for 2024 championship final (2024-game-9)
INSERT INTO inning_scores (game_id, inning, home_runs, away_runs) VALUES
  ('2024-game-9', 1, 2, 1),
  ('2024-game-9', 2, 1, 3),
  ('2024-game-9', 3, 3, 0),
  ('2024-game-9', 4, 0, 2),
  ('2024-game-9', 5, 2, 1),
  ('2024-game-9', 6, 1, 0),
  ('2024-game-9', 7, 3, 2),
  ('2024-game-9', 8, 1, 1),
  ('2024-game-9', 9, 1, 1);

-- Insert inning scoring data for 2023 championship final (2023-game-9)
INSERT INTO inning_scores (game_id, inning, home_runs, away_runs) VALUES
  ('2023-game-9', 1, 1, 2),
  ('2023-game-9', 2, 0, 4),
  ('2023-game-9', 3, 2, 1),
  ('2023-game-9', 4, 3, 0),
  ('2023-game-9', 5, 1, 2),
  ('2023-game-9', 6, 2, 3),
  ('2023-game-9', 7, 0, 1),
  ('2023-game-9', 8, 2, 2),
  ('2023-game-9', 9, 2, 1);

-- Insert some inning data for 2024 semifinal game
INSERT INTO inning_scores (game_id, inning, home_runs, away_runs) VALUES
  ('2024-game-7', 1, 1, 2),
  ('2024-game-7', 2, 2, 1),
  ('2024-game-7', 3, 0, 3),
  ('2024-game-7', 4, 3, 1),
  ('2024-game-7', 5, 1, 2),
  ('2024-game-7', 6, 0, 2),
  ('2024-game-7', 7, 1, 1); 