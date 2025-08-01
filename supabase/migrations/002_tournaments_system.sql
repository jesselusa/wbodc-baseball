-- Create tournaments table for tracking tournament instances
CREATE TABLE tournaments (
  id BIGSERIAL PRIMARY KEY,
  tournament_name VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  location VARCHAR(255),
  winner VARCHAR(255),
  tournament_number INTEGER NOT NULL,
  locked_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tournament_teams table for team configurations within tournaments
CREATE TABLE tournament_teams (
  id BIGSERIAL PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, team_name)
);

-- Create tournament_player_assignments table to track which players are on which teams in tournaments
CREATE TABLE tournament_player_assignments (
  id BIGSERIAL PRIMARY KEY,
  tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES tournament_teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id) -- Each player can only be on one team per tournament
);

-- Create indexes for better query performance
CREATE INDEX idx_tournaments_year ON tournaments(year);
CREATE INDEX idx_tournaments_number ON tournaments(tournament_number);
CREATE INDEX idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_player_assignments_tournament_id ON tournament_player_assignments(tournament_id);
CREATE INDEX idx_tournament_player_assignments_player_id ON tournament_player_assignments(player_id);
CREATE INDEX idx_tournament_player_assignments_team_id ON tournament_player_assignments(team_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tournaments table
CREATE TRIGGER update_tournaments_updated_at 
  BEFORE UPDATE ON tournaments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) on new tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_player_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Enable read access for all users" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tournament_teams FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tournament_player_assignments FOR SELECT USING (true);

-- Create RLS policies for admin write access (you may want to restrict these further)
CREATE POLICY "Enable insert for all users" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON tournaments FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON tournament_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournament_teams FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON tournament_teams FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON tournament_player_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tournament_player_assignments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON tournament_player_assignments FOR DELETE USING (true); 