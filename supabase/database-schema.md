# WBDoc Baseball Database Schema

## Core Entities

### Players
```sql
players (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  nickname: text,
  avatar_url: text,
  email: text,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

### Teams
```sql
teams (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  color: text, -- hex color for UI
  created_at: timestamp DEFAULT now()
)
```

### Team Memberships
```sql
team_memberships (
  id: uuid PRIMARY KEY,
  team_id: uuid REFERENCES teams(id),
  player_id: uuid REFERENCES players(id),
  tournament_id: uuid REFERENCES tournaments(id),
  UNIQUE(team_id, player_id, tournament_id)
)
```

### Tournaments
```sql
tournaments (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  description: text,
  start_date: date,
  end_date: date,
  status: text DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed'
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

## Game Management

### Games
```sql
games (
  id: uuid PRIMARY KEY,
  tournament_id: uuid REFERENCES tournaments(id),
  home_team_id: uuid REFERENCES teams(id),
  away_team_id: uuid REFERENCES teams(id),
  home_score: integer DEFAULT 0,
  away_score: integer DEFAULT 0,
  current_inning: integer DEFAULT 1,
  is_top_inning: boolean DEFAULT true, -- true = top (away batting), false = bottom (home batting)
  total_innings: integer DEFAULT 7, -- 3, 5, 7, or 9
  status: text DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'postponed'
  started_at: timestamp,
  completed_at: timestamp,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

### Game State (Real-time)
```sql
game_states (
  id: uuid PRIMARY KEY,
  game_id: uuid REFERENCES games(id) UNIQUE,
  batting_team_id: uuid REFERENCES teams(id),
  fielding_team_id: uuid REFERENCES teams(id),
  current_batter_id: uuid REFERENCES players(id),
  current_catcher_id: uuid REFERENCES players(id),
  outs: integer DEFAULT 0,
  balls: integer DEFAULT 0,
  strikes: integer DEFAULT 0,
  runner_on_first: uuid REFERENCES players(id),
  runner_on_second: uuid REFERENCES players(id),
  runner_on_third: uuid REFERENCES players(id),
  updated_at: timestamp DEFAULT now()
)
```

## Play-by-Play Events

### At-Bats
```sql
at_bats (
  id: uuid PRIMARY KEY,
  game_id: uuid REFERENCES games(id),
  inning: integer NOT NULL,
  is_top_inning: boolean NOT NULL,
  batter_id: uuid REFERENCES players(id),
  catcher_id: uuid REFERENCES players(id),
  batting_team_id: uuid REFERENCES teams(id),
  fielding_team_id: uuid REFERENCES teams(id),
  result: text, -- 'hit', 'out', 'walk', 'strikeout'
  hit_type: text, -- 'single', 'double', 'triple', 'home_run' (if result = 'hit')
  runs_scored: integer DEFAULT 0,
  created_at: timestamp DEFAULT now()
)
```

### Game Events
```sql
game_events (
  id: uuid PRIMARY KEY,
  game_id: uuid REFERENCES games(id),
  at_bat_id: uuid REFERENCES at_bats(id),
  event_type: text NOT NULL, -- 'shot', 'flip_cup', 'base_running', 'inning_change', 'game_end'
  event_data: jsonb, -- flexible data for different event types
  sequence_number: integer NOT NULL, -- order of events within at-bat
  created_at: timestamp DEFAULT now()
)
```

### Shots (Individual Throws)
```sql
shots (
  id: uuid PRIMARY KEY,
  at_bat_id: uuid REFERENCES at_bats(id),
  shot_number: integer NOT NULL, -- 1st shot, 2nd shot, etc. in the at-bat
  result: text NOT NULL, -- 'miss', 'rim_caught', 'rim_missed', 'cup_hit'
  cup_hit: integer, -- 1, 2, 3, 4 (single, double, triple, home run)
  catcher_id: uuid REFERENCES players(id), -- who caught the ricochet (if any)
  created_at: timestamp DEFAULT now()
)
```

### Flip Cup Rounds
```sql
flip_cup_rounds (
  id: uuid PRIMARY KEY,
  shot_id: uuid REFERENCES shots(id),
  batting_team_id: uuid REFERENCES teams(id),
  fielding_team_id: uuid REFERENCES teams(id),
  winning_team_id: uuid REFERENCES teams(id),
  duration_seconds: integer, -- how long the flip cup round took
  created_at: timestamp DEFAULT now()
)
```

## Statistics & Aggregations

### Player Game Stats
```sql
player_game_stats (
  id: uuid PRIMARY KEY,
  game_id: uuid REFERENCES games(id),
  player_id: uuid REFERENCES players(id),
  team_id: uuid REFERENCES teams(id),
  at_bats: integer DEFAULT 0,
  hits: integer DEFAULT 0,
  runs: integer DEFAULT 0,
  singles: integer DEFAULT 0,
  doubles: integer DEFAULT 0,
  triples: integer DEFAULT 0,
  home_runs: integer DEFAULT 0,
  walks: integer DEFAULT 0,
  strikeouts: integer DEFAULT 0,
  flip_cup_wins: integer DEFAULT 0,
  flip_cup_losses: integer DEFAULT 0,
  catches_as_catcher: integer DEFAULT 0,
  UNIQUE(game_id, player_id)
)
```

### Tournament Standings
```sql
tournament_standings (
  id: uuid PRIMARY KEY,
  tournament_id: uuid REFERENCES tournaments(id),
  team_id: uuid REFERENCES teams(id),
  wins: integer DEFAULT 0,
  losses: integer DEFAULT 0,
  runs_scored: integer DEFAULT 0,
  runs_allowed: integer DEFAULT 0,
  updated_at: timestamp DEFAULT now(),
  UNIQUE(tournament_id, team_id)
)
```

## Real-time Subscriptions

### For Supabase Real-time
```sql
-- Enable real-time on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE shots;
ALTER PUBLICATION supabase_realtime ADD TABLE flip_cup_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE player_game_stats;
```

## Key Relationships & Constraints

### Foreign Key Relationships
- Games belong to tournaments
- Teams are formed for specific tournaments
- Game state tracks current live game status
- At-bats contain multiple shots
- Shots can trigger flip cup rounds
- Events track the chronological sequence of everything

### Indexes for Performance
```sql
-- Game lookup
CREATE INDEX idx_games_tournament_id ON games(tournament_id);
CREATE INDEX idx_games_status ON games(status);

-- Real-time game state
CREATE INDEX idx_game_states_game_id ON game_states(game_id);

-- Play-by-play queries
CREATE INDEX idx_at_bats_game_id ON at_bats(game_id);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_shots_at_bat_id ON shots(at_bat_id);

-- Statistics
CREATE INDEX idx_player_game_stats_game_id ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player_id ON player_game_stats(player_id);
```

## Schema Design Principles

1. **Real-time First**: All critical game state changes are tracked in separate tables that can be easily subscribed to
2. **Event Sourcing**: Every action (shot, flip cup, base running) is recorded as discrete events
3. **Flexible Event Data**: Using JSONB for event_data allows for complex, evolving event types
4. **Statistics Aggregation**: Pre-computed stats tables for fast queries and leaderboards
5. **Audit Trail**: Complete chronological history of every game action
6. **Mobile-Optimized**: Minimal queries needed to get current game state for mobile UI

This schema supports all the complex WBDoc Baseball mechanics while enabling real-time updates and rich statistical analysis! 