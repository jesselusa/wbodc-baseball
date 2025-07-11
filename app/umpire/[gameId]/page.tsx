'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameSetup } from '../../../components/GameSetup';
import { UmpireControls } from '../../../components/UmpireControls';
import { LiveGameState } from '../../../components/LiveGameState';
import { FlipCupModal } from '../../../components/FlipCupModal';
import { AtBatConfirmation } from '../../../components/AtBatConfirmation';
import { EventHistory } from '../../../components/EventHistory';
import { UmpireTakeover } from '../../../components/UmpireTakeover';
import { ConnectionStatus } from '../../../components/ConnectionStatus';
import { useGameEvents } from '../../../hooks/useGameEvents';
import { usePitchByPitchScoring } from '../../../hooks/useUmpireActions';
import { GameSnapshot, GameSetupData, LiveGameStatus, AtBatResult, AtBatEventPayload, UndoEventPayload, EditEventPayload, TakeoverEventPayload } from '../../../lib/types';
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
      console.log('[UmpirePage] Real-time snapshot updated:', {
        batter_id: realtimeSnapshot.batter_id,
        catcher_id: realtimeSnapshot.catcher_id,
        status: realtimeSnapshot.status,
        balls: realtimeSnapshot.balls,
        strikes: realtimeSnapshot.strikes,
        last_updated: realtimeSnapshot.last_updated
      });
      setGameSnapshot(realtimeSnapshot);
    }
  }, [realtimeSnapshot]);

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
    await umpireActions.handleAtBatComplete(payload);
    setAtBatConfirmationOpen(false);
    setPendingAtBatResult(null);
  };

  const handleAtBatCancel = () => {
    setAtBatConfirmationOpen(false);
    setPendingAtBatResult(null);
  };

  // Event history handlers
  const handleUndo = async (payload: UndoEventPayload) => {
    await umpireActions.submitUndo(gameId, payload, umpireId);
  };

  const handleEdit = async (payload: EditEventPayload) => {
    await umpireActions.submitEdit(gameId, payload, umpireId);
  };

  // Takeover handler
  const handleTakeover = async (payload: TakeoverEventPayload) => {
    await umpireActions.submitTakeover(gameId, payload, umpireId);
    // Update local umpire ID if takeover is successful
    setUmpireId(payload.new_umpire_id);
  };

  // Use real-time snapshot if available, otherwise fallback to initial snapshot
  const currentSnapshot = realtimeSnapshot || gameSnapshot;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading umpire interface...</p>
        </div>
      </div>
    );
  }

  if (error && !currentSnapshot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Game</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToGame}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Game
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                Umpire Interface
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ConnectionStatus 
                status={connectionStatus} 
                onReconnect={async () => window.location.reload()}
                size="small"
              />
              {umpireId && (
                <span className="text-sm text-gray-600">
                  Umpire: {umpireId}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!gameStarted ? (
          /* Game Setup Phase */
          <div className="max-w-4xl mx-auto">
            <GameSetup
              gameId={gameId}
              onGameStarted={handleGameStarted}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          /* Active Game Phase */
          <div className="space-y-6">
            {/* Error Messages */}
            {(hasError || umpireActions.state.lastError) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <div className="text-red-400 text-lg mr-3">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Connection Issues
                    </h3>
                    <div className="text-sm text-red-700 mt-1 space-y-1">
                      {hasError && <p>Real-time: {connectionStatus.error}</p>}
                      {umpireActions.state.lastError && (
                        <p>Events: {umpireActions.state.lastError}</p>
                      )}
                    </div>
                    <div className="mt-3 flex space-x-2">
                      {umpireActions.hasPendingEvents && (
                        <button
                          onClick={umpireActions.retryFailedEvents}
                          disabled={umpireActions.state.submitting}
                          className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                        >
                          Retry Events
                        </button>
                      )}
                      <button
                        onClick={umpireActions.clearError}
                        className="text-sm text-red-600 hover:text-red-800"
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
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-green-400 text-lg mr-3">✓</div>
                    <p className="text-sm text-green-800">Event recorded successfully</p>
                  </div>
                  <button
                    onClick={umpireActions.clearSuccess}
                    className="text-sm text-green-600 hover:text-green-800"
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
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Game State */}
              <div className="space-y-6">
                <LiveGameState
                  snapshot={currentSnapshot}
                  liveStatus={liveStatus}
                  connectionStatus={connectionStatus}
                />
              </div>

              {/* Middle Column - Controls */}
              <div className="space-y-6">
                {currentSnapshot && (
                  <UmpireControls
                    gameSnapshot={currentSnapshot}
                    onPitchResult={umpireActions.handlePitchResult}
                    onFlipCupNeeded={(cupHit) => {
                      // This is handled automatically by the usePitchByPitchScoring hook
                    }}
                    onAtBatComplete={handleAtBatComplete}
                    disabled={umpireActions.state.submitting}
                  />
                )}
              </div>

              {/* Right Column - Event History */}
              <div className="space-y-6">
                <EventHistory
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-yellow-400 text-lg mr-3">⏳</div>
                    <p className="text-sm text-yellow-800">
                      {umpireActions.state.pendingEvents.length} event(s) pending submission
                    </p>
                  </div>
                  <button
                    onClick={umpireActions.retryFailedEvents}
                    disabled={umpireActions.state.submitting}
                    className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 disabled:opacity-50"
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
          onResult={umpireActions.handleFlipCupResult}
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
    </div>
  );
} 