import { renderHook, act } from '@testing-library/react';
import { useMobileTournamentState, useMobileTouchGestures, useMobileBreakpoints } from '../useMobileTournamentState';

// Mock window properties
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockClearTimeout = jest.fn();
const mockSetTimeout = jest.fn();

Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });
Object.defineProperty(global, 'setTimeout', { value: mockSetTimeout });
Object.defineProperty(global, 'clearTimeout', { value: mockClearTimeout });

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 0
});

describe('useMobileTournamentState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetTimeout.mockImplementation((fn, delay) => {
      return setTimeout(fn, delay);
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useMobileTournamentState());
    const [state] = result.current;

    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.isRefreshing).toBe(false);
    expect(state.retryCount).toBe(0);
    expect(state.isOnline).toBe(true);
  });

  it('detects touch device correctly', () => {
    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', { value: true });
    
    const { result } = renderHook(() => useMobileTournamentState());
    const [state] = result.current;

    expect(state.isTouchDevice).toBe(true);
  });

  it('sets loading state correctly', () => {
    const { result } = renderHook(() => useMobileTournamentState());
    const [, actions] = result.current;

    act(() => {
      actions.setLoading(true);
    });

    expect(result.current[0].isLoading).toBe(true);

    act(() => {
      actions.setLoading(false);
    });

    expect(result.current[0].isLoading).toBe(false);
  });

  it('sets error state correctly', () => {
    const { result } = renderHook(() => useMobileTournamentState());
    const [, actions] = result.current;

    const testError = new Error('Test error');

    act(() => {
      actions.setError(testError);
    });

    expect(result.current[0].error).toBe(testError);
    expect(result.current[0].isLoading).toBe(false);
  });

  it('clears error state correctly', () => {
    const { result } = renderHook(() => useMobileTournamentState());
    const [, actions] = result.current;

    act(() => {
      actions.setError('Test error');
    });

    expect(result.current[0].error).toBe('Test error');

    act(() => {
      actions.clearError();
    });

    expect(result.current[0].error).toBe(null);
    expect(result.current[0].retryCount).toBe(0);
  });

  it('handles retry with exponential backoff', async () => {
    const onRetry = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => 
      useMobileTournamentState({ onRetry, retryDelay: 100 })
    );
    const [, actions] = result.current;

    act(() => {
      actions.retry();
    });

    expect(result.current[0].retryCount).toBe(1);
    expect(result.current[0].isLoading).toBe(true);
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
  });

  it('stops retrying after max attempts', async () => {
    const onRetry = jest.fn().mockRejectedValue(new Error('Retry failed'));
    const { result } = renderHook(() => 
      useMobileTournamentState({ onRetry, maxRetries: 2 })
    );
    const [, actions] = result.current;

    // Set retry count to max
    act(() => {
      result.current[0].retryCount = 2;
      actions.retry();
    });

    expect(result.current[0].error).toBe('Maximum retry attempts reached. Please try again later.');
  });

  it('handles refresh correctly', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => 
      useMobileTournamentState({ onRefresh })
    );
    const [, actions] = result.current;

    await act(async () => {
      await actions.refresh();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current[0].isRefreshing).toBe(false);
    expect(result.current[0].retryCount).toBe(0);
  });

  it('handles refresh error correctly', async () => {
    const onRefresh = jest.fn().mockRejectedValue(new Error('Refresh failed'));
    const { result } = renderHook(() => 
      useMobileTournamentState({ onRefresh })
    );
    const [, actions] = result.current;

    await act(async () => {
      await actions.refresh();
    });

    expect(result.current[0].error).toEqual(new Error('Refresh failed'));
    expect(result.current[0].isRefreshing).toBe(false);
  });

  it('monitors online status', () => {
    const { result } = renderHook(() => useMobileTournamentState());

    // Check that event listeners were added
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    const offlineHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'offline')?.[1];
    
    act(() => {
      offlineHandler?.();
    });

    expect(result.current[0].isOnline).toBe(false);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useMobileTournamentState());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});

describe('useMobileTouchGestures', () => {
  it('initializes with correct default gesture state', () => {
    const mockRef = { current: document.createElement('div') };
    const { result } = renderHook(() => useMobileTouchGestures(mockRef));

    expect(result.current.isScrolling).toBe(false);
    expect(result.current.scrollDirection).toBe('none');
    expect(result.current.lastTouchX).toBe(0);
    expect(result.current.lastTouchY).toBe(0);
  });

  it('adds touch event listeners to element', () => {
    const mockElement = document.createElement('div');
    const mockAddEventListener = jest.fn();
    mockElement.addEventListener = mockAddEventListener;
    
    const mockRef = { current: mockElement };
    renderHook(() => useMobileTouchGestures(mockRef));

    expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
    expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
    expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
  });

  it('handles null ref gracefully', () => {
    const mockRef = { current: null };
    expect(() => {
      renderHook(() => useMobileTouchGestures(mockRef));
    }).not.toThrow();
  });
});

describe('useMobileBreakpoints', () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true
    });
  });

  it('detects xs breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
    
    const { result } = renderHook(() => useMobileBreakpoints());

    expect(result.current.breakpoint).toBe('xs');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects sm breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
    
    const { result } = renderHook(() => useMobileBreakpoints());

    expect(result.current.breakpoint).toBe('sm');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects md breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 700, writable: true });
    
    const { result } = renderHook(() => useMobileBreakpoints());

    expect(result.current.breakpoint).toBe('md');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects lg breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
    
    const { result } = renderHook(() => useMobileBreakpoints());

    expect(result.current.breakpoint).toBe('lg');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it('detects xl breakpoint correctly', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    
    const { result } = renderHook(() => useMobileBreakpoints());

    expect(result.current.breakpoint).toBe('xl');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it('adds resize event listener', () => {
    renderHook(() => useMobileBreakpoints());

    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('removes resize event listener on unmount', () => {
    const { unmount } = renderHook(() => useMobileBreakpoints());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
 
 