import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateTeamStandings } from '../../../../../lib/utils/bracket-generation';

// Helper function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;
  return createClient(supabaseUrl, supabaseSecretKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createSupabaseClient();
    
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

    if (!teamAssignments || teamAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          standings: [],
          tiebreakers: [],
          round_robin_complete: false
        }
      });
    }

    // Get all round robin games for this tournament
    const { data: roundRobinGames, error: gamesError } = await supabase
      .from('games')
      .select(`
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status,
        actual_start,
        actual_end
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_round_robin', true)
      .order('actual_start', { ascending: true });

    if (gamesError) {
      return NextResponse.json(
        { error: 'Failed to fetch round robin games' },
        { status: 500 }
      );
    }

    // Convert teams to the format expected by standings calculation
    const teams = teamAssignments.map(assignment => ({
      id: assignment.id,
      name: assignment.team_name
    }));

    // Transform round robin games to the expected format
    const transformedGames = (roundRobinGames || []).map((game: any) => ({
      homeTeamId: game.home_team_id,
      awayTeamId: game.away_team_id,
      homeScore: game.home_score,
      awayScore: game.away_score,
      status: game.status
    }));

    // Calculate team standings with tiebreaker logic
    const standings = calculateTeamStandings(transformedGames, teams);

    // Calculate total games that should be played in round robin
    const totalTeams = teams.length;
    const expectedGames = (totalTeams * (totalTeams - 1)) / 2;
    const completedGames = roundRobinGames?.filter(g => g.status === 'completed').length || 0;
    const roundRobinComplete = completedGames >= expectedGames;

    // Identify tiebreaker situations
    const tiebreakers = identifyTiebreakers(standings, roundRobinGames || []);

    // Calculate additional statistics
    const standingsWithStats = standings.map(standing => {
      const teamGames = roundRobinGames?.filter(g => 
        g.status === 'completed' && 
        (g.home_team_id === standing.teamId || g.away_team_id === standing.teamId)
      ) || [];

      const avgRunsScored = standing.gamesPlayed > 0 ? standing.runsScored / standing.gamesPlayed : 0;
      const avgRunsAllowed = standing.gamesPlayed > 0 ? standing.runsAllowed / standing.gamesPlayed : 0;
      const winPercentage = standing.gamesPlayed > 0 ? standing.wins / standing.gamesPlayed : 0;

      return {
        ...standing,
        avg_runs_scored: Math.round(avgRunsScored * 100) / 100,
        avg_runs_allowed: Math.round(avgRunsAllowed * 100) / 100,
        win_percentage: Math.round(winPercentage * 1000) / 10,
        games_played: teamGames.length
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        standings: standingsWithStats,
        tiebreakers,
        round_robin_complete: roundRobinComplete,
        total_teams: totalTeams,
        expected_games: expectedGames,
        completed_games: completedGames,
        remaining_games: expectedGames - completedGames
      }
    });

  } catch (error) {
    console.error('Error fetching tournament standings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = createSupabaseClient();
    const body = await request.json();
    const { recalculate = false } = body;

    if (recalculate) {
      // Recalculate standings from scratch
      return await GET(request, { params });
    }

    // Update standings based on latest game results
    const { data: latestGames, error: gamesError } = await supabase
      .from('games')
      .select(`
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status,
        actual_start
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_round_robin', true)
      .eq('status', 'completed')
      .order('actual_start', { ascending: false })
      .limit(10); // Get last 10 completed games

    if (gamesError) {
      return NextResponse.json(
        { error: 'Failed to fetch latest games' },
        { status: 500 }
      );
    }

    // Get current standings
    const { data: currentStandings, error: standingsError } = await supabase
      .from('tournament_standings')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (standingsError) {
      return NextResponse.json(
        { error: 'Failed to fetch current standings' },
        { status: 500 }
      );
    }

    // Update standings based on latest games
    const updatedStandings = updateStandingsFromGames(currentStandings || [], latestGames || []);

    // Save updated standings
    const { error: updateError } = await supabase
      .from('tournament_standings')
      .upsert(updatedStandings, { onConflict: 'tournament_id,team_id' });

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update standings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Standings updated successfully',
        updated_standings: updatedStandings
      }
    });

  } catch (error) {
    console.error('Error updating tournament standings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Identify tiebreaker situations in standings
 * 
 * @param standings Team standings
 * @param games All round robin games
 * @returns Array of tiebreaker situations
 */
function identifyTiebreakers(
  standings: any[],
  games: any[]
): Array<{
  teams: string[];
  reason: string;
  resolution: string;
}> {
  const tiebreakers: Array<{
    teams: string[];
    reason: string;
    resolution: string;
  }> = [];

  // Group teams by wins
  const teamsByWins = new Map<number, any[]>();
  standings.forEach(standing => {
    if (!teamsByWins.has(standing.wins)) {
      teamsByWins.set(standing.wins, []);
    }
    teamsByWins.get(standing.wins)!.push(standing);
  });

  // Check for ties
  teamsByWins.forEach((teams, wins) => {
    if (teams.length > 1) {
      // Check if tie is resolved by run differential
      const teamsByRunDiff = new Map<number, any[]>();
      teams.forEach(team => {
        if (!teamsByRunDiff.has(team.runDifferential)) {
          teamsByRunDiff.set(team.runDifferential, []);
        }
        teamsByRunDiff.get(team.runDifferential)!.push(team);
      });

      teamsByRunDiff.forEach((tiedTeams, runDiff) => {
        if (tiedTeams.length > 1) {
          // Check if tie is resolved by runs scored
          const teamsByRunsScored = new Map<number, any[]>();
          tiedTeams.forEach(team => {
            if (!teamsByRunsScored.has(team.runsScored)) {
              teamsByRunsScored.set(team.runsScored, []);
            }
            teamsByRunsScored.get(team.runsScored)!.push(team);
          });

          teamsByRunsScored.forEach((finalTiedTeams, runsScored) => {
            if (finalTiedTeams.length > 1) {
              // Check head-to-head record
              const headToHeadResolution = resolveHeadToHead(finalTiedTeams, games);
              
              tiebreakers.push({
                teams: finalTiedTeams.map(t => t.teamName),
                reason: `Tied with ${wins} wins, ${runDiff} run differential, ${runsScored} runs scored`,
                resolution: headToHeadResolution
              });
            }
          });
        }
      });
    }
  });

  return tiebreakers;
}

/**
 * Resolve tie using head-to-head record
 * 
 * @param tiedTeams Teams that are tied
 * @param games All round robin games
 * @returns Resolution description
 */
function resolveHeadToHead(tiedTeams: any[], games: any[]): string {
  const teamIds = tiedTeams.map(t => t.teamId);
  
  // Get head-to-head games between tied teams
  const headToHeadGames = games.filter(g => 
    g.status === 'completed' &&
    teamIds.includes(g.home_team_id) &&
    teamIds.includes(g.away_team_id)
  );

  if (headToHeadGames.length === 0) {
    return 'No head-to-head games played - tie resolved by alphabetical order';
  }

  // Calculate head-to-head records
  const headToHeadRecords = new Map<string, { wins: number; losses: number }>();
  teamIds.forEach(teamId => {
    headToHeadRecords.set(teamId, { wins: 0, losses: 0 });
  });

  headToHeadGames.forEach(game => {
    const homeRecord = headToHeadRecords.get(game.home_team_id)!;
    const awayRecord = headToHeadRecords.get(game.away_team_id)!;

    if (game.home_score > game.away_score) {
      homeRecord.wins++;
      awayRecord.losses++;
    } else {
      awayRecord.wins++;
      homeRecord.losses++;
    }
  });

  // Check if head-to-head resolves the tie
  const records = Array.from(headToHeadRecords.entries()).map(([teamId, record]) => ({
    teamId,
    teamName: tiedTeams.find(t => t.teamId === teamId)!.teamName,
    ...record
  }));

  const maxWins = Math.max(...records.map(r => r.wins));
  const teamsWithMaxWins = records.filter(r => r.wins === maxWins);

  if (teamsWithMaxWins.length === 1) {
    return `Resolved by head-to-head record: ${teamsWithMaxWins[0].teamName} (${teamsWithMaxWins[0].wins}-${teamsWithMaxWins[0].losses})`;
  } else {
    return 'Head-to-head record does not resolve tie - resolved by alphabetical order';
  }
}

/**
 * Update standings based on new game results
 * 
 * @param currentStandings Current standings from database
 * @param newGames New games to process
 * @returns Updated standings
 */
function updateStandingsFromGames(currentStandings: any[], newGames: any[]): any[] {
  const standingsMap = new Map<string, any>();
  
  // Initialize standings map
  currentStandings.forEach(standing => {
    standingsMap.set(standing.team_id, { ...standing });
  });

  // Process new games
  newGames.forEach(game => {
    const homeStanding = standingsMap.get(game.home_team_id);
    const awayStanding = standingsMap.get(game.away_team_id);

    if (homeStanding && awayStanding) {
      // Update games played
      homeStanding.games_played++;
      awayStanding.games_played++;

      // Update runs
      homeStanding.runs_scored += game.home_score;
      homeStanding.runs_allowed += game.away_score;
      awayStanding.runs_scored += game.away_score;
      awayStanding.runs_allowed += game.home_score;

      // Update wins/losses
      if (game.home_score > game.away_score) {
        homeStanding.wins++;
        awayStanding.losses++;
      } else {
        awayStanding.wins++;
        homeStanding.losses++;
      }

      // Update run differential
      homeStanding.run_differential = homeStanding.runs_scored - homeStanding.runs_allowed;
      awayStanding.run_differential = awayStanding.runs_scored - awayStanding.runs_allowed;
    }
  });

  return Array.from(standingsMap.values());
} 