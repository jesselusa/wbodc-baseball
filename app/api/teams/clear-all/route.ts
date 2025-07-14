import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Use the service role key for database operations with full permissions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_API_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Clear all team memberships (this removes players from teams)
    const { error: teamMembershipsError } = await supabase
      .from('team_memberships')
      .delete()
      .not('id', 'is', null); // Delete all records

    if (teamMembershipsError) {
      console.error('Error clearing team memberships:', teamMembershipsError);
      return NextResponse.json(
        { error: 'Failed to clear team memberships' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All team assignments cleared successfully' 
    });
  } catch (error) {
    console.error('Error in clear all teams API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 