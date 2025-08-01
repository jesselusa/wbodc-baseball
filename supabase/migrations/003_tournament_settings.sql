-- Add tournament settings columns to tournaments table
ALTER TABLE tournaments ADD COLUMN pool_play_games INTEGER DEFAULT 2;
ALTER TABLE tournaments ADD COLUMN pool_play_innings INTEGER DEFAULT 3;
ALTER TABLE tournaments ADD COLUMN bracket_type VARCHAR(50) DEFAULT 'single_elimination';
ALTER TABLE tournaments ADD COLUMN bracket_innings INTEGER DEFAULT 3;
ALTER TABLE tournaments ADD COLUMN final_innings INTEGER DEFAULT 5;
ALTER TABLE tournaments ADD COLUMN num_teams INTEGER DEFAULT 4;

-- Add constraints for valid values
ALTER TABLE tournaments ADD CONSTRAINT tournaments_pool_play_games_check CHECK (pool_play_games >= 1 AND pool_play_games <= 10);
ALTER TABLE tournaments ADD CONSTRAINT tournaments_pool_play_innings_check CHECK (pool_play_innings IN (3, 5, 7, 9));
ALTER TABLE tournaments ADD CONSTRAINT tournaments_bracket_type_check CHECK (bracket_type IN ('single_elimination', 'double_elimination'));
ALTER TABLE tournaments ADD CONSTRAINT tournaments_bracket_innings_check CHECK (bracket_innings IN (3, 5, 7, 9));
ALTER TABLE tournaments ADD CONSTRAINT tournaments_final_innings_check CHECK (final_innings IN (3, 5, 7, 9));
ALTER TABLE tournaments ADD CONSTRAINT tournaments_num_teams_check CHECK (num_teams >= 2 AND num_teams <= 20);
ALTER TABLE tournaments ADD CONSTRAINT tournaments_bracket_final_innings_check CHECK (final_innings >= bracket_innings); 