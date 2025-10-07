import { BaseballGameStateMachine, StateTransitionResult } from '../state-machine';
import { GameSnapshot, GameEvent, PitchEventPayload, FlipCupEventPayload, AtBatEventPayload, GameStartEventPayload, BaseRunners } from '../types';

describe('BaseballGameStateMachine', () => {
  // Helper function to create a basic game snapshot
  const createBasicSnapshot = (overrides: Partial<GameSnapshot> = {}): GameSnapshot => ({
    game_id: 'test-game-id',
    current_inning: 1,
    is_top_of_inning: true,
    outs: 0,
    balls: 0,
    strikes: 0,
    score_home: 0,
    score_away: 0,
    home_team_id: 'home-team',
    away_team_id: 'away-team',
    batter_id: 'batter-1',
    catcher_id: 'catcher-1',
    base_runners: { first: null, second: null, third: null },
    home_lineup: ['home-1', 'home-2', 'home-3'],
    away_lineup: ['away-1', 'away-2', 'away-3'],
    home_lineup_position: 0,
    away_lineup_position: 0,
    umpire_id: 'umpire-1',
    status: 'in_progress',
    last_updated: '2024-01-01T00:00:00Z',
    ...overrides
  });

  // Helper function to create a basic event
  const createEvent = (type: string, payload: any): GameEvent => ({
    id: 'test-event-id',
    game_id: 'test-game-id',
    type: type as any,
    payload,
    umpire_id: 'umpire-1',
    sequence_number: 1,
    created_at: '2024-01-01T00:00:00Z'
  });

  describe('Pitch Events', () => {
    test('should handle strike correctly', () => {
      const snapshot = createBasicSnapshot({ strikes: 1 });
      const event = createEvent('pitch', { result: 'strike', batter_id: 'batter-1', catcher_id: 'catcher-1' } as PitchEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.strikes).toBe(2);
      expect(result.snapshot.balls).toBe(0);
    });

    test('should handle ball correctly', () => {
      const snapshot = createBasicSnapshot({ balls: 2 });
      const event = createEvent('pitch', { result: 'ball', batter_id: 'batter-1', catcher_id: 'catcher-1' } as PitchEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.balls).toBe(3);
      expect(result.snapshot.strikes).toBe(0);
    });

    test('should handle foul ball correctly', () => {
      const snapshot = createBasicSnapshot({ strikes: 1 });
      const event = createEvent('pitch', { result: 'foul ball', batter_id: 'batter-1', catcher_id: 'catcher-1' } as PitchEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.strikes).toBe(2);
    });

    test('should add strike on foul ball with 2 strikes (unique baseball rule)', () => {
      const snapshot = createBasicSnapshot({ strikes: 2 });
      const event = createEvent('pitch', { result: 'foul ball', batter_id: 'batter-1', catcher_id: 'catcher-1' } as PitchEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.strikes).toBe(3); // Should increase to 3 strikes (strikeout)
    });

    test('should handle cup hits without changing count', () => {
      const snapshot = createBasicSnapshot({ balls: 2, strikes: 1 });
      const event = createEvent('pitch', { result: 'second cup hit', batter_id: 'batter-1', catcher_id: 'catcher-1' } as PitchEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.balls).toBe(2); // Unchanged
      expect(result.snapshot.strikes).toBe(1); // Unchanged
    });
  });

  describe('Flip Cup Events', () => {
    test('should handle offense wins with single (first cup hit)', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: 'runner-1', second: 'runner-2', third: 'runner-3' },
        score_away: 5
      });
      
      // Create previous pitch event with first cup hit
      const previousEvents = [
        createEvent('pitch', { result: 'first cup hit', batter_id: 'batter-1', catcher_id: 'catcher-1' })
      ];

      const event = createEvent('flip_cup', { 
        result: 'offense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, previousEvents);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_away).toBe(6); // Runner from third scores
      expect(result.snapshot.base_runners.first).toBe('batter-1'); // Batter on first
      expect(result.snapshot.base_runners.second).toBe('runner-1'); // First base runner advances to second
      expect(result.snapshot.base_runners.third).toBe('runner-2'); // Second base runner advances to third
      expect(result.snapshot.balls).toBe(0); // Count reset
      expect(result.snapshot.strikes).toBe(0); // Count reset
    });

    test('should handle offense wins with double (second cup hit)', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: 'runner-1', second: 'runner-2', third: 'runner-3' },
        score_away: 3
      });
      
      const previousEvents = [
        createEvent('pitch', { result: 'second cup hit', batter_id: 'batter-1', catcher_id: 'catcher-1' })
      ];

      const event = createEvent('flip_cup', { 
        result: 'offense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, previousEvents);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_away).toBe(5); // Two runs score (third and second base runners)
      expect(result.snapshot.base_runners.first).toBe(null);
      expect(result.snapshot.base_runners.second).toBe('batter-1'); // Batter on second
      expect(result.snapshot.base_runners.third).toBe('runner-1'); // First base runner advances to third
    });

    test('should handle offense wins with triple (third cup hit)', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: 'runner-1', second: 'runner-2', third: 'runner-3' },
        score_home: 2,
        is_top_of_inning: false
      });
      
      const previousEvents = [
        createEvent('pitch', { result: 'third cup hit', batter_id: 'batter-1', catcher_id: 'catcher-1' })
      ];

      const event = createEvent('flip_cup', { 
        result: 'offense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, previousEvents);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_home).toBe(5); // All three runners score
      expect(result.snapshot.base_runners.first).toBe(null);
      expect(result.snapshot.base_runners.second).toBe(null);
      expect(result.snapshot.base_runners.third).toBe('batter-1'); // Batter on third
    });

    test('should handle offense wins with homerun (fourth cup hit)', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: 'runner-1', second: 'runner-2', third: 'runner-3' },
        score_away: 1
      });
      
      const previousEvents = [
        createEvent('pitch', { result: 'fourth cup hit', batter_id: 'batter-1', catcher_id: 'catcher-1' })
      ];

      const event = createEvent('flip_cup', { 
        result: 'offense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, previousEvents);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_away).toBe(5); // All runners + batter score (4 runs)
      expect(result.snapshot.base_runners.first).toBe(null);
      expect(result.snapshot.base_runners.second).toBe(null);
      expect(result.snapshot.base_runners.third).toBe(null);
    });

    test('should handle defense wins', () => {
      const snapshot = createBasicSnapshot({
        outs: 1,
        base_runners: { first: 'runner-1', second: null, third: null }
      });

      const event = createEvent('flip_cup', { 
        result: 'defense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, []);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.outs).toBe(2);
      expect(result.snapshot.base_runners.first).toBe('runner-1'); // Runners stay
      expect(result.snapshot.balls).toBe(0); // Count reset
      expect(result.snapshot.strikes).toBe(0); // Count reset
    });

    test('should advance lineup after flip cup', () => {
      const snapshot = createBasicSnapshot({
        away_lineup: ['batter-1', 'batter-2', 'batter-3'],
        away_lineup_position: 0,
        batter_id: 'batter-1'
      });

      const event = createEvent('flip_cup', { 
        result: 'defense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, []);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.away_lineup_position).toBe(1);
      expect(result.snapshot.batter_id).toBe('batter-2');
    });

    test('should change inning when 3 outs reached', () => {
      const snapshot = createBasicSnapshot({
        outs: 2,
        current_inning: 1,
        is_top_of_inning: true
      });

      const event = createEvent('flip_cup', { 
        result: 'defense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, []);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.outs).toBe(0); // Reset for new inning
      expect(result.snapshot.current_inning).toBe(1); // Same inning
      expect(result.snapshot.is_top_of_inning).toBe(false); // Bottom of inning
      expect(result.snapshot.base_runners).toEqual({ first: null, second: null, third: null }); // Cleared
    });
  });

  describe('At-Bat Events', () => {
    test('should handle walk correctly', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: 'runner-1', second: null, third: null }
      });

      const event = createEvent('at_bat', { 
        result: 'walk', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as AtBatEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.base_runners.first).toBe('batter-1');
      expect(result.snapshot.base_runners.second).toBe('runner-1'); // Forced advance
    });

    test('should handle strikeout correctly', () => {
      const snapshot = createBasicSnapshot({ outs: 1 });

      const event = createEvent('at_bat', { 
        result: 'out', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as AtBatEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.outs).toBe(2);
    });

    test('should handle single correctly', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: null, second: 'runner-2', third: 'runner-3' },
        score_away: 2
      });

      const event = createEvent('at_bat', { 
        result: 'single', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as AtBatEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_away).toBe(3); // Runner from third scores
      expect(result.snapshot.base_runners.first).toBe('batter-1');
      expect(result.snapshot.base_runners.second).toBe(null);
      expect(result.snapshot.base_runners.third).toBe('runner-2'); // Runner from second advances to third
    });

    test('should handle triple with runner on first correctly', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: 'runner-1', second: null, third: null },
        score_away: 2
      });

      const event = createEvent('at_bat', { 
        result: 'triple', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as AtBatEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_away).toBe(3); // Runner from first scores (1+3=4)
      expect(result.snapshot.base_runners.first).toBe(null); // Should be empty
      expect(result.snapshot.base_runners.second).toBe(null); // Should be empty
      expect(result.snapshot.base_runners.third).toBe('batter-1'); // Batter goes to third
    });

    test('should handle triple with bases loaded correctly', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: 'runner-1', second: 'runner-2', third: 'runner-3' },
        score_home: 0,
        is_top_of_inning: false // Home team batting
      });

      const event = createEvent('at_bat', { 
        result: 'triple', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as AtBatEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_home).toBe(3); // All 3 runners score
      expect(result.snapshot.base_runners.first).toBe(null); // Should be empty
      expect(result.snapshot.base_runners.second).toBe(null); // Should be empty
      expect(result.snapshot.base_runners.third).toBe('batter-1'); // Only batter on third
    });
  });

  describe('Game Start Events', () => {
    test('should initialize game correctly', () => {
      const snapshot = createBasicSnapshot({ status: 'not_started' });
      
      const event = createEvent('game_start', {
        umpire_id: 'umpire-1',
        lineups: {
          home: ['home-1', 'home-2', 'home-3'],
          away: ['away-1', 'away-2', 'away-3']
        }
      } as GameStartEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.status).toBe('in_progress');
      expect(result.snapshot.current_inning).toBe(1);
      expect(result.snapshot.is_top_of_inning).toBe(true);
      expect(result.snapshot.outs).toBe(0);
      expect(result.snapshot.balls).toBe(0);
      expect(result.snapshot.strikes).toBe(0);
      expect(result.snapshot.score_home).toBe(0);
      expect(result.snapshot.score_away).toBe(0);
      expect(result.snapshot.batter_id).toBe('away-1'); // Away team bats first
      expect(result.snapshot.base_runners).toEqual({ first: null, second: null, third: null });
    });
  });

  describe('Game End Events (Quick Result vs Live)', () => {
    test('should mark completed with live method by default (no quick flag)', () => {
      const snapshot = createBasicSnapshot({ status: 'in_progress', score_home: 2, score_away: 1 });
      const event = createEvent('game_end', {
        final_score_home: 2,
        final_score_away: 1
      });

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.status).toBe('completed');
      expect(result.snapshot.score_home).toBe(2);
      expect(result.snapshot.score_away).toBe(1);
      expect(result.snapshot.scoring_method).toBe('live');
      expect(result.snapshot.is_quick_result).toBe(false);
    });

    test('should mark completed with quick_result and set flag when provided', () => {
      const snapshot = createBasicSnapshot({ status: 'in_progress', score_home: 0, score_away: 0 });
      const event = createEvent('game_end', {
        final_score_home: 7,
        final_score_away: 4,
        scoring_method: 'quick_result'
      });

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.status).toBe('completed');
      expect(result.snapshot.score_home).toBe(7);
      expect(result.snapshot.score_away).toBe(4);
      expect(result.snapshot.scoring_method).toBe('quick_result');
      expect(result.snapshot.is_quick_result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle same player on base and batting (lineup cycling)', () => {
      const snapshot = createBasicSnapshot({
        base_runners: { first: null, second: null, third: 'batter-1' },
        batter_id: 'batter-1' // Same player on third and batting
      });

      const previousEvents = [
        createEvent('pitch', { result: 'first cup hit', batter_id: 'batter-1', catcher_id: 'catcher-1' })
      ];

      const event = createEvent('flip_cup', { 
        result: 'offense wins', 
        batter_id: 'batter-1', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, previousEvents);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.score_away).toBe(1); // Player scores from third
      expect(result.snapshot.base_runners.first).toBe('batter-1'); // Same player gets on first as batter
      expect(result.snapshot.base_runners.third).toBe(null); // No longer on third
    });

    test('should reject transitions on completed games', () => {
      const snapshot = createBasicSnapshot({ status: 'completed' });
      const event = createEvent('pitch', { result: 'strike', batter_id: 'batter-1', catcher_id: 'catcher-1' });

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBe('Cannot modify completed games');
      expect(result.snapshot).toEqual(snapshot); // Unchanged
    });

    test('should reject gameplay events when game not in progress', () => {
      const snapshot = createBasicSnapshot({ status: 'not_started' });
      const event = createEvent('pitch', { result: 'strike', batter_id: 'batter-1', catcher_id: 'catcher-1' });

      const result = BaseballGameStateMachine.transition(snapshot, event);

      expect(result.error).toBe('Game must be in progress for gameplay events');
    });

    test('should handle lineup wraparound', () => {
      const snapshot = createBasicSnapshot({
        away_lineup: ['batter-1', 'batter-2', 'batter-3'],
        away_lineup_position: 2, // Last batter in lineup
        batter_id: 'batter-3'
      });

      const event = createEvent('flip_cup', { 
        result: 'defense wins', 
        batter_id: 'batter-3', 
        catcher_id: 'catcher-1' 
      } as FlipCupEventPayload);

      const result = BaseballGameStateMachine.transition(snapshot, event, []);

      expect(result.error).toBeUndefined();
      expect(result.snapshot.away_lineup_position).toBe(0); // Wraps around to first batter
      expect(result.snapshot.batter_id).toBe('batter-1');
    });
  });

  describe('State Machine Properties', () => {
    test('should be deterministic - same input produces same output', () => {
      const snapshot = createBasicSnapshot();
      const event = createEvent('pitch', { result: 'strike', batter_id: 'batter-1', catcher_id: 'catcher-1' });

      const result1 = BaseballGameStateMachine.transition(snapshot, event);
      const result2 = BaseballGameStateMachine.transition(snapshot, event);

      expect(result1.snapshot.strikes).toBe(result2.snapshot.strikes);
      expect(result1.snapshot.balls).toBe(result2.snapshot.balls);
    });

    test('should be immutable - original snapshot unchanged', () => {
      const snapshot = createBasicSnapshot({ strikes: 1 });
      const originalSnapshot = { ...snapshot };
      const event = createEvent('pitch', { result: 'strike', batter_id: 'batter-1', catcher_id: 'catcher-1' });

      BaseballGameStateMachine.transition(snapshot, event);

      expect(snapshot).toEqual(originalSnapshot); // Original unchanged
    });
  });
}); 