'use client';

import React, { useState, useEffect, Suspense } from 'react';
import GameResultsList from '../../components/GameResultsList';
import { useCurrentTournament } from '../../hooks/useCurrentTournament';

function GamesContent() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Use the current tournament hook for live games
  const {
    tournament,
    games,
    loading,
    error,
    refetch
  } = useCurrentTournament();

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

  // No year selection needed for current tournament

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1c1b20',
      paddingTop: isMobile ? '56px' : '64px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: isMobile ? '20px 16px' : '32px 24px'
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
            Current Tournament Games
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#696775',
            margin: '0',
            fontWeight: '500',
            lineHeight: isMobile ? '1.4' : '1.5'
          }}>
            Live and upcoming games for the 2025 tournament
          </p>
        </div>

        {/* Loading State */}
        {!isClient || loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e4e2e8',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <div style={{
              fontSize: '16px',
              color: '#696775',
              fontWeight: '500'
            }}>
              Loading current tournament games...
            </div>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#dc2626',
              fontWeight: '500'
            }}>
              Error loading games: {error}
            </div>
          </div>
        ) : !tournament ? (
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🏟️
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#f59e0b',
              margin: '0 0 8px 0'
            }}>
              Tournament Not Started
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0',
              lineHeight: '1.5'
            }}>
              The 2025 tournament hasn't started yet. Check back soon for live games and updates.
            </p>
          </div>
        ) : games.length === 0 ? (
          <div style={{
            background: 'rgba(139, 138, 148, 0.05)',
            border: '1px solid rgba(139, 138, 148, 0.2)',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ⚾
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#696775',
              margin: '0 0 8px 0'
            }}>
              No Games Scheduled
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#8b8a94',
              margin: '0',
              lineHeight: '1.5'
            }}>
              No games have been scheduled for the current tournament yet.
            </p>
          </div>
        ) : (
          /* Tournament Info */
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e4e2e8',
            padding: isMobile ? '20px' : '24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <h2 style={{
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '700',
                  color: '#1c1b20',
                  margin: '0 0 4px 0'
                }}>
                  {tournament.name}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#696775',
                  margin: '0'
                }}>
                  {tournament.status === 'active' ? 'Tournament in Progress' : 
                   tournament.status === 'completed' ? 'Tournament Completed' : 
                   'Tournament Scheduled'}
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: tournament.status === 'active' ? 'rgba(34, 197, 94, 0.1)' :
                           tournament.status === 'completed' ? 'rgba(139, 138, 148, 0.1)' :
                           'rgba(59, 130, 246, 0.1)',
                color: tournament.status === 'active' ? '#15803d' :
                       tournament.status === 'completed' ? '#696775' :
                       '#2563eb',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {tournament.status === 'active' ? '●' : 
                 tournament.status === 'completed' ? '✓' : '⏰'}
                {tournament.status}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: '16px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '4px'
                }}>
                  Total Games
                </div>
                <div style={{
                  color: '#696775'
                }}>
                  {games.length}
                </div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '4px'
                }}>
                  Completed
                </div>
                <div style={{
                  color: '#696775'
                }}>
                  {games.filter(g => g.status === 'completed').length}
                </div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '4px'
                }}>
                  Live/Upcoming
                </div>
                <div style={{
                  color: '#696775'
                }}>
                  {games.filter(g => g.status !== 'completed').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Results */}
        {tournament && games.length > 0 && (
          <GameResultsList
            games={games}
            loading={loading}
            className="mb-8"
            groupByPhase={true}
            showTournamentInfo={false}
          />
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
      paddingTop: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e4e2e8',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          fontSize: '16px',
          color: '#696775',
          fontWeight: '500'
        }}>
          Loading games...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GamesContent />
    </Suspense>
  );
} 