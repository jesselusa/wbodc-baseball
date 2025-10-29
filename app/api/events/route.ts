import { NextRequest, NextResponse } from 'next/server';
import { submitEvent, validateEvent, getGameSnapshot, getGameEvents } from '../../../lib/api';
import { BaseballGameStateMachine } from '../../../lib/state-machine';
import type { GameEvent, GameSnapshot, UndoEventPayload } from '../../../lib/types';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import type { EventSubmissionRequest, EventSubmissionResponse } from '../../../lib/types';
import { updateStandingsOnGameComplete } from '../../../lib/tournament-standings-updater';
import { updateBracketOnGameComplete } from '../../../lib/tournament-bracket-updater';
import { transitionToBracketPhase } from '../../../lib/tournament-phase-transition';
import { createBracketTemplate, seedBracketGames, advanceWinnerToNextGame } from '../../../lib/bracket-template';
import { calculateTeamStandings } from '../../../lib/utils/bracket-generation';

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
    const validEventTypes = ['pitch', 'flip_cup', 'at_bat', 'undo', 'edit', 'takeover', 'game_start', 'game_end', 'inning_end'];
    if (!validEventTypes.includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Special handling: server-side undo deletes target event and rebuilds snapshot
    if (type === 'undo') {
      const undoPayload = payload as UndoEventPayload;

      // Enforce that only the most recent gameplay event can be undone
      const { data: latestEvents, error: latestErr } = await supabaseAdmin
        .from('game_events')
        .select('*')
        .eq('game_id', game_id)
        .not('type', 'in', '(undo,edit)')
        .order('sequence_number', { ascending: false })
        .limit(1);

      if (latestErr) {
        return NextResponse.json({ success: false, error: `Failed to load latest event: ${latestErr.message}` }, { status: 400 });
      }

      const latestEvent = latestEvents && latestEvents[0];
      if (!latestEvent) {
        return NextResponse.json({ success: false, error: 'No events to undo' }, { status: 400 });
      }

      if (latestEvent.id !== undoPayload.target_event_id) {
        return NextResponse.json({ success: false, error: 'Can only undo the most recent event' }, { status: 400 });
      }

      // Delete the target event
      const { error: delErr } = await supabaseAdmin
        .from('game_events')
        .delete()
        .eq('id', undoPayload.target_event_id);

      if (delErr) {
        return NextResponse.json({ success: false, error: `Failed to delete event: ${delErr.message}` }, { status: 400 });
      }

      // Rebuild snapshot by replaying remaining events
      const { data: allEvents, error: allErr } = await supabaseAdmin
        .from('game_events')
        .select('*')
        .eq('game_id', game_id)
        .order('sequence_number', { ascending: true });

      if (allErr || !allEvents) {
        return NextResponse.json({ success: false, error: 'Failed to fetch events for rebuild' }, { status: 500 });
      }

      const events: GameEvent[] = allEvents as any;
      const gameStart = events.find(e => e.type === 'game_start');
      if (!gameStart) {
        return NextResponse.json({ success: false, error: 'Missing game_start event' }, { status: 500 });
      }

      // Start from minimal pre-start snapshot
      const preStart: GameSnapshot = {
        game_id,
        current_inning: 1,
        is_top_of_inning: true,
        outs: 0,
        balls: 0,
        strikes: 0,
        score_home: 0,
        score_away: 0,
        home_team_id: '',
        away_team_id: '',
        batter_id: null,
        catcher_id: null,
        base_runners: { first: null, second: null, third: null },
        home_lineup: [],
        away_lineup: [],
        home_lineup_position: 0,
        away_lineup_position: 0,
        last_event_id: null,
        umpire_id: null,
        status: 'not_started',
        last_updated: new Date().toISOString(),
        scoring_method: 'live',
        is_quick_result: false
      } as any;

      let snapshot = BaseballGameStateMachine.transition(preStart, gameStart as any, events).snapshot;
      // Skip any additional game_start events during replay to avoid duplicate start errors
      const remaining = events
        .filter(e => e.type !== 'game_start')
        .filter(e => e.type !== 'undo' && e.type !== 'edit');
      for (const e of remaining) {
        const result = BaseballGameStateMachine.transition(snapshot, e as any, events);
        if (result.error) {
          return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
        snapshot = result.snapshot;
      }

      // Persist snapshot
      const { data: saved, error: saveErr } = await supabaseAdmin
        .from('game_snapshots')
        .upsert(snapshot as any)
        .select()
        .single();

      if (saveErr) {
        return NextResponse.json({ success: false, error: 'Failed to save rebuilt snapshot' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: { event: null, snapshot: saved } }, { status: 200 });
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
    
    // Server-side: Update games table with current scores from snapshot
    try {
      const snapshot = result.snapshot;
      
      // Determine the correct Game status based on GameSnapshot status
      let gameStatus;
      if (snapshot.status === 'completed') {
        gameStatus = 'completed';
      } else if (snapshot.status === 'in_progress' || snapshot.status === 'paused') {
        gameStatus = 'in_progress';
      } else {
        gameStatus = 'scheduled'; // Default for not_started
      }
      
      await supabaseAdmin
        .from('games')
        .update({
          home_score: snapshot.score_home,
          away_score: snapshot.score_away,
          status: gameStatus,
          current_inning: snapshot.current_inning,
          is_top_inning: snapshot.is_top_of_inning
        })
        .eq('id', snapshot.game_id);
    } catch (gamesUpdateError) {
      console.error('Error updating games table server-side:', gamesUpdateError);
      // Don't fail the whole request for this, just log it
    }
    
    // If the snapshot indicates completion, trigger tournament updates (standings/bracket)
    if (result.snapshot.status === 'completed') {
      try {
        // Fetch minimal game info to decide which updaters to run
        const { data: gameRow } = await supabaseAdmin
          .from('games')
          .select('id, tournament_id, game_type')
          .eq('id', result.snapshot.game_id)
          .single();

        if (gameRow && gameRow.tournament_id) {
          let standingsResult = null as any;
          if (gameRow.game_type === 'round_robin' || gameRow.game_type === 'pool_play') {
            standingsResult = await updateStandingsOnGameComplete(gameRow.tournament_id, gameRow.id);
            if (standingsResult?.roundRobinComplete) {
              // Generate bracket games for current schema (games + brackets tables)
              // 1) Determine number of teams from tournament_teams
              const { data: teams } = await supabaseAdmin
                .from('tournament_teams')
                .select('id, team_name')
                .eq('tournament_id', gameRow.tournament_id);

              const numTeams = teams?.length || 0;
              if (numTeams >= 2) {
                // Create bracket template (no-op if already exists)
                await createBracketTemplate(gameRow.tournament_id, numTeams);

                // Build standings from completed round robin games
                const { data: rrGames } = await supabaseAdmin
                  .from('games')
                  .select('home_team_id, away_team_id, home_score, away_score, status')
                  .eq('tournament_id', gameRow.tournament_id)
                  .eq('game_type', 'round_robin');

                const teamList = (teams || []).map(t => ({ id: t.id, name: t.team_name }));
                const transformed = (rrGames || []).map(g => ({
                  homeTeamId: g.home_team_id,
                  awayTeamId: g.away_team_id,
                  homeScore: g.home_score,
                  awayScore: g.away_score,
                  status: g.status
                }));
                const standings = calculateTeamStandings(transformed, teamList);

                // Seed bracket games using bracket entries
                await seedBracketGames(
                  gameRow.tournament_id,
                  standings.map(s => ({ teamId: s.teamId, seed: s.seed! }))
                );
              }
            }
          } else {
            // Bracket winner advancement using legacy brackets table
            const completedGameId = result.snapshot.game_id;
            const winnerTeamId = (result.snapshot.score_home || 0) > (result.snapshot.score_away || 0)
              ? result.snapshot.home_team_id
              : result.snapshot.away_team_id;
            if (winnerTeamId) {
              try { await advanceWinnerToNextGame(gameRow.tournament_id, completedGameId, winnerTeamId); } catch (_) {}
            }
          }
        }
      } catch (tournamentUpdateError) {
        console.error('Error running tournament updates on game completion:', tournamentUpdateError);
        // Do not fail the request if tournament updates fail; they can be retried separately
      }
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