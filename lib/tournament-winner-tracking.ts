/**
 * Tournament Winner Tracking Service
 * 
 * This service tracks winner advancement through the bracket system,
 * including progression history and championship tracking.
 */

import { createClient } from '@supabase/supabase-js';
import { TournamentBracketMatch } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export interface WinnerAdvancement {
  tournamentId: string;
  teamId: string;
  teamName: string;
  fromGameNumber: number;
  fromRound: number;
  toGameNumber?: number;
  toRound?: number;
  isChampion: boolean;
  advancementDate: string;
}

export interface BracketProgression {
  tournamentId: string;
  teamId: string;
  teamName: string;
  seed: number;
  progression: {
    round: number;
    gameNumber: number;
    opponentTeamId?: string;
    opponentTeamName?: string;
    result: 'win' | 'loss' | 'bye' | 'pending';
    score?: string; // e.g., "5-3"
    date?: string;
  }[];
  finalResult: 'champion' | 'runner_up' | 'eliminated' | 'active';
}

/**
 * Track winner advancement when a bracket game is completed
 * 
 * @param tournamentId Tournament ID
 * @param gameId Game ID that was completed
 * @returns Winner advancement information
 */
export async function trackWinnerAdvancement(
  tournamentId: string,
  gameId: string
): Promise<WinnerAdvancement | null> {
  try {
    console.log(`[WinnerTracking] Tracking winner advancement for tournament ${tournamentId}, game ${gameId}`);

    // Get the completed game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('tournament_id', tournamentId)
      .single();

    if (gameError || !game) {
      console.error('[WinnerTracking] Game not found:', gameError);
      return null;
    }

    // Only process completed bracket games
    if (game.status !== 'completed' || (game as any).game_type === 'round_robin') {
      return null;
    }

    // Determine winner
    const winnerTeamId = game.home_score > game.away_score ? game.home_team_id : game.away_team_id;
    const loserTeamId = game.home_score > game.away_score ? game.away_team_id : game.home_team_id;

    // Get team names
    const { data: winnerTeam, error: winnerTeamError } = await supabase
      .from('tournament_teams')
      .select('team_name')
      .eq('id', winnerTeamId)
      .single();

    if (winnerTeamError || !winnerTeam) {
      console.error('[WinnerTracking] Winner team not found:', winnerTeamError);
      return null;
    }

    // Get bracket match information
    const { data: bracketMatch, error: matchError } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('game_id', gameId)
      .single();

    if (matchError || !bracketMatch) {
      console.error('[WinnerTracking] Bracket match not found:', matchError);
      return null;
    }

    // Check if this is the championship game (no next game)
    const isChampion = !bracketMatch.next_game_number;

    // Create advancement record
    const advancement: WinnerAdvancement = {
      tournamentId,
      teamId: winnerTeamId,
      teamName: winnerTeam.team_name,
      fromGameNumber: bracketMatch.game_number,
      fromRound: bracketMatch.round_number,
      toGameNumber: bracketMatch.next_game_number,
      toRound: bracketMatch.next_game_number ? bracketMatch.round_number + 1 : undefined,
      isChampion,
      advancementDate: new Date().toISOString()
    };

    console.log(`[WinnerTracking] Winner ${winnerTeam.team_name} advanced from game ${bracketMatch.game_number} to ${bracketMatch.next_game_number || 'championship'}`);

    // Store advancement history (optional - for analytics)
    await storeAdvancementHistory(advancement);

    return advancement;

  } catch (error) {
    console.error('[WinnerTracking] Error tracking winner advancement:', error);
    return null;
  }
}

/**
 * Store advancement history for analytics
 * 
 * @param advancement Winner advancement information
 */
async function storeAdvancementHistory(advancement: WinnerAdvancement): Promise<void> {
  try {
    // This could be stored in a separate table for analytics
    // For now, we'll just log it
    console.log('[WinnerTracking] Advancement history:', advancement);
  } catch (error) {
    console.error('[WinnerTracking] Error storing advancement history:', error);
  }
}

/**
 * Get complete bracket progression for a team
 * 
 * @param tournamentId Tournament ID
 * @param teamId Team ID
 * @returns Complete bracket progression
 */
