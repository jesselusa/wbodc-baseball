'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameSetup } from '../../../components/GameSetup';
import { UmpireControls } from '../../../components/UmpireControls';
import { LiveGameState } from '../../../components/LiveGameState';
import { FlipCupModal } from '../../../components/FlipCupModal';
import { AtBatConfirmation } from '../../../components/AtBatConfirmation';
import { EndGameModal } from '../../../components/EndGameModal';
import { EndInningModal } from '../../../components/EndInningModal';
// QuickEndGameModal removed in favor of single End Game modal
import { EventHistory } from '../../../components/EventHistory';
import { UmpireTakeover } from '../../../components/UmpireTakeover';
import { ConnectionStatus } from '../../../components/ConnectionStatus';
import { useGameEvents } from '../../../hooks/useGameEvents';
import { usePitchByPitchScoring } from '../../../hooks/useUmpireActions';
import { GameSnapshot, GameSetupData, LiveGameStatus, AtBatResult, AtBatEventPayload, FlipCupEventPayload, UndoEventPayload, EditEventPayload, TakeoverEventPayload, GameEndEventPayload, InningEndEventPayload } from '../../../lib/types';
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
  const [endInningModalOpen, setEndInningModalOpen] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-renders
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());

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
      eventTypes: ['pitch', 'flip_cup', 'at_bat', 'game_start', 'game_end', 'inning_end']
    }
  });

  // Umpire actions hook
  const umpireActions = usePitchByPitchScoring(gameId, umpireId);

  // Auto-dismiss success message after 2 seconds
  useEffect(() => {
    if (umpireActions.state.lastSuccess) {
      const timer = setTimeout(() => {
        umpireActions.clearSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [umpireActions.state.lastSuccess, umpireActions]);

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
        base_runners: realtimeSnapshot.base_runners,
        umpire_id: realtimeSnapshot.umpire_id
      });
      
      // Force a fresh object to ensure React re-renders
      const newSnapshot = { ...realtimeSnapshot };
      console.log('[Umpire] Setting new snapshot state:', newSnapshot);
      setGameSnapshot(newSnapshot);
      
      // Update umpire ID if it changed
      if (realtimeSnapshot.umpire_id && realtimeSnapshot.umpire_id !== umpireId) {
        console.log('[Umpire] Updating umpire ID from snapshot:', realtimeSnapshot.umpire_id);
        setUmpireId(realtimeSnapshot.umpire_id);
      }
      
      // Update liveStatus to refresh player names when game state changes
      const refreshLiveStatus = async () => {
        try {
          console.log('[Umpire] Refreshing liveStatus for updated player names...');
          const updatedLiveStatus = await getLiveGameStatus(gameId);
          if (updatedLiveStatus) {
            console.log('[Umpire] Updated liveStatus:', {
              batter_name: updatedLiveStatus.batter_name,
              catcher_name: updatedLiveStatus.catcher_name,
              away_lineup_position: realtimeSnapshot.away_lineup_position
            });
            setLiveStatus(updatedLiveStatus);
          }
        } catch (err) {
          console.warn('[Umpire] Failed to refresh liveStatus:', err);
        }
      };
      
      refreshLiveStatus();
      
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
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          type: 'undo',
          payload,
          umpire_id: umpireId
        })
      });
      const json = await res.json();
      if (!json?.success) {
        console.error('[UmpirePage] Undo failed:', json?.error);
      } else {
        // Locally hide the undone event from the feed immediately
        setHiddenEventIds(prev => new Set(prev).add(payload.target_event_id));
      }
    } catch (e) {
      console.error('[UmpirePage] Undo threw:', e);
    }
  };

  const handleEdit = async (payload: EditEventPayload) => {
    await umpireActions.submitEdit(gameId, payload, umpireId);
  };

  const handleEndGame = async (payload: GameEndEventPayload) => {
    // Determine if this is a quick-result (allow overriding scores)
    const isQuickResult = currentSnapshot
      ? payload.final_score_home !== currentSnapshot.score_home || payload.final_score_away !== currentSnapshot.score_away
      : false;

    const finalPayload: GameEndEventPayload = {
      ...payload,
      scoring_method: isQuickResult ? 'quick_result' : 'live'
    };

    const response = await umpireActions.submitGameEnd(gameId, finalPayload, umpireId);
    if (response?.success) {
      setEndGameModalOpen(false);
      try {
        const [snapshotResponse, statusResponse] = await Promise.all([
          getGameSnapshot(gameId),
          getLiveGameStatus(gameId)
        ]);
        if (snapshotResponse) setGameSnapshot(snapshotResponse);
        if (statusResponse) setLiveStatus(statusResponse);
      } catch (e) {
        // non-fatal
      }
      router.push(`/game/${gameId}`);
    }
  };

  const handleEndInning = async (payload: InningEndEventPayload) => {
    const response = await umpireActions.submitInningEnd(gameId, payload, umpireId);
    if (response?.success) {
      setEndInningModalOpen(false);
      try {
        const [snapshotResponse, statusResponse] = await Promise.all([
          getGameSnapshot(gameId),
          getLiveGameStatus(gameId)
        ]);
        if (snapshotResponse) setGameSnapshot(snapshotResponse);
        if (statusResponse) setLiveStatus(statusResponse);
      } catch (e) {
        // non-fatal
      }
    }
  };

  // Use a single End Game modal; decide quick_result vs live at submit time

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
    <>
      <style jsx>{`
        @media (max-width: 1023px) {
          .umpire-grid {
            grid-template-columns: 1fr !important;
            grid-auto-rows: auto !important;
          }
        }
        @media (max-width: 640px) {
          .umpire-header-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
            height: auto !important;
            padding: 0.75rem 0 !important;
            gap: 0.75rem !important;
          }
          .umpire-header-left {
            width: 100%;
          }
          .umpire-header-right {
            width: 100%;
            justify-content: space-between !important;
          }
          .umpire-back-button {
            padding: 0.375rem 0.5rem !important;
            font-size: 0.875rem !important;
          }
          .umpire-title {
            font-size: 1.125rem !important;
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1c1b20'
      }}>
        {/* Header */}
        <div style={{
          background: '#fdfcfe',
          borderBottom: '1px solid #e4e2e8',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(10px)'
        }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div 
            className="umpire-header-inner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '56px',
              gap: '1rem'
            }}
          >
            <div 
              className="umpire-header-left"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <button
                onClick={handleBackToGame}
                className="umpire-back-button"
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
              <h1 
                className="umpire-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1c1b20'
                }}
              >
                Umpire Interface
              </h1>
            </div>
            
            <div 
              className="umpire-header-right"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <ConnectionStatus 
                status={connectionStatus} 
                onReconnect={async () => window.location.reload()}
                size="small"
              />
              <button
                onClick={handleManualRefresh}
                style={{
                  padding: '0.5rem 0.75rem',
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
                🔄
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem'
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
              gameSnapshot={gameSnapshot}
            />
          </div>
        ) : (
          /* Active Game Phase */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 56px - 2rem)', minHeight: 0 }}>
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

            {/* Success Messages - Fixed Position */}
            {umpireActions.state.lastSuccess && (
              <div style={{
                position: 'fixed',
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                borderLeft: '3px solid #22c55e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{
                  color: '#22c55e',
                  fontSize: '1rem'
                }}>✓</div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#166534',
                  margin: 0
                }}>Event recorded</p>
              </div>
            )}

            {/* Main Game Interface */}
            <div 
              className="umpire-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                minHeight: 0,
                overflow: 'hidden',
                gridAutoRows: 'minmax(0, 1fr)'
              }}
            >
              {/* Column 1: Game State */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <LiveGameState
                  key={`live-${updateCounter}-${currentSnapshot?.last_updated}`}
                  snapshot={currentSnapshot}
                  liveStatus={liveStatus}
                  connectionStatus={connectionStatus}
                />
              </div>

              {/* Column 2: Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {currentSnapshot && (
                  <UmpireControls
                    key={`controls-${updateCounter}-${currentSnapshot?.last_updated}`}
                    gameSnapshot={currentSnapshot}
                    onPitchResult={umpireActions.handlePitchResult}
                    onFlipCupNeeded={(cupHit) => {
                      // Manually open the flip cup modal
                      umpireActions.openFlipCupModal(cupHit);
                    }}
                    onTriggerAtBatModal={handleAtBatComplete}
                    onEndGame={() => setEndGameModalOpen(true)}
                    onEndInning={() => setEndInningModalOpen(true)}
                    disabled={umpireActions.state.submitting}
                  />
                )}
              </div>

              {/* Column 3: Umpire Management + Event History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, overflow: 'hidden' }}>
                {/* Umpire Takeover Section */}
                <UmpireTakeover
                  currentUmpireId={umpireId}
                  gameId={gameId}
                  onTakeover={handleTakeover}
                  disabled={umpireActions.state.submitting}
                />
                
                {/* Event History */}
                <div style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
                  <EventHistory
                    key={`events-${updateCounter}-${events?.length || 0}`}
                    events={(events || []).filter(e => !hiddenEventIds.has(e.id))}
                    onUndo={handleUndo}
                    onEdit={handleEdit}
                    disabled={umpireActions.state.submitting}
                    maxEvents={20}
                  />
                </div>
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
          homeTeamName={liveStatus?.home_team_name}
          awayTeamName={liveStatus?.away_team_name}
          onConfirm={handleEndGame}
          onCancel={() => setEndGameModalOpen(false)}
        />
      )}

      {/* End Inning Modal */}
      {currentSnapshot && (
        <EndInningModal
          isOpen={endInningModalOpen}
          gameSnapshot={currentSnapshot}
          homeTeamName={liveStatus?.home_team_name}
          awayTeamName={liveStatus?.away_team_name}
          onConfirm={handleEndInning}
          onCancel={() => setEndInningModalOpen(false)}
        />
      )}

      {/* Single End Game modal only (quick or live determined on submit) */}
      </div>
    </>
  );
} 