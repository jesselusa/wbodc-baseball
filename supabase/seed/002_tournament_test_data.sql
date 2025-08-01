-- Insert test tournament data
INSERT INTO tournaments (
  tournament_name, 
  year, 
  location, 
  tournament_number, 
  locked_status,
  pool_play_games,
  pool_play_innings,
  bracket_type,
  bracket_innings,
  final_innings,
  num_teams
) VALUES
('WBDoc Baseball Championship 2024', 2024, 'San Francisco, CA', 1, false, 2, 3, 'single_elimination', 3, 5, 4);

-- Note: When the tournament is locked via the admin interface, 
-- the tournament_teams and tournament_player_assignments tables 
-- will be populated automatically by the lockTournament API function. 