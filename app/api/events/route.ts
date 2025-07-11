import { NextRequest, NextResponse } from 'next/server';
import { submitEvent, validateEvent, getGameSnapshot, getGameEvents } from '../../../lib/api';
import type { EventSubmissionRequest, EventSubmissionResponse } from '../../../lib/types';

// POST /api/events - Submit a new game event
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const { game_id, type, payload, umpire_id, previous_event_id } = body;
    
    if (!game_id || !type || !payload || !umpire_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: game_id, type, payload, and umpire_id are required' 
        },
        { status: 400 }
      );
    }
    
    // Validate event type
    const validEventTypes = ['pitch', 'flip_cup', 'at_bat', 'undo', 'edit', 'takeover', 'game_start', 'game_end'];
    if (!validEventTypes.includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Create submission request
    const submissionRequest: EventSubmissionRequest = {
      game_id,
      type,
      payload,
      umpire_id,
      previous_event_id
    };
    
    // Submit the event (this includes validation)
    const result = await submitEvent(submissionRequest);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      );
    }
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        event: result.event,
        snapshot: result.snapshot
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during event submission' 
      },
      { status: 500 }
    );
  }
}

// GET /api/events?game_id=xxx - Get events for a game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get('game_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!game_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'game_id parameter is required' 
        },
        { status: 400 }
      );
    }
    
    // Get events for the game
    const { events, total } = await getGameEvents(game_id, limit, offset);
    
    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          limit,
          offset,
          total
        }
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while fetching events' 
      },
      { status: 500 }
    );
  }
} 