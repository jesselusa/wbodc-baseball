/**
 * Unit Tests for Tournament Bracket Generation Utilities
 * 
 * Tests for bracket generation, seeding, bye assignment, and validation functions.
 */

import {
  calculateTeamStandings,
  generateBracketSeeding,
  assignByesToTopSeededTeams,
  validateBracketStructure,
  generateTournamentBracket,
  calculateByesNeeded,
  calculateBracketRounds,
  calculateBracketGames,
  validateBracketSeeding,
  TeamStanding,
  BracketType,
  TournamentBracket
} from './bracket-generation';

describe('Bracket Generation Utilities', () => {
  describe('calculateTeamStandings', () => {
    it('should calculate standings for teams with no games', () => {
      const teams = [
        { id: 'team1', name: 'Team A' },
        { id: 'team2', name: 'Team B' },
        { id: 'team3', name: 'Team C' }
      ];

      const standings = calculateTeamStandings([], teams);

      expect(standings).toHaveLength(3);
      expect(standings[0]).toEqual({
        teamId: 'team1',
        teamName: 'Team A',
        wins: 0,
        losses: 0,
        runsScored: 0,
        runsAllowed: 0,
        runDifferential: 0,
        gamesPlayed: 0,
        seed: 1
      });
    });

    it('should calculate standings from completed games', () => {
      const teams = [
        { id: 'team1', name: 'Team A' },
        { id: 'team2', name: 'Team B' },
        { id: 'team3', name: 'Team C' }
      ];

      const games = [
        {
          homeTeamId: 'team1',
          awayTeamId: 'team2',
          homeScore: 5,
          awayScore: 3,
          status: 'completed'
        },
        {
          homeTeamId: 'team2',
          awayTeamId: 'team3',
          homeScore: 4,
          awayScore: 2,
          status: 'completed'
        },
        {
          homeTeamId: 'team1',
          awayTeamId: 'team3',
          homeScore: 6,
          awayScore: 1,
          status: 'completed'
        }
      ];

      const standings = calculateTeamStandings(games, teams);

      expect(standings).toHaveLength(3);
      
      // Team A should be first (2-0, +7 run differential)
      expect(standings[0].teamId).toBe('team1');
      expect(standings[0].wins).toBe(2);
      expect(standings[0].losses).toBe(0);
      expect(standings[0].runDifferential).toBe(7);
      expect(standings[0].seed).toBe(1);

      // Team B should be second (1-1, 0 run differential)
      expect(standings[1].teamId).toBe('team2');
      expect(standings[1].wins).toBe(1);
      expect(standings[1].losses).toBe(1);
      expect(standings[1].runDifferential).toBe(0);
      expect(standings[1].seed).toBe(2);

      // Team C should be third (0-2, -7 run differential)
      expect(standings[2].teamId).toBe('team3');
      expect(standings[2].wins).toBe(0);
      expect(standings[2].losses).toBe(2);
      expect(standings[2].runDifferential).toBe(-7);
      expect(standings[2].seed).toBe(3);
    });

    it('should handle tiebreakers correctly', () => {
      const teams = [
        { id: 'team1', name: 'Team A' },
        { id: 'team2', name: 'Team B' },
        { id: 'team3', name: 'Team C' },
        { id: 'team4', name: 'Team D' }
      ];

      const games = [
        // Team A: 2-0, +10 run differential
        { homeTeamId: 'team1', awayTeamId: 'team2', homeScore: 8, awayScore: 3, status: 'completed' },
        { homeTeamId: 'team1', awayTeamId: 'team3', homeScore: 7, awayScore: 2, status: 'completed' },
        // Team B: 1-1, +5 run differential
        { homeTeamId: 'team2', awayTeamId: 'team3', homeScore: 6, awayScore: 2, status: 'completed' },
        // Team C: 1-1, -5 run differential
        { homeTeamId: 'team3', awayTeamId: 'team4', homeScore: 5, awayScore: 1, status: 'completed' },
        // Team D: 0-2, -10 run differential
        { homeTeamId: 'team4', awayTeamId: 'team1', homeScore: 2, awayScore: 9, status: 'completed' }
      ];

      const standings = calculateTeamStandings(games, teams);

      expect(standings[0].teamId).toBe('team1'); // 2-0, +10
      expect(standings[1].teamId).toBe('team2'); // 1-1, +5
      expect(standings[2].teamId).toBe('team3'); // 1-1, -5
      expect(standings[3].teamId).toBe('team4'); // 0-2, -10
    });

    it('should ignore incomplete games', () => {
      const teams = [
        { id: 'team1', name: 'Team A' },
        { id: 'team2', name: 'Team B' }
      ];

      const games = [
        {
          homeTeamId: 'team1',
          awayTeamId: 'team2',
          homeScore: 5,
          awayScore: 3,
          status: 'in_progress'
        }
      ];

      const standings = calculateTeamStandings(games, teams);

      expect(standings[0].wins).toBe(0);
      expect(standings[0].losses).toBe(0);
      expect(standings[0].gamesPlayed).toBe(0);
    });
  });

  describe('generateBracketSeeding', () => {
    it('should generate single elimination seeding for 4 teams', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 3, losses: 0, runsScored: 15, runsAllowed: 5, runDifferential: 10, gamesPlayed: 3, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 2, losses: 1, runsScored: 12, runsAllowed: 8, runDifferential: 4, gamesPlayed: 3, seed: 2 },
        { teamId: 'team3', teamName: 'Team C', wins: 1, losses: 2, runsScored: 8, runsAllowed: 12, runDifferential: -4, gamesPlayed: 3, seed: 3 },
        { teamId: 'team4', teamName: 'Team D', wins: 0, losses: 3, runsScored: 5, runsAllowed: 15, runDifferential: -10, gamesPlayed: 3, seed: 4 }
      ];

      const seeding = generateBracketSeeding(standings, 'single_elimination');

      expect(seeding).toHaveLength(4);
      expect(seeding[0]).toBe('team1'); // 1st seed
      expect(seeding[1]).toBe('team4'); // 4th seed
      expect(seeding[2]).toBe('team3'); // 3rd seed
      expect(seeding[3]).toBe('team2'); // 2nd seed
    });

    it('should generate seeding for 6 teams with byes', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 5, losses: 0, runsScored: 25, runsAllowed: 10, runDifferential: 15, gamesPlayed: 5, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 4, losses: 1, runsScored: 20, runsAllowed: 12, runDifferential: 8, gamesPlayed: 5, seed: 2 },
        { teamId: 'team3', teamName: 'Team C', wins: 3, losses: 2, runsScored: 18, runsAllowed: 15, runDifferential: 3, gamesPlayed: 5, seed: 3 },
        { teamId: 'team4', teamName: 'Team D', wins: 2, losses: 3, runsScored: 15, runsAllowed: 18, runDifferential: -3, gamesPlayed: 5, seed: 4 },
        { teamId: 'team5', teamName: 'Team E', wins: 1, losses: 4, runsScored: 12, runsAllowed: 20, runDifferential: -8, gamesPlayed: 5, seed: 5 },
        { teamId: 'team6', teamName: 'Team F', wins: 0, losses: 5, runsScored: 10, runsAllowed: 25, runDifferential: -15, gamesPlayed: 5, seed: 6 }
      ];

      const seeding = generateBracketSeeding(standings, 'single_elimination');

      expect(seeding).toHaveLength(8); // Next power of 2
      expect(seeding).toContain('BYE'); // Should have byes
      expect(seeding.filter(id => id === 'BYE')).toHaveLength(2); // 6 teams need 2 byes to reach 8
      
      // Check that all teams are included
      expect(seeding).toContain('team1');
      expect(seeding).toContain('team2');
      expect(seeding).toContain('team3');
      expect(seeding).toContain('team4');
      expect(seeding).toContain('team5');
      expect(seeding).toContain('team6');
    });

    it('should throw error for empty standings', () => {
      expect(() => {
        generateBracketSeeding([], 'single_elimination');
      }).toThrow('No team standings provided for bracket seeding');
    });

    it('should throw error for unsupported bracket type', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 }
      ];

      expect(() => {
        generateBracketSeeding(standings, 'invalid_type' as BracketType);
      }).toThrow('Unsupported bracket type: invalid_type');
    });
  });

  describe('assignByesToTopSeededTeams', () => {
    it('should assign byes for 6 teams', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 5, losses: 0, runsScored: 25, runsAllowed: 10, runDifferential: 15, gamesPlayed: 5, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 4, losses: 1, runsScored: 20, runsAllowed: 12, runDifferential: 8, gamesPlayed: 5, seed: 2 },
        { teamId: 'team3', teamName: 'Team C', wins: 3, losses: 2, runsScored: 18, runsAllowed: 15, runDifferential: 3, gamesPlayed: 5, seed: 3 },
        { teamId: 'team4', teamName: 'Team D', wins: 2, losses: 3, runsScored: 15, runsAllowed: 18, runDifferential: -3, gamesPlayed: 5, seed: 4 },
        { teamId: 'team5', teamName: 'Team E', wins: 1, losses: 4, runsScored: 12, runsAllowed: 20, runDifferential: -8, gamesPlayed: 5, seed: 5 },
        { teamId: 'team6', teamName: 'Team F', wins: 0, losses: 5, runsScored: 10, runsAllowed: 25, runDifferential: -15, gamesPlayed: 5, seed: 6 }
      ];

      const byes = assignByesToTopSeededTeams(standings, 'single_elimination');

      expect(byes).toHaveLength(2); // 2 byes needed for 6 teams
      expect(byes[0].byeRound).toBe(1);
      expect(byes[1].byeRound).toBe(1);
      
      // Check that byes are assigned to teams that are paired with BYE in seeding
      const seeding = generateBracketSeeding(standings, 'single_elimination');
      const byeTeamIds = byes.map(b => b.teamId);
      
      // Verify that teams with byes are actually paired with BYE in the seeding
      for (let i = 0; i < seeding.length; i += 2) {
        const team1 = seeding[i];
        const team2 = seeding[i + 1];
        
        if (team1 === 'BYE' && team2 !== 'BYE') {
          expect(byeTeamIds).toContain(team2);
        } else if (team2 === 'BYE' && team1 !== 'BYE') {
          expect(byeTeamIds).toContain(team1);
        }
      }
    });

    it('should return empty array for power of 2 teams', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 0, losses: 1, runsScored: 3, runsAllowed: 5, runDifferential: -2, gamesPlayed: 1, seed: 2 }
      ];

      const byes = assignByesToTopSeededTeams(standings, 'single_elimination');

      expect(byes).toHaveLength(0); // No byes needed for 2 teams
    });
  });

  describe('calculateByesNeeded', () => {
    it('should calculate byes for various team counts', () => {
      expect(calculateByesNeeded(2)).toBe(0);   // 2 teams = 2 (power of 2)
      expect(calculateByesNeeded(3)).toBe(1);   // 3 teams -> 4 (power of 2) = 1 bye
      expect(calculateByesNeeded(4)).toBe(0);   // 4 teams = 4 (power of 2)
      expect(calculateByesNeeded(5)).toBe(3);   // 5 teams -> 8 (power of 2) = 3 byes
      expect(calculateByesNeeded(6)).toBe(2);   // 6 teams -> 8 (power of 2) = 2 byes
      expect(calculateByesNeeded(7)).toBe(1);   // 7 teams -> 8 (power of 2) = 1 bye
      expect(calculateByesNeeded(8)).toBe(0);   // 8 teams = 8 (power of 2)
    });
  });

  describe('calculateBracketRounds', () => {
    it('should calculate rounds for various team counts', () => {
      expect(calculateBracketRounds(2)).toBe(1);   // 2 teams = 1 round
      expect(calculateBracketRounds(4)).toBe(2);   // 4 teams = 2 rounds
      expect(calculateBracketRounds(8)).toBe(3);   // 8 teams = 3 rounds
      expect(calculateBracketRounds(16)).toBe(4);  // 16 teams = 4 rounds
      expect(calculateBracketRounds(3)).toBe(2);   // 3 teams -> 4 positions = 2 rounds
      expect(calculateBracketRounds(5)).toBe(3);   // 5 teams -> 8 positions = 3 rounds
    });
  });

  describe('calculateBracketGames', () => {
    it('should calculate games for single elimination', () => {
      expect(calculateBracketGames(2, 'single_elimination')).toBe(1);   // 2 teams = 1 game
      expect(calculateBracketGames(4, 'single_elimination')).toBe(3);   // 4 teams = 3 games
      expect(calculateBracketGames(8, 'single_elimination')).toBe(7);   // 8 teams = 7 games
      expect(calculateBracketGames(16, 'single_elimination')).toBe(15); // 16 teams = 15 games
    });

    it('should calculate games for double elimination', () => {
      expect(calculateBracketGames(2, 'double_elimination')).toBe(1);   // 2 teams = 1 game
      expect(calculateBracketGames(4, 'double_elimination')).toBe(5);   // 4 teams = 5 games
      expect(calculateBracketGames(8, 'double_elimination')).toBe(13);  // 8 teams = 13 games
    });

    it('should throw error for unsupported bracket type', () => {
      expect(() => {
        calculateBracketGames(4, 'invalid_type' as BracketType);
      }).toThrow('Unsupported bracket type: invalid_type');
    });
  });

  describe('validateBracketSeeding', () => {
    it('should validate correct seeding', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 0, losses: 1, runsScored: 3, runsAllowed: 5, runDifferential: -2, gamesPlayed: 1, seed: 2 }
      ];

      const seeding = ['team1', 'team2'];
      const validation = validateBracketSeeding(seeding, standings);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing teams', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 0, losses: 1, runsScored: 3, runsAllowed: 5, runDifferential: -2, gamesPlayed: 1, seed: 2 }
      ];

      const seeding = ['team1']; // Missing team2
      const validation = validateBracketSeeding(seeding, standings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Team team2 not found in bracket seeding');
    });

    it('should detect unknown teams', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 }
      ];

      const seeding = ['team1', 'unknown_team'];
      const validation = validateBracketSeeding(seeding, standings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unknown team unknown_team found in bracket seeding');
    });

    it('should detect non-power-of-2 length', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 0, losses: 1, runsScored: 3, runsAllowed: 5, runDifferential: -2, gamesPlayed: 1, seed: 2 },
        { teamId: 'team3', teamName: 'Team C', wins: 0, losses: 1, runsScored: 2, runsAllowed: 4, runDifferential: -2, gamesPlayed: 1, seed: 3 }
      ];

      const seeding = ['team1', 'team2', 'team3']; // Length 3 is not power of 2
      const validation = validateBracketSeeding(seeding, standings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Bracket seeding length 3 is not a power of 2');
    });
  });

  describe('generateTournamentBracket', () => {
    it('should generate single elimination bracket for 4 teams', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 3, losses: 0, runsScored: 15, runsAllowed: 5, runDifferential: 10, gamesPlayed: 3, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 2, losses: 1, runsScored: 12, runsAllowed: 8, runDifferential: 4, gamesPlayed: 3, seed: 2 },
        { teamId: 'team3', teamName: 'Team C', wins: 1, losses: 2, runsScored: 8, runsAllowed: 12, runDifferential: -4, gamesPlayed: 3, seed: 3 },
        { teamId: 'team4', teamName: 'Team D', wins: 0, losses: 3, runsScored: 5, runsAllowed: 15, runDifferential: -10, gamesPlayed: 3, seed: 4 }
      ];

      const bracket = generateTournamentBracket('tournament1', standings, 'single_elimination');

      expect(bracket.tournamentId).toBe('tournament1');
      expect(bracket.bracketType).toBe('single_elimination');
      expect(bracket.totalRounds).toBe(2);
      expect(bracket.totalGames).toBe(3);
      expect(bracket.matches).toHaveLength(3);

      // Check first round matches
      const firstRoundMatches = bracket.matches.filter(m => m.round === 1);
      expect(firstRoundMatches).toHaveLength(2);

      // Check second round match
      const secondRoundMatches = bracket.matches.filter(m => m.round === 2);
      expect(secondRoundMatches).toHaveLength(1);
    });

    it('should generate bracket with byes for 6 teams', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 5, losses: 0, runsScored: 25, runsAllowed: 10, runDifferential: 15, gamesPlayed: 5, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 4, losses: 1, runsScored: 20, runsAllowed: 12, runDifferential: 8, gamesPlayed: 5, seed: 2 },
        { teamId: 'team3', teamName: 'Team C', wins: 3, losses: 2, runsScored: 18, runsAllowed: 15, runDifferential: 3, gamesPlayed: 5, seed: 3 },
        { teamId: 'team4', teamName: 'Team D', wins: 2, losses: 3, runsScored: 15, runsAllowed: 18, runDifferential: -3, gamesPlayed: 5, seed: 4 },
        { teamId: 'team5', teamName: 'Team E', wins: 1, losses: 4, runsScored: 12, runsAllowed: 20, runDifferential: -8, gamesPlayed: 5, seed: 5 },
        { teamId: 'team6', teamName: 'Team F', wins: 0, losses: 5, runsScored: 10, runsAllowed: 25, runDifferential: -15, gamesPlayed: 5, seed: 6 }
      ];

      const bracket = generateTournamentBracket('tournament1', standings, 'single_elimination');

      expect(bracket.totalRounds).toBe(3);
      expect(bracket.totalGames).toBe(5);
      
      // Should have bye matches
      const byeMatches = bracket.matches.filter(m => m.isBye);
      expect(byeMatches.length).toBeGreaterThan(0);
    });

    it('should throw error for empty standings', () => {
      expect(() => {
        generateTournamentBracket('tournament1', [], 'single_elimination');
      }).toThrow('No team standings provided for bracket generation');
    });

    it('should throw error for unsupported bracket type', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 }
      ];

      expect(() => {
        generateTournamentBracket('tournament1', standings, 'invalid_type' as BracketType);
      }).toThrow('Unsupported bracket type: invalid_type');
    });
  });

  describe('validateBracketStructure', () => {
    it('should validate correct bracket structure', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 },
        { teamId: 'team2', teamName: 'Team B', wins: 0, losses: 1, runsScored: 3, runsAllowed: 5, runDifferential: -2, gamesPlayed: 1, seed: 2 }
      ];

      const bracket: TournamentBracket = {
        tournamentId: 'tournament1',
        bracketType: 'single_elimination',
        totalRounds: 1,
        totalGames: 1,
        matches: [
          {
            gameNumber: 1,
            round: 1,
            homeTeamId: 'team1',
            awayTeamId: 'team2',
            homeTeamSeed: 1,
            awayTeamSeed: 2,
            winnerTeamId: undefined,
            isBye: false,
            nextGameNumber: undefined
          }
        ]
      };

      const validation = validateBracketStructure(bracket, standings);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing tournament ID', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 }
      ];

      const bracket: TournamentBracket = {
        tournamentId: '',
        bracketType: 'single_elimination',
        totalRounds: 1,
        totalGames: 1,
        matches: []
      };

      const validation = validateBracketStructure(bracket, standings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Tournament ID is required');
    });

    it('should detect invalid bracket type', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 }
      ];

      const bracket: TournamentBracket = {
        tournamentId: 'tournament1',
        bracketType: 'invalid_type' as BracketType,
        totalRounds: 1,
        totalGames: 1,
        matches: []
      };

      // The validation should catch this before calling calculateBracketGames
      const validation = validateBracketStructure(bracket, standings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid bracket type: invalid_type');
    });

    it('should detect missing matches', () => {
      const standings: TeamStanding[] = [
        { teamId: 'team1', teamName: 'Team A', wins: 1, losses: 0, runsScored: 5, runsAllowed: 3, runDifferential: 2, gamesPlayed: 1, seed: 1 }
      ];

      const bracket: TournamentBracket = {
        tournamentId: 'tournament1',
        bracketType: 'single_elimination',
        totalRounds: 1,
        totalGames: 1,
        matches: []
      };

      const validation = validateBracketStructure(bracket, standings);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Bracket must contain at least one match');
    });
  });
}); 
 
 