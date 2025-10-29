import { createClient } from '@supabase/supabase-js';
import {
  Game,
  GameDisplayData,
  Tournament,
  Team,
  Player,
  GameFilters,
  TournamentFilters,
  ApiResponse,
  PaginatedResponse,
  GameStatus,
  GameType,
  GameSnapshot,
  GameEvent,
  EventType,
  EventPayload,
  PitchEventPayload,
  FlipCupEventPayload,
  AtBatEventPayload,
  AtBatResult,
  UndoEventPayload,
  EditEventPayload,
  TakeoverEventPayload,
  GameStartEventPayload,
  GameEndEventPayload,
  InningEndEventPayload,
  EventSubmissionRequest,
  EventSubmissionResponse,
  LiveGameStatus,
  BaseRunners,
  TournamentRecord,
  TournamentTeamRecord,
  TournamentPlayerAssignment,
  TournamentWithTeams,
  TournamentTeamWithPlayers,
  TeamDragDrop,
  BracketType
} from './types';

// Import the state machine
import { BaseballGameStateMachine, StateTransitionResult } from './state-machine';

// Mock data for development
const mockPlayers: Player[] = [
  { id: '1', name: 'Jesse Lusa', nickname: 'J-Lusa', email: 'jesse@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Alex Chen', nickname: 'Ace', email: 'alex@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Sarah Martinez', nickname: 'Smash', email: 'sarah@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Mike Johnson', nickname: 'MJ', email: 'mike@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'Emma Wilson', nickname: 'Em', email: 'emma@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'David Kim', nickname: 'DK', email: 'david@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

const mockTeams: Team[] = [
  { id: 'team1', name: 'Beer Pong Legends', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team2', name: 'Flip Cup Champions', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team3', name: 'The Ringers', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team4', name: 'Clutch Hitters', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team5', name: 'Home Run Heroes', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team6', name: 'The Underdogs', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

const mockTournaments: Tournament[] = [
  {
    id: 'tournament1',
    name: 'Baseball IX - Halloweekend 2024',
    description: 'The legendary 9th annual WBDoc Baseball tournament',
    start_date: '2024-11-01T18:00:00Z',
    end_date: '2024-11-03T23:59:59Z',
    logo_url: null,
    status: 'in_progress',
    created_at: '2024-10-01T00:00:00Z',
    updated_at: '2024-11-01T18:00:00Z',
  },
  {
    id: 'tournament2',
    name: 'Spring Training 2024',
    description: 'Pre-season warmup tournament',
    start_date: '2024-03-15T12:00:00Z',
    end_date: '2024-03-16T20:00:00Z',
    logo_url: null,
    status: 'completed',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-03-16T20:00:00Z',
  },
];

const mockGames: Game[] = [
  {
    id: 'game1',
    tournament_id: 'tournament1',
    tournament: mockTournaments[0],
    home_team_id: 'team1',
    home_team: mockTeams[0],
    away_team_id: 'team2',
    away_team: mockTeams[1],
    status: 'in_progress',
    game_type: 'tournament',
    innings: 7,
    scheduled_start: '2024-11-01T19:00:00Z',
    actual_start: '2024-11-01T19:05:00Z',
    actual_end: null,
    home_score: 4,
    away_score: 3,
    created_at: '2024-11-01T18:30:00Z',
    updated_at: '2024-11-01T20:15:00Z',
  },
  {
    id: 'game2',
    tournament_id: 'tournament1',
    tournament: mockTournaments[0],
    home_team_id: 'team3',
    home_team: mockTeams[2],
    away_team_id: 'team4',
    away_team: mockTeams[3],
    status: 'scheduled',
    game_type: 'tournament',
    innings: 7,
    scheduled_start: '2024-11-01T20:30:00Z',
    actual_start: null,
    actual_end: null,
    home_score: 0,
    away_score: 0,
    created_at: '2024-11-01T18:30:00Z',
    updated_at: '2024-11-01T18:30:00Z',
  },
  {
    id: 'game3',
    tournament_id: 'tournament1',
    tournament: mockTournaments[0],
    home_team_id: 'team5',
    home_team: mockTeams[4],
    away_team_id: 'team6',
    away_team: mockTeams[5],
    status: 'completed',
    game_type: 'tournament',
    innings: 7,
    scheduled_start: '2024-11-01T18:00:00Z',
    actual_start: '2024-11-01T18:05:00Z',
    actual_end: '2024-11-01T19:45:00Z',
    home_score: 7,
    away_score: 2,
    created_at: '2024-11-01T17:30:00Z',
    updated_at: '2024-11-01T19:45:00Z',
  },
  {
    id: 'game4',
    tournament_id: null,
    tournament: null,
    home_team_id: 'team1',
    home_team: mockTeams[0],
    away_team_id: 'team3',
    away_team: mockTeams[2],
    status: 'completed',
    game_type: 'free_play',
    innings: 5,
    scheduled_start: null,
    actual_start: '2024-10-28T16:00:00Z',
    actual_end: '2024-10-28T17:30:00Z',
    home_score: 8,
    away_score: 6,
    created_at: '2024-10-28T16:00:00Z',
    updated_at: '2024-10-28T17:30:00Z',
  },
  {
    id: 'game5',
    tournament_id: null,
    tournament: null,
    home_team_id: 'team2',
    home_team: mockTeams[1],
    away_team_id: 'team4',
    away_team: mockTeams[3],
    status: 'completed',
    game_type: 'free_play',
    innings: 5,
    scheduled_start: null,
    actual_start: '2024-10-25T14:30:00Z',
    actual_end: '2024-10-25T16:00:00Z',
    home_score: 5,
    away_score: 9,
    created_at: '2024-10-25T14:30:00Z',
    updated_at: '2024-10-25T16:00:00Z',
  },
];

// Helper function to add display data to games
function enhanceGameWithDisplayData(game: Game): GameDisplayData {
  const enhanced: GameDisplayData = { ...game };

  // Add current inning info for in-progress games
  if (game.status === 'in_progress') {
    enhanced.current_inning = 3;
    enhanced.current_inning_half = 'bottom';
    enhanced.outs = 1;
    enhanced.time_status = 'Live';
    enhanced.is_live = true;
  } else if (game.status === 'completed') {
    enhanced.time_status = 'Final';
    enhanced.is_live = false;
  } else if (game.status === 'scheduled' && game.scheduled_start) {
    const startTime = new Date(game.scheduled_start);
    enhanced.time_status = startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    enhanced.is_live = false;
  }

  return enhanced;
}

// Simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// For client-side, always use the anon key (RLS will handle security)
// For server-side API routes, we can use service role key
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_API_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Event Validation Functions
// These functions validate events according to WBDoc Baseball rules

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// Validate pitch events
export function validatePitchEvent(
  payload: PitchEventPayload, 
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { result, batter_id, catcher_id } = payload;
  
  // Basic field validation
  if (!batter_id || !catcher_id) {
    return { isValid: false, error: 'Batter and catcher are required for pitch events' };
  }
  
  if (!['strike', 'foul ball', 'ball', 'first cup hit', 'second cup hit', 'third cup hit', 'fourth cup hit'].includes(result)) {
    return { isValid: false, error: 'Invalid pitch result' };
  }
  
  // Game state validation
  if (gameSnapshot.status !== 'in_progress') {
    return { isValid: false, error: 'Cannot record pitches when game is not in progress' };
  }
  
  if (gameSnapshot.batter_id !== batter_id) {
    return { isValid: false, error: 'Pitch batter must match current batter in game state' };
  }
  
  if (gameSnapshot.catcher_id !== catcher_id) {
    return { isValid: false, error: 'Pitch catcher must match current catcher in game state' };
  }
  
  // Count validation
  if (result === 'strike' && gameSnapshot.strikes >= 2) {
    return { isValid: false, error: 'Cannot record strike when batter already has 2 strikes (should be strikeout)' };
  }
  
  if (result === 'ball' && gameSnapshot.balls >= 3) {
    return { isValid: false, error: 'Cannot record ball when batter already has 3 balls (should be walk)' };
  }
  
  // Cup hit validation - these should trigger flip cup
  const cupHits = ['first cup hit', 'second cup hit', 'third cup hit', 'fourth cup hit'];
  if (cupHits.includes(result)) {
    return { 
      isValid: true, 
      warnings: ['Cup hit recorded - flip cup event should follow'] 
    };
  }
  
  return { isValid: true };
}

// Validate flip cup events
export function validateFlipCupEvent(
  payload: FlipCupEventPayload,
  gameSnapshot: GameSnapshot,
  previousEvent?: GameEvent
): ValidationResult {
  const { result, batter_id, catcher_id, errors } = payload;
  
  // Basic field validation
  if (!batter_id || !catcher_id) {
    return { isValid: false, error: 'Batter and catcher are required for flip cup events' };
  }
  
  if (!['offense wins', 'defense wins'].includes(result)) {
    return { isValid: false, error: 'Invalid flip cup result' };
  }
  
  // Game state validation
  if (gameSnapshot.status !== 'in_progress') {
    return { isValid: false, error: 'Cannot record flip cup when game is not in progress' };
  }
  
  // Previous event validation - flip cup should follow a cup hit
  if (previousEvent && previousEvent.type === 'pitch') {
    const pitchPayload = previousEvent.payload as PitchEventPayload;
    const cupHits = ['first cup hit', 'second cup hit', 'third cup hit', 'fourth cup hit'];
    if (!cupHits.includes(pitchPayload.result)) {
      return { 
        isValid: false, 
        error: 'Flip cup event must follow a cup hit pitch' 
      };
    }
  }
  
  // Error validation - errors should be valid player IDs
  if (errors && errors.length > 0) {
    for (const playerId of errors) {
      if (!playerId || typeof playerId !== 'string') {
        return { isValid: false, error: 'Invalid player ID in errors array' };
      }
    }
  }
  
  return { isValid: true };
}

// Validate at-bat completion events
export function validateAtBatEvent(
  payload: AtBatEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { result, batter_id, catcher_id } = payload;
  
  // Basic field validation
  if (!batter_id || !catcher_id) {
    return { isValid: false, error: 'Batter and catcher are required for at-bat events' };
  }
  
  if (!['out', 'walk', 'single', 'double', 'triple', 'homerun'].includes(result)) {
    return { isValid: false, error: 'Invalid at-bat result' };
  }
  
  // Game state validation
  if (gameSnapshot.status !== 'in_progress') {
    return { isValid: false, error: 'Cannot complete at-bat when game is not in progress' };
  }
  
  if (gameSnapshot.batter_id !== batter_id) {
    return { isValid: false, error: 'At-bat batter must match current batter in game state' };
  }
  
  // Count validation - at-bat should complete on valid counts
  const { balls, strikes } = gameSnapshot;
  
  if (result === 'walk' && balls < 3) {
    return { isValid: false, error: 'Walk requires 4 balls (3 balls + 1 more)' };
  }
  
  // Note: We don't validate strikeouts here because:
  // 1. An "out" can result from many things other than strikeouts (fielding plays, etc.)
  // 2. Umpires should have the flexibility to call outs as needed
  // 3. Strikeout validation should happen at the pitch level, not at-bat level
  
  return { isValid: true };
}

// Validate undo events
export function validateUndoEvent(
  payload: UndoEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { target_event_id, reason } = payload;
  
  console.log('[validateUndoEvent] Validating undo event:', { target_event_id, reason });
  
  // Basic field validation
  if (!target_event_id) {
    console.error('[validateUndoEvent] Missing target_event_id');
    return { isValid: false, error: 'Target event ID is required for undo events' };
  }
  
  // Game state validation
  if (gameSnapshot.status === 'completed') {
    console.error('[validateUndoEvent] Game is completed');
    return { isValid: false, error: 'Cannot undo events in completed games' };
  }
  
  // Reason validation (optional but recommended)
  if (reason && reason.length > 500) {
    console.error('[validateUndoEvent] Reason too long');
    return { isValid: false, error: 'Undo reason must be 500 characters or less' };
  }
  
  console.log('[validateUndoEvent] Validation passed');
  return { isValid: true };
}

// Validate edit events
export function validateEditEvent(
  payload: EditEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { target_event_id, new_data } = payload;
  
  // Basic field validation
  if (!target_event_id) {
    return { isValid: false, error: 'Target event ID is required for edit events' };
  }
  
  if (!new_data || typeof new_data !== 'object') {
    return { isValid: false, error: 'New data is required for edit events' };
  }
  
  // Game state validation
  if (gameSnapshot.status === 'completed') {
    return { isValid: false, error: 'Cannot edit events in completed games' };
  }
  
  return { isValid: true };
}

// Validate takeover events
export function validateTakeoverEvent(
  payload: TakeoverEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { previous_umpire_id, new_umpire_id } = payload;
  
  // Basic field validation
  if (!new_umpire_id) {
    return { isValid: false, error: 'New umpire ID is required' };
  }
  
  // Allow null previous_umpire_id when no umpire is currently assigned
  if (previous_umpire_id === new_umpire_id) {
    return { isValid: false, error: 'New umpire must be different from previous umpire' };
  }
  
  // Game state validation - check that previous_umpire_id matches current state
  if (gameSnapshot.umpire_id !== previous_umpire_id) {
    return { 
      isValid: false, 
      error: 'Previous umpire ID must match current umpire in game state' 
    };
  }
  
  if (gameSnapshot.status === 'completed') {
    return { isValid: false, error: 'Cannot change umpire in completed games' };
  }
  
  return { isValid: true };
}

// Validate game start events
export function validateGameStartEvent(
  payload: GameStartEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { umpire_id, home_team_id, away_team_id, lineups, innings } = payload;
  
  // Basic field validation
  if (!umpire_id || !home_team_id || !away_team_id) {
    return { isValid: false, error: 'Umpire and team IDs are required' };
  }
  
  if (home_team_id === away_team_id) {
    return { isValid: false, error: 'Home and away teams must be different' };
  }
  
  if (!lineups || !lineups.home || !lineups.away) {
    return { isValid: false, error: 'Both home and away lineups are required' };
  }
  
  if (lineups.home.length === 0 || lineups.away.length === 0) {
    return { isValid: false, error: 'Lineups cannot be empty' };
  }
  
  if (![3, 5, 7, 9].includes(innings)) {
    return { isValid: false, error: 'Innings must be 3, 5, 7, or 9' };
  }
  
  // Game state validation
  if (gameSnapshot.status !== 'not_started') {
    return { isValid: false, error: 'Game start can only be recorded for games not yet started' };
  }
  
  // Team validation
  if (gameSnapshot.home_team_id !== home_team_id || gameSnapshot.away_team_id !== away_team_id) {
    return { isValid: false, error: 'Team IDs must match game snapshot' };
  }
  
  return { isValid: true };
}

// Validate game end events
export function validateGameEndEvent(
  payload: GameEndEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { final_score_home, final_score_away, notes, scoring_method } = payload;
  
  // Basic field validation
  if (final_score_home < 0 || final_score_away < 0) {
    return { isValid: false, error: 'Final scores cannot be negative' };
  }
  
  if (final_score_home === final_score_away) {
    return { isValid: false, error: 'Games cannot end in a tie' };
  }
  
  // Game state validation
  if (gameSnapshot.status !== 'in_progress') {
    return { isValid: false, error: 'Game end can only be recorded for games in progress' };
  }
  
  // Score validation
  // For quick_result completion, allow overriding current snapshot scores
  if (scoring_method !== 'quick_result') {
    if (final_score_home !== gameSnapshot.score_home || final_score_away !== gameSnapshot.score_away) {
      return { 
        isValid: false, 
        error: 'Final scores must match current game snapshot scores' 
      };
    }
  }
  
  // Notes validation
  if (notes && notes.length > 1000) {
    return { isValid: false, error: 'Game end notes must be 1000 characters or less' };
  }
  
  return { isValid: true };
}

// Validate inning end events
export function validateInningEndEvent(
  payload: InningEndEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { inning_number, is_top_of_inning, score_home, score_away } = payload;

  // Basic validation
  if (typeof inning_number !== 'number' || inning_number < 1) {
    return { isValid: false, error: 'Invalid inning number' };
  }
  if (score_home < 0 || score_away < 0) {
    return { isValid: false, error: 'Scores cannot be negative' };
  }

  // Game state validation
  if (gameSnapshot.status !== 'in_progress') {
    return { isValid: false, error: 'Inning end can only be recorded for games in progress' };
  }

  // Ensure we are ending the current half-inning
  if (inning_number !== gameSnapshot.current_inning || is_top_of_inning !== gameSnapshot.is_top_of_inning) {
    return { isValid: false, error: 'Inning end must match the current half-inning' };
  }

  return { isValid: true };
}

// Master validation function
export function validateEvent(
  type: EventType,
  payload: EventPayload,
  gameSnapshot: GameSnapshot,
  previousEvent?: GameEvent
): ValidationResult {
  switch (type) {
    case 'pitch':
      return validatePitchEvent(payload as PitchEventPayload, gameSnapshot);
    
    case 'flip_cup':
      return validateFlipCupEvent(payload as FlipCupEventPayload, gameSnapshot, previousEvent);
    
    case 'at_bat':
      return validateAtBatEvent(payload as AtBatEventPayload, gameSnapshot);
    
    case 'undo':
      return validateUndoEvent(payload as UndoEventPayload, gameSnapshot);
    
    case 'edit':
      return validateEditEvent(payload as EditEventPayload, gameSnapshot);
    
    case 'takeover':
      return validateTakeoverEvent(payload as TakeoverEventPayload, gameSnapshot);
    
    case 'game_start':
      return validateGameStartEvent(payload as GameStartEventPayload, gameSnapshot);
    
    case 'game_end':
      return validateGameEndEvent(payload as GameEndEventPayload, gameSnapshot);
    
    case 'inning_end':
      return validateInningEndEvent(payload as InningEndEventPayload, gameSnapshot);
    
    default:
      return { isValid: false, error: `Unknown event type: ${type}` };
  }
}

// API Functions for Event Submission
export async function submitEvent(request: EventSubmissionRequest): Promise<EventSubmissionResponse> {
  try {
    // Get current game snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('game_snapshots')
      .select('*')
      .eq('game_id', request.game_id)
      .single();
    
    let currentSnapshot = snapshot;
    
    // For game_start events, if no snapshot exists yet, create a minimal one
    // (This is normal for new games where we only created the games record initially)
    if (snapshotError || !currentSnapshot) {
      if (request.type === 'game_start') {
        // Get the basic game info to create initial snapshot
        const { data: gameInfo, error: gameError } = await supabase
          .from('games')
          .select('id, home_team_id, away_team_id')
          .eq('id', request.game_id)
          .single();
        
        if (gameError || !gameInfo) {
          return {
            event: {} as GameEvent,
            snapshot: {} as GameSnapshot,
            success: false,
            error: 'Could not fetch game information'
          };
        }

        // Create minimal initial snapshot for game_start processing
        currentSnapshot = {
          game_id: request.game_id,
          current_inning: 1,
          is_top_of_inning: true,
          outs: 0,
          balls: 0,
          strikes: 0,
          score_home: 0,
          score_away: 0,
          home_team_id: gameInfo.home_team_id || '',
          away_team_id: gameInfo.away_team_id || '',
          batter_id: null,
          catcher_id: null,
          base_runners: { first: null, second: null, third: null },
          home_lineup: [],
          away_lineup: [],
          home_lineup_position: 0,
          away_lineup_position: 0,
          last_event_id: null,
          umpire_id: null,
          status: 'not_started',
          last_updated: new Date().toISOString(),
          scoring_method: 'live',
          is_quick_result: false
        };
      } else {
        return {
          event: {} as GameEvent,
          snapshot: {} as GameSnapshot,
          success: false,
          error: 'Could not fetch current game state'
        };
      }
    }
    
    // Get previous event if needed
    let previousEvent: GameEvent | undefined;
    if (request.previous_event_id) {
      const { data: prevEvent } = await supabase
        .from('game_events')
        .select('*')
        .eq('id', request.previous_event_id)
        .single();
      
      previousEvent = prevEvent || undefined;
    }
    
    // Special handling: undo should delete the target event and rebuild snapshot
    if (request.type === 'undo') {
      const undoPayload = request.payload as UndoEventPayload;

      // Basic validation
      const basicValidation = validateUndoEvent(undoPayload, currentSnapshot);
      if (!basicValidation.isValid) {
        return {
          event: {} as GameEvent,
          snapshot: {} as GameSnapshot,
          success: false,
          error: basicValidation.error
        };
      }

      // Fetch most recent gameplay event (exclude undo/edit)
      const { data: latestEvents, error: latestErr } = await supabase
        .from('game_events')
        .select('*')
        .eq('game_id', request.game_id)
        .not('type', 'in', '(undo,edit)')
        .order('sequence_number', { ascending: false })
        .limit(1);

      if (latestErr) {
        return {
          event: {} as GameEvent,
          snapshot: {} as GameSnapshot,
          success: false,
          error: `Failed to load latest event: ${latestErr.message}`
        };
      }

      const latestEvent = latestEvents && latestEvents[0];
      if (!latestEvent) {
        return {
          event: {} as GameEvent,
          snapshot: currentSnapshot,
          success: false,
          error: 'No events to undo'
        };
      }

      if (latestEvent.id !== undoPayload.target_event_id) {
        return {
          event: {} as GameEvent,
          snapshot: currentSnapshot,
          success: false,
          error: 'Can only undo the most recent event'
        };
      }

      // Delete the target event
      const { error: delErr } = await supabase
        .from('game_events')
        .delete()
        .eq('id', undoPayload.target_event_id);

      if (delErr) {
        return {
          event: {} as GameEvent,
          snapshot: currentSnapshot,
          success: false,
          error: `Failed to delete event: ${delErr.message}`
        };
      }

      // Rebuild snapshot by replaying remaining events
      const rebuilt = await rebuildSnapshotForGame(request.game_id);
      if (!rebuilt.success) {
        return {
          event: {} as GameEvent,
          snapshot: currentSnapshot,
          success: false,
          error: rebuilt.error || 'Failed to rebuild snapshot'
        };
      }

      return {
        event: {} as GameEvent,
        snapshot: rebuilt.snapshot as GameSnapshot,
        success: true
      };
    }

    // Validate the event (non-undo)
    const validation = validateEvent(request.type, request.payload, currentSnapshot, previousEvent);
    if (!validation.isValid) {
      return {
        event: {} as GameEvent,
        snapshot: {} as GameSnapshot,
        success: false,
        error: validation.error
      };
    }
    
    // Submit the event
    const { data: event, error: eventError } = await supabase
      .from('game_events')
      .insert({
        game_id: request.game_id,
        type: request.type,
        payload: request.payload,
        umpire_id: request.umpire_id,
        previous_event_id: request.previous_event_id
      })
      .select()
      .single();
    
    if (eventError || !event) {
      return {
        event: {} as GameEvent,
        snapshot: {} as GameSnapshot,
        success: false,
        error: `Failed to submit event: ${eventError?.message || 'Unknown database error'}`
      };
    }
    
    // Update game snapshot using the state machine
    const updatedSnapshot = await updateGameSnapshotWithStateMachine(event, currentSnapshot);
    
    return {
      event,
      snapshot: updatedSnapshot,
      success: true
    };
    
  } catch (error) {
    return {
      event: {} as GameEvent,
      snapshot: {} as GameSnapshot,
      success: false,
      error: 'Unexpected error during event submission'
    };
  }
}

// Rebuild snapshot by replaying all remaining events for a game
async function rebuildSnapshotForGame(gameId: string): Promise<{ success: boolean; snapshot?: GameSnapshot; error?: string }> {
  // Load events in order
  const { data: events, error: eventsErr } = await supabase
    .from('game_events')
    .select('*')
    .eq('game_id', gameId)
    .order('sequence_number', { ascending: true });

  if (eventsErr || !events) {
    return { success: false, error: 'Could not fetch game events' };
  }

  // Find game_start
  const gameStart = events.find(e => e.type === 'game_start');
  if (!gameStart) {
    return { success: false, error: 'Missing game_start event' };
  }

  // Start from minimal snapshot built for game_start using state machine
  // Get current snapshot row (for created_at preservation if needed)
  const { data: existingSnapshot } = await supabase
    .from('game_snapshots')
    .select('*')
    .eq('game_id', gameId)
    .single();

  // Build initial snapshot by transitioning with game_start
  // Create a minimal pre-start snapshot for transition
  const preStartSnapshot: GameSnapshot = {
    game_id: gameId,
    current_inning: 1,
    is_top_of_inning: true,
    outs: 0,
    balls: 0,
    strikes: 0,
    score_home: 0,
    score_away: 0,
    home_team_id: '',
    away_team_id: '',
    batter_id: null,
    catcher_id: null,
    base_runners: { first: null, second: null, third: null },
    home_lineup: [],
    away_lineup: [],
    home_lineup_position: 0,
    away_lineup_position: 0,
    last_event_id: null,
    umpire_id: null,
    status: 'not_started',
    last_updated: new Date().toISOString(),
    scoring_method: 'live',
    is_quick_result: false,
    ...(existingSnapshot?.created_at ? { created_at: existingSnapshot.created_at } as any : {})
  } as any;

  let snapshot = BaseballGameStateMachine.transition(preStartSnapshot, gameStart as any, events).snapshot;

  // Replay remaining events except undo/edit and any duplicate game_start
  const remaining = events
    .filter(e => e.type !== 'game_start')
    .filter(e => e.type !== 'undo' && e.type !== 'edit');
  for (const e of remaining) {
    const result = BaseballGameStateMachine.transition(snapshot, e as any, events);
    if (result.error) {
      return { success: false, error: result.error };
    }
    snapshot = result.snapshot;
  }

  // Persist snapshot
  const { data: saved, error: saveErr } = await supabase
    .from('game_snapshots')
    .upsert(snapshot as any)
    .select()
    .single();

  if (saveErr) {
    return { success: false, error: 'Failed to save rebuilt snapshot' };
  }

  return { success: true, snapshot: saved as GameSnapshot };
}

// Existing API functions (placeholder - will be updated in subsequent tasks)
export async function getGames(): Promise<Game[]> {
  // TODO: Implement
  return [];
}

export async function getGameSnapshot(gameId: string): Promise<GameSnapshot | null> {
  const { data, error } = await supabase
    .from('game_snapshots')
    .select('*')
    .eq('game_id', gameId)
    .single();
  
  return error ? null : data;
}

export async function getLiveGameStatus(gameId: string): Promise<LiveGameStatus | null> {
  const { data, error } = await supabase
    .from('live_game_status')
    .select('*')
    .eq('game_id', gameId)
    .single();
  
  return error ? null : data;
}

export interface InningScore {
  inning: number;
  home_runs: number;
  away_runs: number;
}

/**
 * Calculate inning-by-inning scores from game events
 * This is a simplified implementation - a more robust version would replay
 * the entire game state to track exact run scoring per inning
 */
export async function calculateInningScores(gameId: string): Promise<InningScore[]> {
  try {
    // Get current game snapshot and game data
    const { data: currentSnapshot } = await supabase
      .from('game_snapshots')
      .select('current_inning, score_home, score_away, is_top_of_inning')
      .eq('game_id', gameId)
      .single();

    const { data: gameData } = await supabase
      .from('games')
      .select('total_innings, game_type, tournament_id')
      .eq('id', gameId)
      .single();

    if (!currentSnapshot) return [];

    let totalInnings = gameData?.total_innings;
    
    // If game doesn't have innings configured, get from tournament defaults based on game type
    if (!totalInnings && gameData?.tournament_id) {
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('pool_play_innings, bracket_innings, final_innings')
        .eq('id', gameData.tournament_id)
        .single();
      
      if (tournamentData) {
        // Use appropriate inning setting based on game type
        switch (gameData.game_type) {
          case 'pool_play':
          case 'round_robin':
            totalInnings = tournamentData.pool_play_innings || 5;
            break;
          case 'bracket':
          case 'elimination':
            totalInnings = tournamentData.bracket_innings || 5;
            break;
          case 'championship':
          case 'final':
            totalInnings = tournamentData.final_innings || 7;
            break;
          default:
            totalInnings = tournamentData.pool_play_innings || 5;
        }
      } else {
        totalInnings = 5; // Fallback if no tournament data
      }
    } else if (!totalInnings) {
      totalInnings = 5; // Final fallback
    }

    const currentInning = currentSnapshot.current_inning;
    const isTopOfInning = currentSnapshot.is_top_of_inning;
    const inningScores: InningScore[] = [];

    // Initialize innings that have been played or are currently being played
    for (let i = 1; i <= totalInnings; i++) {
      if (i < currentInning || (i === currentInning && !isTopOfInning)) {
        // Inning has been completed or bottom half is in progress
        inningScores.push({ inning: i, home_runs: 0, away_runs: 0 });
      } else if (i === currentInning && isTopOfInning) {
        // Currently in top of this inning
        inningScores.push({ inning: i, home_runs: 0, away_runs: 0 });
      } else {
        // Future inning - will show "-" in the ScoreBoard component
        inningScores.push({ inning: i, home_runs: -1, away_runs: -1 });
      }
    }

    // Put all current runs in the current inning (simplified approach)
    if (currentInning <= totalInnings) {
      const currentInningScore = inningScores[currentInning - 1];
      if (currentInningScore && currentInningScore.home_runs !== -1) {
        currentInningScore.home_runs = currentSnapshot.score_home;
        currentInningScore.away_runs = currentSnapshot.score_away;
      }
    }
    
    return inningScores;
  } catch (error) {
    console.error('Error calculating inning scores:', error);
    return [];
  }
}

export async function getGameEvents(
  gameId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<{ events: GameEvent[], total: number }> {
  const { data: events, error, count } = await supabase
    .from('game_events')
    .select('*', { count: 'exact' })
    .eq('game_id', gameId)
    .order('sequence_number', { ascending: true })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching game events:', error);
    return { events: [], total: 0 };
  }
  
  return { 
    events: events || [], 
    total: count || 0 
  };
}

async function getRecentGameEvents(gameId: string, limit: number = 10): Promise<GameEvent[]> {
  const { data: events, error } = await supabase
    .from('game_events')
    .select('*')
    .eq('game_id', gameId)
    .order('sequence_number', { ascending: false }) // Most recent first
    .limit(limit);
  
  if (error) {
    console.error('Error fetching recent game events:', error);
    return [];
  }
  
  return (events || []).reverse(); // Return in chronological order
}

/**
 * Update game snapshot using the state machine
 */
export async function updateGameSnapshotWithStateMachine(
  event: GameEvent, 
  currentSnapshot: GameSnapshot
): Promise<GameSnapshot> {
  // Get events for context
  // For undo events, we need all events; for other events, recent events are sufficient
  const limit = event.type === 'undo' ? 1000 : 10;
  const recentEvents = await getRecentGameEvents(currentSnapshot.game_id, limit);
  
  // Process the event using the state machine
  const result = BaseballGameStateMachine.transition(currentSnapshot, event, recentEvents);
  
  if (result.error) {
    console.error('[StateMachine] Error processing event:', result.error);
    throw new Error(`State machine error: ${result.error}`);
  }
  
  const newSnapshot = result.snapshot;
  
  // Handle side effects
  if (result.sideEffects) {
    for (const sideEffect of result.sideEffects) {
      if (sideEffect.type === 'game_start') {
        // Update the games table when game starts
        const { error: gameUpdateError } = await supabase
          .from('games')
          .update({
            home_team_id: sideEffect.data.home_team_id,
            away_team_id: sideEffect.data.away_team_id,
            status: 'in_progress',
            started_at: sideEffect.data.started_at
          })
          .eq('id', currentSnapshot.game_id);
        
        if (gameUpdateError) {
          console.error('Error updating games table:', gameUpdateError);
          // Don't throw here, just log the error
        }
      } else if (sideEffect.type === 'score_change') {
        // Note: Games table updates are handled server-side via API
        // This side effect is processed by the server-side event handler
        console.log('[StateMachine] Score change detected, will be synced server-side');
      }
      // Handle other side effects as needed
    }
  }
  
  // Save the updated snapshot to the database
  // Remove any fields that don't exist in the database schema
  const { updated_at, ...snapshotToSave } = newSnapshot as any;
  
  const { data, error } = await supabase
    .from('game_snapshots')
    .upsert(snapshotToSave)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating game snapshot:', error);
    throw new Error('Failed to update game snapshot');
  }
  
  return data;
}

export async function testStateMachineAgainstCurrentGame(gameId: string): Promise<any> {
  // Get all events for the game
  const { data: events, error: eventsError } = await supabase
    .from('game_events')
    .select('*')
    .eq('game_id', gameId)
    .order('sequence_number', { ascending: true });
  
  if (eventsError || !events) {
    return { error: 'Could not fetch game events' };
  }
  
  // Get current snapshot
  const { data: currentSnapshot, error: snapshotError } = await supabase
    .from('game_snapshots')
    .select('*')
    .eq('game_id', gameId)
    .single();
  
  if (snapshotError || !currentSnapshot) {
    return { error: 'Could not fetch current snapshot' };
  }
  
  return {
    message: 'State machine is now the primary system',
    currentSnapshot,
    totalEvents: events.length
  };
}

// API Functions
export async function fetchGames(filters?: GameFilters): Promise<ApiResponse<GameDisplayData[]>> {
  try {
    // First, get the games without joins
    let query = supabase.from('games').select('*');

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.tournament_id) {
      query = query.eq('tournament_id', filters.tournament_id);
    }

    if (filters?.team_id) {
      query = query.or(`home_team_id.eq.${filters.team_id},away_team_id.eq.${filters.team_id}`);
    }

    // Apply sorting: active games first, then by most recent
    query = query.order('status', { ascending: false });
    query = query.order('updated_at', { ascending: false });

    // Apply limit
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data: games, error } = await query;

    if (error) {
      console.error('Error fetching games:', error);
      return {
        data: [],
        success: false,
        error: 'Failed to fetch games from database',
      };
    }

    if (!games || games.length === 0) {
      console.log('No games found in database');
      return {
        data: [],
        success: true,
      };
    }

    console.log(`Found ${games.length} games in database`);

    // Get all unique team IDs
    const teamIds = new Set<string>();
    const tournamentIds = new Set<string>();
    
    games.forEach(game => {
      if (game.home_team_id) teamIds.add(game.home_team_id);
      if (game.away_team_id) teamIds.add(game.away_team_id);
      if (game.tournament_id) tournamentIds.add(game.tournament_id);
    });

    // Fetch teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, color')
      .in('id', Array.from(teamIds));

    // Fetch tournaments
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date, end_date, created_at, updated_at')
      .in('id', Array.from(tournamentIds));

    // Create lookup maps
    const teamMap = new Map(teams?.map(team => [team.id, team]) || []);
    const tournamentMap = new Map(tournaments?.map(tournament => [tournament.id, tournament]) || []);

    // Transform the data to match our Game interface
    const transformedGames: Game[] = games.map(game => {
      const homeTeam = teamMap.get(game.home_team_id);
      const awayTeam = teamMap.get(game.away_team_id);
      const tournament = game.tournament_id ? tournamentMap.get(game.tournament_id) : null;

      return {
        id: game.id,
        tournament_id: game.tournament_id,
        tournament: tournament ? {
          id: tournament.id,
          name: tournament.name,
          description: undefined, // Field doesn't exist in DB
          status: tournament.status,
          start_date: tournament.start_date,
          end_date: tournament.end_date,
          logo_url: null,
          created_at: tournament.created_at || new Date().toISOString(),
          updated_at: tournament.updated_at || new Date().toISOString(),
        } : null,
        home_team_id: game.home_team_id,
        home_team: homeTeam ? {
          id: homeTeam.id,
          name: homeTeam.name,
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : {
          id: game.home_team_id,
          name: 'Unknown Team',
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        away_team_id: game.away_team_id,
        away_team: awayTeam ? {
          id: awayTeam.id,
          name: awayTeam.name,
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : {
          id: game.away_team_id,
          name: 'Unknown Team',
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        status: game.status as GameStatus,
        game_type: 'tournament' as GameType,
        innings: game.total_innings || 7,
        scheduled_start: game.started_at,
        actual_start: game.started_at,
        actual_end: game.completed_at,
        home_score: game.home_score || 0,
        away_score: game.away_score || 0,
        created_at: game.created_at,
        updated_at: game.updated_at,
      };
    });

    // Enhance with display data
    const enhancedGames = transformedGames.map(enhanceGameWithDisplayData);

    console.log(`Successfully transformed ${enhancedGames.length} games`);
    return {
      data: enhancedGames,
      success: true,
    };
  } catch (error) {
    console.error('Error in fetchGames:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to fetch games',
    };
  }
}

export async function fetchGameById(gameId: string): Promise<ApiResponse<GameDisplayData | null>> {
  try {
    const { data: game, error } = await supabase
      .from('games')
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, color),
        away_team:teams!games_away_team_id_fkey(id, name, color),
        tournament:tournaments(id, name, status, start_date, end_date, created_at, updated_at)
      `)
      .eq('id', gameId)
      .single();

    if (error) {
      console.error('Error fetching game:', error);
      return {
        data: null,
        success: false,
        error: 'Game not found',
      };
    }

    if (!game) {
      return {
        data: null,
        success: false,
        error: 'Game not found',
      };
    }

    // Transform the data to match our Game interface
    const transformedGame: Game = {
      id: game.id,
      tournament_id: game.tournament_id,
      tournament: game.tournament ? {
        id: game.tournament.id,
        name: game.tournament.name,
        status: game.tournament.status,
        start_date: game.tournament.start_date,
        end_date: game.tournament.end_date,
        logo_url: null,
        created_at: game.tournament.created_at || new Date().toISOString(),
        updated_at: game.tournament.updated_at || new Date().toISOString(),
      } : null,
      home_team_id: game.home_team_id,
      home_team: {
        id: game.home_team.id,
        name: game.home_team.name,
        logo_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      away_team_id: game.away_team_id,
      away_team: {
        id: game.away_team.id,
        name: game.away_team.name,
        logo_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      status: game.status as GameStatus,
      game_type: 'tournament' as GameType, // Default to tournament for now
      innings: game.total_innings || 7,
      scheduled_start: game.started_at,
      actual_start: game.started_at,
      actual_end: game.completed_at,
      home_score: game.home_score || 0,
      away_score: game.away_score || 0,
      created_at: game.created_at,
      updated_at: game.updated_at,
    };

    return {
      data: enhanceGameWithDisplayData(transformedGame),
      success: true,
    };
  } catch (error) {
    console.error('Error in fetchGameById:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to fetch game',
    };
  }
}

export async function fetchTournaments(filters?: TournamentFilters): Promise<ApiResponse<Tournament[]>> {
  await delay(250);

  try {
    let filteredTournaments = [...mockTournaments];

    if (filters?.status?.length) {
      filteredTournaments = filteredTournaments.filter(tournament => 
        filters.status!.includes(tournament.status)
      );
    }

    // Sort by start date (most recent first)
    filteredTournaments.sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    if (filters?.limit) {
      filteredTournaments = filteredTournaments.slice(0, filters.limit);
    }

    return {
      data: filteredTournaments,
      success: true,
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: 'Failed to fetch tournaments',
    };
  }
}

export async function fetchActiveTournament(): Promise<ApiResponse<Tournament | null>> {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'in_progress')
      .limit(1);

    if (error) {
      console.error('Error fetching active tournament:', error);
      return {
        data: null,
        success: false,
        error: 'Failed to fetch active tournament',
      };
    }

    // Get the first tournament from the array (or null if empty)
    const tournament = tournaments?.[0] || null;

    return {
      data: tournament ? {
        id: tournament.id,
        name: tournament.name,
        description: undefined, // Field doesn't exist in DB, set as undefined
        status: tournament.status,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        logo_url: null,
        created_at: tournament.created_at,
        updated_at: tournament.updated_at,
      } : null,
      success: true,
    };
  } catch (error) {
    console.error('Error in fetchActiveTournament:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to fetch active tournament',
    };
  }
}

// Convenience function for homepage: get recent games (active first, then recent)
export async function fetchRecentGames(limit: number = 10): Promise<ApiResponse<GameDisplayData[]>> {
  return fetchGames({ limit });
}

// Team and Player API functions

export async function fetchTeams(): Promise<ApiResponse<Team[]>> {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, color, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching teams:', error);
      return {
        data: [],
        success: false,
        error: 'Failed to fetch teams from database',
      };
    }

    const transformedTeams: Team[] = teams?.map(team => ({
      id: team.id,
      name: team.name,
      logo_url: null, // teams table doesn't have logo_url column
      created_at: team.created_at,
      updated_at: team.created_at, // teams table doesn't have updated_at, use created_at
    })) || [];

    return {
      data: transformedTeams,
      success: true,
    };
  } catch (error) {
    console.error('Error in fetchTeams:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to fetch teams',
    };
  }
}

export async function fetchPlayers(includeInactive: boolean = false): Promise<ApiResponse<Player[]>> {
  try {
    let query = supabase
      .from('players')
      .select('id, name, nickname, email, avatar_url, current_town, hometown, championships_won, is_active, created_at, updated_at');
    
    // By default, only fetch active players
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data: players, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching players:', error);
      return {
        data: [],
        success: false,
        error: 'Failed to fetch players from database',
      };
    }

    const transformedPlayers: Player[] = players?.map(player => ({
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      email: player.email,
      avatar_url: player.avatar_url,
      current_town: player.current_town,
      hometown: player.hometown,
      championships_won: player.championships_won,
      is_active: player.is_active,
      created_at: player.created_at,
      updated_at: player.updated_at,
    })) || [];

    return {
      data: transformedPlayers,
      success: true,
    };
  } catch (error) {
    console.error('Error in fetchPlayers:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to fetch players',
    };
  }
}

export async function fetchTeamPlayers(teamId: string, tournamentId?: string): Promise<ApiResponse<Player[]>> {
  try {
    // Build the query to fetch players for a specific team
    let query = supabase
      .from('tournament_player_assignments')
      .select(`
        players!inner(id, name, nickname, email, avatar_url, current_town, hometown, championships_won, created_at, updated_at)
      `)
      .eq('team_id', teamId);

    // If tournament ID is provided, filter by tournament
    if (tournamentId) {
      query = query.eq('tournament_id', tournamentId);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Error fetching team players:', error);
      return {
        data: [],
        success: false,
        error: 'Failed to fetch team players from database',
      };
    }

    // Extract players from the assignments
    const players: Player[] = assignments?.map((assignment: any) => assignment.players).filter(Boolean) || [];

    // Sort by name
    players.sort((a, b) => a.name.localeCompare(b.name));

    return {
      data: players,
      success: true,
    };
  } catch (error) {
    console.error('Error in fetchTeamPlayers:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to fetch team players',
    };
  }
}

export async function fetchTeamById(teamId: string): Promise<ApiResponse<Team | null>> {
  await delay(150);

  try {
    const team = mockTeams.find(t => t.id === teamId);
    
    return {
      data: team || null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: 'Failed to fetch team',
    };
  }
}

export async function fetchPlayerById(playerId: string): Promise<ApiResponse<Player | null>> {
  await delay(150);

  try {
    const player = mockPlayers.find(p => p.id === playerId);
    
    return {
      data: player || null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: 'Failed to fetch player',
    };
  }
} 

/**
 * Create a new game record in the database
 */
export async function createNewGame(gameData: {
  tournament_id?: string;
  home_team_id?: string;
  away_team_id?: string;
  innings?: 3 | 5 | 7 | 9;
  game_type?: 'tournament' | 'free_play';
}): Promise<ApiResponse<{ game_id: string }>> {
  try {
    const gameType = gameData.game_type || 'free_play';
    const innings = gameData.innings || 7;
    
    // Create the game record
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        tournament_id: gameData.tournament_id || null,
        home_team_id: gameData.home_team_id || null,
        away_team_id: gameData.away_team_id || null,
        home_score: 0,
        away_score: 0,
        current_inning: 1,
        is_top_inning: true,
        total_innings: innings,
        status: 'scheduled',
        started_at: null,
        completed_at: null
      })
      .select('id')
      .single();

    if (gameError || !game) {
      console.error('Error creating game:', gameError);
      return {
        data: null,
        success: false,
        error: gameError?.message || 'Failed to create game'
      };
    }

    const gameId = game.id;

    // Note: We don't create the game_snapshots record here because it requires
    // home_team_id and away_team_id which are NOT NULL, but we don't know them yet.
    // The game_snapshots record will be created when the game starts (game_start event).

    console.log(`Successfully created new game with ID: ${gameId}`);
    return {
      data: { game_id: gameId },
      success: true
    };

  } catch (error) {
    console.error('Error in createNewGame:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to create new game'
    };
  }
}

// Tournament Admin API Functions

/**
 * Save tournament configuration settings
 */
export async function saveTournamentConfig(config: {
  tournament_id: string;
  pool_play_games: number;
  pool_play_innings: number;
  bracket_type: 'single_elimination' | 'double_elimination';
  bracket_innings: number;
  final_innings: number;
  team_size: number;
  is_active?: boolean;
  settings_locked?: boolean;
}): Promise<ApiResponse<any>> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .update({
        pool_play_games: config.pool_play_games,
        pool_play_innings: config.pool_play_innings,
        bracket_type: config.bracket_type,
        bracket_innings: config.bracket_innings,
        final_innings: config.final_innings,
        team_size: config.team_size,
        status: config.is_active ? 'in_progress' : 'upcoming',
        locked_status: config.settings_locked || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', config.tournament_id)
      .select()
      .single();

    if (error) {
      console.error('Error saving tournament configuration:', error);
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to save tournament configuration'
      };
    }

    return {
      data,
      success: true
    };
  } catch (error) {
    console.error('Error in saveTournamentConfig:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to save tournament configuration'
    };
  }
}

/**
 * Load tournament configuration settings
 */
export async function loadTournamentConfig(tournamentId: string): Promise<ApiResponse<any>> {
  try {
    // Query the tournaments table directly since configuration is stored there
          const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          pool_play_games,
          pool_play_innings,
          bracket_type,
          bracket_innings,
          final_innings,
          num_teams,
          team_size,
          status
        `)
        .eq('id', tournamentId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error loading tournament configuration:', error);
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to load tournament configuration'
      };
    }

    // If no tournament exists, return default values
    if (!data) {
      return {
        data: {
          tournament_id: tournamentId,
          pool_play_games: 3,
          pool_play_innings: 3,
          bracket_type: 'single_elimination',
          bracket_innings: 3,
          final_innings: 5,
          team_size: 4,
          is_active: false,
          settings_locked: false
        },
        success: true
      };
    }

    // Transform the data to match expected format
    return {
      data: {
        tournament_id: data.id,
        pool_play_games: data.pool_play_games,
        pool_play_innings: data.pool_play_innings,
        bracket_type: data.bracket_type,
        bracket_innings: data.bracket_innings,
        final_innings: data.final_innings,
        num_teams: data.num_teams,
        team_size: data.team_size,
        is_active: data.status === 'in_progress',
        settings_locked: data.status === 'in_progress'
      },
      success: true
    };
  } catch (error) {
    console.error('Error in loadTournamentConfig:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to load tournament configuration'
    };
  }
}

/**
 * Save player data with enhanced tournament admin fields
 */
export async function savePlayerData(players: Array<{
  id?: string;
  name: string;
  nickname?: string;
  email?: string;
  hometown?: string;
  current_town?: string;
  championships_won?: number;
}>): Promise<ApiResponse<Player[]>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .upsert(players.map(player => ({
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        email: player.email,
        hometown: player.hometown,
        current_town: player.current_town,
        championships_won: player.championships_won || 0,
        updated_at: new Date().toISOString()
      })))
      .select()
      .order('name');

    if (error) {
      console.error('Error saving player data:', error);
      return {
        data: [],
        success: false,
        error: error.message || 'Failed to save player data'
      };
    }

    return {
      data: data || [],
      success: true
    };
  } catch (error) {
    console.error('Error in savePlayerData:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to save player data'
    };
  }
}

