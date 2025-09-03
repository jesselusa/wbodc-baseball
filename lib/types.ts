// Core entity types for WBDoc Baseball

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  avatar_url?: string;
  current_town?: string;
  hometown?: string;
  championships_won?: number;
  created_at: string;
  updated_at: string;
}

export interface PlayerFormData {
  name: string;
  nickname?: string;
  email?: string;
  avatar_url?: string;
  current_town?: string;
  hometown?: string;
  championships_won?: number;
}

export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

// Team management types for tournament admin
export interface TeamDragDrop {
  id: string;
  name: string;
  players: Player[];
  isLocked: boolean;
  color?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  logo_url?: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// Tournament system types for historical tracking (uses existing tournaments table)
export interface TournamentRecord {
  id: string;
  name: string; // tournament name
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string  
  location: string;
  winner?: string;
  tournament_number: number;
  status: 'upcoming' | 'in_progress' | 'completed'; // simplified status: upcoming=not started, active=in progress, completed=finished
  // Tournament settings
  pool_play_games: number;
  pool_play_innings: number;
  bracket_type: BracketType;
  bracket_innings: number;
  final_innings: number;
  num_teams: number;
  created_at: string;
  updated_at: string;
}

// Utility function to get year from tournament start_date
export function getTournamentYear(tournament: TournamentRecord): number {
  if (tournament.start_date) {
    return new Date(tournament.start_date).getFullYear();
  }
  return new Date().getFullYear(); // fallback to current year
}

export interface TournamentTeamRecord {
  id: string;
  tournament_id: string;
  team_name: string;
  created_at: string;
}

export interface TournamentPlayerAssignment {
  id: string;
  tournament_id: string;
  player_id: string;
  team_id: string;
  created_at: string;
}

// Extended types with relationships
export interface TournamentWithTeams extends TournamentRecord {
  teams: TournamentTeamWithPlayers[];
}

export interface TournamentTeamWithPlayers extends TournamentTeamRecord {
  players: Player[];
}

// Tournament Admin Types
export type BracketType = 'single_elimination' | 'double_elimination';

export interface TournamentConfig {
  id?: string;
  tournament_id: string;
  pool_play_games: number;
  pool_play_innings: number;
  bracket_type: BracketType;
  bracket_innings: number;
  final_innings: number;
  team_size: number;
  is_active: boolean;
  settings_locked: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeamAssignment {
  id?: string;
  tournament_id: string;
  team_id: string;
  team_name: string;
  player_ids: string[];
  is_locked: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TournamentTeam {
  id: string;
  name: string;
  players: Player[];
  is_locked: boolean;
}

export interface TournamentAdminData {
  tournament_id: string;
  config: TournamentConfig;
  players: Player[];
  teams: TournamentTeam[];
  team_assignments: TeamAssignment[];
  is_tournament_active: boolean;
  settings_locked: boolean;
}

export interface TeamFormData {
  id: string;
  name: string;
  player_ids: string[];
  is_locked: boolean;
}

export interface TournamentSettingsFormData {
  pool_play_games: number;
  pool_play_innings: number;
  bracket_type: BracketType;
  bracket_innings: number;
  final_innings: number;
  num_teams: number;
  team_size: number;
}

export interface BracketStanding {
  team_id: string;
  team_name: string;
  wins: number;
  losses: number;
  runs_scored: number;
  runs_allowed: number;
  run_differential: number;
  win_percentage: number;
  seed: number;
}

export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type GameType = 'round_robin' | 'bracket' | 'single_elimination' | 'tournament' | 'free_play';

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
  innings?: number; // 3, 5, 7, or 9
  total_innings?: number;
  current_inning?: number;
  is_top_inning?: boolean;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  started_at?: string;
  completed_at?: string;
  home_score: number;
  away_score: number;
  round_number?: number;
  game_number?: number;
  created_at: string;
  updated_at: string;
}

// Live scoring types for real-time event system
export type EventType = 'pitch' | 'flip_cup' | 'at_bat' | 'undo' | 'edit' | 'takeover' | 'game_start' | 'game_end';

export type PitchResult = 'strike' | 'foul ball' | 'ball' | 'first cup hit' | 'second cup hit' | 'third cup hit' | 'fourth cup hit';
export type FlipCupResult = 'offense wins' | 'defense wins';
export type AtBatResult = 'out' | 'walk' | 'single' | 'double' | 'triple' | 'homerun';
export type GameSnapshotStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

// Event payload types
export interface PitchEventPayload {
  result: PitchResult;
  batter_id: string;
  catcher_id: string;
}

export interface FlipCupEventPayload {
  result: FlipCupResult;
  batter_id: string;
  catcher_id: string;
  errors?: string[]; // player_ids who made errors
}

export interface AtBatEventPayload {
  result: AtBatResult;
  batter_id: string;
  catcher_id: string;
}

export interface UndoEventPayload {
  target_event_id: string;
  reason?: string;
}

export interface EditEventPayload {
  target_event_id: string;
  new_data: Record<string, any>;
}

export interface TakeoverEventPayload {
  previous_umpire_id: string;
  new_umpire_id: string;
}

export interface GameStartEventPayload {
  umpire_id: string;
  home_team_id: string;
  away_team_id: string;
  lineups: {
    home: string[]; // player_ids
    away: string[]; // player_ids
  };
  innings: 3 | 5 | 7 | 9;
}

export interface GameEndEventPayload {
  final_score_home: number;
  final_score_away: number;
  notes?: string;
}

export type EventPayload = 
  | PitchEventPayload 
  | FlipCupEventPayload 
  | AtBatEventPayload 
  | UndoEventPayload 
  | EditEventPayload 
  | TakeoverEventPayload 
  | GameStartEventPayload 
  | GameEndEventPayload;

// Game event for the event log
export interface GameEvent {
  id: string;
  game_id: string;
  type: EventType;
  umpire_id: string;
  payload: EventPayload;
  previous_event_id?: string;
  sequence_number: number;
  created_at: string;
}

// Base runners structure
export interface BaseRunners {
  first: string | null;  // player_id
  second: string | null; // player_id
  third: string | null;  // player_id
}

// Game snapshot for current state
export interface GameSnapshot {
  game_id: string;
  current_inning: number;
  is_top_of_inning: boolean;
  outs: number;
  balls: number;
  strikes: number;
  score_home: number;
  score_away: number;
  home_team_id: string;
  away_team_id: string;
  batter_id?: string;
  catcher_id?: string;
  base_runners: BaseRunners;
  home_lineup: string[]; // Array of player IDs in batting order
  away_lineup: string[]; // Array of player IDs in batting order
  home_lineup_position: number; // Current batter index (0-based)
  away_lineup_position: number; // Current batter index (0-based)
  last_event_id?: string;
  umpire_id?: string;
  status: GameSnapshotStatus;
  last_updated: string;
}

// Live game status view type
export interface LiveGameStatus {
  game_id: string;
  current_inning: number;
  is_top_of_inning: boolean;
  outs: number;
  balls: number;
  strikes: number;
  score_home: number;
  score_away: number;
  home_team_name: string;
  home_team_color: string;
  away_team_name: string;
  away_team_color: string;
  batter_name?: string;
  catcher_name?: string;
  base_runners: BaseRunners;
  umpire_name?: string;
  status: GameSnapshotStatus;
  last_updated: string;
  tournament_id?: string;
  tournament_name?: string;
}

// Legacy GameState interface (deprecated, use GameSnapshot instead)
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

// Live scoring API types
export interface EventSubmissionRequest {
  game_id: string;
  type: EventType;
  payload: EventPayload;
  umpire_id: string;
  previous_event_id?: string;
}

export interface EventSubmissionResponse {
  event: GameEvent;
  snapshot: GameSnapshot;
  success: boolean;
  error?: string;
}

export interface UmpireAction {
  type: 'pitch' | 'flip_cup' | 'at_bat_complete' | 'undo' | 'edit' | 'takeover';
  data: any;
  timestamp: string;
}

export interface GameSetupData {
  home_team_id: string;
  away_team_id: string;
  innings: 3 | 5 | 7 | 9;
  umpire_id: string;
  game_id?: string; // Optional - for starting existing tournament games
}

// Real-time subscription types
export interface RealtimeGameUpdate {
  type: 'event' | 'snapshot' | 'error';
  data: GameEvent | GameSnapshot | { message: string };
  timestamp: string;
}

export interface RealtimeDashboardUpdate {
  type: 'game_summary' | 'game_status_change';
  game_id: string;
  data: Partial<LiveGameStatus>;
  timestamp: string;
}

// Tournament-specific real-time update types
export interface RealtimeTournamentUpdate {
  type: 'standings_update' | 'bracket_update' | 'game_complete' | 'phase_transition' | 'error';
  tournament_id: string;
  data: TournamentStandingsUpdate | TournamentBracketUpdate | TournamentGameComplete | TournamentPhaseTransition | { message: string };
  timestamp: string;
}

export interface TournamentStandingsUpdate {
  standings: BracketStanding[];
  round_robin_complete: boolean;
  total_teams: number;
  completed_games: number;
  expected_games: number;
}

export interface TournamentBracketUpdate {
  bracket_matches: TournamentBracketMatch[];
  bracket_games: Game[];
  updated_match?: TournamentBracketMatch;
  winner_advanced?: boolean;
}

export interface TournamentBracketMatch {
  id: string;
  tournament_id: string;
  round_id: string;
  bracket_type: BracketType;
  round_number: number;
  game_number: number;
  home_team_id?: string;
  away_team_id?: string;
  home_team_seed?: number;
  away_team_seed?: number;
  winner_team_id?: string;
  game_id?: string;
  is_bye: boolean;
  next_game_number?: number;
  home_team?: TournamentTeamRecord;
  away_team?: TournamentTeamRecord;
  winner_team?: TournamentTeamRecord;
}

export interface TournamentGameComplete {
  game_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  winner_team_id: string;
  is_round_robin: boolean;
  bracket_game_number?: number;
}

export interface TournamentPhaseTransition {
  from_phase: 'round_robin' | 'bracket';
  to_phase: 'round_robin' | 'bracket';
  round_id: string;
  bracket_type?: BracketType;
  total_rounds?: number;
  total_games?: number;
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