import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentGames } from '../../../lib/api';
import { testRealtimeConnection } from '../../../lib/realtime';
import { createClient } from '@supabase/supabase-js';

// GET /api/test-games - Test endpoint for debugging
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key present:', !!supabaseKey);
    
    // Test direct Supabase connection
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: directData, error: directError } = await supabase
      .from('games')
      .select('id, status')
      .limit(3);
    
    console.log('Direct Supabase query result:', { 
      data: directData, 
      error: directError, 
      dataLength: directData?.length || 0 
    });

    // Test realtime connection
    console.log('Testing realtime connection...');
    const realtimeTest = await testRealtimeConnection();
    console.log('Realtime test result:', realtimeTest);

    // Test fetchRecentGames function
    console.log('Testing fetchRecentGames...');
    const gamesResponse = await fetchRecentGames(10);
    
    if (gamesResponse.success && gamesResponse.data) {
      console.log(`Found ${gamesResponse.data.length} games in database`);
      console.log('Successfully transformed', gamesResponse.data.length, 'games');
    } else {
      console.log('No games found in database');
    }

    console.log('fetchRecentGames response:', {
      success: gamesResponse.success,
      dataLength: gamesResponse.data?.length || 0,
      error: gamesResponse.error,
      firstGame: gamesResponse.data?.[0] ? {
        id: gamesResponse.data[0].id,
        home_team: gamesResponse.data[0].home_team,
        away_team: gamesResponse.data[0].away_team,
        status: gamesResponse.data[0].status
      } : null
    });

    return NextResponse.json({
      success: true,
      tests: {
        environment: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey
        },
        directQuery: {
          success: !directError,
          dataLength: directData?.length || 0,
          error: directError?.message
        },
        realtime: realtimeTest,
        fetchGames: {
          success: gamesResponse.success,
          dataLength: gamesResponse.data?.length || 0,
          error: gamesResponse.error
        }
      }
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 