import { supabaseAdmin } from './supabase-admin';

interface BracketTemplate {
  rounds: BracketRound[];
  totalGames: number;
}

interface BracketRound {
  roundNumber: number;
  roundName: string;
  games: BracketGame[];
}

interface BracketGame {
  gameNumber: number;
  homeSeed: number;
  awaySeed: number;
  roundNumber: number;
  nextGameNumber?: number;
}

/**
 * Generate bracket template structure based on number of teams
 */
export function generateBracketTemplate(
  numTeams: number,
  bracketType: 'single_elimination' | 'double_elimination' = 'single_elimination'
): BracketTemplate {
  
  if (bracketType === 'double_elimination') {
    throw new Error('Double elimination not yet implemented');
  }

  // For single elimination, we need to determine bracket structure
  if (numTeams === 4) {
    // 4-team single elimination: 2 semifinals + 1 final
    return {
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Semifinals',
          games: [
            {
              gameNumber: 1,
              homeSeed: 1,
              awaySeed: 4,
              roundNumber: 1,
              nextGameNumber: 3
            },
            {
              gameNumber: 2,
              homeSeed: 2,
              awaySeed: 3,
              roundNumber: 1,
              nextGameNumber: 3
            }
          ]
        },
        {
          roundNumber: 2,
          roundName: 'Finals',
          games: [
            {
              gameNumber: 3,
              homeSeed: 0, // Winner of game 1
              awaySeed: 0, // Winner of game 2
              roundNumber: 2
            }
          ]
        }
      ],
      totalGames: 3
    };
  } else if (numTeams === 8) {
    // 8-team single elimination: 4 quarters + 2 semis + 1 final
    return {
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Quarterfinals',
          games: [
            { gameNumber: 1, homeSeed: 1, awaySeed: 8, roundNumber: 1, nextGameNumber: 5 },
            { gameNumber: 2, homeSeed: 4, awaySeed: 5, roundNumber: 1, nextGameNumber: 5 },
            { gameNumber: 3, homeSeed: 2, awaySeed: 7, roundNumber: 1, nextGameNumber: 6 },
            { gameNumber: 4, homeSeed: 3, awaySeed: 6, roundNumber: 1, nextGameNumber: 6 }
          ]
        },
        {
          roundNumber: 2,
          roundName: 'Semifinals',
          games: [
            { gameNumber: 5, homeSeed: 0, awaySeed: 0, roundNumber: 2, nextGameNumber: 7 },
            { gameNumber: 6, homeSeed: 0, awaySeed: 0, roundNumber: 2, nextGameNumber: 7 }
          ]
        },
        {
          roundNumber: 3,
          roundName: 'Finals',
          games: [
            { gameNumber: 7, homeSeed: 0, awaySeed: 0, roundNumber: 3 }
          ]
        }
      ],
      totalGames: 7
    };
  } else {
    throw new Error(`Bracket generation for ${numTeams} teams not yet implemented`);
  }
}

/**
 * Create bracket template games in database with placeholder teams
 */
export async function createBracketTemplate(
  tournamentId: string,
  numTeams: number,
  bracketType: 'single_elimination' | 'double_elimination' = 'single_elimination'
): Promise<{ success: boolean; error?: string; gamesCreated?: number; warning?: string }> {
  try {
    // Get tournament settings
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('bracket_innings, final_innings')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return { success: false, error: 'Tournament not found' };
    }

    // Check if bracket games already exist
    const { data: existingGames } = await supabaseAdmin
      .from('games')
      .select('id')
      .eq('tournament_id', tournamentId)
      .neq('game_type', 'round_robin');

    if (existingGames && existingGames.length > 0) {
      return { success: false, error: 'Bracket games already exist' };
    }

    // Generate bracket template
    const bracketTemplate = generateBracketTemplate(numTeams, bracketType);

    // Create placeholder bracket games
    const bracketGames = [];
    
    for (const round of bracketTemplate.rounds) {
      for (const game of round.games) {
        const isFinal = round.roundName?.toLowerCase().includes('final');
        bracketGames.push({
          tournament_id: tournamentId,
          home_team_id: null, // Will be set when seeding is determined
          away_team_id: null, // Will be set when seeding is determined
          status: 'scheduled',
          game_type: 'bracket',
          total_innings: isFinal ? (tournament.final_innings || tournament.bracket_innings || 5) : (tournament.bracket_innings || 5),
          home_score: 0,
          away_score: 0
        });
      }
    }

    // Insert bracket games
    const { data: createdGames, error: gamesError } = await supabaseAdmin
      .from('games')
      .insert(bracketGames)
      .select();

    if (gamesError) {
      console.error('Error creating bracket template games:', gamesError);
      return { 
        success: false, 
        error: `Failed to create bracket games: ${gamesError.message || 'Unknown error'}` 
      };
    }

    if (!createdGames || createdGames.length === 0) {
      return { success: false, error: 'No games were created' };
    }

    // Create bracket entries for each game
    const bracketEntries = [];
    let gameIndex = 0;
    
    for (const round of bracketTemplate.rounds) {
      for (const game of round.games) {
        const createdGame = createdGames[gameIndex];
        const nextGameIndex = game.nextGameNumber ? game.nextGameNumber - 1 : null;
        const nextGameId = nextGameIndex !== null && createdGames[nextGameIndex] ? createdGames[nextGameIndex].id : null;
        
        bracketEntries.push({
          tournament_id: tournamentId,
          game_id: createdGame.id,
          round_number: game.roundNumber,
          round_name: round.roundName,
          game_number: game.gameNumber,
          home_seed: game.homeSeed,
          away_seed: game.awaySeed,
          next_game_id: nextGameId,
          bracket_type: bracketType
        });
        
        gameIndex++;
      }
    }

    // Insert bracket entries
    const { error: bracketError } = await supabaseAdmin
      .from('brackets')
      .insert(bracketEntries);

    if (bracketError) {
      console.error('Error creating bracket entries:', bracketError);
      // Don't fail - games were created successfully
      return { 
        success: true, 
        gamesCreated: createdGames.length,
        warning: 'Games created but bracket structure failed. Bracket features may be limited.'
      };
    }

    return { 
      success: true, 
      gamesCreated: createdGames.length 
    };

  } catch (error) {
    console.error('Error in createBracketTemplate:', error);
    return { success: false, error: 'Internal error creating bracket template' };
  }
}

