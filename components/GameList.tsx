"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameDisplayData } from '../lib/types';
import { fetchRecentGames } from '../lib/api';
import GameRow from './GameRow';

interface GameListProps {
  limit?: number;
  showViewAllButton?: boolean;
}

export default function GameList({ limit = 10, showViewAllButton = true }: GameListProps) {
  const router = useRouter();
  const [games, setGames] = useState<GameDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      try {
        const response = await fetchRecentGames(limit);
        if (response.success) {
          setGames(response.data);
        } else {
          setError(response.error || 'Failed to load games');
        }
      } catch (err) {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [limit]);

  if (loading) {
    return (
      <div style={{
        background: '#f9f8fc',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e4e2e8',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '120px',
          color: '#696775',
          fontSize: '16px',
        }}>
          Loading games...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#f9f8fc',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e4e2e8',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '120px',
          color: '#696775',
          fontSize: '16px',
        }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div style={{
        background: '#f9f8fc',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e4e2e8',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '120px',
          color: '#696775',
          fontSize: '16px',
        }}>
          No games found
        </div>
      </div>
    );
  }

  // Separate live and non-live games for special treatment
  const liveGames = games.filter(game => game.status === 'in_progress');
  const otherGames = games.filter(game => game.status !== 'in_progress');

  return (
    <div style={{
      background: '#fdfcfe',
      borderRadius: '12px',
      border: '1px solid #e4e2e8',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid #e9e8eb',
        background: '#f9f8fc',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
          color: '#1c1b20',
        }}>
          Recent Games
        </h2>
        {liveGames.length > 0 && (
          <p style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: '#696775',
          }}>
            {liveGames.length} game{liveGames.length === 1 ? '' : 's'} currently live
          </p>
        )}
      </div>

      {/* Live Games Section */}
      {liveGames.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(34, 197, 94, 0.08) 100%)',
          borderBottom: otherGames.length > 0 ? '3px solid #22c55e' : 'none',
          position: 'relative',
        }}>
          {/* Live indicator stripe */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #22c55e, #16a34a, #22c55e)',
            animation: 'shimmer 2s infinite',
          }}></div>

          {/* Live Games Header */}
          <div style={{
            padding: '20px 24px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)',
              }}></div>
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#22c55e',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}>
                🔴 Live Now
              </span>
            </div>
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#16a34a',
            }}>
              {liveGames.length} Active
            </div>
          </div>
          
          {/* Live Games List */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            margin: '0 16px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            overflow: 'hidden',
          }}>
            {liveGames.map((game, index) => (
              <div key={game.id} style={{
                borderBottom: index < liveGames.length - 1 ? '1px solid rgba(34, 197, 94, 0.1)' : 'none',
              }}>
                <GameRow game={game} isLive={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Games Section */}
      {otherGames.length > 0 && (
        <div style={{
          background: '#fdfcfe',
        }}>
          {/* Recent Games Header */}
          <div style={{
            padding: '20px 24px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: liveGames.length > 0 ? 'none' : '1px solid #e9e8eb',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#8b8a94',
              }}></div>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#696775',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}>
                📊 Recent Games
              </span>
            </div>
            <div style={{
              background: 'rgba(139, 138, 148, 0.1)',
              border: '1px solid rgba(139, 138, 148, 0.3)',
              borderRadius: '12px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#696775',
            }}>
              {otherGames.length} Completed
            </div>
          </div>
          
          {/* Recent Games List */}
          <div style={{
            background: '#fdfcfe',
            margin: '0 16px 16px',
            borderRadius: '8px',
            border: '1px solid #e4e2e8',
            overflow: 'hidden',
          }}>
            {otherGames.map((game, index) => (
              <div key={game.id} style={{
                borderBottom: index < otherGames.length - 1 ? '1px solid #e9e8eb' : 'none',
              }}>
                <GameRow game={game} isLive={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View All Button */}
      {showViewAllButton && (
        <div style={{
          padding: '16px 24px',
          background: '#f9f8fc',
          borderTop: '1px solid #e9e8eb',
          textAlign: 'center',
        }}>
          <button
            style={{
              background: 'transparent',
              border: '1px solid #9c9ba6',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1c1b20',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f2f1f5';
              e.currentTarget.style.borderColor = '#8b8a94';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#9c9ba6';
            }}
            onClick={() => {
              router.push('/games');
            }}
          >
            View All Games
          </button>
        </div>
      )}

      {/* Animations for live indicators */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
} 