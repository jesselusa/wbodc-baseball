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
  EventSubmissionRequest,
  EventSubmissionResponse,
  LiveGameStatus,
  BaseRunners
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
    status: 'active',
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
  
  if (result === 'out' && strikes < 2) {
    return { 
      isValid: false, 
      error: 'Strikeout requires 3 strikes (2 strikes + 1 more)' 
    };
  }
  
  return { isValid: true };
}

// Validate undo events
export function validateUndoEvent(
  payload: UndoEventPayload,
  gameSnapshot: GameSnapshot
): ValidationResult {
  const { target_event_id, reason } = payload;
  
  // Basic field validation
  if (!target_event_id) {
    return { isValid: false, error: 'Target event ID is required for undo events' };
  }
  
  // Game state validation
  if (gameSnapshot.status === 'completed') {
    return { isValid: false, error: 'Cannot undo events in completed games' };
  }
  
  // Reason validation (optional but recommended)
  if (reason && reason.length > 500) {
    return { isValid: false, error: 'Undo reason must be 500 characters or less' };
  }
  
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
  const { final_score_home, final_score_away, notes } = payload;
  
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
  if (final_score_home !== gameSnapshot.score_home || final_score_away !== gameSnapshot.score_away) {
    return { 
      isValid: false, 
      error: 'Final scores must match current game snapshot scores' 
    };
  }
  
  // Notes validation
  if (notes && notes.length > 1000) {
    return { isValid: false, error: 'Game end notes must be 1000 characters or less' };
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
    
    if (snapshotError || !snapshot) {
      return {
        event: {} as GameEvent,
        snapshot: {} as GameSnapshot,
        success: false,
        error: 'Could not fetch current game state'
      };
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
    
    // Validate the event
    const validation = validateEvent(request.type, request.payload, snapshot, previousEvent);
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
    const updatedSnapshot = await updateGameSnapshotWithStateMachine(event, snapshot);
    
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
  // Get recent events for context (needed for flip cup hit type determination)
  const recentEvents = await getRecentGameEvents(currentSnapshot.game_id, 10);
  
  // Process the event using the state machine
  const result = BaseballGameStateMachine.transition(currentSnapshot, event, recentEvents);
  
  if (result.error) {
    console.error('[StateMachine] Error processing event:', result.error);
    throw new Error(`State machine error: ${result.error}`);
  }
  
  const newSnapshot = result.snapshot;
  
  // Save the updated snapshot to the database
  const { data, error } = await supabase
    .from('game_snapshots')
    .upsert(newSnapshot)
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
      .select('id, name, description, status, start_date, end_date, created_at, updated_at')
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
          description: tournament.description,
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
        tournament:tournaments(id, name, description, status, start_date, end_date)
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
        description: game.tournament.description,
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
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching active tournament:', error);
      return {
        data: null,
        success: false,
        error: 'Failed to fetch active tournament',
      };
    }

    return {
      data: tournament ? {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
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
  await delay(200);

  try {
    return {
      data: [...mockTeams],
      success: true,
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: 'Failed to fetch teams',
    };
  }
}

export async function fetchPlayers(): Promise<ApiResponse<Player[]>> {
  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('id, name, nickname, email, created_at, updated_at')
      .order('name', { ascending: true });

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