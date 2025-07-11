import { NextRequest, NextResponse } from 'next/server';
import { getLiveGameStatus } from '../../../../../lib/api';

// GET /api/games/[gameId]/live-status - Get live game status with team/player names
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    
    if (!gameId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Game ID is required' 
        },
        { status: 400 }
      );
    }
    
    // Get the live game status (includes team names, player names, etc.)
    const liveStatus = await getLiveGameStatus(gameId);
    
    if (!liveStatus) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Game not found or no live status available' 
        },
        { status: 404 }
      );
    }
    
    // Return the live status
    return NextResponse.json({
      success: true,
      data: liveStatus
    });
    
  } catch (error) {
    console.error(`Error in GET /api/games/live-status:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching live game status' 
      },
      { status: 500 }
    );
  }
} 