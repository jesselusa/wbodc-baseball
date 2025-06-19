import {
  Player,
  Team,
  Tournament,
  Game,
  GameDisplayData,
  GameStatus,
  TournamentStatus,
  GameType,
  TournamentFormat,
  InningHalf,
  ApiResponse,
} from '../types';

describe('Type Definitions', () => {
  describe('GameStatus', () => {
    it('includes all expected status values', () => {
      const validStatuses: GameStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      
      expect(validStatuses).toContain('scheduled');
      expect(validStatuses).toContain('in_progress');
      expect(validStatuses).toContain('completed');
      expect(validStatuses).toContain('cancelled');
      expect(validStatuses.length).toBe(4);
    });
  });

  describe('TournamentStatus', () => {
    it('includes all expected status values', () => {
      const validStatuses: TournamentStatus[] = ['upcoming', 'active', 'completed'];
      
      expect(validStatuses).toContain('upcoming');
      expect(validStatuses).toContain('active');
      expect(validStatuses).toContain('completed');
      expect(validStatuses.length).toBe(3);
    });
  });

  describe('GameType', () => {
    it('includes all expected game types', () => {
      const validTypes: GameType[] = ['tournament', 'free_play'];
      
      expect(validTypes).toContain('tournament');
      expect(validTypes).toContain('free_play');
      expect(validTypes.length).toBe(2);
    });
  });

  describe('TournamentFormat', () => {
    it('includes all expected tournament formats', () => {
      const validFormats: TournamentFormat[] = ['round_robin', 'bracket', 'swiss'];
      
      expect(validFormats).toContain('round_robin');
      expect(validFormats).toContain('bracket');
      expect(validFormats).toContain('swiss');
      expect(validFormats.length).toBe(3);
    });
  });

  describe('InningHalf', () => {
    it('includes all expected inning halves', () => {
      const validHalves: InningHalf[] = ['top', 'bottom'];
      
      expect(validHalves).toContain('top');
      expect(validHalves).toContain('bottom');
      expect(validHalves.length).toBe(2);
    });
  });

  describe('Player Interface', () => {
    it('has correct structure', () => {
      const mockPlayer: Player = {
        id: 'player1',
        name: 'John Doe',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockPlayer).toHaveProperty('id');
      expect(mockPlayer).toHaveProperty('name');
      expect(mockPlayer).toHaveProperty('created_at');
      expect(mockPlayer).toHaveProperty('updated_at');
      
      expect(typeof mockPlayer.id).toBe('string');
      expect(typeof mockPlayer.name).toBe('string');
      expect(typeof mockPlayer.created_at).toBe('string');
      expect(typeof mockPlayer.updated_at).toBe('string');
    });
  });

  describe('Team Interface', () => {
    it('has correct structure', () => {
      const mockTeam: Team = {
        id: 'team1',
        name: 'Team Alpha',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockTeam).toHaveProperty('id');
      expect(mockTeam).toHaveProperty('name');
      expect(mockTeam).toHaveProperty('created_at');
      expect(mockTeam).toHaveProperty('updated_at');
      
      expect(typeof mockTeam.id).toBe('string');
      expect(typeof mockTeam.name).toBe('string');
      expect(typeof mockTeam.created_at).toBe('string');
      expect(typeof mockTeam.updated_at).toBe('string');
    });
  });

  describe('Tournament Interface', () => {
    it('has correct structure with required fields', () => {
      const mockTournament: Tournament = {
        id: 'tournament1',
        name: 'Spring Championship',
        status: 'active',
        start_date: '2024-03-15',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockTournament).toHaveProperty('id');
      expect(mockTournament).toHaveProperty('name');
      expect(mockTournament).toHaveProperty('status');
      expect(mockTournament).toHaveProperty('start_date');
      expect(mockTournament).toHaveProperty('created_at');
      expect(mockTournament).toHaveProperty('updated_at');
      
      expect(typeof mockTournament.id).toBe('string');
      expect(typeof mockTournament.name).toBe('string');
      expect(typeof mockTournament.start_date).toBe('string');
    });

    it('supports optional fields', () => {
      const mockTournament: Tournament = {
        id: 'tournament1',
        name: 'Spring Championship',
        status: 'active',
        start_date: '2024-03-15',
        end_date: '2024-03-17',
        format: 'round_robin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockTournament.end_date).toBe('2024-03-17');
      expect(mockTournament.format).toBe('round_robin');
    });
  });

  describe('Game Interface', () => {
    it('has correct structure with required fields', () => {
      const mockGame: Game = {
        id: 'game1',
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'completed',
        game_type: 'tournament',
        innings: 7,
        home_score: 5,
        away_score: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockGame).toHaveProperty('id');
      expect(mockGame).toHaveProperty('home_team_id');
      expect(mockGame).toHaveProperty('away_team_id');
      expect(mockGame).toHaveProperty('status');
      expect(mockGame).toHaveProperty('game_type');
      expect(mockGame).toHaveProperty('innings');
      expect(mockGame).toHaveProperty('home_score');
      expect(mockGame).toHaveProperty('away_score');
      
      expect(typeof mockGame.id).toBe('string');
      expect(typeof mockGame.home_team_id).toBe('string');
      expect(typeof mockGame.away_team_id).toBe('string');
      expect(typeof mockGame.innings).toBe('number');
      expect(typeof mockGame.home_score).toBe('number');
      expect(typeof mockGame.away_score).toBe('number');
    });

    it('supports optional tournament fields', () => {
      const mockGame: Game = {
        id: 'game1',
        tournament_id: 'tournament1',
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'in_progress',
        game_type: 'tournament',
        innings: 7,
        home_score: 2,
        away_score: 1,
        current_inning: 5,
        current_inning_half: 'top',
        outs: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockGame.tournament_id).toBe('tournament1');
      expect(mockGame.current_inning).toBe(5);
      expect(mockGame.current_inning_half).toBe('top');
      expect(mockGame.outs).toBe(2);
    });
  });

  describe('GameDisplayData Interface', () => {
    it('extends Game with additional display properties', () => {
      const mockGameDisplayData: GameDisplayData = {
        id: 'game1',
        tournament_id: 'tournament1',
        tournament: {
          id: 'tournament1',
          name: 'Spring Championship',
          status: 'active',
          start_date: '2024-03-15',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        home_team_id: 'team1',
        home_team: {
          id: 'team1',
          name: 'Team Alpha',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        away_team_id: 'team2',
        away_team: {
          id: 'team2',
          name: 'Team Beta',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        status: 'in_progress',
        game_type: 'tournament',
        innings: 7,
        home_score: 3,
        away_score: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        time_status: 'Live',
        is_live: true,
      };

      // Check Game properties
      expect(mockGameDisplayData).toHaveProperty('id');
      expect(mockGameDisplayData).toHaveProperty('status');
      expect(mockGameDisplayData).toHaveProperty('home_score');
      expect(mockGameDisplayData).toHaveProperty('away_score');
      
      // Check additional display properties
      expect(mockGameDisplayData).toHaveProperty('home_team');
      expect(mockGameDisplayData).toHaveProperty('away_team');
      expect(mockGameDisplayData).toHaveProperty('tournament');
      expect(mockGameDisplayData).toHaveProperty('time_status');
      expect(mockGameDisplayData).toHaveProperty('is_live');
      
      expect(typeof mockGameDisplayData.time_status).toBe('string');
      expect(typeof mockGameDisplayData.is_live).toBe('boolean');
    });

    it('supports nullable tournament for free play games', () => {
      const mockFreePlayGame: GameDisplayData = {
        id: 'game1',
        tournament_id: null,
        tournament: null,
        home_team_id: 'team1',
        home_team: {
          id: 'team1',
          name: 'Team Alpha',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        away_team_id: 'team2',
        away_team: {
          id: 'team2',
          name: 'Team Beta',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        status: 'completed',
        game_type: 'free_play',
        innings: 7,
        home_score: 8,
        away_score: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        time_status: 'Final',
        is_live: false,
      };

      expect(mockFreePlayGame.tournament_id).toBeNull();
      expect(mockFreePlayGame.tournament).toBeNull();
      expect(mockFreePlayGame.game_type).toBe('free_play');
    });
  });

  describe('ApiResponse Interface', () => {
    it('supports successful response structure', () => {
      const mockSuccessResponse: ApiResponse<string[]> = {
        success: true,
        data: ['item1', 'item2', 'item3'],
      };

      expect(mockSuccessResponse.success).toBe(true);
      expect(mockSuccessResponse.data).toEqual(['item1', 'item2', 'item3']);
      expect(mockSuccessResponse).not.toHaveProperty('error');
    });

    it('supports error response structure', () => {
      const mockErrorResponse: ApiResponse<string[]> = {
        success: false,
        error: 'Something went wrong',
      };

      expect(mockErrorResponse.success).toBe(false);
      expect(mockErrorResponse.error).toBe('Something went wrong');
      expect(mockErrorResponse).not.toHaveProperty('data');
    });

    it('works with different data types', () => {
      const numberResponse: ApiResponse<number> = {
        success: true,
        data: 42,
      };

      const objectResponse: ApiResponse<Player> = {
        success: true,
        data: {
          id: 'player1',
          name: 'John Doe',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };

      expect(numberResponse.data).toBe(42);
      expect(objectResponse.data?.name).toBe('John Doe');
    });

    it('supports nullable data', () => {
      const nullResponse: ApiResponse<Player | null> = {
        success: true,
        data: null,
      };

      expect(nullResponse.success).toBe(true);
      expect(nullResponse.data).toBeNull();
    });
  });

  describe('Type Compatibility', () => {
    it('ensures Game can be converted to GameDisplayData', () => {
      const baseGame: Game = {
        id: 'game1',
        tournament_id: 'tournament1',
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'completed',
        game_type: 'tournament',
        innings: 7,
        home_score: 5,
        away_score: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // This should compile without errors
      const displayGame: GameDisplayData = {
        ...baseGame,
        tournament: {
          id: 'tournament1',
          name: 'Test Tournament',
          status: 'active',
          start_date: '2024-01-01',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        home_team: {
          id: 'team1',
          name: 'Team Alpha',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        away_team: {
          id: 'team2',
          name: 'Team Beta',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        time_status: 'Final',
        is_live: false,
      };

      expect(displayGame.id).toBe(baseGame.id);
      expect(displayGame.status).toBe(baseGame.status);
      expect(displayGame.home_score).toBe(baseGame.home_score);
    });

    it('ensures all status enums are assignable', () => {
      const game: Game = {
        id: 'game1',
        home_team_id: 'team1',
        away_team_id: 'team2',
        status: 'scheduled', // Should accept all GameStatus values
        game_type: 'tournament',
        innings: 7,
        home_score: 0,
        away_score: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Test all valid status assignments
      game.status = 'scheduled';
      game.status = 'in_progress';
      game.status = 'completed';
      game.status = 'cancelled';

      expect(['scheduled', 'in_progress', 'completed', 'cancelled']).toContain(game.status);
    });
  });
}); 