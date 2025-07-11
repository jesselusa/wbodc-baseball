import { NextRequest, NextResponse } from 'next/server';
import { getGameSnapshot, getLiveGameStatus } from '../../../../../lib/api';

// GET /api/games/[gameId]/snapshot - Get current game snapshot
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
    
    // Get the current game snapshot
    const snapshot = await getGameSnapshot(gameId);
    
    if (!snapshot) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Game not found or no snapshot available' 
        },
        { status: 404 }
      );
    }
    
    // Return the snapshot
    return NextResponse.json({
      success: true,
      data: snapshot
    });
    
  } catch (error) {
    console.error(`Error in GET /api/games/snapshot:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching game snapshot' 
      },
      { status: 500 }
    );
  }
} 