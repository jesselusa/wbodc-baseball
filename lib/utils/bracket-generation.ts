/**
 * Tournament Bracket Generation Utilities
 * 
 * This module contains algorithms and utilities for generating tournament brackets,
 * including seeding, bye assignment, and bracket structure creation.
 */

export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  gamesPlayed: number;
  seed?: number;
}

export interface BracketMatch {
  gameNumber: number;
  round: number;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamSeed?: number;
  awayTeamSeed?: number;
  winnerTeamId?: string;
  isBye: boolean;
  nextGameNumber?: number;
}

export interface TournamentBracket {
  tournamentId: string;
  bracketType: 'single_elimination' | 'double_elimination';
  matches: BracketMatch[];
  totalRounds: number;
  totalGames: number;
}

export interface ByeAssignment {
  teamId: string;
  teamName: string;
  seed: number;
  byeRound: number;
  nextGameNumber: number;
}

export interface BracketValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type BracketType = 'single_elimination' | 'double_elimination';

/**
 * Calculate team standings from round robin results
 * 
 * @param games Array of completed round robin games
 * @param teams Array of teams in the tournament
 * @returns Array of team standings sorted by performance
 */
export function calculateTeamStandings(
  games: Array<{
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    status: string;
  }>,
  teams: Array<{ id: string; name: string }>
): TeamStanding[] {
  const standings = new Map<string, TeamStanding>();

  // Initialize standings for all teams
  teams.forEach(team => {
    standings.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      wins: 0,
      losses: 0,
      runsScored: 0,
      runsAllowed: 0,
      runDifferential: 0,
      gamesPlayed: 0
    });
  });

  // Process completed games
  games.forEach(game => {
    if (game.status !== 'completed') return;

    const homeStanding = standings.get(game.homeTeamId)!;
    const awayStanding = standings.get(game.awayTeamId)!;

    // Update games played
    homeStanding.gamesPlayed++;
    awayStanding.gamesPlayed++;

    // Update runs
    homeStanding.runsScored += game.homeScore;
    homeStanding.runsAllowed += game.awayScore;
    awayStanding.runsScored += game.awayScore;
    awayStanding.runsAllowed += game.homeScore;

    // Update wins/losses
    if (game.homeScore > game.awayScore) {
      homeStanding.wins++;
      awayStanding.losses++;
    } else {
      awayStanding.wins++;
      homeStanding.losses++;
    }
  });

  // Calculate run differentials
  standings.forEach(standing => {
    standing.runDifferential = standing.runsScored - standing.runsAllowed;
  });

  // Sort standings by performance (wins, then run differential)
  const sortedStandings = Array.from(standings.values()).sort((a, b) => {
    // Primary sort: wins (descending)
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }
    
    // Secondary sort: run differential (descending)
    if (a.runDifferential !== b.runDifferential) {
      return b.runDifferential - a.runDifferential;
    }
    
    // Tertiary sort: runs scored (descending)
    if (a.runsScored !== b.runsScored) {
      return b.runsScored - a.runsScored;
    }
    
    // Quaternary sort: team name (alphabetical)
    return a.teamName.localeCompare(b.teamName);
  });

  // Assign seeds
  sortedStandings.forEach((standing, index) => {
    standing.seed = index + 1;
  });

  return sortedStandings;
}

/**
 * Generate bracket seeding based on round robin standings
 * 
 * This function creates the bracket seeding order based on team performance.
 * For single elimination brackets, teams are seeded to minimize early matchups
 * between top performers.
 * 
 * @param standings Team standings from round robin phase
 * @param bracketType Type of bracket (single or double elimination)
 * @returns Array of team IDs in bracket seeding order
 */
