import { GameSnapshot, GameEvent, EventType, EventPayload, PitchEventPayload, FlipCupEventPayload, AtBatEventPayload, GameStartEventPayload, GameEndEventPayload, TakeoverEventPayload, UndoEventPayload, BaseRunners } from './types';

/**
 * Baseball Game State Machine
 * 
 * This is a pure function-based state machine that handles all game state transitions.
 * Each transition is deterministic: given a current state + event, it produces a new state.
 * 
 * Benefits:
 * - Predictable and testable
 * - Single source of truth for game logic
 * - Easy to debug and reason about
 * - Immutable state transitions
 */

export interface StateTransitionResult {
  snapshot: GameSnapshot;
  sideEffects?: StateTransitionSideEffect[];
  error?: string;
}

export interface StateTransitionSideEffect {
  type: 'score_change' | 'inning_change' | 'lineup_advance' | 'game_end' | 'game_start';
  data: any;
}

export class BaseballGameStateMachine {
  /**
   * Main state transition function
   * Pure function: (currentState, event) => newState
   */
  static transition(
    currentSnapshot: GameSnapshot, 
    event: GameEvent, 
    previousEvents?: GameEvent[]
  ): StateTransitionResult {
    try {
      // Validate the transition is allowed
      const validation = this.validateTransition(currentSnapshot, event, previousEvents);
      if (!validation.isValid) {
        return { 
          snapshot: currentSnapshot, 
          error: validation.error 
        };
      }

      // Apply the state transition based on event type
      switch (event.type) {
        case 'pitch':
          return this.handlePitchEvent(currentSnapshot, event.payload as PitchEventPayload);
        
        case 'flip_cup':
          return this.handleFlipCupEvent(currentSnapshot, event.payload as FlipCupEventPayload, previousEvents);
        
        case 'at_bat':
          return this.handleAtBatEvent(currentSnapshot, event.payload as AtBatEventPayload);
        
        case 'game_start':
          return this.handleGameStartEvent(currentSnapshot, event.payload as GameStartEventPayload);
        
        case 'game_end':
          return this.handleGameEndEvent(currentSnapshot, event.payload as GameEndEventPayload);
        
        case 'takeover':
          return this.handleTakeoverEvent(currentSnapshot, event.payload as TakeoverEventPayload);
        
        case 'undo':
          return this.handleUndoEvent(currentSnapshot, event.payload as UndoEventPayload, previousEvents);
        
        default:
          return { 
            snapshot: currentSnapshot, 
            error: `Unsupported event type: ${event.type}` 
          };
      }
    } catch (error) {
      return { 
        snapshot: currentSnapshot, 
        error: `State transition failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validate that a transition is allowed given current state and event
   */
  private static validateTransition(
    snapshot: GameSnapshot, 
    event: GameEvent, 
    previousEvents?: GameEvent[]
  ): { isValid: boolean; error?: string } {
    // Basic game state validation
    if (snapshot.status === 'completed' && event.type !== 'undo' && event.type !== 'edit') {
      return { isValid: false, error: 'Cannot modify completed games' };
    }

    // Event-specific validation
    switch (event.type) {
      case 'pitch':
      case 'flip_cup':
      case 'at_bat':
        if (snapshot.status !== 'in_progress') {
          return { isValid: false, error: 'Game must be in progress for gameplay events' };
        }
        break;
      
      case 'game_start':
        if (snapshot.status === 'in_progress') {
          return { isValid: false, error: 'Game is already in progress' };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Handle pitch events (strikes, balls, fouls, cup hits)
   */
  private static handlePitchEvent(
    snapshot: GameSnapshot, 
    payload: PitchEventPayload
  ): StateTransitionResult {
    const newSnapshot = { ...snapshot };
    const { result } = payload;

    switch (result) {
      case 'strike':
        newSnapshot.strikes = Math.min(newSnapshot.strikes + 1, 3);
        break;
      
      case 'foul ball':
        // Foul ball is a strike unless batter already has 2 strikes
        if (newSnapshot.strikes < 2) {
          newSnapshot.strikes += 1;
        }
        break;
      
      case 'ball':
        newSnapshot.balls = Math.min(newSnapshot.balls + 1, 4);
        break;
      
      case 'first cup hit':
      case 'second cup hit':
      case 'third cup hit':
      case 'fourth cup hit':
        // Cup hits don't change count - they trigger flip cup
        break;
    }

    // Update metadata
    newSnapshot.last_updated = new Date().toISOString();

    return { snapshot: newSnapshot };
  }

  /**
   * Handle flip cup events (offense wins/defense wins)
   */
  private static handleFlipCupEvent(
    snapshot: GameSnapshot, 
    payload: FlipCupEventPayload,
    previousEvents?: GameEvent[]
  ): StateTransitionResult {
    const newSnapshot = { ...snapshot };
    const { result } = payload;
    const sideEffects: StateTransitionSideEffect[] = [];

    if (result === 'offense wins') {
      // Determine hit type from previous cup hit event
      const hitType = this.determineHitTypeFromPreviousEvent(previousEvents);
      const basesToAdvance = this.getBasesForHitType(hitType);
      
      // Calculate runs scored BEFORE updating runners
      const runsScored = this.calculateRunsScored(newSnapshot.base_runners, basesToAdvance);
      
      // Update base runners
      newSnapshot.base_runners = this.advanceRunners(
        newSnapshot.base_runners, 
        basesToAdvance, 
        payload.batter_id
      );
      
      // Update score
      if (newSnapshot.is_top_of_inning) {
        newSnapshot.score_away += runsScored;
      } else {
        newSnapshot.score_home += runsScored;
      }

      if (runsScored > 0) {
        sideEffects.push({
          type: 'score_change',
          data: { runsScored, team: newSnapshot.is_top_of_inning ? 'away' : 'home' }
        });
      }
    } else {
      // Defense wins - batter is out
      newSnapshot.outs += 1;
    }

    // Reset count after flip cup
    newSnapshot.balls = 0;
    newSnapshot.strikes = 0;

    // Check for inning change or lineup advancement
    if (newSnapshot.outs >= 3) {
      const inningResult = this.changeInning(newSnapshot);
      Object.assign(newSnapshot, inningResult.snapshot);
      sideEffects.push(...(inningResult.sideEffects || []));
    } else {
      const lineupResult = this.advanceLineupPosition(newSnapshot);
      Object.assign(newSnapshot, lineupResult.snapshot);
      sideEffects.push(...(lineupResult.sideEffects || []));
    }

    newSnapshot.last_updated = new Date().toISOString();

    return { snapshot: newSnapshot, sideEffects };
  }

  /**
   * Handle at-bat completion events (walks, strikeouts, hits)
   */
  private static handleAtBatEvent(
    snapshot: GameSnapshot, 
    payload: AtBatEventPayload
  ): StateTransitionResult {
    const newSnapshot = { ...snapshot };
    const { result, batter_id } = payload;
    const sideEffects: StateTransitionSideEffect[] = [];

    switch (result) {
      case 'out':
        newSnapshot.outs += 1;
        break;
      
      case 'walk':
        // Walk advances batter to first, forces other runners
        newSnapshot.base_runners = this.advanceRunners(
          newSnapshot.base_runners, 
          1, 
          batter_id, 
          true // force advance
        );
        break;
      
      case 'single':
        newSnapshot.base_runners = this.advanceRunners(newSnapshot.base_runners, 1, batter_id);
        break;
      
      case 'double':
        newSnapshot.base_runners = this.advanceRunners(newSnapshot.base_runners, 2, batter_id);
        break;
      
      case 'triple':
        newSnapshot.base_runners = this.advanceRunners(newSnapshot.base_runners, 3, batter_id);
        break;
      
      case 'homerun':
        newSnapshot.base_runners = this.advanceRunners(newSnapshot.base_runners, 4, batter_id);
        break;
    }

    // Update score for hits
    if (['walk', 'single', 'double', 'triple', 'homerun'].includes(result)) {
      const basesToAdvance = this.getBasesForHitType(result);
      const runsScored = this.calculateRunsScored(snapshot.base_runners, basesToAdvance);
      
      if (newSnapshot.is_top_of_inning) {
        newSnapshot.score_away += runsScored;
      } else {
        newSnapshot.score_home += runsScored;
      }

      if (runsScored > 0) {
        sideEffects.push({
          type: 'score_change',
          data: { runsScored, team: newSnapshot.is_top_of_inning ? 'away' : 'home' }
        });
      }
    }

    // Reset count
    newSnapshot.balls = 0;
    newSnapshot.strikes = 0;

    // Check for inning change or lineup advancement
    if (newSnapshot.outs >= 3) {
      const inningResult = this.changeInning(newSnapshot);
      Object.assign(newSnapshot, inningResult.snapshot);
      sideEffects.push(...(inningResult.sideEffects || []));
    } else {
      const lineupResult = this.advanceLineupPosition(newSnapshot);
      Object.assign(newSnapshot, lineupResult.snapshot);
      sideEffects.push(...(lineupResult.sideEffects || []));
    }

    newSnapshot.last_updated = new Date().toISOString();

    return { snapshot: newSnapshot, sideEffects };
  }

  /**
   * Handle game start events
   */
  private static handleGameStartEvent(
    snapshot: GameSnapshot, 
    payload: GameStartEventPayload
  ): StateTransitionResult {
    const newSnapshot = { ...snapshot };

    // Initialize game state
    newSnapshot.status = 'in_progress';
    newSnapshot.current_inning = 1;
    newSnapshot.is_top_of_inning = true;
    newSnapshot.outs = 0;
    newSnapshot.balls = 0;
    newSnapshot.strikes = 0;
    newSnapshot.score_home = 0;
    newSnapshot.score_away = 0;
    newSnapshot.umpire_id = payload.umpire_id;

    // Set team IDs from the payload
    newSnapshot.home_team_id = payload.home_team_id;
    newSnapshot.away_team_id = payload.away_team_id;

    // Set up lineups
    newSnapshot.home_lineup = payload.lineups.home;
    newSnapshot.away_lineup = payload.lineups.away;
    newSnapshot.home_lineup_position = 0;
    newSnapshot.away_lineup_position = 0;

    // Set first batter (away team bats first)
    newSnapshot.batter_id = payload.lineups.away[0];

    // Set catcher (on deck batter - next in batting order)
    newSnapshot.catcher_id = payload.lineups.away[1] || payload.lineups.away[0];

    // Clear base runners
    newSnapshot.base_runners = { first: null, second: null, third: null };

    newSnapshot.last_updated = new Date().toISOString();

    return { 
      snapshot: newSnapshot,
      sideEffects: [{ 
        type: 'game_start', 
        data: { 
          home_team_id: payload.home_team_id,
          away_team_id: payload.away_team_id,
          started_at: newSnapshot.last_updated 
        } 
      }] 
    };
  }

  /**
   * Handle game end events
   */
  private static handleGameEndEvent(
    snapshot: GameSnapshot, 
    payload: GameEndEventPayload
  ): StateTransitionResult {
    const newSnapshot = { ...snapshot };

    newSnapshot.status = 'completed';
    newSnapshot.score_home = payload.final_score_home;
    newSnapshot.score_away = payload.final_score_away;
    newSnapshot.last_updated = new Date().toISOString();

    return { 
      snapshot: newSnapshot, 
      sideEffects: [{ type: 'game_end', data: payload }] 
    };
  }

  /**
   * Handle umpire takeover events
   */
  private static handleTakeoverEvent(
    snapshot: GameSnapshot, 
    payload: TakeoverEventPayload
  ): StateTransitionResult {
    const newSnapshot = { ...snapshot };

    newSnapshot.umpire_id = payload.new_umpire_id;
    newSnapshot.last_updated = new Date().toISOString();

    return { snapshot: newSnapshot };
  }

  private static handleUndoEvent(
    snapshot: GameSnapshot,
    payload: UndoEventPayload,
    previousEvents?: GameEvent[]
  ): StateTransitionResult {
    // For now, undo functionality requires rebuilding the state from scratch
    // This is a simplified implementation that just returns the current snapshot
    // A full implementation would need to replay all events except the undone one
    
    return { 
      snapshot: snapshot, 
      error: 'Undo functionality not yet implemented - please use database-level event deletion' 
    };
  }

  /**
   * Utility Functions
   */

  private static determineHitTypeFromPreviousEvent(previousEvents?: GameEvent[]): string {
    if (!previousEvents || previousEvents.length === 0) {
      return 'single'; // Default fallback
    }

    // Find the most recent pitch event with a cup hit
    const recentPitchEvent = previousEvents
      .filter(event => event.type === 'pitch')
      .reverse() // Most recent first
      .find(event => {
        const payload = event.payload as PitchEventPayload;
        return ['first cup hit', 'second cup hit', 'third cup hit', 'fourth cup hit'].includes(payload.result);
      });

    if (recentPitchEvent) {
      const payload = recentPitchEvent.payload as PitchEventPayload;
      switch (payload.result) {
        case 'first cup hit': return 'single';
        case 'second cup hit': return 'double';
        case 'third cup hit': return 'triple';
        case 'fourth cup hit': return 'homerun';
      }
    }

    return 'single'; // Default fallback
  }

  private static getBasesForHitType(hitType: string): number {
    switch (hitType) {
      case 'single': return 1;
      case 'double': return 2;
      case 'triple': return 3;
      case 'homerun': return 4;
      case 'walk': return 1;
      default: return 1;
    }
  }

  private static calculateRunsScored(runners: BaseRunners, basesToAdvance: number): number {
    let runs = 0;

    // Count runners who will score
    if (runners.third && basesToAdvance >= 1) runs++;
    if (runners.second && basesToAdvance >= 2) runs++;
    if (runners.first && basesToAdvance >= 3) runs++;
    
    // Batter scores on homerun
    if (basesToAdvance >= 4) runs++;

    return runs;
  }

  private static advanceRunners(
    runners: BaseRunners, 
    bases: number, 
    batterId: string, 
    forceAdvance: boolean = false
  ): BaseRunners {
    const newRunners: BaseRunners = { first: null, second: null, third: null };

    // Move existing runners (process in order: third, second, first to avoid conflicts)
    
    // Third base runner
    if (runners.third) {
      const newPosition = 3 + bases;
      if (newPosition < 4) {
        // Runner stays on base (shouldn't happen with normal hits, but handle it)
        newRunners.third = runners.third;
      }
      // If newPosition >= 4, runner scores (no placement needed - correctly handled)
    }

    // Second base runner  
    if (runners.second) {
      const newPosition = 2 + bases;
      if (newPosition < 4) {
        // Place runner on their calculated base if available
        if (newPosition === 3 && !newRunners.third) {
          newRunners.third = runners.second;
        } else if (newPosition === 2 && !newRunners.second) {
          newRunners.second = runners.second;
        } else if (newPosition === 1 && !newRunners.first) {
          newRunners.first = runners.second;
        } else if (forceAdvance) {
          // Force advance - find next available base going forward
          if (!newRunners.third) newRunners.third = runners.second;
          else if (!newRunners.second) newRunners.second = runners.second;
          else if (!newRunners.first) newRunners.first = runners.second;
        }
      }
      // If newPosition >= 4, runner scores (no placement needed)
    }

    // First base runner
    if (runners.first) {
      const newPosition = 1 + bases;
      if (newPosition < 4) {
        // Place runner on their calculated base if available
        if (newPosition === 3 && !newRunners.third) {
          newRunners.third = runners.first;
        } else if (newPosition === 2 && !newRunners.second) {
          newRunners.second = runners.first;
        } else if (newPosition === 1 && !newRunners.first) {
          newRunners.first = runners.first;
        } else if (forceAdvance) {
          // Force advance - find next available base going forward
          if (!newRunners.third) newRunners.third = runners.first;
          else if (!newRunners.second) newRunners.second = runners.first;
          else if (!newRunners.first) newRunners.first = runners.first;
        }
      }
      // If newPosition >= 4, runner scores (no placement needed)
    }

    // Place batter on base (unless home run)
    if (bases < 4) {
      if (bases === 3 && !newRunners.third) {
        newRunners.third = batterId;
      } else if (bases === 2 && !newRunners.second) {
        newRunners.second = batterId;
      } else if (bases === 1 && !newRunners.first) {
        newRunners.first = batterId;
      } else if (forceAdvance) {
        // Force advance batter - this is typically only for walks
        // Place batter on lowest available base
        if (!newRunners.first) newRunners.first = batterId;
        else if (!newRunners.second) newRunners.second = batterId;
        else if (!newRunners.third) newRunners.third = batterId;
      }
      // If batter can't be placed anywhere (bases loaded), this is an error state
      // that should be handled at a higher level
    }

    return newRunners;
  }

  private static changeInning(snapshot: GameSnapshot): StateTransitionResult {
    const newSnapshot = { ...snapshot };
    const sideEffects: StateTransitionSideEffect[] = [];

    if (newSnapshot.is_top_of_inning) {
      // Switch to bottom of inning
      newSnapshot.is_top_of_inning = false;
    } else {
      // Go to next inning
      newSnapshot.current_inning += 1;
      newSnapshot.is_top_of_inning = true;
    }

    // Reset inning state
    newSnapshot.outs = 0;
    newSnapshot.balls = 0;
    newSnapshot.strikes = 0;
    newSnapshot.base_runners = { first: null, second: null, third: null };

    // Set current batter for the new inning/half-inning
    newSnapshot.batter_id = newSnapshot.is_top_of_inning 
      ? newSnapshot.away_lineup[newSnapshot.away_lineup_position]
      : newSnapshot.home_lineup[newSnapshot.home_lineup_position];

    // Set catcher (on deck batter - next in batting order)
    if (newSnapshot.is_top_of_inning) {
      const nextAwayPosition = (newSnapshot.away_lineup_position + 1) % newSnapshot.away_lineup.length;
      newSnapshot.catcher_id = newSnapshot.away_lineup[nextAwayPosition];
    } else {
      const nextHomePosition = (newSnapshot.home_lineup_position + 1) % newSnapshot.home_lineup.length;
      newSnapshot.catcher_id = newSnapshot.home_lineup[nextHomePosition];
    }

    sideEffects.push({
      type: 'inning_change',
      data: { 
        inning: newSnapshot.current_inning, 
        isTop: newSnapshot.is_top_of_inning 
      }
    });

    return { snapshot: newSnapshot, sideEffects };
  }

  private static advanceLineupPosition(snapshot: GameSnapshot): StateTransitionResult {
    const newSnapshot = { ...snapshot };
    const sideEffects: StateTransitionSideEffect[] = [];

    if (newSnapshot.is_top_of_inning) {
      newSnapshot.away_lineup_position = (newSnapshot.away_lineup_position + 1) % newSnapshot.away_lineup.length;
    } else {
      newSnapshot.home_lineup_position = (newSnapshot.home_lineup_position + 1) % newSnapshot.home_lineup.length;
    }

    // Update the current batter_id to the new batter
    newSnapshot.batter_id = newSnapshot.is_top_of_inning 
      ? newSnapshot.away_lineup[newSnapshot.away_lineup_position]
      : newSnapshot.home_lineup[newSnapshot.home_lineup_position];

    // Update catcher (on deck batter - next in batting order)
    if (newSnapshot.is_top_of_inning) {
      const nextAwayPosition = (newSnapshot.away_lineup_position + 1) % newSnapshot.away_lineup.length;
      newSnapshot.catcher_id = newSnapshot.away_lineup[nextAwayPosition];
    } else {
      const nextHomePosition = (newSnapshot.home_lineup_position + 1) % newSnapshot.home_lineup.length;
      newSnapshot.catcher_id = newSnapshot.home_lineup[nextHomePosition];
    }

    sideEffects.push({
      type: 'lineup_advance',
      data: { 
        newBatterId: newSnapshot.batter_id,
        position: newSnapshot.is_top_of_inning ? newSnapshot.away_lineup_position : newSnapshot.home_lineup_position
      }
    });

    return { snapshot: newSnapshot, sideEffects };
  }
} 