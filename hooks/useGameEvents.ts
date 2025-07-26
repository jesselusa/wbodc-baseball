import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameRealtimeManager, 
  ConnectionStatus,
  SubscriptionFilters,
  createGameSubscription 
} from '../lib/realtime';
import { 
  GameSnapshot, 
  GameEvent, 
  RealtimeGameUpdate 
} from '../lib/types';

export interface UseGameEventsOptions {
  gameId: string;
  autoConnect?: boolean; // Default: true
  onEvent?: (event: GameEvent) => void;
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onError?: (error: string) => void;
  filters?: SubscriptionFilters; // Subscription filtering options
}

export interface UseGameEventsReturn {
  // Current state
  snapshot: GameSnapshot | null;
  events: GameEvent[];
  connectionStatus: ConnectionStatus;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  
  // Status helpers
  isConnected: boolean;
  isReconnecting: boolean;
  hasError: boolean;
}

/**
 * React hook for managing real-time game event subscriptions
 * 
 * @param options Configuration options for the subscription
 * @returns Object with current state and control functions
 */
export function useGameEvents(options: UseGameEventsOptions): UseGameEventsReturn {
  const {
    gameId,
    autoConnect = true,
    onEvent,
    onSnapshot,
    onError,
    filters
  } = options;

  // State
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false
  });

  // Refs to maintain stable references
  const managerRef = useRef<GameRealtimeManager | null>(null);
  const isConnectingRef = useRef(false);

  // Create or get the manager instance
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = createGameSubscription(gameId, filters);
    }
    return managerRef.current;
  }, [gameId, filters]);

  // Handle new events
  const handleEvent = useCallback((update: RealtimeGameUpdate) => {
    if (update.type === 'event' && update.data) {
      const event = update.data as GameEvent;
      
      // Add to events list (keep last 50 events in memory)
      setEvents(prev => [event, ...prev.slice(0, 49)]);
      
      // Call user-provided handler
      onEvent?.(event);
    }
  }, [onEvent]);

  // Handle snapshot updates
  const handleSnapshot = useCallback((newSnapshot: GameSnapshot) => {
    setSnapshot(newSnapshot);
    onSnapshot?.(newSnapshot);
  }, [onSnapshot]);

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
        onEvent: handleEvent,
        onSnapshot: handleSnapshot,
        onConnectionStatus: handleConnectionStatus,
        filters
      });
    } catch (error) {
      console.error('Error connecting to game events:', error);
      onError?.(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      isConnectingRef.current = false;
    }
  }, [gameId, handleEvent, handleSnapshot, handleConnectionStatus, onError, getManager]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.dispose().catch(error => {
        console.warn(`[useGameEvents] Error during disconnect for game ${gameId}:`, error);
      });
      managerRef.current = null;
    }
    
    setConnectionStatus({
      connected: false,
      reconnecting: false
    });
  }, [gameId]);

  // Reconnect function
  const reconnect = useCallback(async () => {
    disconnect();
    await connect();
  }, [disconnect, connect]);

  // Auto-connect on mount if enabled, with single cleanup
  useEffect(() => {
    if (autoConnect && gameId) {
      connect();
    }

    // Single cleanup function that handles all cases
    return () => {
      if (managerRef.current) {
        console.log(`[useGameEvents] Cleaning up connection for game: ${gameId}`);
        managerRef.current.dispose().catch(error => {
          console.warn(`[useGameEvents] Error during cleanup for game ${gameId}:`, error);
        });
        managerRef.current = null;
      }
    };
  }, [gameId, autoConnect]); // Intentionally not including connect/disconnect to avoid loops

  // Derived state
  const isConnected = connectionStatus.connected;
  const isReconnecting = connectionStatus.reconnecting;
  const hasError = !!connectionStatus.error;

  return {
    // Current state
    snapshot,
    events,
    connectionStatus,
    
    // Actions
    connect,
    disconnect,
    reconnect,
    
    // Status helpers
    isConnected,
    isReconnecting,
    hasError
  };
}

/**
 * Simplified hook for just getting the current game snapshot with real-time updates
 */
export function useGameSnapshot(gameId: string): {
  snapshot: GameSnapshot | null;
  isConnected: boolean;
  error?: string;
} {
  const { snapshot, isConnected, connectionStatus } = useGameEvents({
    gameId,
    autoConnect: true
  });

  return {
    snapshot,
    isConnected,
    error: connectionStatus.error
  };
}

/**
 * Hook for listening to game events without managing full state
 */
export function useGameEventListener(
  gameId: string,
  onEvent: (event: GameEvent) => void,
  onSnapshot?: (snapshot: GameSnapshot) => void
): {
  isConnected: boolean;
  reconnect: () => Promise<void>;
} {
  const { isConnected, reconnect } = useGameEvents({
    gameId,
    autoConnect: true,
    onEvent,
    onSnapshot
  });

  return {
    isConnected,
    reconnect
  };
} 