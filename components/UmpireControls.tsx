import React, { useState } from 'react';
import { 
  PitchEventPayload, 
  PitchResult, 
  AtBatResult,
  GameSnapshot
} from '../lib/types';

export interface UmpireControlsProps {
  gameSnapshot: GameSnapshot;
  onPitchResult: (payload: PitchEventPayload) => void;
  onFlipCupNeeded: (cupHit: 1 | 2 | 3 | 4) => void;
  onAtBatComplete: (result: AtBatResult) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * UmpireControls component for recording pitch results and game events
 * Provides buttons for strikes, balls, fouls, and cup hits
 */
export function UmpireControls({
  gameSnapshot,
  onPitchResult,
  onFlipCupNeeded,
  onAtBatComplete,
  disabled = false,
  className = ''
}: UmpireControlsProps) {
  const [lastPitchResult, setLastPitchResult] = useState<PitchResult | null>(null);

  // Helper to determine if a count would result in a walk or strikeout
  const wouldBeWalk = gameSnapshot.balls >= 3;
  const wouldBeStrikeout = gameSnapshot.strikes >= 2;

  const handlePitchResult = (result: PitchResult, cupHit?: 1 | 2 | 3 | 4) => {
    console.log('[UmpireControls] Creating pitch event payload:');
    console.log('  - result:', result);
    console.log('  - batter_id:', gameSnapshot.batter_id);
    console.log('  - catcher_id:', gameSnapshot.catcher_id);
    console.log('  - gameSnapshot status:', gameSnapshot.status);
    console.log('  - current balls:', gameSnapshot.balls);
    console.log('  - wouldBeWalk:', wouldBeWalk);
    
    // Check if this ball would result in a walk - trigger confirmation instead of direct submission
    if (result === 'ball' && wouldBeWalk) {
      console.log('[UmpireControls] Ball would result in walk - triggering confirmation');
      setLastPitchResult('ball'); // For UI display
      onAtBatComplete('walk'); // This will trigger the confirmation modal
      return;
    }
    
    // Check if this strike would result in a strikeout - trigger confirmation instead of direct submission
    if (result === 'strike' && wouldBeStrikeout) {
      console.log('[UmpireControls] Strike would result in strikeout - triggering confirmation');
      setLastPitchResult('strike'); // For UI display
      onAtBatComplete('out'); // This will trigger the confirmation modal
      return;
    }
    
    // Regular pitch event (not walk or strikeout)
    const payload: PitchEventPayload = {
      result,
      batter_id: gameSnapshot.batter_id || '',
      catcher_id: gameSnapshot.catcher_id || ''
    };

    console.log('[UmpireControls] Final pitch payload:', payload);

    setLastPitchResult(result);
    onPitchResult(payload);

    // Check if this pitch completes the at-bat (cup hits)
    if (['first cup hit', 'second cup hit', 'third cup hit', 'fourth cup hit'].includes(result)) {
      // Cup hits require flip cup round first, then confirmation after flip cup completes
      if (cupHit) {
        onFlipCupNeeded(cupHit);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">Pitch Results</h2>
        <p className="text-sm text-gray-600">
          Record the result of each pitch
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Count Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Current Count</h3>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {gameSnapshot.balls}-{gameSnapshot.strikes}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {gameSnapshot.outs} {gameSnapshot.outs === 1 ? 'out' : 'outs'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {wouldBeWalk && 'Next ball = Walk'}
                {wouldBeStrikeout && 'Next strike = Strikeout'}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Pitch Results */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <PitchButton
              result="ball"
              label="Ball"
              description={wouldBeWalk ? "Walk!" : "Ball"}
              color="blue"
              onClick={() => handlePitchResult('ball')}
              disabled={disabled}
              variant={wouldBeWalk ? 'highlighted' : 'normal'}
            />
            
            <PitchButton
              result="strike"
              label="Strike"
              description={wouldBeStrikeout ? "Strikeout!" : "Strike"}
              color="red"
              onClick={() => handlePitchResult('strike')}
              disabled={disabled}
              variant={wouldBeStrikeout ? 'highlighted' : 'normal'}
            />
            
            <PitchButton
              result="foul ball"
              label="Foul"
              description="Foul ball"
              color="yellow"
              onClick={() => handlePitchResult('foul ball')}
              disabled={disabled}
              className="col-span-2"
            />
          </div>
        </div>

        {/* Cup Hits */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Cup Hits</h3>
          <div className="grid grid-cols-2 gap-3">
            <CupHitButton
              cupHit={1}
              label="Single"
              description="1 cup hit"
              onClick={() => handlePitchResult('first cup hit', 1)}
              disabled={disabled}
            />
            
            <CupHitButton
              cupHit={2}
              label="Double"
              description="2 cups hit"
              onClick={() => handlePitchResult('second cup hit', 2)}
              disabled={disabled}
            />
            
            <CupHitButton
              cupHit={3}
              label="Triple"
              description="3 cups hit"
              onClick={() => handlePitchResult('third cup hit', 3)}
              disabled={disabled}
            />
            
            <CupHitButton
              cupHit={4}
              label="Home Run"
              description="4 cups hit"
              onClick={() => handlePitchResult('fourth cup hit', 4)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Last Pitch Result */}
        {lastPitchResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Last pitch:</strong> {formatPitchResult(lastPitchResult)}
            </p>
          </div>
        )}

        {/* Game State Warnings */}
        {gameSnapshot.status !== 'in_progress' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Game is not in progress. 
              Status: {gameSnapshot.status.replace('_', ' ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// PitchButton component for basic pitch results
interface PitchButtonProps {
  result: PitchResult;
  label: string;
  description: string;
  color: 'blue' | 'red' | 'yellow' | 'green';
  onClick: () => void;
  disabled?: boolean;
  variant?: 'normal' | 'highlighted';
  className?: string;
}

function PitchButton({
  result,
  label,
  description,
  color,
  onClick,
  disabled = false,
  variant = 'normal',
  className = ''
}: PitchButtonProps) {
  const baseClasses = "p-4 rounded-lg font-medium transition-all duration-200 focus:ring-4 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const colorClasses = {
    blue: variant === 'highlighted' 
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 border-2 border-blue-400" 
      : "bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-300 border border-blue-300",
    red: variant === 'highlighted'
      ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300 border-2 border-red-400"
      : "bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-300 border border-red-300",
    yellow: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-300 border border-yellow-300",
    green: "bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-300 border border-green-300"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses[color]} ${className}`}
    >
      <div className="text-center">
        <div className="text-lg font-bold">{label}</div>
        <div className="text-sm mt-1">{description}</div>
      </div>
    </button>
  );
}

// CupHitButton component for cup hits
interface CupHitButtonProps {
  cupHit: 1 | 2 | 3 | 4;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

function CupHitButton({
  cupHit,
  label,
  description,
  onClick,
  disabled = false
}: CupHitButtonProps) {
  const cupColors = {
    1: "bg-green-100 text-green-800 hover:bg-green-200 border-green-300",
    2: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300",
    3: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300",
    4: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-lg font-medium transition-all duration-200 
        focus:ring-4 focus:outline-none border
        disabled:opacity-50 disabled:cursor-not-allowed
        ${cupColors[cupHit]}
      `}
    >
      <div className="text-center">
        <div className="text-lg font-bold">{label}</div>
        <div className="text-sm mt-1">{description}</div>
        <div className="text-xs mt-1 opacity-75">
          → Flip Cup Required
        </div>
      </div>
    </button>
  );
}

// Utility function to format pitch results for display
function formatPitchResult(result: PitchResult): string {
  switch (result) {
    case 'ball': return 'Ball';
    case 'strike': return 'Strike';
    case 'foul ball': return 'Foul Ball';
    case 'first cup hit': return 'Single (Cup Hit)';
    case 'second cup hit': return 'Double (Cup Hit)';
    case 'third cup hit': return 'Triple (Cup Hit)';
    case 'fourth cup hit': return 'Home Run (Cup Hit)';
    default: return result;
  }
} 