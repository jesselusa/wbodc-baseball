import React, { useState, useEffect } from 'react';
import { FlipCupEventPayload, FlipCupResult, GameSnapshot, Player } from '../lib/types';
import { fetchPlayers } from '../lib/api';

export interface FlipCupModalProps {
  isOpen: boolean;
  cupHit: 1 | 2 | 3 | 4;
  gameSnapshot: GameSnapshot;
  onResult: (payload: FlipCupEventPayload) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * FlipCupModal component for recording flip cup results
 * Appears after a cup hit to determine if it becomes a base hit or an out
 */
export function FlipCupModal({
  isOpen,
  cupHit,
  gameSnapshot,
  onResult,
  onCancel,
  className = ''
}: FlipCupModalProps) {
  const [selectedResult, setSelectedResult] = useState<FlipCupResult | null>(null);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Load players for name resolution
  useEffect(() => {
    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    try {
      // Fetch ALL players including inactive ones for name resolution
      const response = await fetchPlayers(true);
      if (response.success && response.data) {
        console.log('[FlipCupModal] Loaded players:', response.data.length);
        setPlayers(response.data);
      } else {
        console.error('[FlipCupModal] Failed to fetch players:', response.error);
      }
    } catch (error) {
      console.error('[FlipCupModal] Failed to load players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Helper function to get player name by ID
  const getPlayerName = (playerId: string | null): string => {
    if (!playerId) return 'Unknown';
    if (loadingPlayers || players.length === 0) return 'Loading...';
    
    const player = players.find(p => p.id === playerId);
    if (!player) {
      console.log('[FlipCupModal] Player not found for ID:', playerId);
      console.log('[FlipCupModal] Available players:', players.map(p => ({ id: p.id, name: p.name })));
      return 'Unknown Player';
    }
    return player.name;
  };

  // Don't render if not open
  if (!isOpen) return null;

  const cupHitLabels = {
    1: 'Single',
    2: 'Double', 
    3: 'Triple',
    4: 'Home Run'
  };

  const handleErrorToggle = (playerId: string) => {
    setSelectedErrors(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedResult) return;

    setSubmitting(true);

    const payload: FlipCupEventPayload = {
      result: selectedResult,
      batter_id: gameSnapshot.batter_id || '',
      catcher_id: gameSnapshot.catcher_id || '',
      errors: selectedErrors.length > 0 ? selectedErrors : undefined
    };

    console.log('[FlipCupModal] Submitting flip cup result:');
    console.log('  - selectedResult:', selectedResult);
    console.log('  - payload:', payload);

    onResult(payload);
    
    // Reset form
    setSelectedResult(null);
    setSelectedErrors([]);
    setSubmitting(false);
  };

  const handleCancel = () => {
    setSelectedResult(null);
    setSelectedErrors([]);
    setPlayers([]); // Clear players cache for next open
    onCancel();
  };

  // Get available players for error tracking (fielding team)
  const fieldingLineup = gameSnapshot.is_top_of_inning 
    ? gameSnapshot.home_lineup 
    : gameSnapshot.away_lineup;

  return (
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
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }} className={className}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e4e2e8',
          background: '#fafafa'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1c1b20',
            marginBottom: '0.25rem'
          }}>Flip Cup Result</h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            {cupHitLabels[cupHit]} attempt - Who won the flip cup?
          </p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Result Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>Flip Cup Winner</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setSelectedResult('offense wins')}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: '8px',
                  border: selectedResult === 'offense wins' ? '2px solid #22c55e' : '2px solid #d1d5db',
                  backgroundColor: selectedResult === 'offense wins' ? '#f0fdf4' : '#ffffff',
                  color: selectedResult === 'offense wins' ? '#166534' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  if (selectedResult !== 'offense wins') {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedResult !== 'offense wins') {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                {cupHitLabels[cupHit]}
              </button>

              <button
                onClick={() => setSelectedResult('defense wins')}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: '8px',
                  border: selectedResult === 'defense wins' ? '2px solid #ef4444' : '2px solid #d1d5db',
                  backgroundColor: selectedResult === 'defense wins' ? '#fef2f2' : '#ffffff',
                  color: selectedResult === 'defense wins' ? '#991b1b' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  if (selectedResult !== 'defense wins') {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedResult !== 'defense wins') {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                Out
              </button>
            </div>
          </div>

          {/* Error Tracking (optional) */}
          {selectedResult === 'offense wins' && fieldingLineup.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                Fielding Errors (Optional)
              </h3>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginBottom: '0.75rem'
              }}>
                Select any fielders who made errors during the play
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxHeight: '8rem',
                overflowY: 'auto'
              }}>
                {fieldingLineup.map((playerId) => (
                  <label
                    key={playerId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedErrors.includes(playerId)}
                      onChange={() => handleErrorToggle(playerId)}
                      style={{
                        width: '1rem',
                        height: '1rem',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        accentColor: '#3b82f6'
                      }}
                    />
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>
                      {getPlayerName(playerId)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e4e2e8',
          background: '#fafafa',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
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
              opacity: submitting ? 0.5 : 1,
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
            onClick={handleSubmit}
            disabled={!selectedResult || submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: !selectedResult || submitting ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: !selectedResult || submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => {
              if (selectedResult && !submitting) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedResult && !submitting) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {submitting ? 'Recording...' : 'Record Result'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Overlay component to prevent background interaction
export function FlipCupOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {children}
    </div>
  );
} 