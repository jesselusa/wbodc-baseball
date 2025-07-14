-- Tournament Admin Schema Migration
-- Enhances existing tables and adds new tables for tournament administration

-- Enhance players table with tournament admin fields
ALTER TABLE players 
ADD COLUMN hometown text,
ADD COLUMN state text,
ADD COLUMN current_town text,
ADD COLUMN current_state text,
ADD COLUMN championships_won integer DEFAULT 0 CHECK (championships_won >= 0);

-- Create tournament configurations table
CREATE TABLE tournament_configurations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE UNIQUE,
  pool_play_games integer NOT NULL CHECK (pool_play_games > 0),
  pool_play_innings integer NOT NULL CHECK (pool_play_innings >= 3),
  bracket_type text NOT NULL CHECK (bracket_type IN ('single_elimination', 'double_elimination')),
  bracket_innings integer NOT NULL CHECK (bracket_innings >= 3),
  final_innings integer NOT NULL CHECK (final_innings >= 3),
  team_size integer NOT NULL CHECK (team_size > 0),
  is_active boolean DEFAULT false,
  settings_locked boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create team assignments table for tournament admin
CREATE TABLE team_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  player_ids uuid[] DEFAULT '{}',
  is_locked boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(tournament_id, team_id),
  UNIQUE(tournament_id, team_name)
);

-- Add indexes for performance
CREATE INDEX idx_tournament_configurations_tournament_id ON tournament_configurations(tournament_id);
CREATE INDEX idx_team_assignments_tournament_id ON team_assignments(tournament_id);
CREATE INDEX idx_team_assignments_team_id ON team_assignments(team_id);

-- Enable Row Level Security
ALTER TABLE tournament_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (matching existing pattern)
CREATE POLICY "Allow public read access" ON tournament_configurations 
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON team_assignments 
  FOR SELECT USING (true);

-- Add write policies for tournament admin operations
-- These allow public write access for now (no auth requirement per PRD)
CREATE POLICY "Allow public write access" ON tournament_configurations 
  FOR ALL USING (true);

CREATE POLICY "Allow public write access" ON team_assignments 
  FOR ALL USING (true);

-- Allow updates to enhanced player fields
CREATE POLICY "Allow public write access" ON players 
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert access" ON players 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON players 
  FOR DELETE USING (true);

-- Enable real-time subscriptions for tournament admin
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_configurations;
ALTER PUBLICATION supabase_realtime ADD TABLE team_assignments; 