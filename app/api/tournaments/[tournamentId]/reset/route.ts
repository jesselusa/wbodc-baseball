import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';

export async function POST(
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

    // Reset tournament status and clear teams
    const { error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .update({ 
        status: 'upcoming',
        started_at: null
      })
      .eq('id', tournamentId);

    if (tournamentError) {
      console.error('Error resetting tournament:', tournamentError);
      return NextResponse.json(
        { error: tournamentError.message || 'Failed to reset tournament' },
        { status: 500 }
      );
    }

            // Clear tournament player assignments
        await supabaseAdmin
          .from('tournament_player_assignments')
          .delete()
          .eq('tournament_id', tournamentId);



    // Clear bracket entries first (due to foreign key constraints)
    await supabaseAdmin
      .from('brackets')
      .delete()
      .eq('tournament_id', tournamentId);

    // Clear all games (both pool play and bracket games)
    await supabaseAdmin
      .from('games')
      .delete()
      .eq('tournament_id', tournamentId);

    return NextResponse.json({ 
      success: true,
      message: 'Tournament reset successfully'
    });

  } catch (error) {
    console.error('Error resetting tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
 