/**
 * Save team assignments for tournament
 */
export async function saveTeamAssignments(assignments: Array<{
  tournament_id: string;
  team_id: string;
  team_name: string;
  player_ids: string[];
  is_locked?: boolean;
}>): Promise<ApiResponse<any[]>> {
  try {
    // Handle empty assignments (clear all teams)
    if (assignments.length === 0) {
      return {
        data: [],
        success: true
      };
    }

    // First, get the current tournament ID (we'll use the first assignment's tournament_id)
    const tournamentId = assignments[0]?.tournament_id;
    if (!tournamentId) {
      return {
        data: [],
        success: false,
        error: 'Tournament ID is required'
      };
    }

    // Clear existing tournament player assignments for this tournament
    await supabase
      .from('tournament_player_assignments')
      .delete()
      .eq('tournament_id', tournamentId);

    // Create or find teams in the global teams table and create player assignments
    const teamRecords: any[] = [];
    const playerAssignments: any[] = [];

    for (const assignment of assignments) {
      if (assignment.player_ids.length === 0) continue; // Skip empty teams
      
      // Try to find existing team by name first
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('name', assignment.team_name)
        .single();

      let teamRecord;
      if (existingTeam) {
        teamRecord = existingTeam;
      } else {
        // Create new team
        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: assignment.team_name,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)` // Random color
          })
          .select()
          .single();

        if (teamError) {
          console.error('Error creating team:', teamError);
          return {
            data: [],
            success: false,
            error: `Failed to create team: ${teamError.message}`
          };
        }
        teamRecord = newTeam;
      }
      
      teamRecords.push(teamRecord);

      // Create player assignments for this team
      assignment.player_ids.forEach((playerId: any) => {
        playerAssignments.push({
          tournament_id: tournamentId,
          player_id: playerId,
          team_id: teamRecord.id
        });
      });
    }

    // Insert all player assignments
    if (playerAssignments.length > 0) {
      const { error: assignmentError } = await supabase
        .from('tournament_player_assignments')
        .insert(playerAssignments);

      if (assignmentError) {
        console.error('Error creating player assignments:', assignmentError);
        return {
          data: [],
          success: false,
          error: `Failed to create player assignments: ${assignmentError.message}`
        };
      }
    }



    return {
      data: teamRecords || [],
      success: true
    };
  } catch (error) {
    console.error('Error in saveTeamAssignments:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to save team assignments'
    };
  }
}

/**
 * Load team assignments for tournament
 */
export async function loadTeamAssignments(tournamentId: string): Promise<ApiResponse<any[]>> {
  try {
    // Load player assignments from the tournament_player_assignments table
    const { data: playerAssignments, error: assignmentsError } = await supabase
      .from('tournament_player_assignments')
      .select(`
        team_id,
        player_id,
        teams:team_id (
          id,
          name,
          color
        ),
        players:player_id (
          id,
          name,
          nickname
        )
      `)
      .eq('tournament_id', tournamentId);

    if (assignmentsError) {
      console.error('Error loading player assignments:', assignmentsError);
      return {
        data: [],
        success: false,
        error: assignmentsError.message || 'Failed to load team assignments'
      };
    }

    if (!playerAssignments || playerAssignments.length === 0) {
      return {
        data: [],
        success: true
      };
    }

    // Group players by team and format for the admin interface
    const teamMap = new Map<string, any>();
    
    playerAssignments.forEach(assignment => {
      const teamId = assignment.team_id;
      const team = assignment.teams;
      const player = assignment.players;
      
      if (!team || !player) return;
      
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          tournament_id: tournamentId,
          team_id: teamId,
          team_name: (team as any).name,
          player_ids: [],
          players: [],
          is_locked: false // Add this for compatibility
        });
      }
      
      const teamData = teamMap.get(teamId);
      teamData.player_ids.push((player as any).id);
      teamData.players.push(player);
    });

    const teamAssignments = Array.from(teamMap.values());

    return {
      data: teamAssignments,
      success: true
    };
  } catch (error) {
    console.error('Error in loadTeamAssignments:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to load team assignments'
    };
  }
}

/**
 * Save individual player with tournament admin fields
 */
export async function savePlayer(player: {
  id?: string;
  name: string;
  nickname?: string;
  email?: string;
  avatar_url?: string;
  hometown?: string;
  current_town?: string;
  championships_won?: number;
}): Promise<ApiResponse<Player>> {
  try {
    const { data, error } = await supabase
      .from('players')
      .upsert({
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        email: player.email,
        avatar_url: player.avatar_url,
        hometown: player.hometown,
        current_town: player.current_town,
        championships_won: player.championships_won || 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving player:', error);
      return {
        data: null,
        success: false,
        error: error.message || 'Failed to save player'
      };
    }

    return {
      data,
      success: true
    };
  } catch (error) {
    console.error('Error in savePlayer:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to save player'
    };
  }
}

/**
 * Delete player
 */
export async function deletePlayer(playerId: string): Promise<ApiResponse<boolean>> {
  try {
    // Use MCP tools for database operations
    const response = await fetch('/api/players/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: false,
        success: false,
        error: errorData.error || 'Failed to delete player'
      };
    }

    return {
      data: true,
      success: true
    };
  } catch (error) {
    console.error('Error in deletePlayer:', error);
    return {
      data: false,
      success: false,
      error: 'Failed to delete player'
    };
  }
}

/**
 * Clear all team assignments and reset teams back to square 1
 */
export async function clearAllTeams(): Promise<ApiResponse<boolean>> {
  try {
    const response = await fetch('/api/teams/clear-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: false,
        success: false,
        error: errorData.error || 'Failed to clear team assignments'
      };
    }

    return {
      data: true,
      success: true
    };
  } catch (error) {
    console.error('Error in clearAllTeams:', error);
    return {
      data: false,
      success: false,
      error: 'Failed to clear team assignments'
    };
  }
}

// ================================
// TOURNAMENT MANAGEMENT FUNCTIONS
// ================================

/**
 * Create a new tournament record
 */
export async function createTournament(data: {
  name: string;
  start_date?: string;
  end_date?: string;
  location: string;
  tournament_number: number;
  status?: 'upcoming' | 'in_progress' | 'completed';
  pool_play_games?: number;
  pool_play_innings?: number;
  bracket_type?: BracketType;
  bracket_innings?: number;
  final_innings?: number;
  num_teams?: number;
  team_size?: number;
}): Promise<ApiResponse<TournamentRecord>> {
  try {
    const { data: result, error } = await supabase
      .from('tournaments')
      .insert([{
        ...data,
        // Provide defaults if not specified
        pool_play_games: data.pool_play_games || 2,
        pool_play_innings: data.pool_play_innings || 3,
        bracket_type: data.bracket_type || 'single_elimination',
        bracket_innings: data.bracket_innings || 3,
        final_innings: data.final_innings || 5,
        num_teams: data.num_teams || 4,
        team_size: data.team_size || 3
      }])
      .select()
      .single();

    if (error) {
      return {
        data: {} as TournamentRecord,
        success: false,
        error: error.message
      };
    }

    return {
      data: result,
      success: true
    };
  } catch (error) {
    console.error('Error creating tournament:', error);
    return {
      data: {} as TournamentRecord,
      success: false,
      error: 'Failed to create tournament'
    };
  }
}

/**
 * Update tournament settings
 */
export async function updateTournamentSettings(
  tournamentId: string,
  settings: {
    pool_play_games?: number;
    pool_play_innings?: number;
    bracket_type?: BracketType;
    bracket_innings?: number;
    final_innings?: number;
    num_teams?: number;
    team_size?: number;
    name?: string;
    start_date?: string;
    end_date?: string;
    location?: string;
    tournament_number?: number;
    status?: 'upcoming' | 'in_progress' | 'completed';
  }
): Promise<ApiResponse<TournamentRecord>> {
  try {
    const { data: result, error } = await supabase
      .from('tournaments')
      .update(settings)
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) {
      return {
        data: {} as TournamentRecord,
        success: false,
        error: error.message
      };
    }

    return {
      data: result,
      success: true
    };
  } catch (error) {
    console.error('Error updating tournament settings:', error);
    return {
      data: {} as TournamentRecord,
      success: false,
      error: 'Failed to update tournament settings'
    };
  }
}

/**
 * Get the current active tournament
 */
export async function getCurrentTournament(): Promise<ApiResponse<TournamentRecord | null>> {
  try {
    const currentYear = new Date().getFullYear();
    
    // First try to get a tournament with dates in the current year
    const { data: yearTournament, error: yearError } = await supabase
      .from('tournaments')
      .select('*')
      .gte('start_date', `${currentYear}-01-01`)
      .lt('start_date', `${currentYear + 1}-01-01`)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // If we found a tournament for the current year, return it
    if (!yearError && yearTournament) {
      return {
        data: yearTournament,
        success: true
      };
    }
    
    // Fallback: get the most recent tournament (for cases where dates aren't set)
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        success: false,
        error: error.message
      };
    }

    return {
      data: data,
      success: true
    };
  } catch (error) {
    console.error('Error fetching current tournament:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to fetch current tournament'
    };
  }
}

/**
 * Get all tournaments for historical view
 */
export async function getAllTournaments(): Promise<ApiResponse<TournamentRecord[]>> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('year', { ascending: false })
      .order('tournament_number', { ascending: false });

    if (error) {
      return {
        data: [],
        success: false,
        error: error.message
      };
    }

    return {
      data: data || [],
      success: true
    };
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return {
      data: [],
      success: false,
      error: 'Failed to fetch tournaments'
    };
  }
}

/**
 * Lock a tournament and save team assignments
 */
export async function lockTournament(
  tournamentId: string,
  teams: TeamDragDrop[]
): Promise<ApiResponse<boolean>> {
  try {
    // Use the API route to save teams server-side
    const response = await fetch(`/api/tournaments/${tournamentId}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teams }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        data: false,
        success: false,
        error: result.error || 'Failed to save teams'
      };
    }

    return {
      data: true,
      success: true
    };
  } catch (error) {
    console.error('Error locking tournament:', error);
    return {
      data: false,
      success: false,
      error: 'Failed to lock tournament'
    };
  }
}

