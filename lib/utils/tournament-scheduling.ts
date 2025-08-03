/**
 * Tournament Scheduling Utilities
 * 
 * This module contains algorithms and utilities for generating tournament schedules,
 * including round robin schedules using the Berger table algorithm.
 */

export interface Team {
  id: string;
  name: string;
}

export interface RoundRobinMatch {
  homeTeam: Team;
  awayTeam: Team;
  round: number;
  gameNumber: number;
}

export interface TournamentSchedule {
  matches: RoundRobinMatch[];
  totalRounds: number;
  matchesPerRound: number;
}

export interface TimeSlot {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  label: string;
  maxGames: number;
}

export interface ScheduledMatch extends RoundRobinMatch {
  timeSlot: TimeSlot;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface TournamentScheduleWithTimeSlots {
  matches: ScheduledMatch[];
  totalRounds: number;
  matchesPerRound: number;
  timeSlots: TimeSlot[];
}

/**
 * Berger Table Algorithm for Round Robin Scheduling
 * 
 * The Berger table algorithm creates a round robin schedule where each team
 * plays every other team exactly once. For odd numbers of teams, a "bye" team
 * is added to make the number even.
 * 
 * @param teams Array of teams to schedule
 * @returns Complete round robin schedule
 */
export function generateRoundRobinSchedule(teams: Team[]): TournamentSchedule {
  if (teams.length < 2) {
    throw new Error('At least 2 teams are required for a round robin tournament');
  }

  // If odd number of teams, add a "bye" team
  const teamsWithBye = teams.length % 2 === 1 
    ? [...teams, { id: 'bye', name: 'BYE' }]
    : [...teams];

  const numTeams = teamsWithBye.length;
  const totalRounds = numTeams - 1;
  const matchesPerRound = Math.floor(numTeams / 2);

  const matches: RoundRobinMatch[] = [];

  // Create the Berger table
  const bergerTable = createBergerTable(numTeams);

  // Generate matches from the Berger table
  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIndex = bergerTable[round][match * 2];
      const awayIndex = bergerTable[round][match * 2 + 1];

      // Skip matches involving the bye team
      if (homeIndex !== numTeams - 1 && awayIndex !== numTeams - 1) {
        matches.push({
          homeTeam: teamsWithBye[homeIndex],
          awayTeam: teamsWithBye[awayIndex],
          round: round + 1,
          gameNumber: round * matchesPerRound + match + 1
        });
      }
    }
  }

  return {
    matches,
    totalRounds,
    matchesPerRound
  };
}

/**
 * Create a Berger table for round robin scheduling
 * 
 * The Berger table is a mathematical construct that ensures each team
 * plays every other team exactly once in a round robin tournament.
 * 
 * @param numTeams Number of teams (must be even)
 * @returns 2D array representing the Berger table
 */
function createBergerTable(numTeams: number): number[][] {
  if (numTeams % 2 !== 0) {
    throw new Error('Berger table requires an even number of teams');
  }

  const rounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const table: number[][] = [];

  // Initialize the first round
  const firstRound: number[] = [];
  for (let i = 0; i < numTeams; i++) {
    firstRound.push(i);
  }
  table.push([...firstRound]);

  // Generate subsequent rounds using Berger's algorithm
  for (let round = 1; round < rounds; round++) {
    const newRound: number[] = [];
    
    // Keep the first team fixed
    newRound.push(0);
    
    // Rotate the remaining teams
    for (let i = 1; i < numTeams; i++) {
      const newPosition = (i + round) % (numTeams - 1);
      newRound.push(newPosition + 1);
    }
    
    table.push([...newRound]);
  }

  return table;
}

/**
 * Validate a round robin schedule to ensure it meets all requirements
 * 
 * @param schedule The schedule to validate
 * @param teams Original teams array
 * @returns Validation result with any errors
 */
