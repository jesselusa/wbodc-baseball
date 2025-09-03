/**
 * Tournament Bracket Updater Service
 * 
 * This service handles automatic bracket updates when games are completed,
 * including winner advancement and bracket progression.
 */

import { createClient } from '@supabase/supabase-js';
import { TournamentBracketMatch } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export interface BracketUpdateResult {
  success: boolean;
  updatedMatch?: TournamentBracketMatch;
  nextMatch?: TournamentBracketMatch;
  winnerAdvanced: boolean;
  error?: string;
}

/**
 * Update bracket when a game is completed
 * 
 * @param tournamentId Tournament ID
 * @param gameId Game ID that was completed
 * @returns Bracket update result
 */
export async function updateBracketOnGameComplete(
  tournamentId: string,
  gameId: string
): Promise<BracketUpdateResult> {
  try {
    console.log(`[BracketUpdater] Processing game completion for tournament ${tournamentId}, game ${gameId}`);

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
        winnerAdvanced: false,
        error: 'Game not found'
      };
    }

    // Only process completed games
    if (game.status !== 'completed') {
      return {
        success: false,
        winnerAdvanced: false,
        error: 'Game is not completed'
      };
    }

    // Determine winner
    const winnerTeamId = game.home_score > game.away_score ? game.home_team_id : game.away_team_id;
    const loserTeamId = game.home_score > game.away_score ? game.away_team_id : game.home_team_id;

    console.log(`[BracketUpdater] Game ${gameId} completed. Winner: ${winnerTeamId}, Loser: ${loserTeamId}`);

    // Find the bracket match for this game
    const { data: bracketMatch, error: matchError } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('game_id', gameId)
      .single();

    if (matchError || !bracketMatch) {
      return {
        success: false,
        winnerAdvanced: false,
        error: 'Bracket match not found for this game'
      };
    }

    console.log(`[BracketUpdater] Found bracket match ${bracketMatch.id} for game ${gameId}`);

    // Update the bracket match with the winner
    const { data: updatedMatch, error: updateError } = await supabase
      .from('tournament_brackets')
      .update({ winner_team_id: winnerTeamId })
      .eq('id', bracketMatch.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        winnerAdvanced: false,
        error: 'Failed to update bracket match'
      };
    }

    console.log(`[BracketUpdater] Updated bracket match ${bracketMatch.id} with winner ${winnerTeamId}`);

    // Check if there's a next game for the winner to advance to
    if (bracketMatch.next_game_number) {
      const nextMatchResult = await advanceWinnerToNextMatch(
        tournamentId,
        bracketMatch.next_game_number,
        winnerTeamId,
        bracketMatch.round_number
      );

      return {
        success: true,
        updatedMatch: updatedMatch,
        nextMatch: nextMatchResult.nextMatch,
        winnerAdvanced: nextMatchResult.success
      };
    }

    // No next game - this might be the championship game
    console.log(`[BracketUpdater] No next game for match ${bracketMatch.id} - may be championship game`);
    
    return {
      success: true,
      updatedMatch: updatedMatch,
      winnerAdvanced: false
    };

  } catch (error) {
    console.error('[BracketUpdater] Error updating bracket:', error);
    return {
      success: false,
      winnerAdvanced: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Advance winner to the next match in the bracket
 * 
 * @param tournamentId Tournament ID
 * @param nextGameNumber Next game number in the bracket
 * @param winnerTeamId Team ID of the winner
 * @param currentRound Current round number
 * @returns Result of advancing the winner
 */
async function advanceWinnerToNextMatch(
  tournamentId: string,
  nextGameNumber: number,
  winnerTeamId: string,
  currentRound: number
): Promise<{ success: boolean; nextMatch?: TournamentBracketMatch; error?: string }> {
  try {
    console.log(`[BracketUpdater] Advancing winner ${winnerTeamId} to game ${nextGameNumber}`);

    // Get the next match
    const { data: nextMatch, error: nextMatchError } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('game_number', nextGameNumber)
      .single();

    if (nextMatchError || !nextMatch) {
      return {
        success: false,
        error: 'Next match not found'
      };
    }

    console.log(`[BracketUpdater] Found next match ${nextMatch.id} (game ${nextGameNumber})`);

    // Determine if winner should be home or away team
    // This depends on the bracket structure and game number
    const isHomeTeam = shouldBeHomeTeam(nextGameNumber, currentRound);

    // Update the next match with the winner
    const updateData = isHomeTeam 
      ? { home_team_id: winnerTeamId }
      : { away_team_id: winnerTeamId };

    const { data: updatedNextMatch, error: updateError } = await supabase
      .from('tournament_brackets')
      .update(updateData)
      .eq('id', nextMatch.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update next match'
      };
    }

    console.log(`[BracketUpdater] Advanced winner ${winnerTeamId} to ${isHomeTeam ? 'home' : 'away'} position in game ${nextGameNumber}`);

    // If both teams are now assigned, create the actual game
    if (updatedNextMatch.home_team_id && updatedNextMatch.away_team_id) {
      await createBracketGame(tournamentId, updatedNextMatch);
    }

    return {
      success: true,
      nextMatch: updatedNextMatch
    };

  } catch (error) {
    console.error('[BracketUpdater] Error advancing winner:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Determine if the winner should be the home team in the next match
 * 
 * @param nextGameNumber Next game number
 * @param currentRound Current round number
 * @returns True if winner should be home team
 */
function shouldBeHomeTeam(nextGameNumber: number, currentRound: number): boolean {
  // This logic depends on the bracket structure
  // For now, use a simple alternating pattern
  // In a more sophisticated implementation, this would follow the bracket seeding pattern
  
  // Even game numbers get home team first, odd get away team first
  return nextGameNumber % 2 === 0;
}

/**
 * Create a game for a bracket match when both teams are assigned
 * 
 * @param tournamentId Tournament ID
 * @param bracketMatch Bracket match with both teams assigned
 */
async function createBracketGame(
  tournamentId: string,
  bracketMatch: TournamentBracketMatch
): Promise<void> {
  try {
    console.log(`[BracketUpdater] Creating game for bracket match ${bracketMatch.id}`);

    // Get tournament settings for game configuration
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('bracket_innings')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('[BracketUpdater] Failed to get tournament settings:', tournamentError);
      return;
    }

    // Create the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        tournament_id: tournamentId,
        tournament_round_id: bracketMatch.round_id,
        bracket_game_number: bracketMatch.game_number,
        home_team_id: bracketMatch.home_team_id,
        away_team_id: bracketMatch.away_team_id,
        status: 'scheduled',
        game_type: 'tournament',
        total_innings: tournament.bracket_innings || 3,
        scheduled_start: null,
        actual_start: null,
        actual_end: null,
        home_score: 0,
        away_score: 0,
        is_round_robin: false
      })
      .select()
      .single();

    if (gameError) {
      console.error('[BracketUpdater] Failed to create bracket game:', gameError);
      return;
    }

    // Update the bracket match with the game ID
    const { error: updateError } = await supabase
      .from('tournament_brackets')
      .update({ game_id: game.id })
      .eq('id', bracketMatch.id);

    if (updateError) {
      console.error('[BracketUpdater] Failed to update bracket match with game ID:', updateError);
      return;
    }

    console.log(`[BracketUpdater] Created game ${game.id} for bracket match ${bracketMatch.id}`);

  } catch (error) {
    console.error('[BracketUpdater] Error creating bracket game:', error);
  }
}

/**
 * Process all pending bracket updates for a tournament
 * 
 * @param tournamentId Tournament ID
 * @returns Array of update results
 */
export async function processPendingBracketUpdates(tournamentId: string): Promise<BracketUpdateResult[]> {
  try {
    console.log(`[BracketUpdater] Processing pending bracket updates for tournament ${tournamentId}`);

    // Find all completed games that haven't been processed
    const { data: completedGames, error: gamesError } = await supabase
      .from('games')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed')
      .eq('is_round_robin', false);

    if (gamesError) {
      console.error('[BracketUpdater] Failed to fetch completed games:', gamesError);
      return [];
    }

    const results: BracketUpdateResult[] = [];

    // Process each completed game
    for (const game of completedGames || []) {
      const result = await updateBracketOnGameComplete(tournamentId, game.id);
      results.push(result);
    }

    console.log(`[BracketUpdater] Processed ${results.length} pending bracket updates`);

    return results;

  } catch (error) {
    console.error('[BracketUpdater] Error processing pending updates:', error);
    return [];
  }
}

/**
 * Get bracket progression status for a tournament
 * 
 * @param tournamentId Tournament ID
 * @returns Bracket progression information
 */
export async function getBracketProgressionStatus(tournamentId: string): Promise<{
  totalMatches: number;
  completedMatches: number;
  currentRound: number;
  nextGameNumber?: number;
  isComplete: boolean;
}> {
  try {
    // Get all bracket matches
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('game_number', { ascending: true });

    if (matchesError || !matches) {
      return {
        totalMatches: 0,
        completedMatches: 0,
        currentRound: 0,
        isComplete: false
      };
    }

    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.winner_team_id).length;
    const currentRound = Math.max(...matches.map(m => m.round_number));
    
    // Find the next uncompleted match
    const nextMatch = matches.find(m => !m.winner_team_id);
    const nextGameNumber = nextMatch?.game_number;

    // Check if bracket is complete (championship game has a winner)
    const championshipMatch = matches.find(m => !m.next_game_number);
    const isComplete = championshipMatch?.winner_team_id ? true : false;

    return {
      totalMatches,
      completedMatches,
      currentRound,
      nextGameNumber,
      isComplete
    };

  } catch (error) {
    console.error('[BracketUpdater] Error getting progression status:', error);
    return {
      totalMatches: 0,
      completedMatches: 0,
      currentRound: 0,
      isComplete: false
    };
  }
} 
 
 
