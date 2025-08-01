import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    // If no year specified, return available years
    if (!year) {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('id, name, start_date, end_date, status')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching tournaments:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Group tournaments by year
      const tournamentsByYear: Record<string, any[]> = {};
      tournaments?.forEach(tournament => {
        const tournamentYear = new Date(tournament.start_date).getFullYear().toString();
        if (!tournamentsByYear[tournamentYear]) {
          tournamentsByYear[tournamentYear] = [];
        }
        tournamentsByYear[tournamentYear].push(tournament);
      });

      return NextResponse.json({
        success: true,
        data: {
          years: Object.keys(tournamentsByYear).sort((a, b) => parseInt(b) - parseInt(a)),
          tournamentsByYear
        }
      });
    }

    // If year specified, find the tournament for that year and return games
    if (year) {
      // First, get the tournament for this year (should only be one)
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name, start_date, end_date, status, location, tournament_number')
        .gte('start_date', `${year}-01-01`)
        .lt('start_date', `${parseInt(year) + 1}-01-01`)
        .order('start_date', { ascending: false })
        .limit(1);

      if (tournamentsError) {
        console.error('Error fetching tournaments for year:', tournamentsError);
        return NextResponse.json({ success: false, error: tournamentsError.message }, { status: 500 });
      }

      if (!tournaments || tournaments.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            tournament: null,
            games: []
          }
        });
      }

      const tournament = tournaments[0];

      // Now get games for this tournament
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          id,
          status,
          total_innings,
          started_at,
          completed_at,
          home_score,
          away_score,
          home_team:teams!games_home_team_id_fkey(id, name),
          away_team:teams!games_away_team_id_fkey(id, name),
          tournament:tournaments!games_tournament_id_fkey(id, name, location)
        `)
        .eq('tournament_id', tournament.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: true });

      if (error) {
        console.error('Error fetching games:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Fetch inning scores for games that have them
      const gameIds = games?.map(game => game.id) || [];
      
      let inningScores: any[] = [];
      if (gameIds.length > 0) {
        const { data: innings, error: inningsError } = await supabase
          .from('inning_scores')
          .select('game_id, inning, home_runs, away_runs')
          .in('game_id', gameIds)
          .order('inning', { ascending: true });

        if (!inningsError) {
          inningScores = innings || [];
        }
      }

      // Group inning scores by game_id
      const inningsByGame: Record<string, any[]> = {};
      inningScores.forEach(inning => {
        if (!inningsByGame[inning.game_id]) {
          inningsByGame[inning.game_id] = [];
        }
        inningsByGame[inning.game_id].push(inning);
      });

      // Attach inning data to games
      const gamesWithInnings = games?.map(game => ({
        ...game,
        innings_data: inningsByGame[game.id] || []
      }));

      return NextResponse.json({
        success: true,
        data: {
          tournament,
          games: gamesWithInnings || []
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in results API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 