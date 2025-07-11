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
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No game state available</p>
        </div>
      </div>
    );
  }

  // Use liveStatus if available (has team/player names), otherwise snapshot
  const gameData = liveStatus || snapshot;
  if (!gameData) return null;

  // Debug logging for base runners
  console.log('[LiveGameState] Rendering with data:', {
    source: liveStatus ? 'liveStatus' : 'snapshot',
    base_runners: gameData.base_runners,
    snapshot_base_runners: snapshot?.base_runners,
    liveStatus_base_runners: liveStatus?.base_runners
  });

  const inningDisplay = gameData.is_top_of_inning ? 'Top' : 'Bottom';
  const inningOrdinal = getOrdinalNumber(gameData.current_inning);

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header with Connection Status */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Live Game State</h2>
        {connectionStatus && (
          <div className="flex items-center space-x-2">
            <ConnectionDot status={connectionStatus} size="small" />
            <span className="text-xs text-gray-600">
              {connectionStatus.connected ? 'Live' : 'Offline'}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Score */}
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Inning</h3>
            <div className="text-2xl font-bold text-gray-900">
              {inningDisplay} {inningOrdinal}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {gameData.outs} {gameData.outs === 1 ? 'out' : 'outs'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Count</h3>
            <div className="text-2xl font-bold text-gray-900">
              {gameData.balls}-{gameData.strikes}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Balls-Strikes
            </div>
          </div>
        </div>

        {/* Current Batter */}
        {(liveStatus?.batter_name || snapshot?.batter_id) && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Current Batter</h3>
            <div className="text-lg font-semibold text-blue-900">
              {liveStatus?.batter_name || `Player ${snapshot?.batter_id}`}
            </div>
            {liveStatus?.catcher_name && (
              <div className="text-sm text-blue-700 mt-1">
                Catcher: {liveStatus.catcher_name}
              </div>
            )}
          </div>
        )}

        {/* Base Runners */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Base Runners</h3>
          <BaseRunnersDiamond runners={gameData.base_runners} />
        </div>

        {/* Game Status */}
        {gameData.status && (
          <div className="text-center">
            <span className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${gameData.status === 'in_progress' 
                ? 'bg-green-100 text-green-800' 
                : gameData.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
              }
            `}>
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
    <div className={`
      rounded-lg p-4 border-2 transition-colors
      ${isActive 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 bg-gray-50'
      }
    `}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {label}
          </div>
          <div className={`
            text-sm font-medium mt-1 truncate
            ${isActive ? 'text-blue-900' : 'text-gray-900'}
          `}>
            {teamName}
          </div>
        </div>
        <div className={`
          text-3xl font-bold
          ${isActive ? 'text-blue-900' : 'text-gray-900'}
        `}>
          {score}
        </div>
      </div>
      {isActive && (
        <div className="mt-2 text-xs text-blue-700 font-medium">
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
  // Debug logging for base runners
  console.log('[BaseRunnersDiamond] Rendering with runners:', runners);
  
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Diamond background */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Diamond shape */}
        <path
          d="M100 20 L180 100 L100 180 L20 100 Z"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Home plate */}
        <circle cx="100" cy="180" r="8" fill="#6b7280" />
        
        {/* First base */}
        <rect x="172" y="92" width="16" height="16" fill={runners.first ? "#3b82f6" : "#e5e7eb"} />
        
        {/* Second base */}
        <rect x="92" y="12" width="16" height="16" fill={runners.second ? "#3b82f6" : "#e5e7eb"} />
        
        {/* Third base */}
        <rect x="12" y="92" width="16" height="16" fill={runners.third ? "#3b82f6" : "#e5e7eb"} />
        
        {/* Base labels */}
        <text x="188" y="108" fontSize="10" fill="#6b7280" textAnchor="middle">1B</text>
        <text x="100" y="8" fontSize="10" fill="#6b7280" textAnchor="middle">2B</text>
        <text x="12" y="108" fontSize="10" fill="#6b7280" textAnchor="middle">3B</text>
        <text x="100" y="198" fontSize="10" fill="#6b7280" textAnchor="middle">H</text>
      </svg>
      
      {/* Runner indicators */}
      {runners.first && (
        <div className="absolute top-20 right-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          1
        </div>
      )}
      {runners.second && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          2
        </div>
      )}
      {runners.third && (
        <div className="absolute top-20 left-2 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          3
        </div>
      )}
    </div>
  );
}

// Utility function to get ordinal numbers
function getOrdinalNumber(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
} 