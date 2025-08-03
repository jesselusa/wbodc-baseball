/**
 * useMobileTournamentState Hook
 * 
 * Custom hook for managing mobile-specific tournament states including
 * loading, error handling, touch interactions, and responsive behaviors.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface MobileTournamentState {
  isLoading: boolean;
  error: Error | string | null;
  isRefreshing: boolean;
  isTouchDevice: boolean;
  isOnline: boolean;
  retryCount: number;
}

export interface MobileTournamentActions {
  setLoading: (loading: boolean) => void;
  setError: (error: Error | string | null) => void;
  retry: () => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

interface UseMobileTournamentStateOptions {
  maxRetries?: number;
  retryDelay?: number;
  enablePullToRefresh?: boolean;
  onRetry?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function useMobileTournamentState(
  options: UseMobileTournamentStateOptions = {}
): [MobileTournamentState, MobileTournamentActions] {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    enablePullToRefresh = true,
    onRetry,
    onRefresh
  } = options;

  const [state, setState] = useState<MobileTournamentState>({
    isLoading: false,
    error: null,
    isRefreshing: false,
    isTouchDevice: false,
    isOnline: true,
    retryCount: 0
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      (navigator as any).msMaxTouchPoints > 0;
      
      setState(prev => ({ ...prev, isTouchDevice: hasTouch }));
    };

    checkTouchDevice();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setState(prev => ({ ...prev, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pull-to-refresh support
  useEffect(() => {
    if (!enablePullToRefresh || !state.isTouchDevice) return;

    let startY = 0;
    let pullDistance = 0;
    const threshold = 80;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      const currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;

      if (pullDistance > 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      
      isPulling = false;
      
      if (pullDistance > threshold && onRefresh) {
        setState(prev => ({ ...prev, isRefreshing: true }));
        try {
          await onRefresh();
        } finally {
          setState(prev => ({ ...prev, isRefreshing: false }));
        }
      }
      
      pullDistance = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enablePullToRefresh, state.isTouchDevice, onRefresh]);

  // Actions
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | string | null) => {
    setState(prev => ({ 
      ...prev, 
      error,
      isLoading: false 
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      error: null,
      retryCount: 0 
    }));
  }, []);

  const retry = useCallback(async () => {
    if (state.retryCount >= maxRetries) {
      setError('Maximum retry attempts reached. Please try again later.');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      retryCount: prev.retryCount + 1,
      isLoading: true,
      error: null 
    }));

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Exponential backoff delay
    const delay = retryDelay * Math.pow(2, state.retryCount);
    
    retryTimeoutRef.current = setTimeout(async () => {
      try {
        if (onRetry) {
          await onRetry();
        }
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error : 'Retry failed';
        setError(errorMessage);
      }
    }, delay);
  }, [state.retryCount, maxRetries, retryDelay, onRetry, setError]);

  const refresh = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      isRefreshing: true,
      error: null,
      retryCount: 0 
    }));

    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : 'Refresh failed';
      setError(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [onRefresh, setError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const actions: MobileTournamentActions = {
    setLoading,
    setError,
    retry,
    refresh,
    clearError
  };

  return [state, actions];
}

// Hook for touch gesture handling
export function useMobileTouchGestures(element: React.RefObject<HTMLElement>) {
  const [gestures, setGestures] = useState({
    isScrolling: false,
    scrollDirection: 'none' as 'none' | 'horizontal' | 'vertical',
    lastTouchY: 0,
    lastTouchX: 0
  });

  useEffect(() => {
    const el = element.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      setGestures(prev => ({ 
        ...prev, 
        lastTouchX: startX, 
        lastTouchY: startY 
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const deltaX = Math.abs(currentX - startX);
      const deltaY = Math.abs(currentY - startY);
      
      let direction: 'horizontal' | 'vertical' | 'none' = 'none';
      
      if (deltaX > deltaY && deltaX > 10) {
        direction = 'horizontal';
      } else if (deltaY > deltaX && deltaY > 10) {
        direction = 'vertical';
      }

      setGestures(prev => ({
        ...prev,
        isScrolling: direction !== 'none',
        scrollDirection: direction,
        lastTouchX: currentX,
        lastTouchY: currentY
      }));
    };

    const handleTouchEnd = () => {
      setGestures(prev => ({
        ...prev,
        isScrolling: false,
        scrollDirection: 'none'
      }));
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element]);

  return gestures;
}

// Hook for responsive breakpoint detection
export function useMobileBreakpoints() {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 480) {
        setBreakpoint('xs');
      } else if (width < 640) {
        setBreakpoint('sm');
      } else if (width < 768) {
        setBreakpoint('md');
      } else if (width < 1024) {
        setBreakpoint('lg');
      } else {
        setBreakpoint('xl');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl'
  };
}
 
 