import { renderHook, act } from '@testing-library/react';
import { useGameEvents, useGameSnapshot, useGameEventListener } from '../useGameEvents';
import { GameEvent, GameSnapshot } from '../../lib/types';

// Mock the realtime module
jest.mock('../../lib/realtime', () => ({
  createGameSubscription: jest.fn(() => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getConnectionStatus: jest.fn(() => ({
      connected: false,
      reconnecting: false
    }))
  }))
}));

describe('useGameEvents', () => {
  const gameId = 'test-game-id';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => 
        useGameEvents({ gameId, autoConnect: false })
      );

      expect(result.current.snapshot).toBeNull();
      expect(result.current.events).toEqual([]);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it('should provide connection control functions', () => {
      const { result } = renderHook(() => 
        useGameEvents({ gameId, autoConnect: false })
      );

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.reconnect).toBe('function');
    });
  });

  describe('auto-connect behavior', () => {
    it('should auto-connect by default', () => {
      renderHook(() => useGameEvents({ gameId }));
      // Connection would be initiated in useEffect
    });

    it('should not auto-connect when disabled', () => {
      renderHook(() => useGameEvents({ gameId, autoConnect: false }));
      // No connection should be initiated
    });
  });

  describe('event handling', () => {
    it('should handle event callbacks', () => {
      const onEvent = jest.fn();
      const onSnapshot = jest.fn();
      const onError = jest.fn();

      renderHook(() => 
        useGameEvents({ 
          gameId, 
          autoConnect: false,
          onEvent,
          onSnapshot,
          onError
        })
      );

      // Callbacks should be properly set up
      expect(onEvent).not.toHaveBeenCalled();
      expect(onSnapshot).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('subscription filters', () => {
    it('should accept subscription filters', () => {
      const filters = {
        granularity: 'summary' as const,
        eventTypes: ['pitch', 'at_bat']
      };

      const { result } = renderHook(() => 
        useGameEvents({ 
          gameId, 
          autoConnect: false,
          filters
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => 
        useGameEvents({ gameId, autoConnect: false })
      );

      unmount();
      // Cleanup should occur
    });

    it('should cleanup on gameId change', () => {
      const { rerender } = renderHook(
        ({ gameId }) => useGameEvents({ gameId, autoConnect: false }),
        { initialProps: { gameId: 'game-1' } }
      );

      rerender({ gameId: 'game-2' });
      // Should cleanup old subscription and create new one
    });
  });
});

describe('useGameSnapshot', () => {
  const gameId = 'test-game-id';

  it('should provide simplified snapshot interface', () => {
    const { result } = renderHook(() => useGameSnapshot(gameId));

    expect(result.current.snapshot).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeUndefined();
  });
});

describe('useGameEventListener', () => {
  const gameId = 'test-game-id';
  const onEvent = jest.fn();

  it('should provide event listener interface', () => {
    const { result } = renderHook(() => 
      useGameEventListener(gameId, onEvent)
    );

    expect(result.current.isConnected).toBe(false);
    expect(typeof result.current.reconnect).toBe('function');
  });

  it('should accept optional snapshot handler', () => {
    const onSnapshot = jest.fn();
    
    const { result } = renderHook(() => 
      useGameEventListener(gameId, onEvent, onSnapshot)
    );

    expect(result.current.isConnected).toBe(false);
  });
}); 