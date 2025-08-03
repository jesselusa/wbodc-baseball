import { useState, useEffect, useCallback } from 'react';

interface Tournament {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
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

  return {
    tournament,
    games,
    loading,
    error,
    refetch
  };
}
 