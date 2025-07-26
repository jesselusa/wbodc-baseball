import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DashboardRealtimeManager,
  ConnectionStatus,
  createDashboardSubscription 
} from '../lib/realtime';
import { 
  RealtimeDashboardUpdate,
  LiveGameStatus 
} from '../lib/types';

export interface UseDashboardUpdatesOptions {
  autoConnect?: boolean; // Default: true
  onGameUpdate?: (update: RealtimeDashboardUpdate) => void;
  onError?: (error: string) => void;
}

export interface UseDashboardUpdatesReturn {
  // Current state
  gameUpdates: Map<string, Partial<LiveGameStatus>>; // gameId -> latest status
  connectionStatus: ConnectionStatus;
  lastUpdate?: Date;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  clearUpdates: () => void;
  
  // Status helpers
  isConnected: boolean;
  hasError: boolean;
  
  // Utility functions
  getGameUpdate: (gameId: string) => Partial<LiveGameStatus> | undefined;
  hasGameUpdate: (gameId: string) => boolean;
}

/**
 * React hook for managing real-time dashboard updates across all games
 * 
 * @param options Configuration options for the subscription
 * @returns Object with current state and control functions
 */
export function useDashboardUpdates(options: UseDashboardUpdatesOptions = {}): UseDashboardUpdatesReturn {
  const {
    autoConnect = true,
    onGameUpdate,
    onError
  } = options;

  // State
  const [gameUpdates, setGameUpdates] = useState<Map<string, Partial<LiveGameStatus>>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false
  });
  const [lastUpdate, setLastUpdate] = useState<Date>();

  // Refs to maintain stable references
  const managerRef = useRef<DashboardRealtimeManager | null>(null);
  const isConnectingRef = useRef(false);

  // Create or get the manager instance
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = createDashboardSubscription();
    }
    return managerRef.current;
  }, []);

  // Handle game updates
  const handleGameUpdate = useCallback((update: RealtimeDashboardUpdate) => {
    setGameUpdates(prev => {
      const newMap = new Map(prev);
      
      // Merge the update with existing data for this game
      const existingData = newMap.get(update.game_id) || {};
      const mergedData = { ...existingData, ...update.data };
      
      newMap.set(update.game_id, mergedData);
      return newMap;
    });
    
    setLastUpdate(new Date());
    
    // Call user-provided handler
    onGameUpdate?.(update);
  }, [onGameUpdate]);

  // Handle connection status changes
  const handleConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    
    if (status.error) {
      onError?.(status.error);
    }
  }, [onError]);

  // Connect function
  const connect = useCallback(async () => {
    if (isConnectingRef.current) {
      return; // Already connecting
    }

    try {
      isConnectingRef.current = true;
      const manager = getManager();
      
      await manager.subscribe({
        onGameUpdate: handleGameUpdate,
        onConnectionStatus: handleConnectionStatus
      });
    } catch (error) {
      console.error('Error connecting to dashboard updates:', error);
      onError?.(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      isConnectingRef.current = false;
    }
  }, [handleGameUpdate, handleConnectionStatus, onError, getManager]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.unsubscribe();
      managerRef.current = null;
    }
    
    setConnectionStatus({
      connected: false,
      reconnecting: false
    });
  }, []);

  // Reconnect function
  const reconnect = useCallback(async () => {
    disconnect();
    await connect();
  }, [disconnect, connect]);

  // Clear updates function
  const clearUpdates = useCallback(() => {
    setGameUpdates(new Map());
    setLastUpdate(undefined);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      // Add a small delay to avoid conflicts with HMR during navigation
      const timeoutId = setTimeout(() => {
        connect();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect]); // Intentionally not including connect/disconnect to avoid loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.unsubscribe();
      }
    };
  }, []);

  // Utility functions
  const getGameUpdate = useCallback((gameId: string) => {
    return gameUpdates.get(gameId);
  }, [gameUpdates]);

  const hasGameUpdate = useCallback((gameId: string) => {
    return gameUpdates.has(gameId);
  }, [gameUpdates]);

  // Derived state
  const isConnected = connectionStatus.connected;
  const hasError = !!connectionStatus.error;

  return {
    // Current state
    gameUpdates,
    connectionStatus,
    lastUpdate,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    clearUpdates,
    
    // Status helpers
    isConnected,
    hasError,
    
    // Utility functions
    getGameUpdate,
    hasGameUpdate
  };
}

/**
 * Simplified hook for just monitoring connection status to dashboard updates
 */
export function useDashboardConnection(): {
  isConnected: boolean;
  hasError: boolean;
  reconnect: () => Promise<void>;
} {
  const { isConnected, hasError, reconnect } = useDashboardUpdates({
    autoConnect: true
  });

  return {
    isConnected,
    hasError,
    reconnect
  };
}

/**
 * Hook for listening to specific game updates from the dashboard stream
 */
export function useGameDashboardUpdates(
  gameId: string,
  onUpdate?: (gameData: Partial<LiveGameStatus>) => void
): {
  gameData: Partial<LiveGameStatus> | undefined;
  hasUpdate: boolean;
  isConnected: boolean;
} {
  const { gameUpdates, isConnected, getGameUpdate, hasGameUpdate } = useDashboardUpdates({
    autoConnect: true,
    onGameUpdate: (update) => {
      if (update.game_id === gameId && onUpdate) {
        onUpdate(update.data);
      }
    }
  });

  const gameData = getGameUpdate(gameId);
  const hasUpdate = hasGameUpdate(gameId);

  return {
    gameData,
    hasUpdate,
    isConnected
  };
} 