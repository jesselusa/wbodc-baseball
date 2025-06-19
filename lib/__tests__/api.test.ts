import {
  fetchGames,
  fetchGameById,
  fetchTournaments,
  fetchActiveTournament,
  fetchRecentGames,
} from '../api';

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
      const result = await fetchTournaments({ status: ['active'] });
      
      if (result.success && result.data) {
        result.data.forEach(tournament => {
          expect(tournament.status).toBe('active');
        });
      }
    });
  });

  describe('fetchActiveTournament', () => {
    it('returns active tournament when one exists', async () => {
      const result = await fetchActiveTournament();
      
      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.status).toBe('active');
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
}); 