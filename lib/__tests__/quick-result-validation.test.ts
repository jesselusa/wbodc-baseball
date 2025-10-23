// Mock Supabase to avoid ESM/node import issues when importing lib/api
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}));

import { validateGameEndEvent } from '../api';
import { GameSnapshot } from '../types';

describe('Quick Result Validation', () => {
  const baseSnapshot: GameSnapshot = {
    game_id: 'g1',
    current_inning: 3,
    is_top_of_inning: true,
    outs: 1,
    balls: 0,
    strikes: 0,
    score_home: 2,
    score_away: 2,
    home_team_id: 'h1',
    away_team_id: 'a1',
    base_runners: { first: null, second: null, third: null },
    home_lineup: ['h1p1'],
    away_lineup: ['a1p1'],
    home_lineup_position: 0,
    away_lineup_position: 0,
    status: 'in_progress',
    last_updated: new Date().toISOString()
  };

  it('rejects live end when final scores differ from snapshot', () => {
    const result = validateGameEndEvent({
      final_score_home: 3,
      final_score_away: 2
    } as any, baseSnapshot);
    expect(result.isValid).toBe(false);
  });

  it('accepts quick_result end when final scores differ from snapshot', () => {
    const result = validateGameEndEvent({
      final_score_home: 3,
      final_score_away: 2,
      scoring_method: 'quick_result'
    } as any, baseSnapshot);
    expect(result.isValid).toBe(true);
  });
});


