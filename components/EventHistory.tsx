import React, { useMemo, useState } from 'react';
import { 
  GameEvent, 
  UndoEventPayload, 
  EditEventPayload,
  PitchResult,
  AtBatResult,
  FlipCupResult
} from '../lib/types';
import { BaseballGameStateMachine } from '../lib/state-machine';

export interface EventHistoryProps {
  events: GameEvent[];
  onUndo: (payload: UndoEventPayload) => void;
  onEdit: (payload: EditEventPayload) => void;
  disabled?: boolean;
  maxEvents?: number;
  className?: string;
}

/**
 * EventHistory component for displaying recent game events
 * Shows chronological list with undo/edit capabilities
 */
export function EventHistory({
  events,
  onUndo,
  onEdit,
  disabled = false,
  maxEvents = 10,
  className = ''
}: EventHistoryProps) {

  const [pendingUndoIds, setPendingUndoIds] = useState<Set<string>>(new Set());

  // Get all undone event IDs
  const undoneEventIds = new Set(
    events
      .filter(e => e.type === 'undo')
      .map(e => (e.payload as UndoEventPayload).target_event_id)
  );

  // Include optimistic pending undos
  for (const id of pendingUndoIds) undoneEventIds.add(id);

  // Filter out undone events and undo/edit events themselves, then sort and limit
  // Determine boundary: most recent inning_end, else last game_start
  const mostRecentInningEnd = events
    .filter(e => e.type === 'inning_end')
    .sort((a, b) => b.sequence_number - a.sequence_number)[0];
  const mostRecentGameStart = events
    .filter(e => e.type === 'game_start')
    .sort((a, b) => b.sequence_number - a.sequence_number)[0];
  const boundarySeq = mostRecentInningEnd?.sequence_number ?? mostRecentGameStart?.sequence_number ?? -Infinity;

  const recentEvents = events
    .filter(e => e.sequence_number > boundarySeq)
    .filter(e => !undoneEventIds.has(e.id) && e.type !== 'undo' && e.type !== 'edit' && e.type !== 'inning_end' && e.type !== 'game_start')
    // Sort by sequence_number (authoritative ordering), fallback to created_at when missing
    .sort((a: any, b: any) => {
      const seqA = typeof (a as any).sequence_number === 'number' ? (a as any).sequence_number : -Infinity;
      const seqB = typeof (b as any).sequence_number === 'number' ? (b as any).sequence_number : -Infinity;
      if (seqA !== seqB) return seqB - seqA;
      const ca = new Date((a as any).created_at).getTime();
      const cb = new Date((b as any).created_at).getTime();
      return cb - ca;
    })
    .slice(0, maxEvents);

  const handleUndo = (eventId: string) => {
    // Optimistically hide immediately
    setPendingUndoIds(prev => new Set([...prev, eventId]));
    const payload: UndoEventPayload = {
      target_event_id: eventId
    };
    onUndo(payload);
  };

  if (recentEvents.length === 0) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.5rem',
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} className={className}>
        <div style={{
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <p>No events recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      height: '100%'
    }} className={className}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #e4e2e8',
        background: '#fafafa',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#1c1b20',
          marginBottom: '0.25rem'
        }}>Event History</h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          margin: 0
        }}>
          Recent game events and actions
        </p>
      </div>

      <div style={{ 
        padding: '1rem', 
        flex: 1, 
        overflowY: 'auto',
        minHeight: 0
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {recentEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              allEvents={events}
              onUndo={() => handleUndo(event.id)}
              disabled={disabled}
              isRecent={index === 0}
              canUndo={index === 0} // Only allow undoing the most recent event
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// EventCard component for individual events
interface EventCardProps {
  event: GameEvent;
  allEvents: GameEvent[];
  onUndo: () => void;
  disabled: boolean;
  isRecent: boolean;
  canUndo: boolean;
}

function EventCard({
  event,
  allEvents,
  onUndo,
  disabled,
  isRecent,
  canUndo
}: EventCardProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'pitch': return '⚾';
      case 'flip_cup': return '🥤';
      case 'at_bat': return '🏏';
      case 'game_start': return '▶️';
      case 'game_end': return '⏹️';
      case 'undo': return '↩️';
      case 'edit': return '✏️';
      case 'takeover': return '🔄';
      default: return '📝';
    }
  };

  const getEventTitle = (event: GameEvent) => {
    switch (event.type) {
      case 'pitch':
        return `Pitch: ${formatPitchResult((event.payload as any).result)}`;
      case 'flip_cup':
        return formatFlipCupTitle(event, allEvents);
      case 'at_bat':
        return `At-Bat: ${formatAtBatResult((event.payload as any).result)}`;
      case 'game_start':
        return 'Game Started';
      case 'game_end':
        return 'Game Ended';
      case 'undo':
        return `Undo: ${(event.payload as any).target_event_id}`;
      case 'edit':
        return `Edit: ${(event.payload as any).target_event_id}`;
      case 'takeover':
        return `Umpire Takeover: ${(event.payload as any).new_umpire_id}`;
      default:
        return `${event.type} event`;
    }
  };

  const formatFlipCupTitle = (flipEvent: GameEvent, events: GameEvent[]) => {
    // Prefer explicit hit_type saved in payload
    const payloadAny = flipEvent.payload as any;
    const explicit = payloadAny?.hit_type as ('single'|'double'|'triple'|'homerun'|undefined);
    const explicitLabel = explicit ? formatAtBatResult(explicit as any) : null;
    // Fallback: derive from the most recent cup-hit pitch prior to this flip cup
    const hitLabel = explicitLabel || deriveHitFromPreviousPitch(events, flipEvent);
    // Compute runs scored by simulating state before/after this flip cup
    const runs = useMemo(() => computeRunsForFlipCup(events, flipEvent), [events, flipEvent.id]);
    if (runs && runs > 0) {
      return `${hitLabel}: ${runs} run${runs === 1 ? '' : 's'} scored`;
    }
    return hitLabel;
  };

  const deriveHitFromPreviousPitch = (events: GameEvent[], flipEvent: GameEvent) => {
    // Look back for the latest pitch event with a cup hit prior to this flip cup's sequence_number
    const priorCupPitch = [...events]
      .filter(e => e.type === 'pitch' && e.sequence_number < flipEvent.sequence_number)
      .sort((a, b) => b.sequence_number - a.sequence_number)
      .find(e => {
        const r = (e.payload as any).result as PitchResult;
        return r === 'first cup hit' || r === 'second cup hit' || r === 'third cup hit' || r === 'fourth cup hit';
      });

    if (!priorCupPitch) return 'Hit';
    const r = (priorCupPitch.payload as any).result as PitchResult;
    if (r === 'first cup hit') return 'Single';
    if (r === 'second cup hit') return 'Double';
    if (r === 'third cup hit') return 'Triple';
    if (r === 'fourth cup hit') return 'Home Run';
    return 'Hit';
  };

  const computeRunsForFlipCup = (events: GameEvent[], flipEvent: GameEvent): number | null => {
    try {
      // Find game_start event
      const gameStart = events.find(e => e.type === 'game_start');
      if (!gameStart) return null;
      const gameId = flipEvent.game_id;

      // Build a minimal pre-start snapshot
      const preStart: any = {
        game_id: gameId,
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
      };

      // Apply game_start
      let before = BaseballGameStateMachine.transition(preStart, gameStart as any, events).snapshot;

      // Replay events strictly before the flip cup (skip undo/edit and duplicate game_start)
      const priorEvents = events
        .filter(e => e.sequence_number < flipEvent.sequence_number)
        .filter(e => e.type !== 'undo' && e.type !== 'edit' && e.type !== 'game_start')
        .sort((a, b) => a.sequence_number - b.sequence_number);

      for (const e of priorEvents) {
        before = BaseballGameStateMachine.transition(before, e as any, events).snapshot;
      }

      const battingAway = before.is_top_of_inning;
      const beforeHome = before.score_home;
      const beforeAway = before.score_away;

      // Apply the flip cup event
      const after = BaseballGameStateMachine.transition(before, flipEvent as any, events).snapshot;
      const delta = battingAway ? after.score_away - beforeAway : after.score_home - beforeHome;
      return Math.max(0, delta);
    } catch (_) {
      return null;
    }
  };

  const formatPitchResult = (result: PitchResult) => {
    const labels: Record<PitchResult, string> = {
      'ball': 'Ball',
      'strike': 'Strike',
      'foul ball': 'Foul Ball',
      'first cup hit': '1st Cup Hit',
      'second cup hit': '2nd Cup Hit',
      'third cup hit': '3rd Cup Hit',
      'fourth cup hit': '4th Cup Hit'
    };
    return labels[result] || result;
  };

  const formatAtBatResult = (result: AtBatResult) => {
    const labels: Record<AtBatResult, string> = {
      'out': 'Out',
      'walk': 'Walk',
      'single': 'Single',
      'double': 'Double',
      'triple': 'Triple',
      'homerun': 'Home Run'
    };
    return labels[result] || result;
  };

  return (
    <div style={{
      border: isRecent ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '0.75rem',
      background: isRecent ? '#eff6ff' : '#f9fafb',
      position: 'relative'
    }}>
      {/* Recent Badge */}
      {isRecent && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '8px',
          background: '#3b82f6',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.625rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Latest
        </div>
      )}
      
      {/* Event Info Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        {/* Event Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1
        }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getEventIcon(event.type)}
          </span>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            {getEventTitle(event)}
          </div>
        </div>
        
        {/* Undo Button - Only show for the most recent event */}
        {canUndo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            disabled={disabled}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'background-color 0.2s',
              fontSize: '0.75rem',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#fecaca';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }
            }}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
} 