import { 
  Player, 
  TournamentTeam, 
  TournamentConfig, 
  BracketStanding, 
  TeamAssignment,
  TournamentAdminData,
  PlayerFormData,
  TournamentSettingsFormData
} from '../types';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate unique team names
 */
function generateTeamNames(count: number): string[] {
  const baseNames = [
    'The Ringers', 'Clutch Hitters', 'Home Run Heroes', 'Beer Pong Legends',
    'Flip Cup Champions', 'The Underdogs', 'Power Hitters', 'Base Runners',
    'The Sluggers', 'Diamond Dogs', 'Thunder Bolts', 'Lightning Strikes',
    'The Crushers', 'Ace Pitchers', 'Grand Slammers', 'The Bombers',
    'Fast Ballers', 'The Wildcards', 'Strike Zone', 'The Mavericks',
    'Cup Crushers', 'The Dominators', 'Victory Squad', 'The Titans',
    'Storm Chasers', 'The Dynamos', 'Fire Ballers', 'The Rockets',
    'Thunder Cats', 'The Phoenixes', 'Ice Cold', 'The Hurricanes'
  ];

  if (count <= baseNames.length) {
    return shuffleArray(baseNames).slice(0, count);
  }

  // If we need more teams than base names, add numbers
  const names = [...baseNames];
  for (let i = baseNames.length; i < count; i++) {
    names.push(`Team ${i + 1}`);
  }

  return names.slice(0, count);
}

/**
 * Randomize players into teams of specified size
 */
export function randomizeTeams(
  players: Player[], 
  teamSize: number, 
  tournamentId: string
): TournamentTeam[] {
  if (players.length === 0 || teamSize <= 0) {
    return [];
  }

  const shuffledPlayers = shuffleArray(players);
  const teamCount = Math.ceil(shuffledPlayers.length / teamSize);
  const teamNames = generateTeamNames(teamCount);
  const teams: TournamentTeam[] = [];

  for (let i = 0; i < teamCount; i++) {
    const startIndex = i * teamSize;
    const endIndex = Math.min(startIndex + teamSize, shuffledPlayers.length);
    const teamPlayers = shuffledPlayers.slice(startIndex, endIndex);

    teams.push({
      id: `team-${i + 1}`,
      name: teamNames[i],
      players: teamPlayers,
      is_locked: false
    });
  }

  return teams;
}

/**
 * Convert TournamentTeam array to TeamAssignment array
 */
export function convertTeamsToAssignments(
  teams: TournamentTeam[], 
  tournamentId: string
): TeamAssignment[] {
  return teams.map(team => ({
    tournament_id: tournamentId,
    team_id: team.id,
    team_name: team.name,
    player_ids: team.players.map(player => player.id),
    is_locked: team.is_locked
  }));
}

/**
 * Calculate bracket structure based on pool play standings
 */
