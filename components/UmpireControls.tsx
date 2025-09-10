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
  onTriggerAtBatModal: (result: AtBatResult) => void;
  onEndGame: () => void;
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
  onTriggerAtBatModal,
  onEndGame,
  disabled = false,
  className = ''
}: UmpireControlsProps) {
  const [lastPitchResult, setLastPitchResult] = useState<PitchResult | null>(null);

  // Helper to determine if a count would result in a walk or strikeout
  const wouldBeWalk = gameSnapshot.balls >= 3;
  const wouldBeStrikeout = gameSnapshot.strikes >= 2;

  const handlePitchResult = (result: PitchResult, cupHit?: 1 | 2 | 3 | 4) => {
    // Check if this ball would result in a walk - trigger confirmation instead of direct submission
    if (result === 'ball' && wouldBeWalk) {
      setLastPitchResult('ball'); // For UI display
      onTriggerAtBatModal('walk'); // This will trigger the confirmation modal
      return;
    }
    
    // Check if this strike would result in a strikeout - trigger confirmation instead of direct submission
    if (result === 'strike' && wouldBeStrikeout) {
      setLastPitchResult('strike'); // For UI display
      onTriggerAtBatModal('out'); // This will trigger the confirmation modal
      return;
    }
    
    // Check if this foul ball would result in a strikeout (unique baseball rule)
    if (result === 'foul ball' && wouldBeStrikeout) {
      setLastPitchResult('foul ball'); // For UI display
      onTriggerAtBatModal('out'); // This will trigger the confirmation modal
      return;
    }
    
    // Check if this pitch is a cup hit (requires flip cup modal first)
    if (['first cup hit', 'second cup hit', 'third cup hit', 'fourth cup hit'].includes(result)) {
      // Cup hits need to submit the pitch event first, then trigger flip cup modal
      setLastPitchResult(result);
      
      // Submit the pitch event immediately so flip cup logic can reference it
      const payload: PitchEventPayload = {
        result,
        batter_id: gameSnapshot.batter_id || '',
        catcher_id: gameSnapshot.catcher_id || ''
      };
      onPitchResult(payload);
      
      // Then trigger flip cup modal
      if (cupHit) {
        onFlipCupNeeded(cupHit);
      }
      return;
    }

    // Regular pitch event (not walk, strikeout, or cup hit)
    const payload: PitchEventPayload = {
      result,
      batter_id: gameSnapshot.batter_id || '',
      catcher_id: gameSnapshot.catcher_id || ''
    };

    setLastPitchResult(result);
    onPitchResult(payload);
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
        padding: '1.5rem',
        borderBottom: '1px solid #e4e2e8',
        background: '#fafafa'
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#1c1b20',
          marginBottom: '0.25rem'
        }}>Pitch Results</h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          Record the result of each pitch
        </p>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Current Count Display */}
        <div style={{
          background: '#f9fafb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              }}>Current Count</h3>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1c1b20',
                marginTop: '0.25rem'
              }}>
                {gameSnapshot.balls}-{gameSnapshot.strikes}
              </div>
            </div>
            
            {/* Last Pitch Result Indicator */}
            {lastPitchResult && (
              <div style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Last: {lastPitchResult}
              </div>
            )}
          </div>
        </div>

        {/* Pitch Result Buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.75rem'
          }}>Pitch Result</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => handlePitchResult('strike')}
              disabled={disabled}
              style={{
                padding: '0.75rem',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                fontSize: '0.875rem'
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
              Strike
            </button>
            
            <button
              onClick={() => handlePitchResult('ball')}
              disabled={disabled}
              style={{
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                fontSize: '0.875rem'
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
              Ball
            </button>
            
            <button
              onClick={() => handlePitchResult('foul ball')}
              disabled={disabled}
              style={{
                padding: '0.75rem',
                backgroundColor: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#7c3aed';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#8b5cf6';
                }
              }}
            >
              Foul
            </button>
          </div>
        </div>

        {/* Cup Hit Buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.75rem'
          }}>Cup Hits</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '0.5rem'
          }}>
            {[1, 2, 3, 4].map((cupNumber) => {
              const cupResult = cupNumber === 1 ? 'first cup hit' :
                              cupNumber === 2 ? 'second cup hit' :
                              cupNumber === 3 ? 'third cup hit' : 'fourth cup hit';
              const cupLabel = cupNumber === 1 ? 'Single' :
                              cupNumber === 2 ? 'Double' :
                              cupNumber === 3 ? 'Triple' : 'Home Run';
              return (
                <button
                  key={cupNumber}
                  onClick={() => handlePitchResult(cupResult as PitchResult, cupNumber as 1 | 2 | 3 | 4)}
                  disabled={disabled}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.2s',
                    fontSize: '0.875rem'
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
                  {cupLabel}
                </button>
              );
            })}
          </div>
        </div>


        {/* End Game */}
        <div style={{ 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e4e2e8'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.75rem'
          }}>Game Control</h3>
          
          <button
            onClick={onEndGame}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: disabled ? '#f3f4f6' : '#dc2626',
              color: disabled ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }
            }}
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
} 