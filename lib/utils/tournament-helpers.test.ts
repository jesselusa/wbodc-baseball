import {
  randomizeTeams,
  convertTeamsToAssignments,
  calculateBracketStructure,
  validateTournamentData,
  calculateOptimalTeamDistribution,
  generateTournamentStandings,
  isSettingsLocked,
  areTeamsLocked,
  validatePlayerUniqueness
} from './tournament-helpers';

import {
  Player,
  TournamentTeam,
  TournamentConfig,
  BracketStanding,
  PlayerFormData,
  TournamentSettingsFormData
} from '../types';

// Mock data
const mockPlayers: Player[] = [
  { id: '1', name: 'Alice Johnson', hometown: 'Chicago', state: 'IL', current_town: 'Chicago', current_state: 'IL', championships_won: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', name: 'Bob Smith', hometown: 'New York', state: 'NY', current_town: 'Brooklyn', current_state: 'NY', championships_won: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', name: 'Charlie Brown', hometown: 'Austin', state: 'TX', current_town: 'Austin', current_state: 'TX', championships_won: 0, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '4', name: 'Diana Prince', hometown: 'Seattle', state: 'WA', current_town: 'Seattle', current_state: 'WA', championships_won: 3, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '5', name: 'Eve Williams', hometown: 'Boston', state: 'MA', current_town: 'Cambridge', current_state: 'MA', championships_won: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '6', name: 'Frank Castle', hometown: 'Miami', state: 'FL', current_town: 'Miami', current_state: 'FL', championships_won: 0, created_at: '2024-01-01', updated_at: '2024-01-01' }
];

const mockConfig: TournamentConfig = {
  tournament_id: 'tournament-1',
  pool_play_games: 2,
  pool_play_innings: 7,
  bracket_type: 'single_elimination',
  bracket_innings: 7,
  final_innings: 9,
  team_size: 3,
  is_active: false,
  settings_locked: false
};

const mockStandings: BracketStanding[] = [
  { team_id: 'team-1', team_name: 'Team Alpha', wins: 3, losses: 1, runs_scored: 28, runs_allowed: 15, run_differential: 13, win_percentage: 0.75, seed: 1 },
  { team_id: 'team-2', team_name: 'Team Beta', wins: 2, losses: 2, runs_scored: 20, runs_allowed: 18, run_differential: 2, win_percentage: 0.5, seed: 2 },
  { team_id: 'team-3', team_name: 'Team Gamma', wins: 2, losses: 2, runs_scored: 18, runs_allowed: 20, run_differential: -2, win_percentage: 0.5, seed: 3 },
  { team_id: 'team-4', team_name: 'Team Delta', wins: 1, losses: 3, runs_scored: 15, runs_allowed: 28, run_differential: -13, win_percentage: 0.25, seed: 4 }
];

