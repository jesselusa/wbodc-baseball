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

  // Helper to determine if we should show coming soon for 2025
  const shouldShowComingSoon = () => {
    const currentYear = new Date().getFullYear();
    
    // If it's 2025 and no tournament is available, or tournament hasn't started yet
    if (selectedYear === '2025' || (selectedYear === currentYear.toString() && currentYear === 2025)) {
      return !tournament || (tournament.status !== 'active' && tournament.status !== 'completed');
    }
    
    return false;
  };

  const showComingSoon = shouldShowComingSoon();

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
            margin: '0 0 8px 0'
          }}>
            Tournament Results
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#696775',
            margin: '0',
            fontWeight: '500'
          }}>
            Historical game results, scores, and tournament standings
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

      {/* Coming Soon Section (for 2025 or when no data) */}
      {showComingSoon && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e4e2e8',
          padding: isMobile ? '32px 24px' : '48px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="m9 16 2 2 4-4"/>
            </svg>
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '24px' : '28px',
            fontWeight: '600',
            color: '#1c1b20',
            margin: '0 0 16px 0'
          }}>
            Results Coming Soon
          </h2>
          
          <p style={{
            fontSize: isMobile ? '16px' : '18px',
            color: '#6b7280',
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}>
            {selectedYear === '2025' 
              ? 'Tournament results will be available once the 2025 tournament begins.'
              : 'This page will display tournament game results, standings, and historical data once games begin.'
            }
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              padding: '20px',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '8px'
              }}>
                GAME SCORES
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Live and final scores
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '8px'
              }}>
                STANDINGS
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Team rankings & stats
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.1)'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#f59e0b',
                marginBottom: '8px'
              }}>
                HISTORY
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Past tournaments
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Results */}
      {!showComingSoon && selectedYear && tournament && (
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