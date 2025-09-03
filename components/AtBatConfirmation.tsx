import React, { useState, useEffect } from 'react';
import { 
  AtBatEventPayload, 
  AtBatResult, 
  GameSnapshot, 
  BaseRunners,
  Player
} from '../lib/types';
import { fetchPlayers } from '../lib/api';

export interface AtBatConfirmationProps {
  isOpen: boolean;
  atBatResult: AtBatResult;
  gameSnapshot: GameSnapshot;
  onConfirm: (payload: AtBatEventPayload) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * AtBatConfirmation component for confirming at-bat results
 * Prompts umpire before submitting final at-bat outcomes
 */
export function AtBatConfirmation({
  isOpen,
  atBatResult,
  gameSnapshot,
  onConfirm,
  onCancel,
  className = ''
}: AtBatConfirmationProps) {
  const [submitting, setSubmitting] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  // Load players for name resolution
  useEffect(() => {
    if (isOpen && players.length === 0) {
      loadPlayers();
    }
  }, [isOpen, players.length]);

  const loadPlayers = async () => {
    try {
      const response = await fetchPlayers();
      if (response.success && response.data) {
        setPlayers(response.data);
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  // Helper function to get player name by ID
  const getPlayerName = (playerId: string | null): string => {
    if (!playerId) return 'Unknown';
    const player = players.find(p => p.id === playerId);
    return player?.name || playerId; // Fallback to ID if name not found
  };

  // Don't render if not open
  if (!isOpen) return null;

  const resultLabels: Record<AtBatResult, string> = {
    'out': 'Out',
    'walk': 'Walk',
    'single': 'Single',
    'double': 'Double', 
    'triple': 'Triple',
    'homerun': 'Home Run'
  };

  const resultDescriptions: Record<AtBatResult, string> = {
    'out': 'Batter is out, no runners advance',
    'walk': 'Batter walks to first base',
    'single': 'Batter reaches first base safely',
    'double': 'Batter reaches second base safely',
    'triple': 'Batter reaches third base safely',
    'homerun': 'Batter scores, all runners score'
  };

  const resultColors: Record<AtBatResult, string> = {
    'out': 'text-red-800 bg-red-100 border-red-300',
    'walk': 'text-blue-800 bg-blue-100 border-blue-300',
    'single': 'text-green-800 bg-green-100 border-green-300',
    'double': 'text-blue-800 bg-blue-100 border-blue-300',
    'triple': 'text-purple-800 bg-purple-100 border-purple-300',
    'homerun': 'text-yellow-800 bg-yellow-100 border-yellow-300'
  };

  // Calculate expected outcome
  const getExpectedOutcome = () => {
    const outcomes = [];
    
    // Current batter outcome
    if (atBatResult === 'out') {
      outcomes.push('Batter is out');
    } else if (atBatResult === 'walk') {
      outcomes.push('Batter walks to first base');
    } else {
      const bases = atBatResult === 'single' ? 1 :
                   atBatResult === 'double' ? 2 :
                   atBatResult === 'triple' ? 3 : 4;
      outcomes.push(`Batter advances to ${bases === 4 ? 'home (scores)' : getBaseName(bases)}`);
    }

    // Runner advancement
    if (atBatResult !== 'out') {
      const { first, second, third } = gameSnapshot.base_runners;
      const bases = atBatResult === 'single' ? 1 :
                   atBatResult === 'double' ? 2 :
                   atBatResult === 'triple' ? 3 : 4;

      if (third) {
        if (bases >= 1) outcomes.push('Runner on 3rd scores');
      }
      if (second) {
        if (bases >= 2) outcomes.push('Runner on 2nd scores');
        else if (bases === 1) outcomes.push('Runner on 2nd advances to 3rd');
      }
      if (first) {
        if (bases >= 3) outcomes.push('Runner on 1st scores');
        else if (bases === 2) outcomes.push('Runner on 1st advances to 3rd');
        else if (bases === 1) outcomes.push('Runner on 1st advances to 2nd');
      }
    }

    return outcomes;
  };

  const getBaseName = (base: number) => {
    switch (base) {
      case 1: return 'first base';
      case 2: return 'second base';
      case 3: return 'third base';
      default: return 'home';
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);

    const payload: AtBatEventPayload = {
      result: atBatResult,
      batter_id: gameSnapshot.batter_id || '',
      catcher_id: gameSnapshot.catcher_id || ''
    };

    onConfirm(payload);
    setSubmitting(false);
  };

  const expectedOutcomes = getExpectedOutcome();
  const isPositiveResult = !['out'].includes(atBatResult);

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
        maxWidth: '600px',
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
          }}>Confirm At-Bat Result</h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Review the at-bat outcome before recording
          </p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* At-Bat Result */}
          <div style={{
            borderRadius: '8px',
            padding: '1rem',
            border: '2px solid',
            borderColor: atBatResult === 'out' ? '#ef4444' :
                        ['single', 'walk'].includes(atBatResult) ? '#22c55e' :
                        atBatResult === 'double' ? '#3b82f6' :
                        atBatResult === 'triple' ? '#8b5cf6' : '#f59e0b',
            backgroundColor: atBatResult === 'out' ? '#fef2f2' :
                           ['single', 'walk'].includes(atBatResult) ? '#f0fdf4' :
                           atBatResult === 'double' ? '#eff6ff' :
                           atBatResult === 'triple' ? '#f3e8ff' : '#fffbeb',
            color: atBatResult === 'out' ? '#991b1b' :
                  ['single', 'walk'].includes(atBatResult) ? '#166534' :
                  atBatResult === 'double' ? '#1e40af' :
                  atBatResult === 'triple' ? '#7c3aed' : '#92400e',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '0.5rem'
            }}>
              {resultLabels[atBatResult]}
            </h3>
            <p style={{
              fontSize: '0.875rem'
            }}>
              {resultDescriptions[atBatResult]}
            </p>
          </div>

          {/* Current Situation */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>Current Situation</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <span style={{ color: '#6b7280' }}>Count:</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                  {gameSnapshot.balls}-{gameSnapshot.strikes}
                </span>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Outs:</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                  {gameSnapshot.outs}
                </span>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Inning:</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                  {gameSnapshot.is_top_of_inning ? 'Top' : 'Bottom'} {gameSnapshot.current_inning}
                </span>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Score:</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                  {gameSnapshot.score_away}-{gameSnapshot.score_home}
                </span>
              </div>
            </div>
          </div>

          {/* Base Runners */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>Runners on Base</h3>
            <BaseRunnersSummary runners={gameSnapshot.base_runners} getPlayerName={getPlayerName} />
          </div>

          {/* Expected Outcome */}
          <div style={{
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid',
            borderColor: isPositiveResult ? '#bbf7d0' : '#fecaca',
            backgroundColor: isPositiveResult ? '#f0fdf4' : '#fef2f2',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: isPositiveResult ? '#166534' : '#991b1b',
              marginBottom: '0.75rem'
            }}>
              Expected Outcome
            </h3>
            <ul style={{
              fontSize: '0.875rem',
              color: isPositiveResult ? '#15803d' : '#b91c1c',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              {expectedOutcomes.map((outcome, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>•</span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>

          {/* Player Info */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1e40af',
              marginBottom: '0.5rem'
            }}>At-Bat Details</h3>
            <div style={{
              fontSize: '0.875rem',
              color: '#1d4ed8',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <p><strong>Batter:</strong> {getPlayerName(gameSnapshot.batter_id)}</p>
              <p><strong>Catcher:</strong> {getPlayerName(gameSnapshot.catcher_id)}</p>
            </div>
          </div>
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
            onClick={onCancel}
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
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: submitting ? '#9ca3af' : (isPositiveResult ? '#22c55e' : '#ef4444'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.5 : 1,
              transition: 'background-color 0.2s',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = isPositiveResult ? '#16a34a' : '#dc2626';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = isPositiveResult ? '#22c55e' : '#ef4444';
              }
            }}
          >
            {submitting ? 'Recording...' : `Confirm ${resultLabels[atBatResult]}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// BaseRunnersSummary component for showing current runners
interface BaseRunnersSummaryProps {
  runners: BaseRunners;
  getPlayerName: (playerId: string | null) => string;
}

function BaseRunnersSummary({ runners, getPlayerName }: BaseRunnersSummaryProps) {
  const hasRunners = runners.first || runners.second || runners.third;

  if (!hasRunners) {
    return (
      <div style={{
        fontSize: '0.875rem',
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        No runners on base
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      fontSize: '0.875rem',
      flexWrap: 'wrap'
    }}>
      {runners.first && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <div style={{
            width: '0.75rem',
            height: '0.75rem',
            backgroundColor: '#3b82f6',
            borderRadius: '50%'
          }}></div>
          <span>1st: {getPlayerName(runners.first)}</span>
        </div>
      )}
      {runners.second && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <div style={{
            width: '0.75rem',
            height: '0.75rem',
            backgroundColor: '#3b82f6',
            borderRadius: '50%'
          }}></div>
          <span>2nd: {getPlayerName(runners.second)}</span>
        </div>
      )}
      {runners.third && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <div style={{
            width: '0.75rem',
            height: '0.75rem',
            backgroundColor: '#3b82f6',
            borderRadius: '50%'
          }}></div>
          <span>3rd: {getPlayerName(runners.third)}</span>
        </div>
      )}
    </div>
  );
} 