import React, { useState, useEffect } from 'react';
import { TakeoverEventPayload } from '../lib/types';
import { fetchPlayers } from '../lib/api';

export interface UmpireTakeoverProps {
  currentUmpireId: string;
  gameId: string;
  onTakeover: (payload: TakeoverEventPayload) => void;
  disabled?: boolean;
  className?: string;
}

interface Player {
  id: string;
  name: string;
}

/**
 * UmpireTakeover component for umpire takeover functionality
 * Shows current umpire and provides takeover interface with confirmation
 */
export function UmpireTakeover({
  currentUmpireId,
  gameId,
  onTakeover,
  disabled = false,
  className = ''
}: UmpireTakeoverProps) {
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [newUmpireId, setNewUmpireId] = useState('');
  const [takeoverReason, setTakeoverReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [currentUmpireName, setCurrentUmpireName] = useState<string>('');

  // Load players immediately to get umpire name display
  useEffect(() => {
    if (players.length === 0) {
      loadPlayers();
    }
  }, []);

  // Load players when dialog opens
  useEffect(() => {
    if (showTakeoverDialog && players.length === 0) {
      loadPlayers();
    }
  }, [showTakeoverDialog]);

  // Find current umpire name
  useEffect(() => {
    if (currentUmpireId && players.length > 0) {
      const currentPlayer = players.find(p => p.id === currentUmpireId);
      setCurrentUmpireName(currentPlayer?.name || currentUmpireId);
    } else {
      setCurrentUmpireName('');
    }
  }, [currentUmpireId, players]);

  const loadPlayers = async () => {
    setPlayersLoading(true);
    try {
      const response = await fetchPlayers();
      if (response.success && response.data) {
        setPlayers(response.data.map(p => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setPlayersLoading(false);
    }
  };

  const handleTakeoverClick = () => {
    setShowTakeoverDialog(true);
    setNewUmpireId('');
    setTakeoverReason('');
  };

  const handleTakeoverConfirm = async () => {
    if (!newUmpireId.trim()) {
      alert('Please select a player to become the new umpire');
      return;
    }

    if (currentUmpireId && newUmpireId.trim() === currentUmpireId) {
      alert('You are already the current umpire');
      return;
    }

    setSubmitting(true);

    const payload: TakeoverEventPayload = {
      previous_umpire_id: currentUmpireId || null,
      new_umpire_id: newUmpireId.trim()
    };

    try {
      await onTakeover(payload);
      setShowTakeoverDialog(false);
      setNewUmpireId('');
      setTakeoverReason('');
    } catch (error) {
      console.error('Takeover failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowTakeoverDialog(false);
    setNewUmpireId('');
    setTakeoverReason('');
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden'
    }} className={className}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #e4e2e8',
        background: '#fafafa',
        minHeight: '72px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#1c1b20',
          marginBottom: '0.25rem'
        }}>Umpire Management</h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          Current umpire on duty
        </p>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Current Umpire Display */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#0369a1',
                marginBottom: '0.25rem'
              }}>Current Umpire</h3>
              <p style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#0c4a6e',
                wordBreak: 'break-word'
              }}>
                {currentUmpireName || currentUmpireId || 'None assigned'}
              </p>
            </div>
            
            <button
              onClick={handleTakeoverClick}
              disabled={disabled}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#d97706';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#f59e0b';
                }
              }}
            >
              Change Umpire
            </button>
          </div>
        </div>

        {/* Takeover Dialog */}
        {showTakeoverDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1c1b20',
                marginBottom: '1rem'
              }}>Change Umpire</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  New Umpire
                </label>
                <select
                  value={newUmpireId}
                  onChange={(e) => setNewUmpireId(e.target.value)}
                  disabled={playersLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: playersLoading ? '#f9fafb' : '#ffffff',
                    color: '#374151'
                  }}
                >
                  <option value="">Select a player...</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                {playersLoading && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    Loading players...
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleCancel}
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleTakeoverConfirm}
                  disabled={submitting || !newUmpireId.trim()}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: submitting || !newUmpireId.trim() ? '#9ca3af' : '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: submitting || !newUmpireId.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting && newUmpireId.trim()) {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting && newUmpireId.trim()) {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                    }
                  }}
                >
                  {submitting ? 'Changing...' : 'Change Umpire'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 