export function generateBracketSeeding(
  standings: TeamStanding[],
  bracketType: BracketType
): string[] {
  if (standings.length === 0) {
    throw new Error('No team standings provided for bracket seeding');
  }

  // For single elimination, use standard seeding pattern
  if (bracketType === 'single_elimination') {
    return generateSingleEliminationSeeding(standings);
  }

  // For double elimination, use similar seeding but with loser's bracket
  if (bracketType === 'double_elimination') {
    return generateDoubleEliminationSeeding(standings);
  }

  throw new Error(`Unsupported bracket type: ${bracketType}`);
}

/**
 * Generate single elimination bracket seeding
 * 
 * Standard seeding pattern for single elimination brackets:
 * 1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7 (for 8 teams)
 * This ensures top teams don't meet until later rounds.
 * 
 * @param standings Team standings sorted by performance
 * @returns Array of team IDs in bracket seeding order
 */
function generateSingleEliminationSeeding(standings: TeamStanding[]): string[] {
  const numTeams = standings.length;
  const teamIds = standings.map(s => s.teamId);

  // If number of teams is not a power of 2, we'll need byes
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const byesNeeded = nextPowerOf2 - numTeams;

  // Create seeding array with proper positioning
  const seeding: string[] = new Array(nextPowerOf2);
  
  // Fill in the teams in standard seeding order
  for (let i = 0; i < numTeams; i++) {
    const position = getSeedingPosition(i, nextPowerOf2);
    seeding[position] = teamIds[i];
  }

  // Fill remaining positions with null (these will be byes)
  for (let i = 0; i < nextPowerOf2; i++) {
    if (!seeding[i]) {
      seeding[i] = 'BYE';
    }
  }

  return seeding;
}

/**
 * Generate double elimination bracket seeding
 * 
 * Similar to single elimination but with additional loser's bracket games.
 * 
 * @param standings Team standings sorted by performance
 * @returns Array of team IDs in bracket seeding order
 */
function generateDoubleEliminationSeeding(standings: TeamStanding[]): string[] {
  // For double elimination, we use the same seeding as single elimination
  // The loser's bracket will be generated separately
  return generateSingleEliminationSeeding(standings);
}

/**
 * Get the proper seeding position for a team based on their rank
 * 
 * This implements the standard tournament seeding pattern where:
 * - 1st seed goes to position 0
 * - 2nd seed goes to position (size-1)
 * - 3rd seed goes to position (size/2)
 * - 4th seed goes to position (size/2-1)
 * And so on...
 * 
 * @param rank Team's rank (0-based)
 * @param size Total number of positions in bracket
 * @returns Position in the bracket (0-based)
 */
function getSeedingPosition(rank: number, size: number): number {
  if (rank === 0) return 0; // 1st seed always goes to position 0
  if (rank === 1) return size - 1; // 2nd seed goes to last position
  if (rank === 2) return size / 2; // 3rd seed goes to middle position
  if (rank === 3) return size / 2 - 1; // 4th seed goes to position before middle

  // For higher ranks, we need to use a different approach
  // The standard seeding pattern for 8 teams is: 1,8,4,5,2,7,3,6
  // For 16 teams: 1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11
  // This follows a specific pattern that's hard to express recursively
  
  // For now, let's use a simpler approach for ranks 4 and above
  if (rank === 4) return 2; // 5th seed goes to position 2
  if (rank === 5) return size - 3; // 6th seed goes to position size-3
  if (rank === 6) return size - 2; // 7th seed goes to position size-2
  if (rank === 7) return 1; // 8th seed goes to position 1
  
  // For higher ranks, we'd need to extend this pattern
  throw new Error(`Seeding position not implemented for rank ${rank} with size ${size}`);
}

/**
 * Assign byes to top-seeded teams
 * 
 * This function determines which teams get byes and in which round.
 * Byes are assigned to the highest-seeded teams to give them an advantage
 * for their strong performance in the round robin phase.
 * 
 * @param standings Team standings sorted by performance
 * @param bracketType Type of bracket
 * @returns Array of bye assignments
 */