/**
 * Unlock a tournament (for making changes)
 */
export async function unlockTournament(tournamentId: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('tournaments')
      .update({ locked_status: false })
      .eq('id', tournamentId);

    if (error) {
      return {
        data: false,
        success: false,
        error: error.message
      };
    }

    return {
      data: true,
      success: true
    };
  } catch (error) {
    console.error('Error unlocking tournament:', error);
    return {
      data: false,
      success: false,
      error: 'Failed to unlock tournament'
    };
  }
}

/**
 * Get tournament with teams and players
 */
export async function getTournamentWithTeams(tournamentId: string): Promise<ApiResponse<TournamentWithTeams | null>> {
  try {
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) {
      return {
        data: null,
        success: false,
        error: tournamentError.message
      };
    }

    // Get tournament player assignments with team and player details for this tournament
    const { data: assignments, error: assignmentsError } = await supabase
      .from('tournament_player_assignments')
      .select(`
        team_id,
        player_id,
        teams!inner (
          id,
          name,
          color
        ),
        players!inner (
          id,
          name,
          nickname,
          avatar_url,
          email,
          current_town,
          hometown,
          championships_won
        )
      `)
      .eq('tournament_id', tournamentId);

    if (assignmentsError) {
      return {
        data: null,
        success: false,
        error: assignmentsError.message
      };
    }

    // Group assignments by team to build teams with players
    const teamMap = new Map<string, any>();
    
    assignments?.forEach((assignment: any) => {
      const teamId = assignment.team_id;
      const team = assignment.teams;
      const player = assignment.players;

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          id: teamId,
          team_id: teamId,
          team_name: team.name,
          team_color: team.color,
          tournament_id: tournamentId,
          players: []
        });
      }

      teamMap.get(teamId).players.push(player);
    });

    // Convert map to array and sort by team name
    const teamsWithPlayers: TournamentTeamWithPlayers[] = Array.from(teamMap.values())
      .sort((a, b) => a.team_name.localeCompare(b.team_name));

    return {
      data: {
        ...tournament,
        teams: teamsWithPlayers
      },
      success: true
    };
  } catch (error) {
    console.error('Error fetching tournament with teams:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to fetch tournament data'
    };
  }
}