/**
 * Seed bracket games with actual teams based on standings
 */
export async function seedBracketGames(
  tournamentId: string,
  standings: Array<{ teamId: string; seed: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get unseeded bracket games
    const { data: bracketGames, error: gamesError } = await supabaseAdmin
      .from('games')
      .select('id, home_team_id, away_team_id')
      .eq('tournament_id', tournamentId)
      .neq('game_type', 'round_robin')
      .is('home_team_id', null)
      .is('away_team_id', null);

    if (gamesError) {
      return { success: false, error: 'Failed to fetch bracket games' };
    }

    if (!bracketGames || bracketGames.length === 0) {
      return { success: false, error: 'No unseeded bracket games found' };
    }

    // Create seed to team mapping
    const seedToTeam = new Map<number, string>();
    standings.forEach(standing => {
      seedToTeam.set(standing.seed, standing.teamId);
    });

    // Load bracket seed definitions from brackets table (authoritative)
    const { data: bracketEntries, error: bracketErr } = await supabaseAdmin
      .from('brackets')
      .select('game_id, home_seed, away_seed')
      .eq('tournament_id', tournamentId);

    if (bracketErr) {
      return { success: false, error: 'Failed to fetch bracket entries' };
    }

    const gameIdToSeeds = new Map<string, { home_seed: number; away_seed: number }>();
    (bracketEntries || []).forEach(entry => {
      gameIdToSeeds.set(entry.game_id, { home_seed: entry.home_seed, away_seed: entry.away_seed });
    });

    // Update bracket games with actual teams
    const updates = [];
    
    for (const game of bracketGames) {
      const seeds = gameIdToSeeds.get(game.id);
      if (!seeds) continue;
      const homeTeamId = seedToTeam.get(seeds.home_seed);
      const awayTeamId = seedToTeam.get(seeds.away_seed);
      
      // Only update if both seeds are valid (not 0 for TBD games)
      if ((seeds.home_seed || 0) > 0 && (seeds.away_seed || 0) > 0 && homeTeamId && awayTeamId) {
        updates.push({
          id: game.id,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId
        });
      }
    }

    // Apply updates
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('games')
        .update({
          home_team_id: update.home_team_id,
          away_team_id: update.away_team_id
        })
        .eq('id', update.id);

      if (updateError) {
        console.error('Error updating bracket game:', updateError);
        return { success: false, error: 'Failed to update bracket game' };
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error in seedBracketGames:', error);
    return { success: false, error: 'Internal error seeding bracket' };
  }
}
 
/**
 * Advance a winner from a completed bracket game into the next game
 * using the legacy `brackets` + `games` schema. The earliest game_number
 * feeding a next_game_id is treated as the home slot; the other is away.
 */
export async function advanceWinnerToNextGame(
  tournamentId: string,
  completedGameId: string,
  winnerTeamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the current bracket entry and its next game
    const { data: currentEntry, error: curErr } = await supabaseAdmin
      .from('brackets')
      .select('game_id, game_number, next_game_id')
      .eq('tournament_id', tournamentId)
      .eq('game_id', completedGameId)
      .single();

    if (curErr || !currentEntry) {
      return { success: false, error: 'Bracket entry not found for completed game' };
    }

    if (!currentEntry.next_game_id) {
      // Championship; no next game
      return { success: true };
    }

    // Get both parents of the next game, ordered by game_number
    const { data: parents, error: parErr } = await supabaseAdmin
      .from('brackets')
      .select('game_id, game_number')
      .eq('tournament_id', tournamentId)
      .eq('next_game_id', currentEntry.next_game_id)
      .order('game_number', { ascending: true });

    if (parErr || !parents || parents.length === 0) {
      return { success: false, error: 'No parent games found for next round' };
    }

    const isHomeSlot = parents[0]?.game_number === currentEntry.game_number;

    // Update the next game record with winner into the appropriate slot
    const updateData = isHomeSlot
      ? { home_team_id: winnerTeamId }
      : { away_team_id: winnerTeamId };

    const { error: updErr } = await supabaseAdmin
      .from('games')
      .update(updateData)
      .eq('id', currentEntry.next_game_id);

    if (updErr) {
      return { success: false, error: 'Failed to update next game with winner' };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Unexpected error advancing winner' };
  }
}

 