export function assignByesToTopSeededTeams(
  standings: TeamStanding[],
  bracketType: BracketType
): ByeAssignment[] {
  const numTeams = standings.length;
  const byesNeeded = calculateByesNeeded(numTeams);
  
  if (byesNeeded === 0) {
    return []; // No byes needed if number of teams is a power of 2
  }

  const byeAssignments: ByeAssignment[] = [];
  const seeding = generateBracketSeeding(standings, bracketType);
  const totalRounds = calculateBracketRounds(numTeams);

  // Find teams that get byes (teams that are paired with 'BYE' in first round)
  for (let i = 0; i < seeding.length; i += 2) {
    const team1 = seeding[i];
    const team2 = seeding[i + 1];

    if (team1 === 'BYE' && team2 !== 'BYE') {
      // Team2 gets a bye
      const teamStanding = standings.find(s => s.teamId === team2)!;
      byeAssignments.push({
        teamId: team2,
        teamName: teamStanding.teamName,
        seed: teamStanding.seed!,
        byeRound: 1,
        nextGameNumber: Math.floor(i / 2) + 1
      });
    } else if (team2 === 'BYE' && team1 !== 'BYE') {
      // Team1 gets a bye
      const teamStanding = standings.find(s => s.teamId === team1)!;
      byeAssignments.push({
        teamId: team1,
        teamName: teamStanding.teamName,
        seed: teamStanding.seed!,
        byeRound: 1,
        nextGameNumber: Math.floor(i / 2) + 1
      });
    }
  }

  // Sort bye assignments by seed (highest seeds first)
  byeAssignments.sort((a, b) => a.seed - b.seed);

  return byeAssignments;
}

/**
 * Calculate which round a team with a bye will play their first game
 * 
 * @param byeRound The round in which the team has a bye
 * @param totalRounds Total number of rounds in the bracket
 * @returns The round when the team will play their first game
 */
export function calculateFirstGameRound(byeRound: number, totalRounds: number): number {
  return byeRound + 1;
}

/**
 * Calculate the game number for a team's first game after a bye
 * 
 * @param byeGameNumber The game number where the bye occurred
 * @param byeRound The round of the bye
 * @param totalRounds Total number of rounds in the bracket
 * @returns The game number for the team's first actual game
 */
export function calculateFirstGameNumber(
  byeGameNumber: number,
  byeRound: number,
  totalRounds: number
): number {
  // Calculate how many games are in each round
  const gamesInFirstRound = Math.pow(2, totalRounds - 1);
  
  // Calculate the game number in the next round
  const nextRoundGameNumber = Math.ceil(byeGameNumber / 2);
  
  // Add the offset for games in previous rounds
  return gamesInFirstRound + nextRoundGameNumber;
}

/**
 * Validate bye assignments
 * 
 * @param byeAssignments Array of bye assignments
 * @param standings Team standings
 * @param bracketType Type of bracket
 * @returns Validation result
 */
