import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';
import { createBracketTemplate } from '../../../../../lib/bracket-template';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const { teams } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json(
        { error: 'Teams are required to start tournament' },
        { status: 400 }
      );
    }

    // Save teams directly using supabaseAdmin (we're already server-side)
    // Clear existing tournament player assignments for this tournament
    await supabaseAdmin
      .from('tournament_player_assignments')
      .delete()
      .eq('tournament_id', tournamentId);

    // Create or find teams in the global teams table and create player assignments
    const teamRecords: any[] = [];
    const playerAssignments: any[] = [];

    for (const team of teams) {
      if (team.players.length === 0) continue; // Skip empty teams
      
      // Try to find existing team by name first
      const { data: existingTeam } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('name', team.name)
        .single();

      let teamRecord;
      if (existingTeam) {
        teamRecord = existingTeam;
      } else {
        // Create new team
        const { data: newTeam, error: teamError } = await supabaseAdmin
          .from('teams')
          .insert({
            name: team.name,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)` // Random color
          })
          .select()
          .single();

        if (teamError) {
          return NextResponse.json(
            { error: `Failed to create team: ${teamError.message}` },
            { status: 500 }
          );
        }
        teamRecord = newTeam;
      }
      
      teamRecords.push(teamRecord);

      // Create player assignments for this team
      team.players.forEach(player => {
        playerAssignments.push({
          tournament_id: tournamentId,
          player_id: player.id,
          team_id: teamRecord.id
        });
      });
    }

    // Insert all player assignments
    if (playerAssignments.length > 0) {
      const { error: assignmentError } = await supabaseAdmin
        .from('tournament_player_assignments')
        .insert(playerAssignments);

      if (assignmentError) {
        return NextResponse.json(
          { error: `Failed to create player assignments: ${assignmentError.message}` },
          { status: 500 }
        );
      }
    }

    // Generate pool play games (round robin)
    if (teamRecords.length >= 2) {
      const poolPlayGames = [];
      
      // Generate all possible matchups (round robin)
      for (let i = 0; i < teamRecords.length; i++) {
        for (let j = i + 1; j < teamRecords.length; j++) {
          poolPlayGames.push({
            tournament_id: tournamentId,
            home_team_id: teamRecords[i].id,
            away_team_id: teamRecords[j].id,
            status: 'scheduled',
            game_type: 'round_robin',
            home_score: 0,
            away_score: 0
          });
        }
      }
      
      // Insert pool play games
      if (poolPlayGames.length > 0) {
        const { error: poolGameError } = await supabaseAdmin
          .from('games')
          .insert(poolPlayGames);
          
        if (poolGameError) {
          return NextResponse.json(
            { error: `Failed to create pool play games: ${poolGameError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Get tournament info for bracket creation
    const { data: tournament, error: tournamentFetchError } = await supabaseAdmin
      .from('tournaments')
      .select('num_teams, bracket_type')
      .eq('id', tournamentId)
      .single();

    if (tournamentFetchError || !tournament) {
      return NextResponse.json(
        { error: 'Failed to fetch tournament details' },
        { status: 500 }
      );
    }

    // Create bracket template with placeholder seeds
    const bracketResult = await createBracketTemplate(
      tournamentId, 
      tournament.num_teams || 4,
      tournament.bracket_type || 'single_elimination'
    );

    if (!bracketResult.success) {
      console.error('Error creating bracket template:', bracketResult.error);
      // Don't fail the tournament start, just log the warning
      console.warn('Tournament started but bracket template creation failed:', bracketResult.error);
    }

    // Update tournament status to active/started
    const { error } = await supabaseAdmin
      .from('tournaments')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', tournamentId);

    if (error) {
      console.error('Error updating tournament status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to start tournament' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Tournament started successfully',
      poolPlay: {
        gamesCreated: teamRecords.length >= 2 ? (teamRecords.length * (teamRecords.length - 1)) / 2 : 0
      },
      bracketTemplate: bracketResult.success ? {
        created: true,
        gamesCreated: bracketResult.gamesCreated,
        warning: bracketResult.warning
      } : {
        created: false,
        error: bracketResult.error
      }
    });

  } catch (error) {
    console.error('Error starting tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
 
 