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
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);

  // Sort events by created_at (most recent first) and limit
  const recentEvents = events
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, maxEvents);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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

  const handleUndo = (eventId: string) => {
    const payload: UndoEventPayload = {
      target_event_id: eventId
    };
    onUndo(payload);
  };

  const handleEdit = (eventId: string, newPayload: any) => {
    const payload: EditEventPayload = {
      target_event_id: eventId,
      new_data: newPayload
    };
    onEdit(payload);
    setEditingEvent(null);
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  if (recentEvents.length === 0) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.5rem',
        textAlign: 'center'
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
      overflow: 'hidden'
    }} className={className}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e4e2e8',
        background: '#fafafa'
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#1c1b20',
          marginBottom: '0.25rem'
        }}>Event History</h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          Recent game events and actions
        </p>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {recentEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isExpanded={expandedEvent === event.id}
              isEditing={editingEvent === event.id}
              onToggleExpansion={() => toggleEventExpansion(event.id)}
              onUndo={() => handleUndo(event.id)}
              onEdit={(newPayload) => handleEdit(event.id, newPayload)}
              onStartEdit={() => setEditingEvent(event.id)}
              onCancelEdit={() => setEditingEvent(null)}
              disabled={disabled}
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
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpansion: () => void;
  onUndo: () => void;
  onEdit: (newPayload: any) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  disabled: boolean;
}

function EventCard({
  event,
  isExpanded,
  isEditing,
  onToggleExpansion,
  onUndo,
  onEdit,
  onStartEdit,
  onCancelEdit,
  disabled
}: EventCardProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      {/* Event Header */}
      <div style={{
        padding: '0.75rem',
        background: '#f9fafb',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }} onClick={onToggleExpansion}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1
        }}>
          <span style={{ fontSize: '1.25rem' }}>
            {getEventIcon(event.type)}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              {getEventTitle(event)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.125rem'
            }}>
              {formatTimestamp(event.created_at)}
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px'
          }}>
            {event.umpire_id || 'Unknown'}
          </span>
          
          <button style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1rem',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '0.25rem',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: '0.75rem',
          borderTop: '1px solid #e5e7eb',
          background: '#ffffff'
        }}>
          {/* Event Details */}
          <div style={{
            marginBottom: '0.75rem',
            fontSize: '0.875rem',
            color: '#374151'
          }}>
            <pre style={{
              background: '#f9fafb',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onUndo}
              disabled={disabled}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }
              }}
            >
              Undo
            </button>
            
            <button
              onClick={onStartEdit}
              disabled={disabled}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }
              }}
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 