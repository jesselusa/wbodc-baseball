import { useState, useEffect, useCallback } from 'react';
import type { Tournament } from '../components/YearSelector';
import type { HistoricalGame } from '../components/GameResultsList';

interface UseHistoricalGamesReturn {
  // Selection state
  selectedYear: string | null;
  
  // Data
  years: string[];
  tournament: Tournament | null;
  games: HistoricalGame[];
  
  // Loading states
  loadingYears: boolean;
  loadingGames: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  setSelectedYear: (year: string | null) => void;
  refetch: () => void;
}

/**
 * Custom hook for managing historical games data and selection state
 * Handles data fetching: years -> games for selected year
 * Excludes current year (2025) to separate current games from historical results
 */
export function useHistoricalGames(): UseHistoricalGamesReturn {
  // Selection state - start with null instead of '2025'
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  
  // Data state
  const [years, setYears] = useState<string[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<HistoricalGame[]>([]);
  
  // Loading states
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch years and tournaments overview
  const fetchYears = useCallback(async () => {
    try {
      setLoadingYears(true);
      setError(null);
      
      const response = await fetch('/api/results');
      const data = await response.json();
      
      if (data.success) {
        // Filter out current year (2025) to keep results page historical only
        const allYears = data.data.years || [];
        const currentYear = new Date().getFullYear().toString();
        const historicalYears = allYears.filter((year: string) => year !== currentYear);
        
        setYears(historicalYears);
        
        // Auto-select the most recent historical year if available
        if (historicalYears.length > 0 && !selectedYear) {
          const mostRecentYear = historicalYears.sort((a: string, b: string) => parseInt(b) - parseInt(a))[0];
          setSelectedYear(mostRecentYear);
        }
      } else {
        setError(data.error || 'Failed to fetch years');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch years');
    } finally {
      setLoadingYears(false);
    }
  }, [selectedYear]);

  // Fetch tournament and games for selected year
  const fetchYearData = useCallback(async (year: string) => {
    try {
      setLoadingGames(true);
      setError(null);
      
      const response = await fetch(`/api/results?year=${year}`);
      const data = await response.json();
      
      if (data.success) {
        setTournament(data.data.tournament);
        setGames(data.data.games || []);
      } else {
        setError(data.error || 'Failed to fetch year data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch year data');
    } finally {
      setLoadingGames(false);
    }
  }, []);

  // Handle year selection
  const handleYearChange = useCallback((year: string | null) => {
    setSelectedYear(year);
    setTournament(null);
    setGames([]);
    
    if (year) {
      fetchYearData(year);
    }
  }, [fetchYearData]);

  // Refetch current data
  const refetch = useCallback(() => {
    if (selectedYear) {
      fetchYearData(selectedYear);
    } else {
      fetchYears();
    }
  }, [selectedYear, fetchYears, fetchYearData]);

  // Initial data fetch
  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  // Fetch data for selected year
  useEffect(() => {
    if (selectedYear) {
      fetchYearData(selectedYear);
    }
  }, [selectedYear, fetchYearData]);

  return {
    // Selection state
    selectedYear,
    
    // Data
    years,
    tournament,
    games,
    
    // Loading states
    loadingYears,
    loadingGames,
    
    // Error state
    error,
    
    // Actions
    setSelectedYear: handleYearChange,
    refetch
  };
} 