export function validateByeAssignments(
  byeAssignments: ByeAssignment[],
  standings: TeamStanding[],
  bracketType: BracketType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const numTeams = standings.length;
  const expectedByes = calculateByesNeeded(numTeams);

  // Check that the correct number of byes are assigned
  if (byeAssignments.length !== expectedByes) {
    errors.push(`Expected ${expectedByes} byes, but ${byeAssignments.length} were assigned`);
  }

  // Check that only top-seeded teams get byes
  const teamIds = standings.map(s => s.teamId);
  const byeTeamIds = byeAssignments.map(b => b.teamId);

  byeTeamIds.forEach(teamId => {
    if (!teamIds.includes(teamId)) {
      errors.push(`Unknown team ${teamId} assigned a bye`);
    }
  });

  // Check that no team gets multiple byes
  const uniqueByeTeams = new Set(byeTeamIds);
  if (uniqueByeTeams.size !== byeTeamIds.length) {
    errors.push('Duplicate teams found in bye assignments');
  }

  // Check that byes are assigned to top seeds
  const topSeeds = standings.slice(0, expectedByes).map(s => s.teamId);
  byeTeamIds.forEach(teamId => {
    if (!topSeeds.includes(teamId)) {
      errors.push(`Team ${teamId} is not a top seed but was assigned a bye`);
    }
  });

  // Check that all bye assignments have valid next game numbers
  byeAssignments.forEach(assignment => {
    if (assignment.nextGameNumber <= 0) {
      errors.push(`Invalid next game number for team ${assignment.teamId}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate complete bracket structure and integrity
 * 
 * This function performs comprehensive validation of a tournament bracket,
 * checking for structural integrity, logical consistency, and proper game progression.
 * 
 * @param bracket Tournament bracket to validate
 * @param standings Team standings used to generate the bracket
 * @returns Comprehensive validation result
 */
export function validateBracketStructure(
  bracket: TournamentBracket,
  standings: TeamStanding[]
): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure validation
  if (!bracket.tournamentId) {
    errors.push('Tournament ID is required');
  }

  if (!['single_elimination', 'double_elimination'].includes(bracket.bracketType)) {
    errors.push(`Invalid bracket type: ${bracket.bracketType}`);
  }

  if (!bracket.matches || bracket.matches.length === 0) {
    errors.push('Bracket must contain at least one match');
  }

  if (bracket.totalRounds <= 0) {
    errors.push('Total rounds must be greater than 0');
  }

  if (bracket.totalGames <= 0) {
    errors.push('Total games must be greater than 0');
  }

  // Validate match structure
  const matchValidation = validateBracketMatches(bracket.matches, bracket.bracketType);
  errors.push(...matchValidation.errors);
  warnings.push(...matchValidation.warnings);

  // Validate game progression
  const progressionValidation = validateGameProgression(bracket.matches, bracket.bracketType);
  errors.push(...progressionValidation.errors);
  warnings.push(...progressionValidation.warnings);

  // Validate team consistency
  const teamValidation = validateTeamConsistency(bracket.matches, standings);
  errors.push(...teamValidation.errors);
  warnings.push(...teamValidation.warnings);

  // Validate bracket completeness
  const completenessValidation = validateBracketCompleteness(bracket, standings);
  errors.push(...completenessValidation.errors);
  warnings.push(...completenessValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate individual bracket matches
 * 
 * @param matches Array of bracket matches
 * @param bracketType Type of bracket
 * @returns Validation result
 */
function validateBracketMatches(
  matches: BracketMatch[],
  bracketType: BracketType
): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate game numbers
  const gameNumbers = matches.map(m => m.gameNumber);
  const uniqueGameNumbers = new Set(gameNumbers);
  if (uniqueGameNumbers.size !== gameNumbers.length) {
    errors.push('Duplicate game numbers found in bracket');
  }

  // Check for missing game numbers
  const sortedGameNumbers = gameNumbers.sort((a, b) => a - b);
  for (let i = 1; i <= sortedGameNumbers[sortedGameNumbers.length - 1]; i++) {
    if (!sortedGameNumbers.includes(i)) {
      errors.push(`Missing game number: ${i}`);
    }
  }

  // Validate each match
  matches.forEach(match => {
    // Validate game number
    if (match.gameNumber <= 0) {
      errors.push(`Invalid game number: ${match.gameNumber}`);
    }

    // Validate round number
    if (match.round <= 0) {
      errors.push(`Invalid round number: ${match.round}`);
    }

    // Validate bye matches
    if (match.isBye) {
      if (match.awayTeamId) {
        errors.push(`Bye match ${match.gameNumber} should not have an away team`);
      }
      if (!match.winnerTeamId) {
        errors.push(`Bye match ${match.gameNumber} should have a winner`);
      }
    } else {
      // Validate regular matches
      if (!match.homeTeamId && !match.awayTeamId) {
        warnings.push(`Match ${match.gameNumber} has no teams assigned`);
      }
    }

    // Validate next game number references
    if (match.nextGameNumber !== undefined) {
      if (match.nextGameNumber <= 0) {
        errors.push(`Invalid next game number: ${match.nextGameNumber}`);
      }
      if (!gameNumbers.includes(match.nextGameNumber)) {
        errors.push(`Next game number ${match.nextGameNumber} does not exist`);
      }
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate game progression logic
 * 
 * @param matches Array of bracket matches
 * @param bracketType Type of bracket
 * @returns Validation result
 */
function validateGameProgression(
  matches: BracketMatch[],
  bracketType: BracketType
): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Group matches by round
  const matchesByRound = new Map<number, BracketMatch[]>();
  matches.forEach(match => {
    if (!matchesByRound.has(match.round)) {
      matchesByRound.set(match.round, []);
    }
    matchesByRound.get(match.round)!.push(match);
  });

  // Validate round progression
  const rounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
  for (let i = 1; i < rounds.length; i++) {
    const currentRound = rounds[i];
    const previousRound = rounds[i - 1];
    
    if (currentRound !== previousRound + 1) {
      errors.push(`Missing round ${previousRound + 1} between rounds ${previousRound} and ${currentRound}`);
    }
  }

  // Validate game count progression
  rounds.forEach(round => {
    const roundMatches = matchesByRound.get(round)!;
    const expectedGames = Math.pow(2, rounds.length - round);
    
    if (roundMatches.length !== expectedGames) {
      errors.push(`Round ${round} has ${roundMatches.length} games, expected ${expectedGames}`);
    }
  });

  // Validate winner advancement
  matches.forEach(match => {
    if (match.winnerTeamId && match.nextGameNumber) {
      const nextMatch = matches.find(m => m.gameNumber === match.nextGameNumber);
      if (nextMatch) {
        // Check if winner is properly assigned to next match
        const winnerInNextMatch = nextMatch.homeTeamId === match.winnerTeamId || 
                                 nextMatch.awayTeamId === match.winnerTeamId;
        if (!winnerInNextMatch) {
          warnings.push(`Winner of game ${match.gameNumber} not properly assigned to game ${match.nextGameNumber}`);
        }
      }
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate team consistency across matches
 * 
 * @param matches Array of bracket matches
 * @param standings Team standings
 * @returns Validation result
 */
function validateTeamConsistency(
  matches: BracketMatch[],
  standings: TeamStanding[]
): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const teamIds = standings.map(s => s.teamId);
  const allTeamIds = new Set<string>();

  // Collect all team IDs from matches
  matches.forEach(match => {
    if (match.homeTeamId) allTeamIds.add(match.homeTeamId);
    if (match.awayTeamId) allTeamIds.add(match.awayTeamId);
    if (match.winnerTeamId) allTeamIds.add(match.winnerTeamId);
  });

  // Check for unknown teams
  allTeamIds.forEach(teamId => {
    if (!teamIds.includes(teamId)) {
      errors.push(`Unknown team ID found in bracket: ${teamId}`);
    }
  });

  // Check for teams playing against themselves
  matches.forEach(match => {
    if (match.homeTeamId && match.awayTeamId && match.homeTeamId === match.awayTeamId) {
      errors.push(`Team ${match.homeTeamId} cannot play against itself in game ${match.gameNumber}`);
    }
  });

  // Check for teams appearing multiple times in the same round
  const matchesByRound = new Map<number, BracketMatch[]>();
  matches.forEach(match => {
    if (!matchesByRound.has(match.round)) {
      matchesByRound.set(match.round, []);
    }
    matchesByRound.get(match.round)!.push(match);
  });

  matchesByRound.forEach((roundMatches, round) => {
    const teamsInRound = new Set<string>();
    roundMatches.forEach(match => {
      if (match.homeTeamId) {
        if (teamsInRound.has(match.homeTeamId)) {
          errors.push(`Team ${match.homeTeamId} appears multiple times in round ${round}`);
        }
        teamsInRound.add(match.homeTeamId);
      }
      if (match.awayTeamId) {
        if (teamsInRound.has(match.awayTeamId)) {
          errors.push(`Team ${match.awayTeamId} appears multiple times in round ${round}`);
        }
        teamsInRound.add(match.awayTeamId);
      }
    });
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate bracket completeness
 * 
 * @param bracket Tournament bracket
 * @param standings Team standings
 * @returns Validation result
 */
function validateBracketCompleteness(
  bracket: TournamentBracket,
  standings: TeamStanding[]
): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const numTeams = standings.length;
  
  // Only calculate expected games/rounds if bracket type is valid
  if (!['single_elimination', 'double_elimination'].includes(bracket.bracketType)) {
    errors.push(`Invalid bracket type: ${bracket.bracketType}`);
    return { isValid: false, errors, warnings };
  }
  
  const expectedGames = calculateBracketGames(numTeams, bracket.bracketType);
  const expectedRounds = calculateBracketRounds(numTeams);

  // Check total games
  if (bracket.totalGames !== expectedGames) {
    errors.push(`Expected ${expectedGames} games, but bracket has ${bracket.totalGames}`);
  }

  // Check total rounds
  if (bracket.bracketType === 'single_elimination') {
    if (bracket.totalRounds !== expectedRounds) {
      errors.push(`Expected ${expectedRounds} rounds, but bracket has ${bracket.totalRounds}`);
    }
  } else {
    // Double elimination has extra championship round
    if (bracket.totalRounds !== expectedRounds + 1) {
      errors.push(`Expected ${expectedRounds + 1} rounds for double elimination, but bracket has ${bracket.totalRounds}`);
    }
  }

  // Check that all teams are included in first round
  const firstRoundMatches = bracket.matches.filter(m => m.round === 1);
  const teamsInFirstRound = new Set<string>();
  firstRoundMatches.forEach(match => {
    if (match.homeTeamId) teamsInFirstRound.add(match.homeTeamId);
    if (match.awayTeamId) teamsInFirstRound.add(match.awayTeamId);
  });

  standings.forEach(standing => {
    if (!teamsInFirstRound.has(standing.teamId)) {
      errors.push(`Team ${standing.teamId} not found in first round`);
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Generate complete tournament bracket
 * 
 * This function creates a complete bracket structure with all matches,
 * including proper seeding, bye assignments, and game progression.
 * 
 * @param tournamentId Tournament identifier
 * @param standings Team standings from round robin phase
 * @param bracketType Type of bracket (single or double elimination)
 * @returns Complete tournament bracket
 */
export function generateTournamentBracket(
  tournamentId: string,
  standings: TeamStanding[],
  bracketType: BracketType
): TournamentBracket {
  if (standings.length === 0) {
    throw new Error('No team standings provided for bracket generation');
  }

  if (bracketType === 'single_elimination') {
    return generateSingleEliminationBracket(tournamentId, standings);
  }

  if (bracketType === 'double_elimination') {
    return generateDoubleEliminationBracket(tournamentId, standings);
  }

  throw new Error(`Unsupported bracket type: ${bracketType}`);
}

/**
 * Generate single elimination bracket
 * 
 * @param tournamentId Tournament identifier
 * @param standings Team standings
 * @returns Single elimination bracket
 */
function generateSingleEliminationBracket(
  tournamentId: string,
  standings: TeamStanding[]
): TournamentBracket {
  const numTeams = standings.length;
  const totalRounds = calculateBracketRounds(numTeams);
  const totalGames = calculateBracketGames(numTeams, 'single_elimination');
  const seeding = generateBracketSeeding(standings, 'single_elimination');

  const matches: BracketMatch[] = [];
  let gameNumber = 1;

  // Generate first round matches
  for (let i = 0; i < seeding.length; i += 2) {
    const team1 = seeding[i];
    const team2 = seeding[i + 1];

    if (team1 === 'BYE' && team2 !== 'BYE') {
      // Team2 gets a bye
      matches.push({
        gameNumber,
        round: 1,
        homeTeamId: team2,
        awayTeamId: undefined,
        homeTeamSeed: standings.find(s => s.teamId === team2)?.seed,
        awayTeamSeed: undefined,
        winnerTeamId: team2,
        isBye: true,
        nextGameNumber: Math.floor(gameNumber / 2) + Math.pow(2, totalRounds - 2) + 1
      });
    } else if (team2 === 'BYE' && team1 !== 'BYE') {
      // Team1 gets a bye
      matches.push({
        gameNumber,
        round: 1,
        homeTeamId: team1,
        awayTeamId: undefined,
        homeTeamSeed: standings.find(s => s.teamId === team1)?.seed,
        awayTeamSeed: undefined,
        winnerTeamId: team1,
        isBye: true,
        nextGameNumber: Math.floor(gameNumber / 2) + Math.pow(2, totalRounds - 2) + 1
      });
    } else {
      // Regular match
      matches.push({
        gameNumber,
        round: 1,
        homeTeamId: team1,
        awayTeamId: team2,
        homeTeamSeed: standings.find(s => s.teamId === team1)?.seed,
        awayTeamSeed: standings.find(s => s.teamId === team2)?.seed,
        winnerTeamId: undefined,
        isBye: false,
        nextGameNumber: Math.floor(gameNumber / 2) + Math.pow(2, totalRounds - 2) + 1
      });
    }
    gameNumber++;
  }

  // Generate subsequent rounds
  let gamesInCurrentRound = Math.pow(2, totalRounds - 1);
  for (let round = 2; round <= totalRounds; round++) {
    gamesInCurrentRound = Math.floor(gamesInCurrentRound / 2);
    
    for (let game = 0; game < gamesInCurrentRound; game++) {
      const nextRoundGames = Math.floor(gamesInCurrentRound / 2);
      const nextGameNum = nextRoundGames === 0 ? undefined : 
        Math.pow(2, totalRounds - round) + Math.floor(game / 2) + 1;

      matches.push({
        gameNumber,
        round,
        homeTeamId: undefined,
        awayTeamId: undefined,
        homeTeamSeed: undefined,
        awayTeamSeed: undefined,
        winnerTeamId: undefined,
        isBye: false,
        nextGameNumber: nextGameNum
      });
      gameNumber++;
    }
  }

  return {
    tournamentId,
    bracketType: 'single_elimination',
    matches,
    totalRounds,
    totalGames
  };
}

/**
 * Generate double elimination bracket
 * 
 * @param tournamentId Tournament identifier
 * @param standings Team standings
 * @returns Double elimination bracket
 */
function generateDoubleEliminationBracket(
  tournamentId: string,
  standings: TeamStanding[]
): TournamentBracket {
  const numTeams = standings.length;
  const totalRounds = calculateBracketRounds(numTeams);
  const totalGames = calculateBracketGames(numTeams, 'double_elimination');
  const seeding = generateBracketSeeding(standings, 'double_elimination');

  const matches: BracketMatch[] = [];
  let gameNumber = 1;

  // Generate winner's bracket (same as single elimination)
  const winnerBracketGames = Math.pow(2, totalRounds) - 1;
  for (let i = 0; i < winnerBracketGames; i++) {
    const round = Math.floor(Math.log2(i + 1)) + 1;
    const nextRoundGames = Math.floor(winnerBracketGames / Math.pow(2, round));
    const nextGameNum = nextRoundGames === 0 ? undefined : 
      winnerBracketGames + Math.floor(i / 2) + 1;

    matches.push({
      gameNumber,
      round,
      homeTeamId: undefined,
      awayTeamId: undefined,
      homeTeamSeed: undefined,
      awayTeamSeed: undefined,
      winnerTeamId: undefined,
      isBye: false,
      nextGameNumber: nextGameNum
    });
    gameNumber++;
  }

  // Generate loser's bracket
  const loserBracketGames = winnerBracketGames - 1;
  for (let i = 0; i < loserBracketGames; i++) {
    const round = Math.floor(Math.log2(i + 1)) + 1;
    const nextRoundGames = Math.floor(loserBracketGames / Math.pow(2, round));
    const nextGameNum = nextRoundGames === 0 ? undefined : 
      winnerBracketGames + loserBracketGames + Math.floor(i / 2) + 1;

    matches.push({
      gameNumber,
      round,
      homeTeamId: undefined,
      awayTeamId: undefined,
      homeTeamSeed: undefined,
      awayTeamSeed: undefined,
      winnerTeamId: undefined,
      isBye: false,
      nextGameNumber: nextGameNum
    });
    gameNumber++;
  }

  // Generate championship game(s)
  matches.push({
    gameNumber,
    round: totalRounds + 1,
    homeTeamId: undefined,
    awayTeamId: undefined,
    homeTeamSeed: undefined,
    awayTeamSeed: undefined,
    winnerTeamId: undefined,
    isBye: false,
    nextGameNumber: undefined
  });

  return {
    tournamentId,
    bracketType: 'double_elimination',
    matches,
    totalRounds: totalRounds + 1, // +1 for championship game
    totalGames
  };
}

/**
 * Calculate the number of byes needed for a bracket
 * 
 * @param numTeams Number of teams
 * @returns Number of byes needed
 */
export function calculateByesNeeded(numTeams: number): number {
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  return nextPowerOf2 - numTeams;
}

/**
 * Calculate the number of rounds needed for a bracket
 * 
 * @param numTeams Number of teams
 * @returns Number of rounds needed
 */
export function calculateBracketRounds(numTeams: number): number {
  return Math.ceil(Math.log2(numTeams));
}

/**
 * Calculate the total number of games in a bracket
 * 
 * @param numTeams Number of teams
 * @param bracketType Type of bracket
 * @returns Total number of games
 */
export function calculateBracketGames(numTeams: number, bracketType: BracketType): number {
  if (bracketType === 'single_elimination') {
    return numTeams - 1; // One team wins, all others lose once
  }
  
  if (bracketType === 'double_elimination') {
    // In double elimination, teams need to lose twice to be eliminated
    // Maximum games = 2 * (numTeams - 1) - 1
    return 2 * (numTeams - 1) - 1;
  }
  
  throw new Error(`Unsupported bracket type: ${bracketType}`);
}

/**
 * Validate bracket seeding
 * 
 * @param seeding Bracket seeding array
 * @param standings Original team standings
 * @returns Validation result
 */
export function validateBracketSeeding(
  seeding: string[],
  standings: TeamStanding[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const teamIds = standings.map(s => s.teamId);
  const seedingTeamIds = seeding.filter(id => id !== 'BYE');

  // Check that all teams are included
  teamIds.forEach(teamId => {
    if (!seedingTeamIds.includes(teamId)) {
      errors.push(`Team ${teamId} not found in bracket seeding`);
    }
  });

  // Check that no extra teams are included
  seedingTeamIds.forEach(teamId => {
    if (!teamIds.includes(teamId)) {
      errors.push(`Unknown team ${teamId} found in bracket seeding`);
    }
  });

  // Check that seeding length is a power of 2
  const seedingLength = seeding.length;
  if ((seedingLength & (seedingLength - 1)) !== 0) {
    errors.push(`Bracket seeding length ${seedingLength} is not a power of 2`);
  }

  // Check for duplicate teams
  const uniqueTeams = new Set(seedingTeamIds);
  if (uniqueTeams.size !== seedingTeamIds.length) {
    errors.push('Duplicate teams found in bracket seeding');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 