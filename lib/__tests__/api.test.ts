// Mock Supabase to avoid ESM issues and network calls
jest.mock('@supabase/supabase-js', () => {
  const sampleGames = [
    { id: 'game1', home_team_id: 'team1', away_team_id: 'team2', tournament_id: 'tournament1', status: 'completed', updated_at: '2024-11-01T20:15:00Z', started_at: '2024-11-01T19:05:00Z', completed_at: '2024-11-01T20:15:00Z', home_score: 5, away_score: 3 },
    { id: 'gameB', home_team_id: 'team3', away_team_id: 'team4', tournament_id: 'tournament1', status: 'in_progress', updated_at: '2024-11-01T20:05:00Z', started_at: '2024-11-01T20:00:00Z', home_score: 2, away_score: 1 },
    { id: 'gameC', home_team_id: 'team5', away_team_id: 'team6', tournament_id: 'tournament1', status: 'scheduled', updated_at: '2024-11-01T19:55:00Z', home_score: 0, away_score: 0 },
  ];
  const sampleTeams = [
    { id: 'team1', name: 'Team 1' },
    { id: 'team2', name: 'Team 2' },
    { id: 'team3', name: 'Team 3' },
    { id: 'team4', name: 'Team 4' },
    { id: 'team5', name: 'Team 5' },
    { id: 'team6', name: 'Team 6' },
  ];
  const sampleTournaments = [
    { id: 'tournament1', name: 'Test Tournament', status: 'in_progress', start_date: '2024-11-01', end_date: '2024-11-03', created_at: '2024-11-01', updated_at: '2024-11-01' },
    { id: 'tournament2', name: 'Another Tournament', status: 'completed', start_date: '2024-10-01', end_date: '2024-10-03', created_at: '2024-10-01', updated_at: '2024-10-03' }
  ];

  function makeQuery(table) {
    const qb: any = {
      _table: table,
      _filters: {},
      _in: null,
      select: function () { return this; },
      eq: function (k, v) { this._filters[k] = v; return this; },
      in: function (k, values) { this._in = { column: k, values }; return this; },
      or: function () { return this; },
      order: function () { return this; },
      limit: function () { return this; },
      single: async function () {
        let data = baseDataFor(this._table);
        data = applyFilters(data, this._filters, this._in);
        return { data: data[0] || null, error: null };
      }
    };

    Object.defineProperty(qb, 'data', {
      get() { return null; }
    });
    Object.defineProperty(qb, 'error', {
      get() { return null; }
    });

    return new Proxy(qb, {
      get(target, prop) {
        if (prop === Symbol.toStringTag) return 'Query';
        if (prop === 'then') {
          // Allow await qb to resolve to { data, error }
          return (resolve) => {
            let data = baseDataFor(target._table);
            data = applyFilters(data, target._filters, target._in);
            resolve({ data, error: null });
          };
        }
        return target[prop];
      }
    });
  }

  function baseDataFor(table) {
    if (table === 'games') return sampleGames.slice();
    if (table === 'teams') return sampleTeams.slice();
    if (table === 'tournaments') return sampleTournaments.slice();
    return [];
  }

  function applyFilters(data, filters, inFilter) {
    let result = data;
    // eq filters
    Object.keys(filters || {}).forEach((k) => {
      result = result.filter((row) => row[k] === filters[k]);
    });
    // in filter
    if (inFilter && inFilter.values && inFilter.values.length) {
      result = result.filter((row) => inFilter.values.includes(row[inFilter.column]));
    }
    return result;
  }

  return {
    createClient: jest.fn(() => ({
      from: (table) => makeQuery(table)
    }))
  };
});
import {
  fetchGames,
  fetchGameById,
  fetchTournaments,
  fetchActiveTournament,
  fetchRecentGames,
  validateGameEndEvent
} from '../api';
import { GameSnapshot } from '../types';

