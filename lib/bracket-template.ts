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
        bracketGames.push({
          tournament_id: tournamentId,
          home_team_id: null, // Will be set when seeding is determined
          away_team_id: null, // Will be set when seeding is determined
          status: 'scheduled',
          game_type: 'bracket',
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
      .select('*')
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
    const seedToTeam = new Map();
    standings.forEach(standing => {
      seedToTeam.set(standing.seed, standing.teamId);
    });

    // Update bracket games with actual teams
    const updates = [];
    
    for (const game of bracketGames) {
      const homeTeamId = seedToTeam.get(game.bracket_home_seed);
      const awayTeamId = seedToTeam.get(game.bracket_away_seed);
      
      // Only update if both seeds are valid (not 0 for TBD games)
      if (game.bracket_home_seed > 0 && game.bracket_away_seed > 0 && homeTeamId && awayTeamId) {
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
 
 