export async function getTeamBracketProgression(
  tournamentId: string,
  teamId: string
): Promise<BracketProgression | null> {
  try {
    console.log(`[WinnerTracking] Getting bracket progression for team ${teamId} in tournament ${tournamentId}`);

    // Get team information
    const { data: team, error: teamError } = await supabase
      .from('tournament_teams')
      .select('team_name')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      console.error('[WinnerTracking] Team not found:', teamError);
      return null;
    }

    // Get team's seed
    const { data: standing, error: standingError } = await supabase
      .from('tournament_standings')
      .select('seed')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .single();

    if (standingError) {
      console.error('[WinnerTracking] Standing not found:', standingError);
      return null;
    }

    // Get all bracket matches involving this team
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_brackets')
      .select(`
        *,
        tournament_teams!home_team_id (team_name),
        tournament_teams!away_team_id (team_name),
        games!inner (*)
      `)
      .eq('tournament_id', tournamentId)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('round_number', { ascending: true })
      .order('game_number', { ascending: true });

    if (matchesError || !matches) {
      console.error('[WinnerTracking] Error fetching matches:', matchesError);
      return null;
    }

    // Build progression
    const progression = matches.map(match => {
      const isHomeTeam = match.home_team_id === teamId;
      const opponentTeamId = isHomeTeam ? match.away_team_id : match.home_team_id;
      const opponentTeamName = isHomeTeam ? match.tournament_teams?.away_team_id?.team_name : match.tournament_teams?.home_team_id?.team_name;

      let result: 'win' | 'loss' | 'bye' | 'pending' = 'pending';
      let score: string | undefined;
      let date: string | undefined;

      if (match.is_bye) {
        result = 'bye';
      } else if (match.winner_team_id) {
        result = match.winner_team_id === teamId ? 'win' : 'loss';
        
        // Get game details for score
        if (match.games && match.games.length > 0) {
          const game = match.games[0];
          if (game.status === 'completed') {
            score = isHomeTeam ? `${game.home_score}-${game.away_score}` : `${game.away_score}-${game.home_score}`;
            date = game.actual_end || game.actual_start || game.created_at;
          }
        }
      }

      return {
        round: match.round_number,
        gameNumber: match.game_number,
        opponentTeamId,
        opponentTeamName,
        result,
        score,
        date
      };
    });

    // Determine final result
    let finalResult: 'champion' | 'runner_up' | 'eliminated' | 'active' = 'active';
    
    if (progression.length > 0) {
      const lastGame = progression[progression.length - 1];
      if (lastGame.result === 'win' && !lastGame.opponentTeamId) {
        // Championship game with no opponent (bye or final)
        finalResult = 'champion';
      } else if (lastGame.result === 'loss') {
        finalResult = 'eliminated';
      } else if (lastGame.result === 'win' && lastGame.opponentTeamId) {
        // Still in tournament
        finalResult = 'active';
      }
    }

    return {
      tournamentId,
      teamId,
      teamName: team.team_name,
      seed: standing.seed || 0,
      progression,
      finalResult
    };

  } catch (error) {
    console.error('[WinnerTracking] Error getting team progression:', error);
    return null;
  }
}

/**
 * Get championship game information
 * 
 * @param tournamentId Tournament ID
 * @returns Championship game information
 */
export async function getChampionshipGame(tournamentId: string): Promise<{
  gameNumber: number;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  winnerTeamId?: string;
  winnerTeamName?: string;
  isComplete: boolean;
  score?: string;
  date?: string;
} | null> {
  try {
    // Find the championship match (no next game)
    const { data: championshipMatch, error: matchError } = await supabase
      .from('tournament_brackets')
      .select(`
        *,
        tournament_teams!home_team_id (team_name),
        tournament_teams!away_team_id (team_name),
        tournament_teams!winner_team_id (team_name),
        games!inner (*)
      `)
      .eq('tournament_id', tournamentId)
      .is('next_game_number', null)
      .single();

    if (matchError || !championshipMatch) {
      console.error('[WinnerTracking] Championship match not found:', matchError);
      return null;
    }

    const isComplete = !!championshipMatch.winner_team_id;
    let score: string | undefined;
    let date: string | undefined;

    if (championshipMatch.games && championshipMatch.games.length > 0) {
      const game = championshipMatch.games[0];
      if (game.status === 'completed') {
        score = `${game.home_score}-${game.away_score}`;
        date = game.actual_end || game.actual_start || game.created_at;
      }
    }

    return {
      gameNumber: championshipMatch.game_number,
      homeTeamId: championshipMatch.home_team_id,
      awayTeamId: championshipMatch.away_team_id,
      homeTeamName: championshipMatch.tournament_teams?.home_team_id?.team_name,
      awayTeamName: championshipMatch.tournament_teams?.away_team_id?.team_name,
      winnerTeamId: championshipMatch.winner_team_id,
      winnerTeamName: championshipMatch.tournament_teams?.winner_team_id?.team_name,
      isComplete,
      score,
      date
    };

  } catch (error) {
    console.error('[WinnerTracking] Error getting championship game:', error);
    return null;
  }
}

