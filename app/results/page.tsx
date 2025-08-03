'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import YearSelector from '../../components/YearSelector';
import GameResultsList from '../../components/GameResultsList';
import { useHistoricalGames } from '../../hooks/useHistoricalGames';

function ResultsContent() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  
  // Historical games state management
  const {
    selectedYear,
    years,
    tournament,
    games,
    loadingYears,
    loadingGames,
    error,
    setSelectedYear,
    refetch
  } = useHistoricalGames();

  // Handle URL parameters
  useEffect(() => {
    const yearParam = searchParams.get('year');
    if (yearParam && !loadingYears && years.length > 0) {
      // Only set if it's a valid year and different from current selection
      if (years.includes(yearParam) && yearParam !== selectedYear) {
        setSelectedYear(yearParam);
      }
    }
  }, [searchParams, years, loadingYears, selectedYear, setSelectedYear]);

  // Hydration-safe mobile detection
  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1c1b20',
      paddingTop: '64px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: isMobile ? '16px 12px' : '32px 24px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <h1 style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: '700',
            color: '#1c1b20',
            margin: '0 0 8px 0',
            lineHeight: isMobile ? '1.2' : '1.1'
          }}>
            Historical Results
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#696775',
            margin: '0',
            fontWeight: '500',
            lineHeight: isMobile ? '1.4' : '1.5'
          }}>
            View results and game history from past tournaments
          </p>
        </div>

      {/* Year Selector */}
      {!loadingYears && years.length > 0 && (
        <YearSelector
          selectedYear={selectedYear}
          years={years}
          tournament={tournament}
          onYearChange={setSelectedYear}
          loading={loadingYears}
          className="mb-8"
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="text-red-400 text-lg mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Error Loading Data
              </h3>
              <p className="text-sm text-red-700">
                {error}
              </p>
              <button
                onClick={refetch}
                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingYears && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-lg font-medium" style={{ color: '#312f36' }}>
            Loading tournaments...
          </span>
        </div>
      )}

      {/* Game Results */}
      {selectedYear && tournament && (
        <GameResultsList
          games={games}
          loading={loadingGames}
          className="mb-8"
        />
      )}

      {/* Instructions when no selection made */}
      {!loadingYears && !selectedYear && years.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Select a Year to View Results
          </h3>
          <p className="text-blue-700">
            Choose a year from the filter above to see tournament results and game history.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1c1b20',
      paddingTop: '64px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '32px 24px'
      }}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-lg font-medium" style={{ color: '#312f36' }}>
            Loading results...
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsContent />
    </Suspense>
  );
} 