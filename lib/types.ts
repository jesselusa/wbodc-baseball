// Core entity types for WBDoc Baseball

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  logo_url?: string;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type GameType = 'tournament' | 'free_play';

export interface Game {
  id: string;
  tournament_id?: string;
  tournament?: Tournament;
  home_team_id: string;
  home_team: Team;
  away_team_id: string;
  away_team: Team;
  status: GameStatus;
  game_type: GameType;
  innings: number; // 3, 5, 7, or 9
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
}

export interface GameState {
  id: string;
  game_id: string;
  current_inning: number;
  top_of_inning: boolean; // true = top, false = bottom
  outs: number;
  current_batter_id?: string;
  runner_on_first?: string; // player_id
  runner_on_second?: string; // player_id
  runner_on_third?: string; // player_id
  balls: number;
  strikes: number;
  updated_at: string;
}

// Types for game events and statistics
export interface AtBat {
  id: string;
  game_id: string;
  inning: number;
  top_of_inning: boolean;
  batter_id: string;
  batter: Player;
  sequence_number: number;
  result: 'single' | 'double' | 'triple' | 'home_run' | 'out' | 'walk';
  runs_scored: number;
  created_at: string;
}

export interface Shot {
  id: string;
  at_bat_id: string;
  cup_type: 'single' | 'double' | 'triple' | 'home_run';
  made: boolean;
  shooter_id: string;
  created_at: string;
}

export interface FlipCupRound {
  id: string;
  at_bat_id: string;
  home_team_winner: boolean;
  created_at: string;
}

// UI-specific types
export interface GameDisplayData extends Game {
  current_inning?: number;
  current_inning_half?: 'top' | 'bottom';
  outs?: number;
  time_status?: string; // "Live", "Final", "7:30 PM", etc.
  is_live?: boolean;
}

export interface PlayerGameStats {
  player_id: string;
  player: Player;
  game_id: string;
  at_bats: number;
  hits: number;
  runs: number;
  batting_average: number;
  flip_cup_wins: number;
  flip_cup_attempts: number;
  flip_cup_percentage: number;
}

export interface TournamentStanding {
  tournament_id: string;
  team_id: string;
  team: Team;
  wins: number;
  losses: number;
  win_percentage: number;
  runs_scored: number;
  runs_allowed: number;
  games_played: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Filter and query types
export interface GameFilters {
  status?: GameStatus[];
  game_type?: GameType[];
  tournament_id?: string;
  team_id?: string;
  limit?: number;
  offset?: number;
}

export interface TournamentFilters {
  status?: Tournament['status'][];
  limit?: number;
  offset?: number;
} 