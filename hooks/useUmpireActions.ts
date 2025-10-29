import { useState, useCallback } from 'react';
import { 
  EventSubmissionRequest,
  EventSubmissionResponse,
  PitchEventPayload,
  FlipCupEventPayload,
  AtBatEventPayload,
  UndoEventPayload,
  EditEventPayload,
  TakeoverEventPayload,
  GameStartEventPayload,
  GameEndEventPayload,
  InningEndEventPayload,
  GameSnapshot
} from '../lib/types';
import { submitEvent } from '../lib/api';

export interface UmpireActionsState {
  submitting: boolean;
  lastError?: string;
  lastSuccess?: boolean;
  pendingEvents: EventSubmissionRequest[];
}

export interface UmpireActionsHook {
  state: UmpireActionsState;
  
  // Event submission methods
  submitPitch: (gameId: string, payload: PitchEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitFlipCup: (gameId: string, payload: FlipCupEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitAtBat: (gameId: string, payload: AtBatEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitUndo: (gameId: string, payload: UndoEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitEdit: (gameId: string, payload: EditEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitTakeover: (gameId: string, payload: TakeoverEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitGameStart: (gameId: string, payload: GameStartEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitGameEnd: (gameId: string, payload: GameEndEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  submitInningEnd: (gameId: string, payload: InningEndEventPayload, umpireId: string) => Promise<EventSubmissionResponse | null>;
  
  // Utility methods
  clearError: () => void;
  clearSuccess: () => void;
  retryFailedEvents: () => Promise<void>;
  hasPendingEvents: boolean;
}

/**
 * Hook for managing umpire actions and event submissions
 * Provides methods for submitting various game events with error handling and retry logic
 */
export function useUmpireActions(): UmpireActionsHook {
  const [state, setState] = useState<UmpireActionsState>({
    submitting: false,
    pendingEvents: []
  });

  // Generic event submission handler
  const submitEventAction = useCallback(async (
    type: EventSubmissionRequest['type'],
    gameId: string,
    payload: any,
    umpireId: string,
    previousEventId?: string
  ): Promise<EventSubmissionResponse | null> => {
    console.log('[UmpireActions] Starting event submission:');
    console.log('  - type:', type);
    console.log('  - gameId:', gameId);
    console.log('  - payload:', payload);
    console.log('  - umpireId:', umpireId);
    
    setState(prev => ({ 
      ...prev, 
      submitting: true, 
      lastError: undefined,
      lastSuccess: undefined 
    }));

    const request: EventSubmissionRequest = {
      game_id: gameId,
      type,
      payload,
      umpire_id: umpireId,
      previous_event_id: previousEventId
    };

    console.log('[UmpireActions] Full request:', request);

    try {
      const response = await submitEvent(request);
      
      console.log('[UmpireActions] Event submission response:', response);
      
      if (response.success) {
        console.log('[UmpireActions] Event submitted successfully');
        setState(prev => ({ 
          ...prev, 
          submitting: false,
          lastSuccess: true,
          // Remove any matching pending events
          pendingEvents: prev.pendingEvents.filter(
            event => !(event.game_id === gameId && event.type === type)
          )
        }));
        return response;
      } else {
        console.error('[UmpireActions] Event submission failed:', response.error);
        // Add to pending events for retry
        setState(prev => ({ 
          ...prev, 
          submitting: false,
          lastError: response.error || 'Event submission failed',
          pendingEvents: [...prev.pendingEvents, request]
        }));
        return null;
      }
    } catch (error) {
      console.error('[UmpireActions] Event submission threw error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setState(prev => ({ 
        ...prev, 
        submitting: false,
        lastError: errorMessage,
        pendingEvents: [...prev.pendingEvents, request]
      }));
      return null;
    }
  }, []);

  // Specific event submission methods
  const submitPitch = useCallback(
    (gameId: string, payload: PitchEventPayload, umpireId: string) =>
      submitEventAction('pitch', gameId, payload, umpireId),
    [submitEventAction]
  );

  const submitFlipCup = useCallback(
    (gameId: string, payload: FlipCupEventPayload, umpireId: string) =>
      submitEventAction('flip_cup', gameId, payload, umpireId),
    [submitEventAction]
  );

  const submitAtBat = useCallback(
    (gameId: string, payload: AtBatEventPayload, umpireId: string) =>
      submitEventAction('at_bat', gameId, payload, umpireId),
    [submitEventAction]
  );

  const submitUndo = useCallback(
    async (gameId: string, payload: UndoEventPayload, umpireId: string) => {
      // Use server API to leverage admin privileges for deletion + rebuild
      const request: EventSubmissionRequest = {
        game_id: gameId,
        type: 'undo',
        payload,
        umpire_id: umpireId
      };
      try {
        setState(prev => ({ ...prev, submitting: true, lastError: undefined, lastSuccess: undefined }));
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        const json = await res.json();
        const response: EventSubmissionResponse = json;
        if (response.success) {
          setState(prev => ({ ...prev, submitting: false, lastSuccess: true }));
          return response;
        } else {
          setState(prev => ({ ...prev, submitting: false, lastError: response.error || 'Undo failed' }));
          return null;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Network error';
        setState(prev => ({ ...prev, submitting: false, lastError: msg }));
        return null;
      }
    },
    []
  );

  const submitEdit = useCallback(
    (gameId: string, payload: EditEventPayload, umpireId: string) =>
      submitEventAction('edit', gameId, payload, umpireId),
    [submitEventAction]
  );

  const submitTakeover = useCallback(
    (gameId: string, payload: TakeoverEventPayload, umpireId: string) =>
      submitEventAction('takeover', gameId, payload, umpireId),
    [submitEventAction]
  );

  const submitGameStart = useCallback(
    (gameId: string, payload: GameStartEventPayload, umpireId: string) =>
      submitEventAction('game_start', gameId, payload, umpireId),
    [submitEventAction]
  );

  const submitGameEnd = useCallback(
    async (gameId: string, payload: GameEndEventPayload, umpireId: string) => {
      // Use server API route so tournament updates (standings/bracket) run with service role
      const request: EventSubmissionRequest = {
        game_id: gameId,
        type: 'game_end',
        payload,
        umpire_id: umpireId
      };

      try {
        setState(prev => ({ ...prev, submitting: true, lastError: undefined, lastSuccess: undefined }));
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        const json = await res.json();
        const response: EventSubmissionResponse = json;
        if (response.success) {
          setState(prev => ({ ...prev, submitting: false, lastSuccess: true }));
          return response;
        } else {
          setState(prev => ({ ...prev, submitting: false, lastError: response.error || 'Game end failed' }));
          return null;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Network error';
        setState(prev => ({ ...prev, submitting: false, lastError: msg }));
        return null;
      }
    },
    []
  );

  const submitInningEnd = useCallback(
    (gameId: string, payload: InningEndEventPayload, umpireId: string) =>
      submitEventAction('inning_end', gameId, payload, umpireId),
    [submitEventAction]
  );

  // Utility methods
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, lastError: undefined }));
  }, []);

  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, lastSuccess: undefined }));
  }, []);

  const retryFailedEvents = useCallback(async () => {
    if (state.pendingEvents.length === 0) return;

    setState(prev => ({ ...prev, submitting: true }));

    const retryPromises = state.pendingEvents.map(async (event) => {
      try {
        const response = await submitEvent(event);
        return { event, success: response.success };
      } catch (error) {
        return { event, success: false };
      }
    });

    const results = await Promise.all(retryPromises);
    const stillPending = results
      .filter(result => !result.success)
      .map(result => result.event);

    setState(prev => ({
      ...prev,
      submitting: false,
      pendingEvents: stillPending,
      lastError: stillPending.length > 0 ? 'Some events still failed to submit' : undefined,
      lastSuccess: stillPending.length < state.pendingEvents.length
    }));
  }, [state.pendingEvents]);

  return {
    state,
    submitPitch,
    submitFlipCup,
    submitAtBat,
    submitUndo,
    submitEdit,
    submitTakeover,
    submitGameStart,
    submitGameEnd,
    submitInningEnd,
    clearError,
    clearSuccess,
    retryFailedEvents,
    hasPendingEvents: state.pendingEvents.length > 0
  };
}

