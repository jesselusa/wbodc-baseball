/**
 * Tournament Phase Transition Service
 * 
 * This service handles automatic phase transitions from round robin to bracket phase,
 * including bracket generation and tournament state management.
 */

import { createClient } from '@supabase/supabase-js';
import { generateTournamentBracket } from './utils/bracket-generation';
import { getStandingsStatus } from './tournament-standings-updater';
import { BracketType } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export interface PhaseTransitionResult {
  success: boolean;
  fromPhase: 'round_robin' | 'bracket';
  toPhase: 'round_robin' | 'bracket';
  roundId?: string;
  bracketType?: BracketType;
  totalRounds?: number;
  totalGames?: number;
  error?: string;
}

/**
 * Check if tournament is ready to transition from round robin to bracket
 * 
 * @param tournamentId Tournament ID
 * @returns True if ready to transition
 */
export async function isReadyForBracketTransition(tournamentId: string): Promise<boolean> {
  try {
    const standingsStatus = await getStandingsStatus(tournamentId);
    
    // Check if round robin is complete
    if (!standingsStatus.roundRobinComplete) {
      return false;
    }

    // Check if we have enough teams for a bracket (minimum 2)
    if (standingsStatus.totalTeams < 2) {
      return false;
    }

    // Check if bracket already exists
    const { data: existingBracket, error: bracketError } = await supabase
      .from('tournament_brackets')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1);

    if (bracketError) {
      console.error('[PhaseTransition] Error checking existing bracket:', bracketError);
      return false;
    }

    // If bracket already exists, don't transition
    if (existingBracket && existingBracket.length > 0) {
      return false;
    }

    return true;

  } catch (error) {
    console.error('[PhaseTransition] Error checking bracket transition readiness:', error);
    return false;
  }
}

/**
 * Transition tournament from round robin to bracket phase
 * 
 * @param tournamentId Tournament ID
 * @param bracketType Type of bracket to create
 * @returns Phase transition result
 */
