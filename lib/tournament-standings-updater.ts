/**
 * Tournament Standings Updater Service
 * 
 * This service handles automatic standings updates when round robin games are completed,
 * including tiebreaker calculations and seeding updates.
 */

import { createClient } from '@supabase/supabase-js';
import { BracketStanding } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export interface StandingsUpdateResult {
  success: boolean;
  updatedStandings?: BracketStanding[];
  roundRobinComplete: boolean;
  totalTeams: number;
  completedGames: number;
  expectedGames: number;
  error?: string;
}

/**
 * Update standings when a round robin game is completed
 * 
 * @param tournamentId Tournament ID
 * @param gameId Game ID that was completed
 * @returns Standings update result
 */
export async function updateStandingsOnGameComplete(
  tournamentId: string,
  gameId: string
): Promise<StandingsUpdateResult> {
  try {
    console.log(`[StandingsUpdater] Processing game completion for tournament ${tournamentId}, game ${gameId}`);

    // Get the completed game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('tournament_id', tournamentId)
      .single();

    if (gameError || !game) {
      return {
        success: false,
        roundRobinComplete: false,
        totalTeams: 0,
        completedGames: 0,
        expectedGames: 0,
        error: 'Game not found'
      };
    }

    // Only process completed round robin games
    if (game.status !== 'completed' || (game as any).game_type !== 'round_robin') {
      return {
        success: false,
        roundRobinComplete: false,
        totalTeams: 0,
        completedGames: 0,
        expectedGames: 0,
        error: 'Game is not a completed round robin game'
      };
    }

    // Determine winner and loser
    const winnerTeamId = game.home_score > game.away_score ? game.home_team_id : game.away_team_id;
    const loserTeamId = game.home_score > game.away_score ? game.away_team_id : game.home_team_id;

    console.log(`[StandingsUpdater] Game ${gameId} completed. Winner: ${winnerTeamId}, Loser: ${loserTeamId}`);

    // Update standings for both teams
    await updateTeamStanding(tournamentId, winnerTeamId, 'win', game.home_score, game.away_score);
    await updateTeamStanding(tournamentId, loserTeamId, 'loss', game.away_score, game.home_score);

    // Recalculate all standings with proper seeding
    const result = await recalculateAllStandings(tournamentId);

    console.log(`[StandingsUpdater] Updated standings for tournament ${tournamentId}`);

    return result;

  } catch (error) {
    console.error('[StandingsUpdater] Error updating standings:', error);
    return {
      success: false,
      roundRobinComplete: false,
      totalTeams: 0,
      completedGames: 0,
      expectedGames: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update a single team's standing
 * 
 * @param tournamentId Tournament ID
 * @param teamId Team ID
 * @param result 'win' or 'loss'
 * @param runsScored Runs scored by this team
 * @param runsAllowed Runs allowed by this team
 */
async function updateTeamStanding(
  tournamentId: string,
  teamId: string,
  result: 'win' | 'loss',
  runsScored: number,
  runsAllowed: number
): Promise<void> {
  try {
    // Get current standing for this team
    const { data: currentStanding, error: fetchError } = await supabase
      .from('tournament_standings')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[StandingsUpdater] Error fetching current standing:', fetchError);
      return;
    }

    const updateData = {
      tournament_id: tournamentId,
      team_id: teamId,
      wins: (currentStanding?.wins || 0) + (result === 'win' ? 1 : 0),
      losses: (currentStanding?.losses || 0) + (result === 'loss' ? 1 : 0),
      runs_scored: (currentStanding?.runs_scored || 0) + runsScored,
      runs_allowed: (currentStanding?.runs_allowed || 0) + runsAllowed,
      games_played: (currentStanding?.games_played || 0) + 1,
      run_differential: 0 // Will be calculated below
    };

    // Calculate run differential
    updateData.run_differential = updateData.runs_scored - updateData.runs_allowed;

    // Upsert the standing
    const { error: upsertError } = await supabase
      .from('tournament_standings')
      .upsert(updateData, { onConflict: 'tournament_id,team_id' });

    if (upsertError) {
      console.error('[StandingsUpdater] Error upserting standing:', upsertError);
    }

  } catch (error) {
    console.error('[StandingsUpdater] Error updating team standing:', error);
  }
}

/**
 * Recalculate all standings with proper seeding
 * 
 * @param tournamentId Tournament ID
 * @returns Updated standings result
 */
async function recalculateAllStandings(tournamentId: string): Promise<StandingsUpdateResult> {
  try {
    // Get all standings for this tournament
    const { data: standings, error: standingsError } = await supabase
      .from('tournament_standings')
      .select(`
        team_id,
        wins,
        losses,
        runs_scored,
        runs_allowed,
        run_differential,
        games_played,
        tournament_teams!inner (
          id,
          team_name
        )
      `)
      .eq('tournament_id', tournamentId);

    if (standingsError) {
      console.error('[StandingsUpdater] Error fetching standings:', standingsError);
      return {
        success: false,
        roundRobinComplete: false,
        totalTeams: 0,
        completedGames: 0,
        expectedGames: 0,
        error: 'Failed to fetch standings'
      };
    }

    if (!standings || standings.length === 0) {
      return {
        success: false,
        roundRobinComplete: false,
        totalTeams: 0,
        completedGames: 0,
        expectedGames: 0,
        error: 'No standings found'
      };
    }

    // Sort standings by performance (wins, then run differential, then runs scored)
    const sortedStandings = standings.sort((a, b) => {
      // Primary sort: wins (descending)
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }
      
      // Secondary sort: run differential (descending)
      if (a.run_differential !== b.run_differential) {
        return b.run_differential - a.run_differential;
      }
      
      // Tertiary sort: runs scored (descending)
      if (a.runs_scored !== b.runs_scored) {
        return b.runs_scored - a.runs_scored;
      }
      
      // Quaternary sort: team name (alphabetical)
      return (a.tournament_teams as any)?.team_name?.localeCompare((b.tournament_teams as any)?.team_name) || 0;
    });

    // Calculate completion status
    const totalTeams = sortedStandings.length;
    const expectedGames = (totalTeams * (totalTeams - 1)) / 2;
    const completedGames = sortedStandings.reduce((sum, s) => sum + s.games_played, 0) / 2;
    const roundRobinComplete = completedGames >= expectedGames;

    // Update seeds based on sorted order
    const seedUpdates = sortedStandings.map((standing, index) => ({
      tournament_id: tournamentId,
      team_id: standing.team_id,
      seed: index + 1
    }));

    // Update all seeds
    for (const seedUpdate of seedUpdates) {
      const { error: updateError } = await supabase
        .from('tournament_standings')
        .update({ seed: seedUpdate.seed })
        .eq('tournament_id', seedUpdate.tournament_id)
        .eq('team_id', seedUpdate.team_id);

      if (updateError) {
        console.error('[StandingsUpdater] Error updating seed:', updateError);
      }
    }

    // Convert to BracketStanding format
    const updatedStandings: BracketStanding[] = sortedStandings.map((standing, index) => ({
      team_id: standing.team_id,
      team_name: (standing.tournament_teams as any)?.team_name || 'Unknown Team',
      wins: standing.wins,
      losses: standing.losses,
      runs_scored: standing.runs_scored,
      runs_allowed: standing.runs_allowed,
      run_differential: standing.run_differential,
      win_percentage: standing.games_played > 0 ? standing.wins / standing.games_played : 0,
      seed: index + 1
    }));

    return {
      success: true,
      updatedStandings,
      roundRobinComplete,
      totalTeams,
      completedGames,
      expectedGames
    };

  } catch (error) {
    console.error('[StandingsUpdater] Error recalculating standings:', error);
    return {
      success: false,
      roundRobinComplete: false,
      totalTeams: 0,
      completedGames: 0,
      expectedGames: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process all pending standings updates for a tournament
 * 
 * @param tournamentId Tournament ID
 * @returns Array of update results
 */
export async function processPendingStandingsUpdates(tournamentId: string): Promise<StandingsUpdateResult[]> {
  try {
    console.log(`[StandingsUpdater] Processing pending standings updates for tournament ${tournamentId}`);

    // Find all completed round robin games
    const { data: completedGames, error: gamesError } = await supabase
      .from('games')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed')
      .eq('is_round_robin', true);

    if (gamesError) {
      console.error('[StandingsUpdater] Failed to fetch completed games:', gamesError);
      return [];
    }

    const results: StandingsUpdateResult[] = [];

    // Process each completed game
    for (const game of completedGames || []) {
      const result = await updateStandingsOnGameComplete(tournamentId, game.id);
      results.push(result);
    }

    console.log(`[StandingsUpdater] Processed ${results.length} pending standings updates`);

    return results;

  } catch (error) {
    console.error('[StandingsUpdater] Error processing pending updates:', error);
    return [];
  }
}

/**
 * Get standings status for a tournament
 * 
 * @param tournamentId Tournament ID
 * @returns Standings status information
 */
export async function getStandingsStatus(tournamentId: string): Promise<{
  totalTeams: number;
  completedGames: number;
  expectedGames: number;
  roundRobinComplete: boolean;
  standings: BracketStanding[];
}> {
  try {
    // Get all standings for this tournament
    const { data: standings, error: standingsError } = await supabase
      .from('tournament_standings')
      .select(`
        team_id,
        wins,
        losses,
        runs_scored,
        runs_allowed,
        run_differential,
        games_played,
        seed,
        tournament_teams!inner (
          id,
          team_name
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    if (standingsError || !standings) {
      return {
        totalTeams: 0,
        completedGames: 0,
        expectedGames: 0,
        roundRobinComplete: false,
        standings: []
      };
    }

    const totalTeams = standings.length;
    const expectedGames = totalTeams > 0 ? (totalTeams * (totalTeams - 1)) / 2 : 0;
    const completedGames = standings.reduce((sum, s) => sum + s.games_played, 0) / 2;
    const roundRobinComplete = completedGames >= expectedGames;

    const bracketStandings: BracketStanding[] = standings.map(standing => ({
      team_id: standing.team_id,
      team_name: (standing.tournament_teams as any)?.team_name || 'Unknown Team',
      wins: standing.wins,
      losses: standing.losses,
      runs_scored: standing.runs_scored,
      runs_allowed: standing.runs_allowed,
      run_differential: standing.run_differential,
      win_percentage: standing.games_played > 0 ? standing.wins / standing.games_played : 0,
      seed: standing.seed || 0
    }));

    return {
      totalTeams,
      completedGames,
      expectedGames,
      roundRobinComplete,
      standings: bracketStandings
    };

  } catch (error) {
    console.error('[StandingsUpdater] Error getting standings status:', error);
    return {
      totalTeams: 0,
      completedGames: 0,
      expectedGames: 0,
      roundRobinComplete: false,
      standings: []
    };
  }
}

/**
 * Initialize standings for a tournament
 * 
 * @param tournamentId Tournament ID
 * @returns Success status
 */
export async function initializeTournamentStandings(tournamentId: string): Promise<boolean> {
  try {
    console.log(`[StandingsUpdater] Initializing standings for tournament ${tournamentId}`);

    // Get all teams assigned to this tournament
    const { data: teams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (teamsError || !teams) {
      console.error('[StandingsUpdater] Error fetching tournament teams:', teamsError);
      return false;
    }

    // Create initial standings for each team
    const initialStandings = teams.map(team => ({
      tournament_id: tournamentId,
      team_id: team.id,
      wins: 0,
      losses: 0,
      runs_scored: 0,
      runs_allowed: 0,
      run_differential: 0,
      games_played: 0,
      seed: null
    }));

    // Insert all initial standings
    const { error: insertError } = await supabase
      .from('tournament_standings')
      .insert(initialStandings);

    if (insertError) {
      console.error('[StandingsUpdater] Error inserting initial standings:', insertError);
      return false;
    }

    console.log(`[StandingsUpdater] Initialized standings for ${teams.length} teams in tournament ${tournamentId}`);
    return true;

  } catch (error) {
    console.error('[StandingsUpdater] Error initializing standings:', error);
    return false;
  }
} 
 
 
