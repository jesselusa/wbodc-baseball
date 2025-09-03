import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Fetch games for the tournament with team names and bracket info
    const { data: games, error } = await supabaseAdmin
      .from('games')
      .select(`
        id,
        tournament_id,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        current_inning,
        is_top_inning,
        total_innings,
        status,
        started_at,
        completed_at,
        created_at,
        game_type,

        home_team:teams!games_home_team_id_fkey (
          id,
          name
        ),
        away_team:teams!games_away_team_id_fkey (
          id,
          name
        ),
        brackets!brackets_game_id_fkey (
          round_number,
          round_name,
          game_number,
          home_seed,
          away_seed,
          next_game_id,
          bracket_type
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tournament games:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch tournament games' },
        { status: 500 }
      );
    }

    // Fetch game snapshots for active games to get live state
    // Note: Supporting both 'active' and 'in_progress' for compatibility during transition
    const activeGameIds = games?.filter(game => game.status === 'in_progress').map(game => game.id) || [];
    let gameSnapshots: any[] = [];
    
    if (activeGameIds.length > 0) {
      const { data: snapshots } = await supabaseAdmin
        .from('game_snapshots')
        .select('game_id, current_inning, is_top_of_inning, outs, balls, strikes, base_runners')
        .in('game_id', activeGameIds);
      
      gameSnapshots = snapshots || [];
    }

    // Create a map for quick snapshot lookup
    const snapshotMap = new Map(gameSnapshots.map(snapshot => [snapshot.game_id, snapshot]));

    // Format the games data to match HistoricalGame interface
    const formattedGames = games?.map((game: any) => {
      const snapshot = snapshotMap.get(game.id);
      
      return {
        id: game.id,
        tournament_id: game.tournament_id,
        home_team_id: game.home_team_id,
        away_team_id: game.away_team_id,
        home_team: {
          id: game.home_team_id,
          name: game.home_team?.name || 'Unknown Team'
        },
        away_team: {
          id: game.away_team_id,
          name: game.away_team?.name || 'Unknown Team'
        },
        home_score: game.home_score || 0,
        away_score: game.away_score || 0,
        status: game.status || 'scheduled',
        current_inning: snapshot?.current_inning || game.current_inning || 1,
        is_top_of_inning: snapshot?.is_top_of_inning ?? game.is_top_inning ?? false,
        total_innings: game.total_innings || 9,
        started_at: game.started_at,
        completed_at: game.completed_at,
        game_type: game.game_type,
        brackets: game.brackets,
        // Live game state (only for active games)
        ...(snapshot && {
          outs: snapshot.outs,
          balls: snapshot.balls,
          strikes: snapshot.strikes,
          base_runners: snapshot.base_runners
        })
      };
    }) || [];

    return NextResponse.json({ 
      success: true,
      data: formattedGames
    });

  } catch (error) {
    console.error('Error in /api/tournaments/[tournamentId]/games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament games' },
      { status: 500 }
    );
  }
}