/**
 * Get all teams still active in the bracket
 * 
 * @param tournamentId Tournament ID
 * @returns Array of active teams
 */
export async function getActiveTeams(tournamentId: string): Promise<{
  teamId: string;
  teamName: string;
  seed: number;
  currentRound: number;
  nextGameNumber?: number;
}[]> {
  try {
    // Get all bracket matches
    const { data: matches, error: matchesError } = await supabase
      .from('tournament_brackets')
      .select(`
        *,
        tournament_teams!home_team_id (team_name),
        tournament_teams!away_team_id (team_name)
      `)
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('game_number', { ascending: true });

    if (matchesError || !matches) {
      console.error('[WinnerTracking] Error fetching matches:', matchesError);
      return [];
    }

    // Find teams that haven't lost yet
    const eliminatedTeams = new Set<string>();
    const activeTeams = new Map<string, {
      teamId: string;
      teamName: string;
      seed: number;
      currentRound: number;
      nextGameNumber?: number;
    }>();

    // Process matches to find eliminated teams
    matches.forEach(match => {
      if (match.winner_team_id && !match.is_bye) {
        const loserTeamId = match.home_team_id === match.winner_team_id ? match.away_team_id : match.home_team_id;
        if (loserTeamId) {
          eliminatedTeams.add(loserTeamId);
        }
      }
    });

    // Build active teams list
    matches.forEach(match => {
      // Check home team
      if (match.home_team_id && !eliminatedTeams.has(match.home_team_id)) {
        const teamName = match.tournament_teams?.home_team_id?.team_name || 'Unknown Team';
        activeTeams.set(match.home_team_id, {
          teamId: match.home_team_id,
          teamName,
          seed: 0, // Would need to fetch from standings
          currentRound: match.round_number,
          nextGameNumber: match.next_game_number
        });
      }

      // Check away team
      if (match.away_team_id && !eliminatedTeams.has(match.away_team_id)) {
        const teamName = match.tournament_teams?.away_team_id?.team_name || 'Unknown Team';
        activeTeams.set(match.away_team_id, {
          teamId: match.away_team_id,
          teamName,
          seed: 0, // Would need to fetch from standings
          currentRound: match.round_number,
          nextGameNumber: match.next_game_number
        });
      }
    });

    // Get seeds for active teams
    const activeTeamIds = Array.from(activeTeams.keys());
    if (activeTeamIds.length > 0) {
      const { data: standings, error: standingsError } = await supabase
        .from('tournament_standings')
        .select('team_id, seed')
        .eq('tournament_id', tournamentId)
        .in('team_id', activeTeamIds);

      if (!standingsError && standings) {
        standings.forEach(standing => {
          const team = activeTeams.get(standing.team_id);
          if (team) {
            team.seed = standing.seed || 0;
          }
        });
      }
    }

    return Array.from(activeTeams.values());

  } catch (error) {
    console.error('[WinnerTracking] Error getting active teams:', error);
    return [];
  }
}

/**
 * Get tournament winner
 * 
 * @param tournamentId Tournament ID
 * @returns Tournament winner information
 */
export async function getTournamentWinner(tournamentId: string): Promise<{
  teamId: string;
  teamName: string;
  seed: number;
  championshipDate: string;
} | null> {
  try {
    const championshipGame = await getChampionshipGame(tournamentId);
    
    if (!championshipGame || !championshipGame.isComplete || !championshipGame.winnerTeamId) {
      return null;
    }

    // Get winner's seed
    const { data: standing, error: standingError } = await supabase
      .from('tournament_standings')
      .select('seed')
      .eq('tournament_id', tournamentId)
      .eq('team_id', championshipGame.winnerTeamId)
      .single();

    if (standingError) {
      console.error('[WinnerTracking] Error getting winner standing:', standingError);
      return null;
    }

    return {
      teamId: championshipGame.winnerTeamId,
      teamName: championshipGame.winnerTeamName || 'Unknown Team',
      seed: standing.seed || 0,
      championshipDate: championshipGame.date || new Date().toISOString()
    };

  } catch (error) {
    console.error('[WinnerTracking] Error getting tournament winner:', error);
    return null;
  }
} 
 
 
