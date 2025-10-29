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

    // Get team assignments with team and player details for this tournament
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('tournament_player_assignments')
      .select(`
        team_id,
        player_id,
        teams!inner (
          id,
          name,
          color
        ),
        players!inner (
          id,
          name,
          nickname,
          avatar_url,
          email,
          current_town,
          hometown,
          championships_won
        )
      `)
      .eq('tournament_id', tournamentId);

    if (assignmentsError) {
      console.error('Error fetching tournament team assignments:', assignmentsError);
      return NextResponse.json(
        { error: assignmentsError.message || 'Failed to fetch team assignments' },
        { status: 500 }
      );
    }

    // Group assignments by team to build teams with players
    const teamMap = new Map<string, any>();
    
    assignments?.forEach((assignment: any) => {
      const teamId = assignment.team_id;
      const team = assignment.teams;
      const player = assignment.players;

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          id: teamId,
          team_id: teamId,
          team_name: team.name,
          team_color: team.color,
          tournament_id: tournamentId,
          players: []
        });
      }

      teamMap.get(teamId).players.push(player);
    });

    // Convert map to array and sort by team name
    const teamsWithPlayers = Array.from(teamMap.values())
      .sort((a, b) => a.team_name.localeCompare(b.team_name));

    return NextResponse.json({ 
      success: true,
      data: teamsWithPlayers
    });

  } catch (error) {
    console.error('Error in /api/tournaments/[tournamentId]/teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament teams' },
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
    const { teams } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Clear existing assignments for this tournament
    const { error: clearErr } = await supabaseAdmin
      .from('tournament_player_assignments')
      .delete()
      .eq('tournament_id', tournamentId);

    if (clearErr) {
      return NextResponse.json({ error: clearErr.message }, { status: 500 });
    }

    // If no teams provided, we've effectively cleared assignments
    if (!teams || teams.length === 0) {
      return NextResponse.json({ success: true, message: 'Teams cleared' });
    }

    const playerAssignments: any[] = [];

    // Ensure team rows exist and build assignments
    for (const team of teams) {
      // Ensure team exists by name
      let teamId: string | null = null;
      const { data: existingTeam } = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('name', team.name)
        .single();

      if (existingTeam) {
        teamId = existingTeam.id;
      } else {
        const { data: newTeam, error: teamErr } = await supabaseAdmin
          .from('teams')
          .insert({ name: team.name, color: team.color || null })
          .select('id')
          .single();
        if (teamErr || !newTeam) {
          return NextResponse.json({ error: teamErr?.message || 'Failed to create team' }, { status: 500 });
        }
        teamId = newTeam.id;
      }

      // Build assignments
      for (const player of team.players || []) {
        playerAssignments.push({
          tournament_id: tournamentId,
          player_id: player.id,
          team_id: teamId
        });
      }
    }

    if (playerAssignments.length > 0) {
      const { error: assignErr } = await supabaseAdmin
        .from('tournament_player_assignments')
        .insert(playerAssignments);
      if (assignErr) {
        return NextResponse.json({ error: assignErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Teams saved' });

  } catch (error) {
    console.error('Error in POST /api/tournaments/[tournamentId]/teams:', error);
    return NextResponse.json(
      { error: 'Failed to save teams' },
      { status: 500 }
    );
  }
}