export function calculateBracketStructure(
  standings: BracketStanding[],
  bracketType: 'single_elimination' | 'double_elimination'
): {
  rounds: number;
  matchups: Array<{
    round: number;
    match: number;
    team1_seed: number;
    team2_seed: number;
    team1_name: string;
    team2_name: string;
    has_bye: boolean;
  }>;
  total_games: number;
} {
  const sortedStandings = [...standings].sort((a, b) => {
    // Sort by wins (descending), then by run differential (descending)
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }
    return b.run_differential - a.run_differential;
  });

  // Assign seeds
  const seededTeams = sortedStandings.map((standing, index) => ({
    ...standing,
    seed: index + 1
  }));

  const teamCount = seededTeams.length;
  
  // Find the next power of 2 for bracket size
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamCount)));
  const byeCount = bracketSize - teamCount;
  
  // Calculate rounds needed
  const rounds = Math.log2(bracketSize);
  
  // Generate first round matchups
  const firstRoundMatchups = [];
  let matchNumber = 1;
  
  // Handle byes for top seeds
  const teamsWithByes = seededTeams.slice(0, byeCount);
  const playingTeams = seededTeams.slice(byeCount);
  
  // Create matchups for teams that need to play
  for (let i = 0; i < playingTeams.length; i += 2) {
    if (i + 1 < playingTeams.length) {
      firstRoundMatchups.push({
        round: 1,
        match: matchNumber++,
        team1_seed: playingTeams[i].seed,
        team2_seed: playingTeams[i + 1].seed,
        team1_name: playingTeams[i].team_name,
        team2_name: playingTeams[i + 1].team_name,
        has_bye: false
      });
    }
  }

  // Add bye matchups for top seeds
  teamsWithByes.forEach(team => {
    firstRoundMatchups.push({
      round: 1,
      match: matchNumber++,
      team1_seed: team.seed,
      team2_seed: 0, // 0 indicates bye
      team1_name: team.team_name,
      team2_name: 'BYE',
      has_bye: true
    });
  });

  // Calculate total games
  let totalGames = firstRoundMatchups.length;
  if (bracketType === 'single_elimination') {
    totalGames = teamCount - 1; // n-1 games for n teams
  } else {
    // Double elimination has roughly 2n-3 games
    totalGames = (teamCount * 2) - 3;
  }

  return {
    rounds: Math.ceil(rounds),
    matchups: firstRoundMatchups,
    total_games: totalGames
  };
}

/**
 * Validate tournament configuration data
 */
