import { useState, useEffect, useCallback } from 'react';
import { 
  GameSnapshot, 
  LiveGameStatus
} from '../lib/types';
import { ConnectionStatus } from '../lib/realtime';
import { useGameEvents } from './useGameEvents';

export interface UseViewerGameUpdatesOptions {
  gameId: string;
  autoConnect?: boolean; // Default: true
  onUpdate?: (snapshot: GameSnapshot) => void;
  onError?: (error: string) => void;
}

export interface UseViewerGameUpdatesReturn {
  // Current state
  gameSnapshot: GameSnapshot | null;
  connectionStatus: ConnectionStatus;
  
  // Actions
  reconnect: () => Promise<void>;
  
  // Status helpers
  isConnected: boolean;
  hasError: boolean;
  lastUpdateTime?: Date;
}

/**
 * React hook for viewers to get real-time game updates
 * Optimized for public viewing without authentication requirements
 * 
 * @param options Configuration options for the viewer subscription
 * @returns Object with current game state and connection controls
 */
export function useViewerGameUpdates(options: UseViewerGameUpdatesOptions): UseViewerGameUpdatesReturn {
  const {
    gameId,
    autoConnect = true,
    onUpdate,
    onError
  } = options;

  const [lastUpdateTime, setLastUpdateTime] = useState<Date>();

  // Use the existing useGameEvents hook with viewer-optimized filters
  const {
    snapshot,
    connectionStatus,
    isConnected,
    hasError,
    reconnect
  } = useGameEvents({
    gameId,
    autoConnect,
    onSnapshot: (snapshot) => {
      setLastUpdateTime(new Date());
      onUpdate?.(snapshot);
    },
    onError,
    filters: {
      granularity: 'summary', // Viewers get summary updates, not every pitch
      eventTypes: ['at_bat', 'flip_cup', 'game_start', 'game_end'] // Key events only
    }
  });

  return {
    // Current state
    gameSnapshot: snapshot,
    connectionStatus,
    
    // Actions
    reconnect,
    
    // Status helpers
    isConnected,
    hasError,
    lastUpdateTime
  };
}

/**
 * Simplified hook for just checking if a game is live
 */
export function useGameLiveStatus(gameId: string): {
  isLive: boolean;
  isConnected: boolean;
  hasError: boolean;
} {
  const { gameSnapshot, isConnected, hasError } = useViewerGameUpdates({
    gameId,
    autoConnect: true
  });

  const isLive = gameSnapshot?.status === 'in_progress';

  return {
    isLive,
    isConnected,
    hasError
  };
}

/**
 * Hook for getting live score updates for multiple games
 * Useful for dashboard/homepage views
 */
export function useMultiGameScores(gameIds: string[]): {
  scores: Map<string, { home: number; away: number; status: string }>;
  isConnected: boolean;
  hasError: boolean;
} {
  const [scores, setScores] = useState<Map<string, { home: number; away: number; status: string }>>(new Map());
  const [connectionStates, setConnectionStates] = useState<Map<string, { connected: boolean; hasError: boolean }>>(new Map());

  // Use a single effect to manage all game subscriptions
  useEffect(() => {
    const managers: Array<any> = [];
    const newConnectionStates = new Map<string, { connected: boolean; hasError: boolean }>();

    // Initialize connection states
    gameIds.forEach(gameId => {
      newConnectionStates.set(gameId, { connected: false, hasError: false });
    });
    setConnectionStates(newConnectionStates);

    // Create subscriptions for each game
    gameIds.forEach(gameId => {
      // Create a subscription using the realtime manager
      import('../lib/realtime').then(({ createGameSubscription }) => {
        const manager = createGameSubscription(gameId, {
          granularity: 'summary',
          includeSnapshots: true,
          includeEvents: false // Only need snapshots for scores
        });

        manager.subscribe({
          onSnapshot: (snapshot) => {
            // Update scores
            setScores(prev => {
              const newScores = new Map(prev);
              newScores.set(gameId, {
                home: snapshot.score_home,
                away: snapshot.score_away,
                status: snapshot.status
              });
              return newScores;
            });

            // Update connection state
            setConnectionStates(prev => {
              const newStates = new Map(prev);
              newStates.set(gameId, { connected: true, hasError: false });
              return newStates;
            });
          },
          onConnectionStatus: (status) => {
            // Update connection state
            setConnectionStates(prev => {
              const newStates = new Map(prev);
              newStates.set(gameId, { 
                connected: status.connected, 
                hasError: !!status.error 
              });
              return newStates;
            });
          }
        });

        managers.push(manager);
      });
    });

    // Cleanup function
    return () => {
      managers.forEach(manager => manager.unsubscribe());
    };
  }, [gameIds.join(',')]); // Use join to create stable dependency

  // Calculate global connection status
  const connectionValues = Array.from(connectionStates.values());
  const isConnected = connectionValues.some(state => state.connected);
  const hasError = connectionValues.some(state => state.hasError) && !isConnected;

  return {
    scores,
    isConnected,
    hasError
  };
} 