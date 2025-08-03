import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the current active tournament
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching current tournament:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch current tournament' },
        { status: 500 }
      );
    }

    if (!tournament) {
      return NextResponse.json({ 
        success: true,
        data: null,
        message: 'No active tournament found'
      });
    }

    return NextResponse.json({ 
      success: true,
      data: tournament
    });

  } catch (error) {
    console.error('Error in /api/tournaments/current:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current tournament' },
      { status: 500 }
    );
  }
}
 
 