export async function transitionToBracketPhase(
  tournamentId: string,
  bracketType: BracketType = 'single_elimination'
): Promise<PhaseTransitionResult> {
  try {
    console.log(`[PhaseTransition] Transitioning tournament ${tournamentId} to bracket phase`);

    // Check if ready for transition
    const isReady = await isReadyForBracketTransition(tournamentId);
    if (!isReady) {
      return {
        success: false,
        fromPhase: 'round_robin',
        toPhase: 'bracket',
        error: 'Tournament not ready for bracket transition'
      };
    }

    // Get tournament settings
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return {
        success: false,
        fromPhase: 'round_robin',
        toPhase: 'bracket',
        error: 'Tournament not found'
      };
    }

    // Get current standings
    const standingsStatus = await getStandingsStatus(tournamentId);
    if (!standingsStatus.standings || standingsStatus.standings.length === 0) {
      return {
        success: false,
        fromPhase: 'round_robin',
        toPhase: 'bracket',
        error: 'No standings found for bracket generation'
      };
    }

    // Create tournament round record for bracket phase
    const { data: roundRecord, error: roundError } = await supabase
      .from('tournament_rounds')
      .insert({
        tournament_id: tournamentId,
        round_type: 'bracket',
        round_number: 1,
        status: 'in_progress',
        start_date: new Date().toISOString(),
        end_date: tournament.end_date
      })
      .select()
      .single();

    if (roundError) {
      return {
        success: false,
        fromPhase: 'round_robin',
        toPhase: 'bracket',
        error: 'Failed to create tournament round'
      };
    }

    console.log(`[PhaseTransition] Created tournament round ${roundRecord.id} for bracket phase`);

    // Transform BracketStanding to TeamStanding format
    const teamStandings = standingsStatus.standings.map(standing => ({
      teamId: standing.team_id,
      teamName: standing.team_name,
      wins: standing.wins,
      losses: standing.losses,
      runsScored: standing.runs_scored,
      runsAllowed: standing.runs_allowed,
      runDifferential: standing.run_differential,
      gamesPlayed: standing.wins + standing.losses, // Calculate from wins/losses
      seed: standing.seed
    }));

    // Generate bracket using the bracket generation utility
    const bracket = generateTournamentBracket(tournamentId, teamStandings, bracketType);

    // Create bracket matches in database
    const bracketMatchesToCreate = bracket.matches.map(match => ({
      tournament_id: tournamentId,
      round_id: roundRecord.id,
      bracket_type: bracketType,
      round_number: match.round,
      game_number: match.gameNumber,
      home_team_id: match.homeTeamId,
      away_team_id: match.awayTeamId,
      home_team_seed: match.homeTeamSeed,
      away_team_seed: match.awayTeamSeed,
      winner_team_id: match.winnerTeamId,
      is_bye: match.isBye,
      next_game_number: match.nextGameNumber
    }));

    const { data: createdBracketMatches, error: bracketMatchesError } = await supabase
      .from('tournament_brackets')
      .insert(bracketMatchesToCreate)
      .select();

    if (bracketMatchesError) {
      return {
        success: false,
        fromPhase: 'round_robin',
        toPhase: 'bracket',
        error: 'Failed to create bracket matches'
      };
    }

    console.log(`[PhaseTransition] Created ${createdBracketMatches?.length || 0} bracket matches`);

    // Create games for bracket matches (excluding byes)
    const bracketGamesToCreate = bracket.matches
      .filter(match => !match.isBye)
      .map(match => ({
        tournament_id: tournamentId,
        tournament_round_id: roundRecord.id,
        bracket_game_number: match.gameNumber,
        home_team_id: match.homeTeamId,
        away_team_id: match.awayTeamId,
        status: 'scheduled',
        game_type: 'tournament',
        innings: tournament.bracket_innings || 3,
        scheduled_start: null,
        actual_start: null,
        actual_end: null,
        home_score: 0,
        away_score: 0,
        is_round_robin: false
      }));

    let createdGames = [];
    if (bracketGamesToCreate.length > 0) {
      const { data: games, error: gamesCreateError } = await supabase
        .from('games')
        .insert(bracketGamesToCreate)
        .select();

      if (gamesCreateError) {
        return {
          success: false,
          fromPhase: 'round_robin',
          toPhase: 'bracket',
          error: 'Failed to create bracket games'
        };
      }
      createdGames = games || [];
    }

    console.log(`[PhaseTransition] Created ${createdGames.length} bracket games`);

    // Update tournament status if needed
    if (tournament.status === 'in_progress') {
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ status: 'in_progress' }) // Keep as in_progress since bracket phase is starting
        .eq('id', tournamentId);

      if (updateError) {
        console.warn('[PhaseTransition] Failed to update tournament status:', updateError);
      }
    }

    return {
      success: true,
      fromPhase: 'round_robin',
      toPhase: 'bracket',
      roundId: roundRecord.id,
      bracketType: bracketType,
      totalRounds: bracket.totalRounds,
      totalGames: bracket.totalGames
    };

  } catch (error) {
    console.error('[PhaseTransition] Error transitioning to bracket phase:', error);
    return {
      success: false,
      fromPhase: 'round_robin',
      toPhase: 'bracket',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current tournament phase
 * 
 * @param tournamentId Tournament ID
 * @returns Current phase information
 */
export async function getCurrentTournamentPhase(tournamentId: string): Promise<{
  currentPhase: 'round_robin' | 'bracket' | 'unknown';
  roundRobinComplete: boolean;
  bracketExists: boolean;
  currentRound?: {
    id: string;
    round_type: string;
    round_number: number;
    status: string;
  };
}> {
  try {
    // Check if bracket exists
    const { data: bracketMatches, error: bracketError } = await supabase
      .from('tournament_brackets')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1);

    if (bracketError) {
      console.error('[PhaseTransition] Error checking bracket existence:', bracketError);
    }

    const bracketExists = bracketMatches && bracketMatches.length > 0;

    // Get current round
    const { data: currentRound, error: roundError } = await supabase
      .from('tournament_rounds')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (roundError && roundError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[PhaseTransition] Error fetching current round:', roundError);
    }

    // Check round robin completion
    const standingsStatus = await getStandingsStatus(tournamentId);

    // Determine current phase
    let currentPhase: 'round_robin' | 'bracket' | 'unknown' = 'unknown';
    
    if (bracketExists) {
      currentPhase = 'bracket';
    } else if (standingsStatus.totalTeams > 0) {
      currentPhase = 'round_robin';
    }

    return {
      currentPhase,
      roundRobinComplete: standingsStatus.roundRobinComplete,
      bracketExists,
      currentRound: currentRound || undefined
    };

  } catch (error) {
    console.error('[PhaseTransition] Error getting current phase:', error);
    return {
      currentPhase: 'unknown',
      roundRobinComplete: false,
      bracketExists: false
    };
  }
}

/**
 * Auto-transition tournament when round robin is complete
 * 
 * @param tournamentId Tournament ID
 * @returns Transition result
 */
export async function autoTransitionToBracket(tournamentId: string): Promise<PhaseTransitionResult> {
  try {
    console.log(`[PhaseTransition] Checking auto-transition for tournament ${tournamentId}`);

    // Check if ready for transition
    const isReady = await isReadyForBracketTransition(tournamentId);
    if (!isReady) {
      return {
        success: false,
        fromPhase: 'round_robin',
        toPhase: 'bracket',
        error: 'Not ready for auto-transition'
      };
    }

    // Get tournament settings for bracket type
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('bracket_type')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return {
        success: false,
        fromPhase: 'round_robin',
        toPhase: 'bracket',
        error: 'Tournament not found'
      };
    }

    const bracketType = (tournament.bracket_type as BracketType) || 'single_elimination';

    // Perform the transition
    return await transitionToBracketPhase(tournamentId, bracketType);

  } catch (error) {
    console.error('[PhaseTransition] Error in auto-transition:', error);
    return {
      success: false,
      fromPhase: 'round_robin',
      toPhase: 'bracket',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check and process pending phase transitions for all active tournaments
 * 
 * @returns Array of transition results
 */
export async function processPendingPhaseTransitions(): Promise<PhaseTransitionResult[]> {
  try {
    console.log('[PhaseTransition] Processing pending phase transitions');

    // Get all active tournaments
    const { data: activeTournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('status', 'in_progress');

    if (tournamentsError || !activeTournaments) {
      console.error('[PhaseTransition] Error fetching active tournaments:', tournamentsError);
      return [];
    }

    const results: PhaseTransitionResult[] = [];

    // Check each active tournament for auto-transition
    for (const tournament of activeTournaments) {
      const result = await autoTransitionToBracket(tournament.id);
      if (result.success) {
        results.push(result);
      }
    }

    console.log(`[PhaseTransition] Processed ${results.length} phase transitions`);

    return results;

  } catch (error) {
    console.error('[PhaseTransition] Error processing pending transitions:', error);
    return [];
  }
} 
 
 