// Specialized hook for pitch-by-pitch scoring
export function usePitchByPitchScoring(gameId: string, umpireId: string) {
  const umpireActions = useUmpireActions();
  const [flipCupModalOpen, setFlipCupModalOpen] = useState(false);
  const [pendingCupHit, setPendingCupHit] = useState<1 | 2 | 3 | 4 | null>(null);

  const handlePitchResult = useCallback(async (payload: PitchEventPayload) => {
    const response = await umpireActions.submitPitch(gameId, payload, umpireId);
    
    // If it's a cup hit, open flip cup modal
    if (payload.result.includes('cup hit')) {
      const cupNumber = payload.result.includes('first') ? 1 :
                       payload.result.includes('second') ? 2 :
                       payload.result.includes('third') ? 3 : 4;
      setPendingCupHit(cupNumber);
      setFlipCupModalOpen(true);
    }
    
    return response;
  }, [gameId, umpireId, umpireActions]);

  const handleFlipCupResult = useCallback(async (payload: FlipCupEventPayload) => {
    // Attach hit_type derived from pendingCupHit for accurate history/scoring
    let hit_type: 'single' | 'double' | 'triple' | 'homerun' | undefined;
    if (pendingCupHit === 1) hit_type = 'single';
    else if (pendingCupHit === 2) hit_type = 'double';
    else if (pendingCupHit === 3) hit_type = 'triple';
    else if (pendingCupHit === 4) hit_type = 'homerun';

    const response = await umpireActions.submitFlipCup(
      gameId,
      { ...payload, hit_type },
      umpireId
    );
    
    if (response?.success) {
      setFlipCupModalOpen(false);
      setPendingCupHit(null);
    }
    
    return response;
  }, [gameId, umpireId, umpireActions]);

  const handleAtBatComplete = useCallback(async (payload: AtBatEventPayload) => {
    return umpireActions.submitAtBat(gameId, payload, umpireId);
  }, [gameId, umpireId, umpireActions]);

  const cancelFlipCup = useCallback(() => {
    setFlipCupModalOpen(false);
    setPendingCupHit(null);
  }, []);

  const openFlipCupModal = useCallback((cupHit: 1 | 2 | 3 | 4) => {
    setPendingCupHit(cupHit);
    setFlipCupModalOpen(true);
  }, []);

  return {
    ...umpireActions,
    handlePitchResult,
    handleFlipCupResult,
    handleAtBatComplete,
    flipCupModalOpen,
    pendingCupHit,
    cancelFlipCup,
    openFlipCupModal
  };
} 