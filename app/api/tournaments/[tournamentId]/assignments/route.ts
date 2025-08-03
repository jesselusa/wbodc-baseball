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

    // Load player assignments from the tournament_player_assignments table
    const { data: playerAssignments, error: assignmentsError } = await supabaseAdmin
      .from('tournament_player_assignments')
      .select(`
        team_id,
        player_id,
        teams:team_id (
          id,
          name,
          color
        ),
        players:player_id (
          id,
          name,
          nickname
        )
      `)
      .eq('tournament_id', tournamentId);

    if (assignmentsError) {
      console.error('Error loading player assignments:', assignmentsError);
      return NextResponse.json(
        { error: assignmentsError.message || 'Failed to load player assignments' },
        { status: 500 }
      );
    }

    if (!playerAssignments || playerAssignments.length === 0) {
      return NextResponse.json({ 
        success: true,
        data: [],
        message: 'No team assignments found'
      });
    }

    // Group players by team and format for the admin interface
    const teamMap = new Map<string, any>();
    
    playerAssignments.forEach((assignment: any) => {
      const teamId = assignment.team_id;
      const team = assignment.teams;
      const player = assignment.players;
      
      if (!team || !player) return;
      
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          tournament_id: tournamentId,
          team_id: teamId,
          team_name: team.name,
          player_ids: [],
          players: [],
          is_locked: false // Add this for compatibility
        });
      }
      
      const teamData = teamMap.get(teamId);
      teamData.player_ids.push(player.id);
      teamData.players.push(player);
    });

    const teamAssignments = Array.from(teamMap.values());

    return NextResponse.json({ 
      success: true,
      data: teamAssignments,
      message: 'Team assignments loaded successfully'
    });

  } catch (error) {
    console.error('Error in /api/tournaments/[tournamentId]/assignments:', error);
    return NextResponse.json(
      { error: 'Failed to load team assignments' },
      { status: 500 }
    );
  }
}
 
 