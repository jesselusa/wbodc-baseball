// Mocks for dependencies used by the route
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

jest.mock('../../lib/api', () => ({
  submitEvent: jest.fn(async () => ({
    success: true,
    event: { id: 'e1' },
    snapshot: {
      game_id: 'g1',
      status: 'completed',
      score_home: 3,
      score_away: 2,
      current_inning: 3,
      is_top_of_inning: false,
      outs: 0,
      balls: 0,
      strikes: 0,
      home_team_id: 'h1',
      away_team_id: 'a1',
      base_runners: { first: null, second: null, third: null },
      home_lineup: ['h1p1'],
      away_lineup: ['a1p1'],
      home_lineup_position: 0,
      away_lineup_position: 0,
      last_updated: new Date().toISOString(),
      scoring_method: 'quick_result',
      is_quick_result: true
    }
  }))
}));

// Mock admin client used by the route to update/read games
jest.mock('../../lib/supabase-admin', () => {
  const updateChain = {
    eq: jest.fn(async () => ({ data: null, error: null }))
  };
  const selectChain = {
    eq: jest.fn(() => ({
      single: jest.fn(async () => ({
        data: { id: 'g1', tournament_id: 'tournament1', is_round_robin: true },
        error: null
      }))
    }))
  };
  return {
    supabaseAdmin: {
      from: jest.fn((table: string) => ({
        update: jest.fn(() => updateChain),
        select: jest.fn(() => selectChain)
      }))
    }
  };
});

// Spy on tournament updaters
const standingsSpy = jest.fn(async () => ({ success: true, roundRobinComplete: false, totalTeams: 0, completedGames: 0, expectedGames: 0 }));
const bracketSpy = jest.fn(async () => ({ success: true, winnerAdvanced: false }));

jest.mock('../../lib/tournament-standings-updater', () => ({
  updateStandingsOnGameComplete: (...args: any[]) => standingsSpy(...args)
}));

jest.mock('../../lib/tournament-bracket-updater', () => ({
  updateBracketOnGameComplete: (...args: any[]) => bracketSpy(...args)
}));

// Shim minimal NextResponse to avoid importing next/server in unit tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any) => ({ status: (code: number) => ({ body, status: code }) })
  }
}));

import { POST } from '../../app/api/events/route';

describe('Events Route - quick result triggers tournament updaters', () => {
  it('calls standings and bracket updaters when game_end completes game', async () => {
    const req: any = {
      json: async () => ({
        game_id: 'g1',
        type: 'game_end',
        umpire_id: 'u1',
        payload: { final_score_home: 3, final_score_away: 2, scoring_method: 'quick_result' }
      })
    };

    const res = await POST(req as any);
    expect(standingsSpy).toHaveBeenCalledWith('tournament1', 'g1');
    expect(bracketSpy).toHaveBeenCalledWith('tournament1', 'g1');
  });
});


