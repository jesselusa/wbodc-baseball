import React from 'react';
import { GameSnapshot, LiveGameStatus, BaseRunners } from '../lib/types';

export interface LiveScoreboardProps {
  gameSnapshot?: GameSnapshot | null;
  liveStatus?: LiveGameStatus | null;
  showDetailedState?: boolean; // Show count, runners, etc.
  className?: string;
}

/**
 * LiveScoreboard component for displaying current game state to viewers
 * Optimized for clean, focused live viewing experience
 */
export function LiveScoreboard({
  gameSnapshot,
  liveStatus,
  showDetailedState = true,
  className = ''
}: LiveScoreboardProps) {
  // Determine what data to use (prioritize gameSnapshot for real-time accuracy)
  const data = gameSnapshot || liveStatus;
  
  if (!data) {
    return (
      <div 
        className={className}
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e4e2e8',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '48px 24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚾</div>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: '0'
        }}>
          No game data available
        </p>
      </div>
    );
  }

  const isInProgress = data.status === 'in_progress';
  const homeTeamName = 'home_team_name' in data ? data.home_team_name : 'Home';
  const awayTeamName = 'away_team_name' in data ? data.away_team_name : 'Away';

  return (
    <div 
      className={className}
      style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e4e2e8',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header with game status */}
      <div className={`px-4 sm:px-6 py-3 text-center text-sm font-medium ${
        isInProgress ? 'bg-green-50 text-green-800 border-b border-green-200' : 'bg-gray-50 text-gray-700 border-b'
      }`}>
        {isInProgress ? (
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            LIVE
          </div>
        ) : (
          <span className="uppercase tracking-wide">{data.status.replace('_', ' ')}</span>
        )}
      </div>

      {/* Main scoreboard */}
      <div className="p-4 sm:p-6">
        {/* Team scores */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Away team */}
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
              {awayTeamName}
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900">
              {'score_away' in data ? data.score_away : 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">Away</div>
          </div>

          {/* Home team */}
          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
              {homeTeamName}
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900">
              {'score_home' in data ? data.score_home : 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">Home</div>
          </div>
        </div>

                 {/* Detailed game state (only for in-progress games) */}
         {isInProgress && showDetailedState && (
           <div className="border-t pt-4 sm:pt-6">
             <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                             {/* Inning */}
               <div>
                 <div className="text-xs sm:text-sm text-gray-500 mb-1">Inning</div>
                 <div className="text-base sm:text-lg font-semibold">
                   {data.is_top_of_inning ? '▲' : '▼'} {data.current_inning}
                 </div>
               </div>

               {/* Outs */}
               <div>
                 <div className="text-xs sm:text-sm text-gray-500 mb-1">Outs</div>
                 <div className="text-base sm:text-lg font-semibold">
                   {data.outs ?? 0}
                 </div>
               </div>

               {/* Count */}
               <div>
                 <div className="text-xs sm:text-sm text-gray-500 mb-1">Count</div>
                 <div className="text-base sm:text-lg font-semibold">
                   {data.balls ?? 0}-{data.strikes ?? 0}
                 </div>
               </div>
            </div>

                         {/* Base runners */}
             {'base_runners' in data && data.base_runners && (
               <div className="mt-4 sm:mt-6">
                 <div className="text-xs sm:text-sm text-gray-500 text-center mb-2 sm:mb-3">Base Runners</div>
                 <BaseRunnersDiamond runners={data.base_runners} size="small" />
               </div>
             )}

             {/* Current batter */}
             {('batter_name' in data && data.batter_name) && (
               <div className="mt-4 sm:mt-6 text-center">
                 <div className="text-xs sm:text-sm text-gray-500 mb-1">At Bat</div>
                 <div className="font-medium text-gray-900 text-sm sm:text-base truncate px-2">
                   {data.batter_name}
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

// Base runners diamond component
interface BaseRunnersDiamondProps {
  runners: BaseRunners;
  size?: 'small' | 'medium' | 'large';
}

function BaseRunnersDiamond({ runners, size = 'medium' }: BaseRunnersDiamondProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const baseSize = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <div className={`${sizeClasses[size]} mx-auto relative`}>
      {/* Home plate (bottom) */}
      <div 
        className={`${baseSize[size]} absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-sm`}
        title="Home"
      />

      {/* First base (right) */}
      <div 
        className={`${baseSize[size]} absolute right-0 top-1/2 transform -translate-y-1/2 ${
          runners.first ? 'bg-blue-500' : 'bg-gray-300'
        } rounded-sm`}
        title={runners.first ? `Runner: ${runners.first}` : 'First base'}
      />

      {/* Second base (top) */}
      <div 
        className={`${baseSize[size]} absolute top-0 left-1/2 transform -translate-x-1/2 ${
          runners.second ? 'bg-blue-500' : 'bg-gray-300'
        } rounded-sm`}
        title={runners.second ? `Runner: ${runners.second}` : 'Second base'}
      />

      {/* Third base (left) */}
      <div 
        className={`${baseSize[size]} absolute left-0 top-1/2 transform -translate-y-1/2 ${
          runners.third ? 'bg-blue-500' : 'bg-gray-300'
        } rounded-sm`}
        title={runners.third ? `Runner: ${runners.third}` : 'Third base'}
      />

      {/* Diamond lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <path
          d="M 50 90 L 90 50 L 50 10 L 10 50 Z"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          className="opacity-50"
        />
      </svg>
    </div>
  );
}

// Compact scoreboard variant for cards/lists
export interface CompactScoreboardProps {
  gameSnapshot?: GameSnapshot | null;
  liveStatus?: LiveGameStatus | null;
  className?: string;
}

export function CompactScoreboard({
  gameSnapshot,
  liveStatus,
  className = ''
}: CompactScoreboardProps) {
  const data = gameSnapshot || liveStatus;
  
  if (!data) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No score available
      </div>
    );
  }

  const isInProgress = data.status === 'in_progress';
  const homeTeamName = 'home_team_name' in data ? data.home_team_name : 'Home';
  const awayTeamName = 'away_team_name' in data ? data.away_team_name : 'Away';

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <div className="font-medium">{awayTeamName}</div>
          <div className="font-medium">{homeTeamName}</div>
        </div>
        <div className="text-lg font-bold">
          <div>{'score_away' in data ? data.score_away : 0}</div>
          <div>{'score_home' in data ? data.score_home : 0}</div>
        </div>
      </div>

      {isInProgress && (
        <div className="text-xs text-gray-500 text-right">
          <div>{data.is_top_of_inning ? '▲' : '▼'} {data.current_inning}</div>
          <div>{data.outs ?? 0} outs</div>
        </div>
      )}

      <div className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
        isInProgress 
          ? 'bg-green-100 text-green-800' 
          : data.status === 'completed'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-blue-100 text-blue-800'
      }`}>
        {isInProgress ? 'LIVE' : data.status.toUpperCase()}
      </div>
    </div>
  );
} 