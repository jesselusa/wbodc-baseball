import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';

/**
 * API endpoint to fix game lineups by replacing invalid/old players
 * with valid players from the correct teams
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Get the current game snapshot
    const { data: snapshot, error: snapshotError } = await supabaseAdmin
      .from('game_snapshots')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json(
        { error: 'Game snapshot not found' },
        { status: 404 }
      );
    }

    // Get the game details to find tournament_id
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('tournament_id, home_team_id, away_team_id')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const { tournament_id, home_team_id, away_team_id } = game;

    if (!home_team_id || !away_team_id) {
      return NextResponse.json(
        { error: 'Game does not have team assignments' },
        { status: 400 }
      );
    }

    // Fetch the correct players for home team
    const { data: homeAssignments, error: homeError } = await supabaseAdmin
      .from('tournament_player_assignments')
      .select('player_id')
      .eq('team_id', home_team_id)
      .eq('tournament_id', tournament_id);

    if (homeError || !homeAssignments || homeAssignments.length === 0) {
      return NextResponse.json(
        { error: 'Could not find players for home team' },
        { status: 400 }
      );
    }

    // Fetch the correct players for away team
    const { data: awayAssignments, error: awayError } = await supabaseAdmin
      .from('tournament_player_assignments')
      .select('player_id')
      .eq('team_id', away_team_id)
      .eq('tournament_id', tournament_id);

    if (awayError || !awayAssignments || awayAssignments.length === 0) {
      return NextResponse.json(
        { error: 'Could not find players for away team' },
        { status: 400 }
      );
    }

    const homePlayerIds = homeAssignments.map(a => a.player_id);
    const awayPlayerIds = awayAssignments.map(a => a.player_id);
    
    // All valid players (both teams)
    const allValidPlayerIds = [...homePlayerIds, ...awayPlayerIds];

    // Check if current lineup players are valid
    const homeLineup = snapshot.home_lineup as string[];
    const awayLineup = snapshot.away_lineup as string[];

    const homeLinupValid = homeLineup.every(playerId => homePlayerIds.includes(playerId));
    const awayLineupValid = awayLineup.every(playerId => awayPlayerIds.includes(playerId));

    let updatedSnapshot = { ...snapshot };
    let changesNeeded = false;
    let changesLog: string[] = [];

    // Replace home lineup if needed
    if (!homeLinupValid) {
      console.log(`[FixLineup] Home lineup has invalid players, replacing with correct team roster`);
      updatedSnapshot.home_lineup = homePlayerIds;
      changesNeeded = true;
      changesLog.push('Replaced home team lineup');
      
      // Update batter if they're from home team and invalid
      if (snapshot.batter_id && !snapshot.is_top_of_inning) {
        if (!homePlayerIds.includes(snapshot.batter_id)) {
          updatedSnapshot.batter_id = homePlayerIds[updatedSnapshot.home_lineup_position % homePlayerIds.length];
          console.log(`[FixLineup] Updated home batter to: ${updatedSnapshot.batter_id}`);
          changesLog.push('Updated batter');
        }
      }

      // Update catcher if needed (opponent of current batter)
      if (snapshot.catcher_id && !snapshot.is_top_of_inning) {
        // When it's bottom of inning, catcher should be from away team
        if (!awayPlayerIds.includes(snapshot.catcher_id)) {
          updatedSnapshot.catcher_id = awayPlayerIds[0];
          console.log(`[FixLineup] Updated catcher to away team player: ${updatedSnapshot.catcher_id}`);
          changesLog.push('Updated catcher');
        }
      }
    }

    // Replace away lineup if needed
    if (!awayLineupValid) {
      console.log(`[FixLineup] Away lineup has invalid players, replacing with correct team roster`);
      updatedSnapshot.away_lineup = awayPlayerIds;
      changesNeeded = true;
      changesLog.push('Replaced away team lineup');
      
      // Update batter if they're from away team and invalid
      if (snapshot.batter_id && snapshot.is_top_of_inning) {
        if (!awayPlayerIds.includes(snapshot.batter_id)) {
          updatedSnapshot.batter_id = awayPlayerIds[updatedSnapshot.away_lineup_position % awayPlayerIds.length];
          console.log(`[FixLineup] Updated away batter to: ${updatedSnapshot.batter_id}`);
          changesLog.push('Updated batter');
        }
      }

      // Update catcher if needed (opponent of current batter)
      if (snapshot.catcher_id && snapshot.is_top_of_inning) {
        // When it's top of inning, catcher should be from home team
        if (!homePlayerIds.includes(snapshot.catcher_id)) {
          updatedSnapshot.catcher_id = homePlayerIds[0];
          console.log(`[FixLineup] Updated catcher to home team player: ${updatedSnapshot.catcher_id}`);
          changesLog.push('Updated catcher');
        }
      }
    }

    // Fix base runners - check if any are invalid
    const baseRunners = snapshot.base_runners as { first: string | null; second: string | null; third: string | null };
    let baseRunnersFixed = false;

    if (baseRunners.first && !allValidPlayerIds.includes(baseRunners.first)) {
      console.log(`[FixLineup] Invalid runner on first base: ${baseRunners.first}, clearing`);
      updatedSnapshot.base_runners = { ...updatedSnapshot.base_runners, first: null };
      changesNeeded = true;
      baseRunnersFixed = true;
    }

    if (baseRunners.second && !allValidPlayerIds.includes(baseRunners.second)) {
      console.log(`[FixLineup] Invalid runner on second base: ${baseRunners.second}, clearing`);
      updatedSnapshot.base_runners = { ...updatedSnapshot.base_runners, second: null };
      changesNeeded = true;
      baseRunnersFixed = true;
    }

    if (baseRunners.third && !allValidPlayerIds.includes(baseRunners.third)) {
      console.log(`[FixLineup] Invalid runner on third base: ${baseRunners.third}, clearing`);
      updatedSnapshot.base_runners = { ...updatedSnapshot.base_runners, third: null };
      changesNeeded = true;
      baseRunnersFixed = true;
    }

    if (baseRunnersFixed) {
      changesLog.push('Cleared invalid base runners');
    }

    if (!changesNeeded) {
      return NextResponse.json({
        success: true,
        message: 'Lineups are already valid, no changes needed',
        changes: []
      });
    }

    // Update the snapshot in the database
    const { error: updateError } = await supabaseAdmin
      .from('game_snapshots')
      .update({
        home_lineup: updatedSnapshot.home_lineup,
        away_lineup: updatedSnapshot.away_lineup,
        batter_id: updatedSnapshot.batter_id,
        catcher_id: updatedSnapshot.catcher_id,
        base_runners: updatedSnapshot.base_runners,
        last_updated: new Date().toISOString()
      })
      .eq('game_id', gameId);

    if (updateError) {
      console.error('[FixLineup] Error updating snapshot:', updateError);
      return NextResponse.json(
        { error: 'Failed to update game snapshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully fixed game lineup',
      changes: changesLog
    });

  } catch (error) {
    console.error('[FixLineup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}