describe('Tournament Helper Functions', () => {
  describe('randomizeTeams', () => {
    it('should create teams with specified size', () => {
      const teams = randomizeTeams(mockPlayers, 3, 'tournament-1');
      expect(teams).toHaveLength(2);
      expect(teams[0].players).toHaveLength(3);
      expect(teams[1].players).toHaveLength(3);
    });

    it('should handle uneven player distribution', () => {
      const players = mockPlayers.slice(0, 5); // 5 players
      const teams = randomizeTeams(players, 3, 'tournament-1');
      expect(teams).toHaveLength(2);
      expect(teams[0].players).toHaveLength(3);
      expect(teams[1].players).toHaveLength(2);
    });

    it('should return empty array for empty players', () => {
      const teams = randomizeTeams([], 3, 'tournament-1');
      expect(teams).toHaveLength(0);
    });

    it('should return empty array for invalid team size', () => {
      const teams = randomizeTeams(mockPlayers, 0, 'tournament-1');
      expect(teams).toHaveLength(0);
    });

    it('should assign unique team names', () => {
      const teams = randomizeTeams(mockPlayers, 3, 'tournament-1');
      const teamNames = teams.map(t => t.name);
      const uniqueNames = [...new Set(teamNames)];
      expect(teamNames).toHaveLength(uniqueNames.length);
    });

    it('should generate team IDs', () => {
      const teams = randomizeTeams(mockPlayers, 3, 'tournament-1');
      teams.forEach(team => {
        expect(team.id).toBeTruthy();
        expect(team.is_locked).toBe(false);
      });
    });
  });

  describe('convertTeamsToAssignments', () => {
    it('should convert teams to assignments format', () => {
      const teams = randomizeTeams(mockPlayers, 3, 'tournament-1');
      const assignments = convertTeamsToAssignments(teams, 'tournament-1');
      
      expect(assignments).toHaveLength(teams.length);
      assignments.forEach((assignment, index) => {
        expect(assignment.tournament_id).toBe('tournament-1');
        expect(assignment.team_id).toBe(teams[index].id);
        expect(assignment.team_name).toBe(teams[index].name);
        expect(assignment.player_ids).toHaveLength(teams[index].players.length);
        expect(assignment.is_locked).toBe(teams[index].is_locked);
      });
    });

    it('should handle empty teams array', () => {
      const assignments = convertTeamsToAssignments([], 'tournament-1');
      expect(assignments).toHaveLength(0);
    });
  });

  describe('calculateBracketStructure', () => {
    it('should calculate single elimination bracket', () => {
      const bracket = calculateBracketStructure(mockStandings, 'single_elimination');
      
      expect(bracket.rounds).toBeGreaterThan(0);
      expect(bracket.matchups).toHaveLength(4); // 4 teams = 4 matchups (including byes)
      expect(bracket.total_games).toBe(3); // n-1 games for single elimination
    });

    it('should calculate double elimination bracket', () => {
      const bracket = calculateBracketStructure(mockStandings, 'double_elimination');
      
      expect(bracket.rounds).toBeGreaterThan(0);
      expect(bracket.total_games).toBe(5); // 2n-3 games for double elimination
    });

    it('should handle byes correctly', () => {
      const oddStandings = mockStandings.slice(0, 3); // 3 teams
      const bracket = calculateBracketStructure(oddStandings, 'single_elimination');
      
      const byeMatchups = bracket.matchups.filter(m => m.has_bye);
      expect(byeMatchups.length).toBeGreaterThan(0);
      expect(byeMatchups[0].team2_name).toBe('BYE');
    });

    it('should sort standings correctly', () => {
      const unsorted = [...mockStandings].reverse();
      const bracket = calculateBracketStructure(unsorted, 'single_elimination');
      
      // First matchup should have highest seed vs lowest seed pattern
      const firstMatchup = bracket.matchups.find(m => !m.has_bye);
      expect(firstMatchup).toBeTruthy();
    });
  });

  describe('validateTournamentData', () => {
    const validConfig: TournamentSettingsFormData = {
      pool_play_games: 2,
      pool_play_innings: 7,
      bracket_type: 'single_elimination',
      bracket_innings: 7,
      final_innings: 9,
      team_size: 3
    };

    const validPlayers: PlayerFormData[] = [
      { name: 'Alice Johnson', hometown: 'Chicago', state: 'IL' },
      { name: 'Bob Smith', hometown: 'New York', state: 'NY' },
      { name: 'Charlie Brown', hometown: 'Austin', state: 'TX' }
    ];

    it('should validate correct configuration', () => {
      const result = validateTournamentData(validConfig, validPlayers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid innings', () => {
      const invalidConfig = { ...validConfig, pool_play_innings: 2 };
      const result = validateTournamentData(invalidConfig, validPlayers);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pool play innings must be at least 3');
    });

    it('should reject invalid team size', () => {
      const invalidConfig = { ...validConfig, team_size: 0 };
      const result = validateTournamentData(invalidConfig, validPlayers);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team size must be at least 1');
    });

    it('should reject duplicate player names', () => {
      const duplicatePlayers = [
        { name: 'Alice Johnson', hometown: 'Chicago', state: 'IL' },
        { name: 'alice johnson', hometown: 'New York', state: 'NY' }
      ];
      const result = validateTournamentData(validConfig, duplicatePlayers);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate player names'))).toBe(true);
    });

    it('should reject empty player names', () => {
      const invalidPlayers = [
        { name: '', hometown: 'Chicago', state: 'IL' },
        { name: 'Bob Smith', hometown: 'New York', state: 'NY' }
      ];
      const result = validateTournamentData(validConfig, invalidPlayers);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('empty names'))).toBe(true);
    });

    it('should warn about large team sizes', () => {
      const largeTeamConfig = { ...validConfig, team_size: 25 };
      const result = validateTournamentData(largeTeamConfig, validPlayers);
      expect(result.warnings).toContain('Team size is unusually large (>20 players)');
    });
  });

  describe('calculateOptimalTeamDistribution', () => {
    it('should calculate even distribution', () => {
      const result = calculateOptimalTeamDistribution(12, 4);
      expect(result.teamCount).toBe(3);
      expect(result.actualTeamSize).toBe(4);
      expect(result.remainder).toBe(0);
      expect(result.distribution).toEqual([4, 4, 4]);
    });

    it('should handle uneven distribution', () => {
      const result = calculateOptimalTeamDistribution(10, 4);
      expect(result.teamCount).toBe(3);
      expect(result.actualTeamSize).toBe(3);
      expect(result.remainder).toBe(1);
      expect(result.distribution).toEqual([4, 3, 3]);
    });

    it('should handle edge cases', () => {
      const result = calculateOptimalTeamDistribution(0, 4);
      expect(result.teamCount).toBe(0);
      expect(result.distribution).toEqual([]);
    });
  });

  describe('generateTournamentStandings', () => {
    const mockTeams: TournamentTeam[] = [
      { id: 'team-1', name: 'Team Alpha', players: [], is_locked: false },
      { id: 'team-2', name: 'Team Beta', players: [], is_locked: false }
    ];

    const mockGameResults = [
      { home_team_id: 'team-1', away_team_id: 'team-2', home_score: 5, away_score: 3, status: 'completed' as const },
      { home_team_id: 'team-2', away_team_id: 'team-1', home_score: 2, away_score: 7, status: 'completed' as const }
    ];

    it('should generate standings from game results', () => {
      const standings = generateTournamentStandings(mockTeams, mockGameResults);
      
      expect(standings).toHaveLength(2);
      
      const teamAlpha = standings.find(s => s.team_name === 'Team Alpha');
      expect(teamAlpha).toBeTruthy();
      expect(teamAlpha!.wins).toBe(2);
      expect(teamAlpha!.losses).toBe(0);
      expect(teamAlpha!.runs_scored).toBe(12);
      expect(teamAlpha!.runs_allowed).toBe(5);
      expect(teamAlpha!.run_differential).toBe(7);
      expect(teamAlpha!.win_percentage).toBe(1);
      expect(teamAlpha!.seed).toBe(1);
    });

    it('should handle empty game results', () => {
      const standings = generateTournamentStandings(mockTeams, []);
      
      expect(standings).toHaveLength(2);
      standings.forEach(standing => {
        expect(standing.wins).toBe(0);
        expect(standing.losses).toBe(0);
        expect(standing.win_percentage).toBe(0);
      });
    });
  });

  describe('isSettingsLocked', () => {
    it('should return true when settings are locked', () => {
      const config = { ...mockConfig, settings_locked: true };
      expect(isSettingsLocked(config, false)).toBe(true);
    });

    it('should return true when tournament is active', () => {
      const config = { ...mockConfig, is_active: true };
      expect(isSettingsLocked(config, false)).toBe(true);
    });

    it('should return true when has active games', () => {
      expect(isSettingsLocked(mockConfig, true)).toBe(true);
    });

    it('should return false when unlocked and inactive', () => {
      expect(isSettingsLocked(mockConfig, false)).toBe(false);
    });
  });

  describe('areTeamsLocked', () => {
    const mockTeams: TournamentTeam[] = [
      { id: 'team-1', name: 'Team Alpha', players: [], is_locked: false },
      { id: 'team-2', name: 'Team Beta', players: [], is_locked: false }
    ];

    it('should return true when tournament is active', () => {
      expect(areTeamsLocked(mockTeams, true)).toBe(true);
    });

    it('should return true when any team is locked', () => {
      const lockedTeams = [
        { ...mockTeams[0], is_locked: true },
        mockTeams[1]
      ];
      expect(areTeamsLocked(lockedTeams, false)).toBe(true);
    });

    it('should return false when all teams are unlocked', () => {
      expect(areTeamsLocked(mockTeams, false)).toBe(false);
    });
  });

  describe('validatePlayerUniqueness', () => {
    it('should validate unique player names', () => {
      const players: PlayerFormData[] = [
        { name: 'Alice Johnson' },
        { name: 'Bob Smith' },
        { name: 'Charlie Brown' }
      ];
      
      const result = validatePlayerUniqueness(players);
      expect(result.isValid).toBe(true);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should detect duplicate names (case insensitive)', () => {
      const players: PlayerFormData[] = [
        { name: 'Alice Johnson' },
        { name: 'alice johnson' },
        { name: 'Bob Smith' }
      ];
      
      const result = validatePlayerUniqueness(players);
      expect(result.isValid).toBe(false);
      expect(result.duplicates).toContain('Alice Johnson');
    });

    it('should handle empty names', () => {
      const players: PlayerFormData[] = [
        { name: '' },
        { name: 'Bob Smith' }
      ];
      
      const result = validatePlayerUniqueness(players);
      expect(result.isValid).toBe(true); // Empty names are ignored
    });

    it('should handle whitespace normalization', () => {
      const players: PlayerFormData[] = [
        { name: ' Alice Johnson ' },
        { name: 'Alice Johnson' }
      ];
      
      const result = validatePlayerUniqueness(players);
      expect(result.isValid).toBe(false);
      expect(result.duplicates).toContain(' Alice Johnson ');
    });
  });
}); 