/**
 * Fix game lineup by replacing invalid players with valid team players
 */
export async function fixGameLineup(gameId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/games/${gameId}/fix-lineup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        success: false,
        error: data.error || 'Failed to fix game lineup'
      };
    }

    return {
      data: data,
      success: true
    };
  } catch (error) {
    console.error('Error fixing game lineup:', error);
    return {
      data: null,
      success: false,
      error: 'Failed to fix game lineup'
    };
  }
}

/**
 * Get player team assignments for current tournament
 */
export async function getPlayerTeamAssignments(): Promise<ApiResponse<Map<string, string>>> {
  try {
    // Get current tournament
    const currentTournamentResponse = await getCurrentTournament();
    
    if (!currentTournamentResponse.success || !currentTournamentResponse.data) {
      return {
        data: new Map(),
        success: true
      };
    }

    const tournamentId = currentTournamentResponse.data.id;

    // Get player assignments from tournament_player_assignments table
    const { data: assignments, error } = await supabase
      .from('tournament_player_assignments')
      .select(`
        player_id,
        teams!inner (
          name
        )
      `)
      .eq('tournament_id', tournamentId);

    if (error) {
      console.error('Error fetching player team assignments:', error);
      return {
        data: new Map(),
        success: false,
        error: error.message
      };
    }

    // Create a map of player_id -> team_name
    const playerTeamMap = new Map<string, string>();
    assignments?.forEach((assignment: any) => {
      if (assignment.teams?.name) {
        playerTeamMap.set(assignment.player_id, assignment.teams.name);
      }
    });

    return {
      data: playerTeamMap,
      success: true
    };
  } catch (error) {
    console.error('Error in getPlayerTeamAssignments:', error);
    return {
      data: new Map(),
      success: false,
      error: 'Failed to fetch player team assignments'
    };
  }
}