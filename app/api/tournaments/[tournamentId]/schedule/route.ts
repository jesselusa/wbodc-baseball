import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRoundRobinSchedule, validateRoundRobinSchedule, Team } from '../../../../../lib/utils/tournament-scheduling';

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
        { error: 'At least 2 teams must be assigned to generate a schedule' },
        { status: 400 }
      );
    }

    // Convert to Team format for scheduling algorithm
    const teams: Team[] = teamAssignments.map(assignment => ({
      id: assignment.id,
      name: assignment.team_name
    }));

    // Generate round robin schedule
    const schedule = generateRoundRobinSchedule(teams);

    // Validate the generated schedule
    const validation = validateRoundRobinSchedule(schedule, teams);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Generated schedule is invalid', details: validation.errors },
        { status: 500 }
      );
    }

    // Create tournament round record
    const { data: roundRecord, error: roundError } = await supabase
      .from('tournament_rounds')
      .insert({
        tournament_id: tournamentId,
        round_type: 'round_robin',
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

    // Create games for each match in the schedule
    const gamesToCreate = schedule.matches.map(match => ({
      tournament_id: tournamentId,
      tournament_round_id: roundRecord.id,
      home_team_id: match.homeTeam.id,
      away_team_id: match.awayTeam.id,
      status: 'scheduled',
      game_type: 'tournament',
      total_innings: tournament.pool_play_innings || 3,
      scheduled_start: null, // Will be set by time slot distribution
      actual_start: null,
      actual_end: null,
      home_score: 0,
      away_score: 0,
      game_type: 'round_robin',
      round_robin_round: match.round
    }));

    const { data: createdGames, error: gamesError } = await supabase
      .from('games')
      .insert(gamesToCreate)
      .select();

    if (gamesError) {
      return NextResponse.json(
        { error: 'Failed to create games' },
        { status: 500 }
      );
    }

    // Initialize standings for all teams
    const standingsToCreate = teams.map(team => ({
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

    const { error: standingsError } = await supabase
      .from('tournament_standings')
      .insert(standingsToCreate);

    if (standingsError) {
      return NextResponse.json(
        { error: 'Failed to initialize team standings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tournament_id: tournamentId,
        round_id: roundRecord.id,
        schedule: {
          total_rounds: schedule.totalRounds,
          matches_per_round: schedule.matchesPerRound,
          total_games: schedule.matches.length,
          games_created: createdGames?.length || 0
        },
        teams: teams.length
      }
    });

  } catch (error) {
    console.error('Error generating tournament schedule:', error);
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
    
    // Get tournament round robin schedule
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(`
        id,
        home_team_id,
        away_team_id,
        status,
        scheduled_start,
        actual_start,
        actual_end,
        home_score,
        away_score,
        round_robin_round,
        tournament_round_id,
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
      .eq('game_type', 'round_robin')
      .order('round_robin_round', { ascending: true })
      .order('scheduled_start', { ascending: true });

    if (gamesError) {
      return NextResponse.json(
        { error: 'Failed to fetch tournament schedule' },
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
      .order('wins', { ascending: false })
      .order('run_differential', { ascending: false });

    if (standingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch team standings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        games: games || [],
        standings: standings || []
      }
    });

  } catch (error) {
    console.error('Error fetching tournament schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 