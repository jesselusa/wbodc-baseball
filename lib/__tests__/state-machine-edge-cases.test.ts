import { BaseballGameStateMachine } from '../state-machine';
import { GameSnapshot, GameEvent, PitchEventPayload, FlipCupEventPayload } from '../types';

describe('BaseballGameStateMachine - Edge Cases', () => {
  // Helper function to create a basic game snapshot
  const createBasicSnapshot = (overrides: Partial<GameSnapshot> = {}): GameSnapshot => ({
    game_id: 'test-game-id',
    current_inning: 4,
    is_top_of_inning: true,
    outs: 0,
    balls: 1,
    strikes: 0,
    score_home: 8,
    score_away: 2,
    home_team_id: 'home-team',
    away_team_id: 'away-team',
    batter_id: 'af26618c-2643-4e87-bdcd-32a12cc8b744',
    catcher_id: 'catcher-1',
    base_runners: { 
      first: '7131ebc0-d148-465a-b8f1-340c7cc771be',
      second: 'eff82dbc-97a8-4278-bd1a-7690a21f5e89', 
      third: 'af26618c-2643-4e87-bdcd-32a12cc8b744' // Same as batter
    },
    home_lineup: ['home-1', 'home-2', 'home-3'],
    away_lineup: ['7131ebc0-d148-465a-b8f1-340c7cc771be', 'af26618c-2643-4e87-bdcd-32a12cc8b744', 'eff82dbc-97a8-4278-bd1a-7690a21f5e89'],
    home_lineup_position: 0,
    away_lineup_position: 1,
    umpire_id: 'umpire-1',
    status: 'in_progress',
    last_updated: '2024-01-01T00:00:00Z',
    ...overrides
  });

  // Helper function to create a basic event
  const createEvent = (type: string, payload: any): GameEvent => ({
    id: 'test-event-id',
    game_id: 'test-game-id',
    sequence_number: 1,
    type: type as any,
    payload,
    umpire_id: 'umpire-1',
    created_at: '2024-01-01T00:00:00Z'
  });

  test('should handle same player on third base and batting with double correctly', () => {
    console.log('=== Testing Same Player on Third + Batting with Double ===');
    
    const snapshot = createBasicSnapshot();
    
    console.log('Initial state:');
    console.log('  - Score away:', snapshot.score_away);
    console.log('  - Batter:', snapshot.batter_id);
    console.log('  - Runners:', snapshot.base_runners);
    
    // Create previous pitch event with second cup hit (double)
    const previousEvents = [
      createEvent('pitch', { 
        result: 'second cup hit', 
        batter_id: 'af26618c-2643-4e87-bdcd-32a12cc8b744', 
        catcher_id: 'catcher-1' 
      })
    ];

    const flipCupEvent = createEvent('flip_cup', { 
      result: 'offense wins', 
      batter_id: 'af26618c-2643-4e87-bdcd-32a12cc8b744', 
      catcher_id: 'catcher-1' 
    } as FlipCupEventPayload);

    const result = BaseballGameStateMachine.transition(snapshot, flipCupEvent, previousEvents);

    console.log('After flip cup:');
    console.log('  - Error:', result.error);
    console.log('  - Score away:', result.snapshot.score_away);
    console.log('  - Runners:', result.snapshot.base_runners);
    console.log('  - Side effects:', result.sideEffects);

    expect(result.error).toBeUndefined();
    
    // Expected: 2 runs should score (runner from 3rd + runner from 2nd)
    // Runner on 3rd (af26618c): scores (was same as batter)
    // Runner on 2nd (eff82dbc): scores  
    // Runner on 1st (7131ebc0): advances to 3rd
    // Batter (af26618c): goes to 2nd
    
    expect(result.snapshot.score_away).toBe(4); // 2 + 2 runs = 4
    expect(result.snapshot.base_runners.first).toBe(null);
    expect(result.snapshot.base_runners.second).toBe('af26618c-2643-4e87-bdcd-32a12cc8b744'); // Batter on 2nd
    expect(result.snapshot.base_runners.third).toBe('7131ebc0-d148-465a-b8f1-340c7cc771be'); // First base runner advances to 3rd
    
    // Check side effects
    const scoreEffect = result.sideEffects?.find(effect => effect.type === 'score_change');
    expect(scoreEffect).toBeDefined();
    expect(scoreEffect?.data.runsScored).toBe(2);
  });

  test('should calculate runs scored correctly for double with bases loaded', () => {
    // Test the calculateRunsScored function directly by using a simpler scenario
    const snapshot = createBasicSnapshot({
      base_runners: { 
        first: 'player-1',
        second: 'player-2', 
        third: 'player-3' // Different from batter
      },
      batter_id: 'batter-different'
    });
    
    const previousEvents = [
      createEvent('pitch', { 
        result: 'second cup hit', 
        batter_id: 'batter-different', 
        catcher_id: 'catcher-1' 
      })
    ];

    const flipCupEvent = createEvent('flip_cup', { 
      result: 'offense wins', 
      batter_id: 'batter-different', 
      catcher_id: 'catcher-1' 
    } as FlipCupEventPayload);

    const result = BaseballGameStateMachine.transition(snapshot, flipCupEvent, previousEvents);

    console.log('=== Testing Different Players - Bases Loaded Double ===');
    console.log('Initial runners:', snapshot.base_runners);
    console.log('Final score:', result.snapshot.score_away);
    console.log('Final runners:', result.snapshot.base_runners);
    console.log('Side effects:', result.sideEffects);

    expect(result.error).toBeUndefined();
    expect(result.snapshot.score_away).toBe(4); // 2 + 2 runs = 4
    
    const scoreEffect = result.sideEffects?.find(effect => effect.type === 'score_change');
    expect(scoreEffect?.data.runsScored).toBe(2);
  });
}); 