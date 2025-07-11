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

  const getEventDescription = (event: GameEvent) => {
    switch (event.type) {
      case 'pitch':
        return `Batter: ${(event.payload as any).batter_id}, Catcher: ${(event.payload as any).catcher_id}`;
      case 'flip_cup':
        const errors = (event.payload as any).fielding_errors?.length > 0 
          ? ` (Errors: ${(event.payload as any).fielding_errors.join(', ')})` 
          : '';
        return `Cup hit resolved${errors}`;
      case 'at_bat':
        return `Batter: ${(event.payload as any).batter_id}, Catcher: ${(event.payload as any).catcher_id}`;
      case 'game_start':
        return `Teams: ${(event.payload as any).away_team_id} vs ${(event.payload as any).home_team_id}`;
      case 'undo':
        return `Undid event: ${(event.payload as any).target_event_id}`;
      case 'edit':
        return `Edited event: ${(event.payload as any).target_event_id}`;
      default:
        return '';
    }
  };

  const canUndo = (event: GameEvent) => {
    // Can't undo undo/edit events, and can't undo if it's not the most recent event
    if (['undo', 'edit'].includes(event.type)) return false;
    if (recentEvents.length === 0) return false;
    return event.id === recentEvents[0].id;
  };

  const canEdit = (event: GameEvent) => {
    // Can edit most events except undo/edit/game_start/game_end
    return !['undo', 'edit', 'game_start', 'game_end'].includes(event.type);
  };

  const handleUndo = (event: GameEvent) => {
    const payload: UndoEventPayload = {
      target_event_id: event.id,
      reason: 'User requested undo'
    };
    onUndo(payload);
  };

  const handleEdit = (event: GameEvent) => {
    setEditingEvent(event.id);
    // For now, just show expanded view. Real edit functionality would need a form
    setExpandedEvent(expandedEvent === event.id ? null : event.id);
  };

  const toggleExpanded = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  if (recentEvents.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Event History</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📝</div>
          <p className="text-gray-500">No events recorded yet</p>
          <p className="text-sm text-gray-400 mt-1">Events will appear here as the game progresses</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Event History</h3>
        <p className="text-sm text-gray-500 mt-1">
          Recent {recentEvents.length} of {events.length} events
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {recentEvents.map((event, index) => (
          <div 
            key={event.id} 
            className={`border-b border-gray-100 last:border-b-0 ${
              index === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-lg">{getEventIcon(event.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {getEventTitle(event)}
                      </h4>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTimestamp(event.created_at)}
                      </span>
                    </div>
                    
                    {getEventDescription(event) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {getEventDescription(event)}
                      </p>
                    )}

                    {index === 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                        Most Recent
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleExpanded(event.id)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                    title="View details"
                  >
                    {expandedEvent === event.id ? '▼' : '▶'}
                  </button>

                  {canEdit(event) && (
                    <button
                      onClick={() => handleEdit(event)}
                      disabled={disabled}
                      className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit event"
                    >
                      ✏️
                    </button>
                  )}

                  {canUndo(event) && (
                    <button
                      onClick={() => handleUndo(event)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Undo event"
                    >
                      ↩️
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedEvent === event.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Event ID:</span>
                      <span className="ml-2 font-mono text-xs">{event.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Umpire:</span>
                      <span className="ml-2">{event.umpire_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 capitalize">{event.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Timestamp:</span>
                      <span className="ml-2">{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {event.previous_event_id && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Previous Event:</span>
                      <span className="ml-2 font-mono text-xs">{event.previous_event_id}</span>
                    </div>
                  )}

                  <div className="mt-3">
                    <span className="text-gray-500 text-sm">Payload:</span>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>

                  {editingEvent === event.id && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>Edit Mode:</strong> Event editing functionality would be implemented here.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingEvent(null)}
                          className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel Edit
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement actual edit functionality
                            setEditingEvent(null);
                          }}
                          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {events.length > maxEvents && (
        <div className="px-6 py-3 border-t bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            Showing {maxEvents} of {events.length} total events
          </p>
        </div>
      )}
    </div>
  );
} 