describe('API Functions', () => {
  describe('fetchGames', () => {
    it('returns games successfully', async () => {
      const result = await fetchGames();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('returns games with correct structure', async () => {
      const result = await fetchGames();
      
      if (result.success && result.data && result.data.length > 0) {
        const game = result.data[0];
        expect(game).toHaveProperty('id');
        expect(game).toHaveProperty('home_team');
        expect(game).toHaveProperty('away_team');
        expect(game).toHaveProperty('status');
        expect(game).toHaveProperty('home_score');
        expect(game).toHaveProperty('away_score');
      }
    });

    it('filters games by status', async () => {
      const result = await fetchGames({ status: ['completed'] });
      
      if (result.success && result.data) {
        result.data.forEach(game => {
          expect(game.status).toBe('completed');
        });
      }
    });

    it('filters games by tournament', async () => {
      const result = await fetchGames({ tournament_id: 'tournament1' });
      
      if (result.success && result.data) {
        result.data.forEach(game => {
          expect(game.tournament_id).toBe('tournament1');
        });
      }
    });

    it('handles empty filter results', async () => {
      const result = await fetchGames({ status: ['non_existent_status'] as any });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('fetchGameById', () => {
    it('returns game when valid ID is provided', async () => {
      const result = await fetchGameById('game1');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.id).toBe('game1');
      }
    });

    it('returns error for non-existent game ID', async () => {
      const result = await fetchGameById('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Game not found');
    });

    it('returns error for empty string ID', async () => {
      const result = await fetchGameById('');
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Game not found');
    });
  });

  describe('fetchTournaments', () => {
    it('returns tournaments successfully', async () => {
      const result = await fetchTournaments();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('returns tournaments with correct structure', async () => {
      const result = await fetchTournaments();
      
      if (result.success && result.data && result.data.length > 0) {
        const tournament = result.data[0];
        expect(tournament).toHaveProperty('id');
        expect(tournament).toHaveProperty('name');
        expect(tournament).toHaveProperty('status');
        expect(tournament).toHaveProperty('start_date');
        expect(tournament).toHaveProperty('end_date');
      }
    });

    it('filters tournaments by status', async () => {
      const result = await fetchTournaments({ status: ['in_progress'] as any });
      
      if (result.success && result.data) {
        result.data.forEach(tournament => {
          expect(tournament.status).toBe('in_progress');
        });
      }
    });
  });

  describe('fetchActiveTournament', () => {
    it('returns in-progress tournament when one exists', async () => {
      const result = await fetchActiveTournament();
      
      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.status).toBe('in_progress');
      }
    });

    it('returns tournament with correct structure', async () => {
      const result = await fetchActiveTournament();
      
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('name');
        expect(result.data).toHaveProperty('status');
        expect(result.data).toHaveProperty('start_date');
      }
    });
  });

  describe('fetchRecentGames', () => {
    it('returns recent games successfully', async () => {
      const result = await fetchRecentGames();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('respects the limit parameter', async () => {
      const limit = 3;
      const result = await fetchRecentGames(limit);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.length).toBeLessThanOrEqual(limit);
      }
    });

    it('returns games in reverse chronological order', async () => {
      const result = await fetchRecentGames();
      
      if (result.success && result.data && result.data.length > 1) {
        for (let i = 1; i < result.data.length; i++) {
          const prevGame = result.data[i - 1];
          const currentGame = result.data[i];
          
          // Games should be ordered by most recent first
          if (prevGame.updated_at && currentGame.updated_at) {
            expect(new Date(prevGame.updated_at).getTime()).toBeGreaterThanOrEqual(
              new Date(currentGame.updated_at).getTime()
            );
          }
        }
      }
    });

    it('handles zero limit by returning all games', async () => {
      const result = await fetchRecentGames(0);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // Zero limit doesn't filter, so returns all games
        expect(result.data.length).toBeGreaterThan(0);
      }
    });

    it('returns games with display data', async () => {
      const result = await fetchRecentGames();
      
      if (result.success && result.data && result.data.length > 0) {
        const game = result.data[0];
        expect(game).toHaveProperty('home_team');
        expect(game).toHaveProperty('away_team');
        
        // Check for enhanced display properties
        if (game.status === 'in_progress') {
          expect(game).toHaveProperty('is_live');
          expect(game).toHaveProperty('time_status');
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('maintains consistent response structure', async () => {
      const functions = [
        () => fetchGames(),
        () => fetchGameById('test'),
        () => fetchTournaments(),
        () => fetchActiveTournament(),
        () => fetchRecentGames(),
      ];

      for (const fn of functions) {
        const result = await fn();
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
        
        if (result.success) {
          expect(result).toHaveProperty('data');
        } else {
          expect(result).toHaveProperty('error');
        }
      }
    });
  });

  describe('Data Consistency', () => {
    it('maintains referential integrity between games and tournaments', async () => {
      const gamesResult = await fetchGames();
      const tournamentsResult = await fetchTournaments();
      
      if (gamesResult.success && tournamentsResult.success && 
          gamesResult.data && tournamentsResult.data) {
        
        const tournamentIds = tournamentsResult.data.map(t => t.id);
        
        gamesResult.data.forEach(game => {
          if (game.tournament_id) {
            expect(tournamentIds).toContain(game.tournament_id);
          }
        });
      }
    });

    it('ensures game scores are non-negative', async () => {
      const result = await fetchGames();
      
      if (result.success && result.data) {
        result.data.forEach(game => {
          expect(game.home_score).toBeGreaterThanOrEqual(0);
          expect(game.away_score).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('ensures completed games have end times', async () => {
      const result = await fetchGames({ status: ['completed'] });
      
      if (result.success && result.data) {
        result.data.forEach(game => {
          if (game.status === 'completed') {
            expect(game.actual_end).toBeDefined();
            expect(game.actual_end).not.toBeNull();
          }
        });
      }
    });

    it('ensures in-progress games have start times but no end times', async () => {
      const result = await fetchGames({ status: ['in_progress'] });
      
      if (result.success && result.data) {
        result.data.forEach(game => {
          if (game.status === 'in_progress') {
            expect(game.actual_start).toBeDefined();
            expect(game.actual_start).not.toBeNull();
            expect(game.actual_end).toBeNull();
          }
        });
      }
    });
  });

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
}); 