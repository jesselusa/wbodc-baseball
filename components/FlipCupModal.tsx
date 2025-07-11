import React, { useState } from 'react';
import { FlipCupEventPayload, FlipCupResult, GameSnapshot } from '../lib/types';

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
    onCancel();
  };

  // Get available players for error tracking (fielding team)
  const fieldingLineup = gameSnapshot.is_top_of_inning 
    ? gameSnapshot.home_lineup 
    : gameSnapshot.away_lineup;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Flip Cup Result</h2>
          <p className="text-sm text-gray-600 mt-1">
            {cupHitLabels[cupHit]} attempt - Who won the flip cup?
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Cup Hit Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Cup Hit Details</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Potential Result:</strong> {cupHitLabels[cupHit]}</p>
              <p><strong>Batter:</strong> {gameSnapshot.batter_id || 'Unknown'}</p>
              <p><strong>Catcher:</strong> {gameSnapshot.catcher_id || 'Unknown'}</p>
            </div>
          </div>

          {/* Result Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Flip Cup Winner</h3>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedResult('offense wins')}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all duration-200
                  ${selectedResult === 'offense wins'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="text-center">
                  <div className="font-semibold">Offense Wins</div>
                  <div className="text-sm mt-1">
                    Batter gets {cupHitLabels[cupHit].toLowerCase()}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedResult('defense wins')}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all duration-200
                  ${selectedResult === 'defense wins'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="text-center">
                  <div className="font-semibold">Defense Wins</div>
                  <div className="text-sm mt-1">
                    Batter is out
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Error Tracking (optional) */}
          {selectedResult === 'offense wins' && fieldingLineup.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Fielding Errors (Optional)
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Select any fielders who made errors during the play
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {fieldingLineup.map((playerId) => (
                  <label
                    key={playerId}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedErrors.includes(playerId)}
                      onChange={() => handleErrorToggle(playerId)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">
                      Player {playerId}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Game Rules Reminder */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">Flip Cup Rules</h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>• Offense wins = Batter gets the base hit</p>
              <p>• Defense wins = Batter is out</p>
              <p>• Errors can be tracked for statistics</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!selectedResult || submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500"
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