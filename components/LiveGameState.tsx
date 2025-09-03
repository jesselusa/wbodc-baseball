import React from 'react';
import { GameSnapshot, LiveGameStatus } from '../lib/types';
import { ConnectionStatus as ConnectionStatusType } from '../lib/realtime';
import { ConnectionDot } from './ConnectionStatus';

export interface LiveGameStateProps {
  snapshot?: GameSnapshot | null;
  liveStatus?: LiveGameStatus | null;
  connectionStatus?: ConnectionStatusType;
  className?: string;
}

/**
 * LiveGameState component showing current game state for umpires
 * Displays score, count, runners, inning, and batter information
 */
export function LiveGameState({ 
  snapshot, 
  liveStatus, 
  connectionStatus,
  className = '' 
}: LiveGameStateProps) {
  if (!snapshot && !liveStatus) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.5rem',
        textAlign: 'center'
      }} className={className}>
        <div style={{
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <p>No game state available</p>
        </div>
      </div>
    );
  }

  // Use liveStatus if available (has team/player names), otherwise snapshot
  const gameData = liveStatus || snapshot;
  if (!gameData) return null;

  const inningDisplay = gameData.is_top_of_inning ? 'Top' : 'Bottom';
  const inningOrdinal = getOrdinalNumber(gameData.current_inning);

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden'
    }} className={className}>
      {/* Header with Connection Status */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e4e2e8',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: '#1c1b20'
        }}>Live Game State</h2>
        {connectionStatus && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ConnectionDot status={connectionStatus} size="small" />
            <span style={{
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              {connectionStatus.connected ? 'Live' : 'Offline'}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Score */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <ScoreCard 
            label="Away"
            teamName={liveStatus?.away_team_name || 'Away Team'}
            score={gameData.score_away}
            isActive={gameData.is_top_of_inning}
          />
          <ScoreCard 
            label="Home"
            teamName={liveStatus?.home_team_name || 'Home Team'}
            score={gameData.score_home}
            isActive={!gameData.is_top_of_inning}
          />
        </div>

        {/* Inning and Count */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>Inning</h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1c1b20'
            }}>
              {inningDisplay} {inningOrdinal}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              {gameData.outs} {gameData.outs === 1 ? 'out' : 'outs'}
            </div>
          </div>

          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>Count</h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1c1b20'
            }}>
              {gameData.balls}-{gameData.strikes}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              Balls-Strikes
            </div>
          </div>
        </div>

        {/* Current Batter */}
        {(liveStatus?.batter_name || snapshot?.batter_id) && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#1d4ed8',
              marginBottom: '0.5rem'
            }}>Current Batter</h3>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e40af'
            }}>
              {liveStatus?.batter_name || `Player ${snapshot?.batter_id}`}
            </div>
            {liveStatus?.catcher_name && (
              <div style={{
                fontSize: '0.875rem',
                color: '#1d4ed8',
                marginTop: '0.25rem'
              }}>
                Catcher: {liveStatus.catcher_name}
              </div>
            )}
          </div>
        )}

        {/* Base Runners */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6b7280',
            marginBottom: '0.75rem'
          }}>Base Runners</h3>
          <BaseRunnersDiamond runners={gameData.base_runners} />
        </div>

        {/* Game Status */}
        {gameData.status && (
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: gameData.status === 'in_progress' 
                ? '#dcfce7' 
                : gameData.status === 'completed'
                ? '#f3f4f6'
                : '#fef3c7',
              color: gameData.status === 'in_progress' 
                ? '#166534' 
                : gameData.status === 'completed'
                ? '#374151'
                : '#92400e'
            }}>
              {gameData.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ScoreCard component for team scores
interface ScoreCardProps {
  label: string;
  teamName: string;
  score: number;
  isActive: boolean;
}

function ScoreCard({ label, teamName, score, isActive }: ScoreCardProps) {
  return (
    <div style={{
      borderRadius: '8px',
      padding: '1rem',
      border: `2px solid ${isActive ? '#3b82f6' : '#e5e7eb'}`,
      backgroundColor: isActive ? '#eff6ff' : '#f9fafb',
      transition: 'all 0.2s'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            marginTop: '0.25rem',
            color: isActive ? '#1e40af' : '#374151',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px'
          }}>
            {teamName}
          </div>
        </div>
        <div style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          color: isActive ? '#1e40af' : '#374151'
        }}>
          {score}
        </div>
      </div>
      {isActive && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#1d4ed8',
          fontWeight: '500'
        }}>
          BATTING
        </div>
      )}
    </div>
  );
}

// BaseRunnersDiamond component
interface BaseRunnersProps {
  runners: {
    first: string | null;
    second: string | null;
    third: string | null;
  };
}

function BaseRunnersDiamond({ runners }: BaseRunnersProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      {/* Second Base (Top) */}
      <div style={{
        width: '60px',
        height: '40px',
        background: runners.second ? '#10b981' : '#f3f4f6',
        border: `2px solid ${runners.second ? '#059669' : '#d1d5db'}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: runners.second ? '#ffffff' : '#6b7280'
      }}>
        {runners.second ? '2B' : '2'}
      </div>
      
      {/* Third and First Base (Middle Row) - Third base on left, First base on right */}
      <div style={{
        display: 'flex',
        gap: '2rem'
      }}>
        <div style={{
          width: '60px',
          height: '40px',
          background: runners.third ? '#10b981' : '#f3f4f6',
          border: `2px solid ${runners.third ? '#059669' : '#d1d5db'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: runners.third ? '#ffffff' : '#6b7280'
        }}>
          {runners.third ? '3B' : '3'}
        </div>
        
        <div style={{
          width: '60px',
          height: '40px',
          background: runners.first ? '#10b981' : '#f3f4f6',
          border: `2px solid ${runners.first ? '#059669' : '#d1d5db'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: runners.first ? '#ffffff' : '#6b7280'
        }}>
          {runners.first ? '1B' : '1'}
        </div>
      </div>
      
      {/* Home Plate (Bottom) */}
      <div style={{
        width: '60px',
        height: '40px',
        background: '#f3f4f6',
        border: '2px solid #d1d5db',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#6b7280'
      }}>
        HOME
      </div>
    </div>
  );
}

// Utility function to get ordinal numbers
function getOrdinalNumber(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return num + "st";
  }
  if (j === 2 && k !== 12) {
    return num + "nd";
  }
  if (j === 3 && k !== 13) {
    return num + "rd";
  }
  return num + "th";
} 