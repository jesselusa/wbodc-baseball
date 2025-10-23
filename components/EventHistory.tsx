import React, { useState } from 'react';
import { 
  GameEvent, 
  UndoEventPayload, 
  EditEventPayload,
  PitchResult,
  AtBatResult,
  FlipCupResult
} from '../lib/types';

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
  const recentEvents = events
    .filter(e => !undoneEventIds.has(e.id) && e.type !== 'undo' && e.type !== 'edit')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
  onUndo: () => void;
  disabled: boolean;
  isRecent: boolean;
  canUndo: boolean;
}

function EventCard({
  event,
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
        return `Flip Cup: ${(event.payload as any).result === 'offense wins' ? 'Offense Wins' : 'Defense Wins'}`;
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