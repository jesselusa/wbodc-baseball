import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/realtime';

interface Tournament {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  start_date: string;
  end_date: string;
  location: string;
  tournament_number: number;
}

interface Game {
  id: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  home_team: {
    id: string;
    name: string;
  };
  away_team: {
    id: string;
    name: string;
  };
  home_score: number;
  away_score: number;
  status: string;
  current_inning: number;
  is_top_inning: boolean;
  total_innings: number;
  started_at?: string;
  completed_at?: string;
}

interface UseCurrentTournamentReturn {
  tournament: Tournament | null;
  games: Game[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for loading the current active tournament and its games
 */
export function useCurrentTournament(): UseCurrentTournamentReturn {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const fetchCurrentTournament = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current tournament
      const tournamentResponse = await fetch('/api/tournaments/current');
      const tournamentData = await tournamentResponse.json();

      if (!tournamentResponse.ok || !tournamentData.success) {
        setTournament(null);
        setGames([]);
        return;
      }

      const currentTournament = tournamentData.data;
      setTournament(currentTournament);

      // If tournament exists, fetch its games
      if (currentTournament) {
        const gamesResponse = await fetch(`/api/tournaments/${currentTournament.id}/games`);
        const gamesData = await gamesResponse.json();

        if (gamesResponse.ok && gamesData.success) {
          // The API already returns formatted games matching the HistoricalGame interface
          setGames(gamesData.data || []);
        } else {
          setGames([]);
        }
      } else {
        setGames([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournament');
      setTournament(null);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchCurrentTournament();
  }, [fetchCurrentTournament]);

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only fetch data after client-side hydration
  useEffect(() => {
    if (isClient) {
      fetchCurrentTournament();
    }
  }, [isClient, fetchCurrentTournament]);

  // Set up real-time subscription for game updates
  useEffect(() => {
    if (!tournament) return;

    console.log('[useCurrentTournament] Setting up real-time subscription for tournament:', tournament.id);

    const subscription = supabase
      .channel(`tournament-${tournament.id}-games`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'games',
          filter: `tournament_id=eq.${tournament.id}`
        }, 
        (payload) => {
          console.log('[useCurrentTournament] Game update received:', payload);
          // Refetch games when any game in this tournament changes
          fetchCurrentTournament();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'game_snapshots'
        },
        (payload) => {
          console.log('[useCurrentTournament] Game snapshot update received:', payload);
          // Check if this snapshot update is for a game in our tournament
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          const updatedGameId = newRecord?.game_id || oldRecord?.game_id;
          if (updatedGameId && games.some(g => g.id === updatedGameId)) {
            fetchCurrentTournament();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useCurrentTournament] Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [tournament, games, fetchCurrentTournament]);

  return {
    tournament,
    games,
    loading,
    error,
    refetch
  };
}
 