export function validateRoundRobinSchedule(
  schedule: TournamentSchedule, 
  teams: Team[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const teamIds = teams.map(t => t.id);
  const matchups = new Map<string, Set<string>>();

  // Initialize matchup tracking
  teamIds.forEach(id => {
    matchups.set(id, new Set());
  });

  // Check each match
  schedule.matches.forEach((match, index) => {
    const homeId = match.homeTeam.id;
    const awayId = match.awayTeam.id;

    // Skip bye matches
    if (homeId === 'bye' || awayId === 'bye') {
      return;
    }

    // Check if teams exist
    if (!teamIds.includes(homeId)) {
      errors.push(`Match ${index + 1}: Home team ${homeId} not found in original teams`);
    }
    if (!teamIds.includes(awayId)) {
      errors.push(`Match ${index + 1}: Away team ${awayId} not found in original teams`);
    }

    // Check for self-matchups
    if (homeId === awayId) {
      errors.push(`Match ${index + 1}: Team ${homeId} cannot play against itself`);
    }

    // Check for duplicate matchups
    const homeMatchups = matchups.get(homeId);
    const awayMatchups = matchups.get(awayId);

    if (homeMatchups?.has(awayId)) {
      errors.push(`Duplicate matchup: ${homeId} vs ${awayId}`);
    }

    if (awayMatchups?.has(homeId)) {
      errors.push(`Duplicate matchup: ${awayId} vs ${homeId}`);
    }

    // Record the matchup
    homeMatchups?.add(awayId);
    awayMatchups?.add(homeId);
  });

  // Check that each team plays the correct number of games
  const expectedGames = teams.length - 1;
  teamIds.forEach(id => {
    const actualGames = matchups.get(id)?.size || 0;
    if (actualGames !== expectedGames) {
      errors.push(`Team ${id} plays ${actualGames} games, expected ${expectedGames}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Distribute games evenly across time slots
 * 
 * @param schedule The round robin schedule
 * @param timeSlots Available time slots for games
 * @returns Schedule with time slot assignments
 */
export function distributeGamesAcrossTimeSlots(
  schedule: TournamentSchedule,
  timeSlots: string[]
): (RoundRobinMatch & { timeSlot: string })[] {
  if (timeSlots.length === 0) {
    throw new Error('At least one time slot is required');
  }

  const matchesWithTimeSlots: (RoundRobinMatch & { timeSlot: string })[] = [];
  let timeSlotIndex = 0;

  schedule.matches.forEach(match => {
    const timeSlot = timeSlots[timeSlotIndex % timeSlots.length];
    matchesWithTimeSlots.push({
      ...match,
      timeSlot
    });
    timeSlotIndex++;
  });

  return matchesWithTimeSlots;
}

/**
 * Advanced time slot distribution with load balancing and constraints
 * 
 * This function distributes games across time slots while considering:
 * - Maximum games per time slot
 * - Team rest periods
 * - Round distribution
 * - Even distribution across available slots
 * 
 * @param schedule The round robin schedule
 * @param timeSlots Available time slots with constraints
 * @param gameDuration Duration of each game in minutes
 * @param minRestPeriod Minimum rest period between games for a team in minutes
 * @returns Schedule with optimized time slot assignments
 */
export function distributeGamesWithConstraints(
  schedule: TournamentSchedule,
  timeSlots: TimeSlot[],
  gameDuration: number = 60,
  minRestPeriod: number = 30
): TournamentScheduleWithTimeSlots {
  if (timeSlots.length === 0) {
    throw new Error('At least one time slot is required');
  }

  // Sort time slots by start time
  const sortedTimeSlots = [...timeSlots].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Group matches by round
  const matchesByRound = new Map<number, RoundRobinMatch[]>();
  schedule.matches.forEach(match => {
    if (!matchesByRound.has(match.round)) {
      matchesByRound.set(match.round, []);
    }
    matchesByRound.get(match.round)!.push(match);
  });

  const scheduledMatches: ScheduledMatch[] = [];
  const teamLastGameTime = new Map<string, Date>();

  // Process each round
  for (const [round, matches] of matchesByRound) {
    // Sort matches within the round to optimize time slot usage
    const sortedMatches = [...matches].sort((a, b) => {
      const aLastGame = teamLastGameTime.get(a.homeTeam.id) || new Date(0);
      const bLastGame = teamLastGameTime.get(b.homeTeam.id) || new Date(0);
      return aLastGame.getTime() - bLastGame.getTime();
    });

    // Assign time slots for this round
    for (const match of sortedMatches) {
      const assignedTimeSlot = findOptimalTimeSlot(
        match,
        sortedTimeSlots,
        teamLastGameTime,
        gameDuration,
        minRestPeriod,
        scheduledMatches
      );

      if (!assignedTimeSlot) {
        throw new Error(`No suitable time slot found for match ${match.gameNumber}`);
      }

      // Calculate game start and end times
      const gameStart = new Date(assignedTimeSlot.startTime);
      const gameEnd = new Date(gameStart.getTime() + gameDuration * 60 * 1000);

      // Create scheduled match
      const scheduledMatch: ScheduledMatch = {
        ...match,
        timeSlot: assignedTimeSlot,
        scheduledStart: gameStart.toISOString(),
        scheduledEnd: gameEnd.toISOString()
      };

      scheduledMatches.push(scheduledMatch);

      // Update team last game times
      teamLastGameTime.set(match.homeTeam.id, gameEnd);
      teamLastGameTime.set(match.awayTeam.id, gameEnd);
    }
  }

  return {
    matches: scheduledMatches,
    totalRounds: schedule.totalRounds,
    matchesPerRound: schedule.matchesPerRound,
    timeSlots: sortedTimeSlots
  };
}

/**
 * Find the optimal time slot for a match considering constraints
 * 
 * @param match The match to schedule
 * @param timeSlots Available time slots
 * @param teamLastGameTime Map of team IDs to their last game time
 * @param gameDuration Duration of each game in minutes
 * @param minRestPeriod Minimum rest period between games in minutes
 * @param existingScheduledMatches Already scheduled matches
 * @returns Optimal time slot or null if none available
 */
function findOptimalTimeSlot(
  match: RoundRobinMatch,
  timeSlots: TimeSlot[],
  teamLastGameTime: Map<string, Date>,
  gameDuration: number,
  minRestPeriod: number,
  existingScheduledMatches: ScheduledMatch[]
): TimeSlot | null {
  const homeTeamLastGame = teamLastGameTime.get(match.homeTeam.id);
  const awayTeamLastGame = teamLastGameTime.get(match.awayTeam.id);

  // Find available time slots
  const availableSlots = timeSlots.filter(slot => {
    const slotStart = new Date(slot.startTime);
    const slotEnd = new Date(slot.endTime);
    const gameEnd = new Date(slotStart.getTime() + gameDuration * 60 * 1000);

    // Check if game fits in time slot
    if (gameEnd > slotEnd) {
      return false;
    }

    // Check rest period constraints
    if (homeTeamLastGame) {
      const restPeriod = slotStart.getTime() - homeTeamLastGame.getTime();
      if (restPeriod < minRestPeriod * 60 * 1000) {
        return false;
      }
    }

    if (awayTeamLastGame) {
      const restPeriod = slotStart.getTime() - awayTeamLastGame.getTime();
      if (restPeriod < minRestPeriod * 60 * 1000) {
        return false;
      }
    }

    // Check if slot is not overbooked
    const gamesInSlot = existingScheduledMatches.filter(scheduled => 
      scheduled.timeSlot.id === slot.id
    ).length;

    return gamesInSlot < slot.maxGames;
  });

  if (availableSlots.length === 0) {
    return null;
  }

  // Return the earliest available slot
  return availableSlots.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )[0];
}

/**
 * Generate default time slots for a tournament day
 * 
 * @param startDate Tournament start date
 * @param endDate Tournament end date
 * @param gamesPerDay Maximum games per day
 * @param gameDuration Duration of each game in minutes
 * @param breakBetweenGames Break between games in minutes
 * @returns Array of time slots
 */
export function generateDefaultTimeSlots(
  startDate: string,
  endDate: string,
  gamesPerDay: number = 8,
  gameDuration: number = 60,
  breakBetweenGames: number = 30
): TimeSlot[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeSlots: TimeSlot[] = [];

  // Generate time slots for each day
  for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
    const dayStart = new Date(day);
    dayStart.setHours(10, 0, 0, 0); // Start at 10 AM

    for (let game = 0; game < gamesPerDay; game++) {
      const slotStart = new Date(dayStart.getTime() + 
        game * (gameDuration + breakBetweenGames) * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + gameDuration * 60 * 1000);

      timeSlots.push({
        id: `day-${day.toISOString().split('T')[0]}-game-${game + 1}`,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        label: `${day.toLocaleDateString()} - Game ${game + 1}`,
        maxGames: 1
      });
    }
  }

  return timeSlots;
}

/**
 * Calculate the number of rounds needed for a round robin tournament
 * 
 * @param numTeams Number of teams
 * @returns Number of rounds needed
 */
export function calculateRoundsNeeded(numTeams: number): number {
  return numTeams - 1;
}

/**
 * Calculate the number of games needed for a round robin tournament
 * 
 * @param numTeams Number of teams
 * @returns Number of games needed
 */
export function calculateGamesNeeded(numTeams: number): number {
  return (numTeams * (numTeams - 1)) / 2;
} 