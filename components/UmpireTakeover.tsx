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

  const handleTakeoverCancel = () => {
    setShowTakeoverDialog(false);
    setNewUmpireId('');
    setTakeoverReason('');
  };

  const selectedPlayerName = players.find(p => p.id === newUmpireId)?.name || '';

  return (
    <>
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Current Umpire</h3>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${currentUmpireId ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-lg font-semibold text-gray-900">
                {currentUmpireName || 'No umpire assigned'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Managing game {gameId}
            </p>
          </div>

          <button
            onClick={handleTakeoverClick}
            disabled={disabled}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title={currentUmpireId ? "Take over as umpire for this game" : "Become the umpire for this game"}
          >
            {currentUmpireId ? "Take Over" : "Become Umpire"}
          </button>
        </div>

        {!currentUmpireId && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start">
              <div className="text-yellow-400 text-lg mr-2">⚠️</div>
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>No Active Umpire</strong>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This game needs an umpire to manage scoring. Click "Become Umpire" to take control.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Takeover Confirmation Dialog */}
      {showTakeoverDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {currentUmpireId ? "Take Over as Umpire" : "Become Game Umpire"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentUmpireId 
                  ? "You are requesting to take over umpiring duties for this game"
                  : "You are requesting to become the umpire for this game"
                }
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Umpire Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Current Situation</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Game:</strong> {gameId}</p>
                  <p><strong>Current Umpire:</strong> {currentUmpireName || 'None'}</p>
                </div>
              </div>

              {/* New Umpire Selection */}
              <div>
                <label htmlFor="newUmpireId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Umpire <span className="text-red-500">*</span>
                </label>
                {playersLoading ? (
                  <div className="text-sm text-gray-500">Loading players...</div>
                ) : (
                  <select
                    id="newUmpireId"
                    value={newUmpireId}
                    onChange={(e) => setNewUmpireId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    disabled={submitting}
                  >
                    <option value="">Choose a player...</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Select the player who will become the new umpire for this game
                </p>
              </div>

              {/* Reason Input */}
              <div>
                <label htmlFor="takeoverReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  id="takeoverReason"
                  value={takeoverReason}
                  onChange={(e) => setTakeoverReason(e.target.value)}
                  placeholder="Why are you taking over? (e.g., original umpire unavailable)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={submitting}
                />
              </div>

              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex items-start">
                  <div className="text-orange-400 text-lg mr-3">⚠️</div>
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">Important</h3>
                    <div className="text-sm text-orange-700 mt-1 space-y-1">
                      <p>• <strong>{selectedPlayerName || 'Selected player'}</strong> will become the active umpire</p>
                      <p>• All future events will be recorded under their name</p>
                      <p>• This action will be logged in the game history</p>
                      {currentUmpireId && <p>• The previous umpire will be notified of the change</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
              <button
                onClick={handleTakeoverCancel}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleTakeoverConfirm}
                disabled={submitting || !newUmpireId.trim()}
                className="px-4 py-2 text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : (currentUmpireId ? 'Take Over' : 'Become Umpire')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 