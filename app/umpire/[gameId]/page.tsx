'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameSetup } from '../../../components/GameSetup';
import { UmpireControls } from '../../../components/UmpireControls';
import { LiveGameState } from '../../../components/LiveGameState';
import { FlipCupModal } from '../../../components/FlipCupModal';
import { AtBatConfirmation } from '../../../components/AtBatConfirmation';
import { EndGameModal } from '../../../components/EndGameModal';
import { EventHistory } from '../../../components/EventHistory';
import { UmpireTakeover } from '../../../components/UmpireTakeover';
import { ConnectionStatus } from '../../../components/ConnectionStatus';
import { useGameEvents } from '../../../hooks/useGameEvents';
import { usePitchByPitchScoring } from '../../../hooks/useUmpireActions';
import { GameSnapshot, GameSetupData, LiveGameStatus, AtBatResult, AtBatEventPayload, FlipCupEventPayload, UndoEventPayload, EditEventPayload, TakeoverEventPayload, GameEndEventPayload } from '../../../lib/types';
import { getGameSnapshot, getLiveGameStatus } from '../../../lib/api';

/**
 * Main umpire interface for live game scorekeeping
 * Integrates all umpire components and manages game state
 */
export default function UmpirePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  // State management
  const [gameSnapshot, setGameSnapshot] = useState<GameSnapshot | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveGameStatus | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [umpireId, setUmpireId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  
  // At-bat confirmation modal state
  const [atBatConfirmationOpen, setAtBatConfirmationOpen] = useState(false);
  const [pendingAtBatResult, setPendingAtBatResult] = useState<'walk' | 'out' | 'single' | 'double' | 'triple' | 'homerun' | null>(null);
  const [endGameModalOpen, setEndGameModalOpen] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-renders

  // Real-time hooks
  const {
    snapshot: realtimeSnapshot,
    events,
    connectionStatus,
    hasError
  } = useGameEvents({
    gameId,
    autoConnect: true,
    filters: {
      eventTypes: ['pitch', 'flip_cup', 'at_bat', 'game_start', 'game_end']
    }
  });

  // Umpire actions hook
  const umpireActions = usePitchByPitchScoring(gameId, umpireId);

  // Load initial game data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);
        
        const [snapshotResponse, statusResponse] = await Promise.all([
          getGameSnapshot(gameId),
          getLiveGameStatus(gameId)
        ]);

        if (snapshotResponse) {
          setGameSnapshot(snapshotResponse);
          setGameStarted(snapshotResponse.status !== 'not_started');
          if (snapshotResponse.umpire_id) {
            setUmpireId(snapshotResponse.umpire_id);
          }
        }

        if (statusResponse) {
          setLiveStatus(statusResponse);
        }

      } catch (err) {
        setError('Failed to load game data');
        console.error('Error loading game data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      loadGameData();
    }
  }, [gameId]);

  // Update local state when real-time data changes
  useEffect(() => {
    if (realtimeSnapshot) {
      console.log('[Umpire] Real-time snapshot received:', {
        timestamp: realtimeSnapshot.last_updated,
        score_home: realtimeSnapshot.score_home,
        score_away: realtimeSnapshot.score_away,
        outs: realtimeSnapshot.outs,
        current_inning: realtimeSnapshot.current_inning,
        base_runners: realtimeSnapshot.base_runners
      });
      
      // Force a fresh object to ensure React re-renders
      const newSnapshot = { ...realtimeSnapshot };
      console.log('[Umpire] Setting new snapshot state:', newSnapshot);
      setGameSnapshot(newSnapshot);
      
      // Force re-render by incrementing counter
      setUpdateCounter(prev => prev + 1);
      console.log('[Umpire] Forcing re-render with updateCounter:', updateCounter + 1);
      
      // Persist to localStorage to survive hot reloads in development
      if (typeof window !== 'undefined') {
        localStorage.setItem(`game-snapshot-${gameId}`, JSON.stringify(realtimeSnapshot));
      }
    }
  }, [realtimeSnapshot, gameId]);

  // Restore state from localStorage on mount (for development HMR)
  useEffect(() => {
    if (typeof window !== 'undefined' && !gameSnapshot) {
      const stored = localStorage.getItem(`game-snapshot-${gameId}`);
      if (stored) {
        try {
          const parsedSnapshot = JSON.parse(stored);
          console.log('[Umpire] Restored snapshot from localStorage:', parsedSnapshot);
          setGameSnapshot(parsedSnapshot);
        } catch (err) {
          console.warn('[Umpire] Failed to restore snapshot from localStorage:', err);
        }
      }
    }
  }, [gameId, gameSnapshot]);

  // Manual refresh function for debugging
  const handleManualRefresh = async () => {
    console.log('[Umpire] Manual refresh triggered');
    try {
      const updatedSnapshot = await getGameSnapshot(gameId);
      if (updatedSnapshot) {
        console.log('[Umpire] Manual refresh got snapshot:', updatedSnapshot);
        setGameSnapshot(updatedSnapshot);
      }
    } catch (err) {
      console.error('[Umpire] Manual refresh failed:', err);
    }
  };

  // Handle game setup completion
  const handleGameStarted = (setupData: GameSetupData) => {
    setGameStarted(true);
    setUmpireId(setupData.umpire_id);
    // The real-time hook will pick up the updated snapshot
  };

  // Handle navigation back
  const handleBackToGame = () => {
    router.push(`/game/${gameId}`);
  };

  const handleCancel = () => {
    router.push('/');
  };

  // At-bat confirmation handlers
  const handleAtBatComplete = (result: AtBatResult) => {
    setPendingAtBatResult(result);
    setAtBatConfirmationOpen(true);
  };

  const handleAtBatConfirm = async (payload: AtBatEventPayload) => {
    const response = await umpireActions.handleAtBatComplete(payload);
    
    if (response?.success) {
      setAtBatConfirmationOpen(false);
      setPendingAtBatResult(null);
    }
  };

  const handleAtBatCancel = () => {
    setAtBatConfirmationOpen(false);
    setPendingAtBatResult(null);
  };

  const handleFlipCupResult = async (payload: FlipCupEventPayload) => {
    const response = await umpireActions.handleFlipCupResult(payload);
    return response;
  };

  // Event history handlers
  const handleUndo = async (payload: UndoEventPayload) => {
    await umpireActions.submitUndo(gameId, payload, umpireId);
  };

  const handleEdit = async (payload: EditEventPayload) => {
    await umpireActions.submitEdit(gameId, payload, umpireId);
  };

  const handleEndGame = async (payload: GameEndEventPayload) => {
    // TODO: Implement end game functionality
    console.log('End game payload:', payload);
    setEndGameModalOpen(false);
  };

  // Takeover handler
  const handleTakeover = async (payload: TakeoverEventPayload) => {
    await umpireActions.submitTakeover(gameId, payload, umpireId);
    // Update local umpire ID if takeover is successful
    setUmpireId(payload.new_umpire_id);
  };

  // Use real-time snapshot if available, otherwise fallback to initial snapshot
  const currentSnapshot = realtimeSnapshot || gameSnapshot;
  
  // Debug: Log what snapshot is being used for UI
  useEffect(() => {
    if (currentSnapshot) {
      console.log('[Umpire] Current snapshot for UI:', {
        source: realtimeSnapshot ? 'realtime' : 'local',
        score_home: currentSnapshot.score_home,
        score_away: currentSnapshot.score_away,
        outs: currentSnapshot.outs,
        timestamp: currentSnapshot.last_updated
      });
    }
  }, [currentSnapshot, realtimeSnapshot]);

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          textAlign: 'center',
          maxWidth: '300px',
          width: '100%'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>Loading umpire interface...</p>
        </div>
      </div>
    );
  }

  if (error && !currentSnapshot) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>⚠️</div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1c1b20',
            marginBottom: '0.5rem'
          }}>Error Loading Game</h1>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>{error}</p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              Retry
            </button>
            <button
              onClick={handleCancel}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1c1b20'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e4e2e8',
        position: 'sticky',
        top: '64px',
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={handleBackToGame}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ← Back to Game
              </button>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1c1b20'
              }}>
                Umpire Interface
              </h1>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <ConnectionStatus 
                status={connectionStatus} 
                onReconnect={async () => window.location.reload()}
                size="small"
              />
              <button
                onClick={handleManualRefresh}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                🔄 Refresh
              </button>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px'
              }}>
                Updates: {updateCounter}
              </div>
              {umpireId && (
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontWeight: '500'
                }}>
                  Umpire: {umpireId}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem 1rem'
      }}>
        {!gameStarted ? (
          /* Game Setup Phase */
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <GameSetup
              gameId={gameId}
              onGameStarted={handleGameStarted}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          /* Active Game Phase */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Error Messages */}
            {(hasError || umpireActions.state.lastError) && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '1rem',
                borderLeft: '4px solid #ef4444'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    color: '#ef4444',
                    fontSize: '1.25rem'
                  }}>⚠️</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#991b1b',
                      marginBottom: '0.25rem'
                    }}>
                      Connection Issues
                    </h3>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#b91c1c',
                      marginTop: '0.25rem'
                    }}>
                      {hasError && <p>Real-time: {connectionStatus.error}</p>}
                      {umpireActions.state.lastError && (
                        <p>Events: {umpireActions.state.lastError}</p>
                      )}
                    </div>
                    <div style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {umpireActions.hasPendingEvents && (
                        <button
                          onClick={umpireActions.retryFailedEvents}
                          disabled={umpireActions.state.submitting}
                          style={{
                            fontSize: '0.875rem',
                            backgroundColor: '#fef2f2',
                            color: '#991b1b',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            cursor: umpireActions.state.submitting ? 'not-allowed' : 'pointer',
                            opacity: umpireActions.state.submitting ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!umpireActions.state.submitting) {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!umpireActions.state.submitting) {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                            }
                          }}
                        >
                          Retry Events
                        </button>
                      )}
                      <button
                        onClick={umpireActions.clearError}
                        style={{
                          fontSize: '0.875rem',
                          color: '#dc2626',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Messages */}
            {umpireActions.state.lastSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1rem',
                borderLeft: '4px solid #22c55e'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      color: '#22c55e',
                      fontSize: '1.25rem'
                    }}>✓</div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#166534'
                    }}>Event recorded successfully</p>
                  </div>
                  <button
                    onClick={umpireActions.clearSuccess}
                    style={{
                      fontSize: '0.875rem',
                      color: '#16a34a',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Umpire Takeover Section */}
            <UmpireTakeover
              currentUmpireId={umpireId}
              gameId={gameId}
              onTakeover={handleTakeover}
              disabled={umpireActions.state.submitting}
            />

            {/* Main Game Interface */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Game State */}
              <div>
                <LiveGameState
                  key={`live-${updateCounter}-${currentSnapshot?.last_updated}`}
                  snapshot={currentSnapshot}
                  liveStatus={liveStatus}
                  connectionStatus={connectionStatus}
                />
              </div>

              {/* Controls */}
              <div>
                {currentSnapshot && (
                  <UmpireControls
                    key={`controls-${updateCounter}-${currentSnapshot?.last_updated}`}
                    gameSnapshot={currentSnapshot}
                    onPitchResult={umpireActions.handlePitchResult}
                    onFlipCupNeeded={(cupHit) => {
                      // Manually open the flip cup modal
                      umpireActions.openFlipCupModal(cupHit);
                    }}
                    onAtBatComplete={handleAtBatComplete}
                    onEndGame={() => setEndGameModalOpen(true)}
                    disabled={umpireActions.state.submitting}
                  />
                )}
              </div>

              {/* Event History */}
              <div>
                <EventHistory
                  key={`events-${updateCounter}-${events?.length || 0}`}
                  events={events || []}
                  onUndo={handleUndo}
                  onEdit={handleEdit}
                  disabled={umpireActions.state.submitting}
                  maxEvents={8}
                />
              </div>
            </div>

            {/* Pending Events Indicator */}
            {umpireActions.hasPendingEvents && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '1rem',
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      color: '#f59e0b',
                      fontSize: '1.25rem'
                    }}>⏳</div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#92400e'
                    }}>
                      {umpireActions.state.pendingEvents.length} event(s) pending submission
                    </p>
                  </div>
                  <button
                    onClick={umpireActions.retryFailedEvents}
                    disabled={umpireActions.state.submitting}
                    style={{
                      fontSize: '0.875rem',
                      backgroundColor: '#fffbeb',
                      color: '#92400e',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #fed7aa',
                      cursor: umpireActions.state.submitting ? 'not-allowed' : 'pointer',
                      opacity: umpireActions.state.submitting ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!umpireActions.state.submitting) {
                        e.currentTarget.style.backgroundColor = '#fef3c7';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!umpireActions.state.submitting) {
                        e.currentTarget.style.backgroundColor = '#fffbeb';
                      }
                    }}
                  >
                    {umpireActions.state.submitting ? 'Retrying...' : 'Retry Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flip Cup Modal */}
      {currentSnapshot && (
        <FlipCupModal
          isOpen={umpireActions.flipCupModalOpen}
          cupHit={umpireActions.pendingCupHit || 1}
          gameSnapshot={currentSnapshot}
          onResult={handleFlipCupResult}
          onCancel={umpireActions.cancelFlipCup}
        />
      )}

      {/* At-Bat Confirmation Modal */}
      {currentSnapshot && pendingAtBatResult && (
        <AtBatConfirmation
          isOpen={atBatConfirmationOpen}
          atBatResult={pendingAtBatResult}
          gameSnapshot={currentSnapshot}
          onConfirm={handleAtBatConfirm}
          onCancel={handleAtBatCancel}
        />
      )}

      {/* End Game Modal */}
      {currentSnapshot && (
        <EndGameModal
          isOpen={endGameModalOpen}
          gameSnapshot={currentSnapshot}
          onConfirm={handleEndGame}
          onCancel={() => setEndGameModalOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 