import { NextRequest, NextResponse } from 'next/server';
import { testStateMachineAgainstCurrentGame } from '../../../../../lib/api';

export async function GET(
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

    const result = await testStateMachineAgainstCurrentGame(gameId);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('State machine test error:', error);
    return NextResponse.json(
      { error: 'Failed to test state machine' },
      { status: 500 }
    );
  }
} 