export function validateTournamentData(
  config: TournamentSettingsFormData,
  players: PlayerFormData[],
  teams?: TournamentTeam[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate tournament settings
  if (config.pool_play_games < 1) {
    errors.push('Pool play games must be at least 1');
  }

  if (config.pool_play_innings < 3) {
    errors.push('Pool play innings must be at least 3');
  }

  if (config.bracket_innings < 3) {
    errors.push('Bracket innings must be at least 3');
  }

  if (config.final_innings < 3) {
    errors.push('Final innings must be at least 3');
  }

  if (config.team_size < 1) {
    errors.push('Team size must be at least 1');
  }

  if (config.team_size > 20) {
    warnings.push('Team size is unusually large (>20 players)');
  }

  // Validate players
  if (players.length === 0) {
    errors.push('At least one player is required');
  }

  // Check for duplicate player names
  const playerNames = players.map(p => p.name.toLowerCase().trim());
  const duplicateNames = playerNames.filter((name, index) => 
    playerNames.indexOf(name) !== index
  );

  if (duplicateNames.length > 0) {
    errors.push(`Duplicate player names found: ${duplicateNames.join(', ')}`);
  }

  // Check for empty player names
  const emptyNames = players.filter(p => !p.name.trim());
  if (emptyNames.length > 0) {
    errors.push(`${emptyNames.length} player(s) have empty names`);
  }

  // Validate team composition if teams are provided
  if (teams && teams.length > 0) {
    const totalPlayersInTeams = teams.reduce((sum, team) => sum + team.players.length, 0);
    
    if (totalPlayersInTeams !== players.length) {
      errors.push('Not all players are assigned to teams');
    }

    // Check for duplicate team names
    const teamNames = teams.map(t => t.name.toLowerCase().trim());
    const duplicateTeamNames = teamNames.filter((name, index) => 
      teamNames.indexOf(name) !== index
    );

    if (duplicateTeamNames.length > 0) {
      errors.push(`Duplicate team names found: ${duplicateTeamNames.join(', ')}`);
    }

    // Check team size balance
    const teamSizes = teams.map(t => t.players.length);
    const minSize = Math.min(...teamSizes);
    const maxSize = Math.max(...teamSizes);
    
    if (maxSize - minSize > 1) {
      warnings.push('Team sizes are unbalanced (difference > 1 player)');
    }

    // Check for minimum teams for bracket play
    if (teams.length < 2) {
      errors.push('At least 2 teams are required for bracket play');
    }

    // Warn about odd number of teams
    if (teams.length % 2 === 1) {
      warnings.push('Odd number of teams will result in byes in bracket play');
    }
  }

  // Check minimum players for team size
  if (players.length < config.team_size) {
    errors.push(`Not enough players for desired team size (${players.length} players, need ${config.team_size} per team)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate optimal team distribution
 */
export function calculateOptimalTeamDistribution(
  playerCount: number,
  preferredTeamSize: number
): {
  teamCount: number;
  actualTeamSize: number;
  remainder: number;
  distribution: number[];
} {
  if (playerCount === 0 || preferredTeamSize <= 0) {
    return {
      teamCount: 0,
      actualTeamSize: 0,
      remainder: 0,
      distribution: []
    };
  }

  const teamCount = Math.ceil(playerCount / preferredTeamSize);
  const baseSize = Math.floor(playerCount / teamCount);
  const remainder = playerCount % teamCount;

  // Create distribution array
  const distribution = Array(teamCount).fill(baseSize);
  
  // Distribute remainder players
  for (let i = 0; i < remainder; i++) {
    distribution[i]++;
  }

  return {
    teamCount,
    actualTeamSize: baseSize,
    remainder,
    distribution
  };
}

/**
 * Generate tournament standings from game results
 */
export function generateTournamentStandings(
  teams: TournamentTeam[],
  gameResults: Array<{
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
    status: 'completed';
  }>
): BracketStanding[] {
  // Initialize standings
  const standings: BracketStanding[] = teams.map(team => ({
    team_id: team.id,
    team_name: team.name,
    wins: 0,
    losses: 0,
    runs_scored: 0,
    runs_allowed: 0,
    run_differential: 0,
    win_percentage: 0,
    seed: 0
  }));

  // Process game results
  gameResults.forEach(game => {
    const homeTeam = standings.find(s => s.team_id === game.home_team_id);
    const awayTeam = standings.find(s => s.team_id === game.away_team_id);

    if (homeTeam && awayTeam) {
      // Update scores
      homeTeam.runs_scored += game.home_score;
      homeTeam.runs_allowed += game.away_score;
      awayTeam.runs_scored += game.away_score;
      awayTeam.runs_allowed += game.home_score;

      // Update wins/losses
      if (game.home_score > game.away_score) {
        homeTeam.wins++;
        awayTeam.losses++;
      } else {
        awayTeam.wins++;
        homeTeam.losses++;
      }
    }
  });

  // Calculate derived stats
  standings.forEach(standing => {
    standing.run_differential = standing.runs_scored - standing.runs_allowed;
    const totalGames = standing.wins + standing.losses;
    standing.win_percentage = totalGames > 0 ? standing.wins / totalGames : 0;
  });

  // Sort by wins (desc), then by run differential (desc)
  standings.sort((a, b) => {
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }
    return b.run_differential - a.run_differential;
  });

  // Assign seeds
  standings.forEach((standing, index) => {
    standing.seed = index + 1;
  });

  return standings;
}

/**
 * Check if tournament settings are locked
 */
export function isSettingsLocked(
  config: TournamentConfig,
  hasActiveGames: boolean
): boolean {
  return config.settings_locked || config.is_active || hasActiveGames;
}

/**
 * Check if teams are locked
 */
export function areTeamsLocked(
  teams: TournamentTeam[],
  tournamentActive: boolean
): boolean {
  return tournamentActive || teams.some(team => team.is_locked);
}

/**
 * Validate player uniqueness across tournament
 */
export function validatePlayerUniqueness(
  players: PlayerFormData[]
): {
  isValid: boolean;
  duplicates: string[];
} {
  const nameMap = new Map<string, number>();
  const duplicates: string[] = [];

  players.forEach(player => {
    const normalizedName = player.name.toLowerCase().trim();
    if (normalizedName) {
      const count = nameMap.get(normalizedName) || 0;
      nameMap.set(normalizedName, count + 1);
      
      if (count === 1) { // First duplicate
        duplicates.push(player.name);
      }
    }
  });

  return {
    isValid: duplicates.length === 0,
    duplicates
  };
} 