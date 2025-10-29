import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  generateTournamentBracket, 
  validateBracketStructure,
  calculateTeamStandings,
  BracketType 
} from '../../../../../lib/utils/bracket-generation';

// Helper function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
  return createClient(supabaseUrl, supabaseSecretKey);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createSupabaseClient();
    const body = await request.json();
    const { bracketType = 'single_elimination' } = body;

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get teams assigned to this tournament
    const { data: teamAssignments, error: teamsError } = await supabase
      .from('tournament_teams')
      .select(`
        id,
        team_name,
        tournament_id
      `)
      .eq('tournament_id', tournamentId);

    if (teamsError) {
      return NextResponse.json(
        { error: 'Failed to fetch tournament teams' },
        { status: 500 }
      );
    }

    if (!teamAssignments || teamAssignments.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams must be assigned to generate a bracket' },
        { status: 400 }
      );
    }

    // Get completed round robin games
    const { data: roundRobinGames, error: gamesError } = await supabase
      .from('games')
      .select(`
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status
      `)
      .eq('tournament_id', tournamentId)
      .eq('game_type', 'round_robin');

    if (gamesError) {
      return NextResponse.json(
        { error: 'Failed to fetch round robin games' },
        { status: 500 }
      );
    }

    // Convert teams to the format expected by bracket generation
    const teams = teamAssignments.map(assignment => ({
      id: assignment.id,
      name: assignment.team_name
    }));

    // Transform round robin games to the expected format
    const transformedGames = (roundRobinGames || []).map(game => ({
      homeTeamId: game.home_team_id,
      awayTeamId: game.away_team_id,
      homeScore: game.home_score,
      awayScore: game.away_score,
      status: game.status
    }));

    // Calculate team standings from round robin results
    const standings = calculateTeamStandings(transformedGames, teams);

    // Generate tournament bracket
    const bracket = generateTournamentBracket(tournamentId, standings, bracketType as BracketType);

    // Validate the generated bracket
    const validation = validateBracketStructure(bracket, standings);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Generated bracket is invalid', 
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 500 }
      );
    }

    // Create tournament round record for bracket phase
    const { data: roundRecord, error: roundError } = await supabase
      .from('tournament_rounds')
      .insert({
        tournament_id: tournamentId,
        round_type: 'bracket',
        round_number: 1,
        status: 'pending',
        start_date: tournament.start_date,
        end_date: tournament.end_date
      })
      .select()
      .single();

    if (roundError) {
      return NextResponse.json(
        { error: 'Failed to create tournament round' },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { error: 'Failed to create bracket matches' },
        { status: 500 }
      );
    }

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
        total_innings: tournament.bracket_innings || 3,
        scheduled_start: null,
        actual_start: null,
        actual_end: null,
        home_score: 0,
        away_score: 0
      }));

    let createdGames = [];
    if (bracketGamesToCreate.length > 0) {
      const { data: games, error: gamesCreateError } = await supabase
        .from('games')
        .insert(bracketGamesToCreate)
        .select();

      if (gamesCreateError) {
        return NextResponse.json(
          { error: 'Failed to create bracket games' },
          { status: 500 }
        );
      }
      createdGames = games || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        tournament_id: tournamentId,
        round_id: roundRecord.id,
        bracket: {
          type: bracketType,
          total_rounds: bracket.totalRounds,
          total_games: bracket.totalGames,
          matches_created: createdBracketMatches?.length || 0,
          games_created: createdGames.length
        },
        standings: standings.map(s => ({
          team_id: s.teamId,
          team_name: s.teamName,
          seed: s.seed,
          wins: s.wins,
          losses: s.losses,
          run_differential: s.runDifferential
        }))
      }
    });

  } catch (error) {
    console.error('Error generating tournament bracket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createSupabaseClient();
    
    // Get tournament bracket matches
    const { data: bracketMatches, error: bracketError } = await supabase
      .from('tournament_brackets')
      .select(`
        id,
        tournament_id,
        round_id,
        bracket_type,
        round_number,
        game_number,
        home_team_id,
        away_team_id,
        home_team_seed,
        away_team_seed,
        winner_team_id,
        is_bye,
        next_game_number,
        game_id,
        tournament_teams!home_team_id (
          id,
          team_name
        ),
        tournament_teams!away_team_id (
          id,
          team_name
        ),
        tournament_teams!winner_team_id (
          id,
          team_name
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('game_number', { ascending: true });

    if (bracketError) {
      return NextResponse.json(
        { error: 'Failed to fetch tournament bracket' },
        { status: 500 }
      );
    }

    // Get bracket games
    const { data: bracketGames, error: gamesError } = await supabase
      .from('games')
      .select(`
        id,
        tournament_id,
        tournament_round_id,
        bracket_game_number,
        home_team_id,
        away_team_id,
        status,
        scheduled_start,
        actual_start,
        actual_end,
        home_score,
        away_score,
        tournament_teams!home_team_id (
          id,
          team_name
        ),
        tournament_teams!away_team_id (
          id,
          team_name
        )
      `)
      .eq('tournament_id', tournamentId)
      .neq('game_type', 'round_robin')
      .order('bracket_game_number', { ascending: true });

    if (gamesError) {
      return NextResponse.json(
        { error: 'Failed to fetch bracket games' },
        { status: 500 }
      );
    }

    // Get team standings
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

    if (standingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch team standings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bracket_matches: bracketMatches || [],
        bracket_games: bracketGames || [],
        standings: standings || []
      }
    });

  } catch (error) {
    console.error('Error fetching tournament bracket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createSupabaseClient();
    const body = await request.json();
    const { gameNumber, winnerTeamId } = body;

    if (!gameNumber || !winnerTeamId) {
      return NextResponse.json(
        { error: 'Game number and winner team ID are required' },
        { status: 400 }
      );
    }

    // Update bracket match winner
    const { data: updatedMatch, error: matchError } = await supabase
      .from('tournament_brackets')
      .update({ winner_team_id: winnerTeamId })
      .eq('tournament_id', tournamentId)
      .eq('game_number', gameNumber)
      .select()
      .single();

    if (matchError) {
      return NextResponse.json(
        { error: 'Failed to update bracket match' },
        { status: 500 }
      );
    }

    // Find the next game for this winner
    if (updatedMatch.next_game_number) {
      const nextMatch = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('game_number', updatedMatch.next_game_number)
        .single();

      if (nextMatch.data) {
        // Determine if winner should be home or away team in next match
        const isHomeTeam = !nextMatch.data.home_team_id;
        const updateData = isHomeTeam 
          ? { home_team_id: winnerTeamId }
          : { away_team_id: winnerTeamId };

        await supabase
          .from('tournament_brackets')
          .update(updateData)
          .eq('tournament_id', tournamentId)
          .eq('game_number', updatedMatch.next_game_number);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updated_match: updatedMatch,
        winner_advanced: !!updatedMatch.next_game_number
      }
    });

  } catch (error) {
    console.error('Error updating bracket match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 