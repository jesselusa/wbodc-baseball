-- WBDoc Baseball Initial Schema Migration
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: This migration includes fixes for common deployment issues:
-- 1. RLS Policies: Uses public read access (true) instead of authenticated-only
--    to allow anonymous frontend access with Supabase anon key
-- 2. All tables have public SELECT policies to support viewer functionality
-- 3. Write operations will be handled in subsequent migrations with proper auth

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Entities
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  nickname text,
  avatar_url text,
  email text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE tournaments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  start_date date,
  end_date date,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  color text, -- hex color for UI
  created_at timestamp DEFAULT now()
);

CREATE TABLE team_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE(team_id, player_id, tournament_id)
);

-- Game Management
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  home_team_id uuid REFERENCES teams(id),
  away_team_id uuid REFERENCES teams(id),
  home_score integer DEFAULT 0,
  away_score integer DEFAULT 0,
  current_inning integer DEFAULT 1,
  is_top_inning boolean DEFAULT true, -- true = top (away batting), false = bottom (home batting)
  total_innings integer DEFAULT 7 CHECK (total_innings IN (3, 5, 7, 9)),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'postponed')),
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE game_states (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE UNIQUE,
  batting_team_id uuid REFERENCES teams(id),
  fielding_team_id uuid REFERENCES teams(id),
  current_batter_id uuid REFERENCES players(id),
  current_catcher_id uuid REFERENCES players(id),
  outs integer DEFAULT 0 CHECK (outs >= 0 AND outs <= 3),
  balls integer DEFAULT 0 CHECK (balls >= 0 AND balls <= 4),
  strikes integer DEFAULT 0 CHECK (strikes >= 0 AND strikes <= 3),
  runner_on_first uuid REFERENCES players(id),
  runner_on_second uuid REFERENCES players(id),
  runner_on_third uuid REFERENCES players(id),
  updated_at timestamp DEFAULT now()
);

-- Play-by-Play Events
CREATE TABLE at_bats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  inning integer NOT NULL,
  is_top_inning boolean NOT NULL,
  batter_id uuid REFERENCES players(id),
  catcher_id uuid REFERENCES players(id),
  batting_team_id uuid REFERENCES teams(id),
  fielding_team_id uuid REFERENCES teams(id),
  result text CHECK (result IN ('hit', 'out', 'walk', 'strikeout')),
  hit_type text CHECK (hit_type IN ('single', 'double', 'triple', 'home_run')),
  runs_scored integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE game_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  at_bat_id uuid REFERENCES at_bats(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('shot', 'flip_cup', 'base_running', 'inning_change', 'game_end')),
  event_data jsonb,
  sequence_number integer NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE shots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  at_bat_id uuid REFERENCES at_bats(id) ON DELETE CASCADE,
  shot_number integer NOT NULL,
  result text NOT NULL CHECK (result IN ('miss', 'rim_caught', 'rim_missed', 'cup_hit')),
  cup_hit integer CHECK (cup_hit IN (1, 2, 3, 4)), -- 1=single, 2=double, 3=triple, 4=home_run
  catcher_id uuid REFERENCES players(id), -- who caught the ricochet (if any)
  created_at timestamp DEFAULT now()
);

CREATE TABLE flip_cup_rounds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  shot_id uuid REFERENCES shots(id) ON DELETE CASCADE,
  batting_team_id uuid REFERENCES teams(id),
  fielding_team_id uuid REFERENCES teams(id),
  winning_team_id uuid REFERENCES teams(id),
  duration_seconds integer,
  created_at timestamp DEFAULT now()
);

-- Statistics & Aggregations
CREATE TABLE player_game_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id),
  at_bats integer DEFAULT 0,
  hits integer DEFAULT 0,
  runs integer DEFAULT 0,
  singles integer DEFAULT 0,
  doubles integer DEFAULT 0,
  triples integer DEFAULT 0,
  home_runs integer DEFAULT 0,
  walks integer DEFAULT 0,
  strikeouts integer DEFAULT 0,
  flip_cup_wins integer DEFAULT 0,
  flip_cup_losses integer DEFAULT 0,
  catches_as_catcher integer DEFAULT 0,
  UNIQUE(game_id, player_id)
);

CREATE TABLE tournament_standings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  runs_scored integer DEFAULT 0,
  runs_allowed integer DEFAULT 0,
  updated_at timestamp DEFAULT now(),
  UNIQUE(tournament_id, team_id)
);

-- Indexes for Performance
CREATE INDEX idx_games_tournament_id ON games(tournament_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_game_states_game_id ON game_states(game_id);
CREATE INDEX idx_at_bats_game_id ON at_bats(game_id);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_shots_at_bat_id ON shots(at_bat_id);
CREATE INDEX idx_player_game_stats_game_id ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player_id ON player_game_stats(player_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE at_bats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE flip_cup_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (anonymous users can view data)
-- This allows the frontend to work with the anonymous Supabase key
-- In production, you may want to restrict some of these policies

-- Core entities - public read access for viewers
CREATE POLICY "Allow public read access" ON players 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON tournaments 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON teams 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON team_memberships 
  FOR SELECT USING (true);

-- Game data - public read access for viewers  
CREATE POLICY "Allow public read access" ON games 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON game_states 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON at_bats 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON game_events 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON shots 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON flip_cup_rounds 
  FOR SELECT USING (true);

-- Stats - public read access for leaderboards
CREATE POLICY "Allow public read access" ON player_game_stats 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON tournament_standings 
  FOR SELECT USING (true);

-- Enable real-time subscriptions on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE shots;
ALTER PUBLICATION supabase_realtime ADD TABLE flip_cup_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE player_game_stats; 