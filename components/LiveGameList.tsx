"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameDisplayData } from '../lib/types';
import { getCurrentTournament } from '../lib/api';
import { useMultiGameScores } from '../hooks/useViewerGameUpdates';
import { CompactScoreboard } from './LiveScoreboard';

interface LiveGameListProps {
  limit?: number;
  showViewAllButton?: boolean;
}

export default function LiveGameList({ limit = 10, showViewAllButton = true }: LiveGameListProps) {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]); // Use any[] since tournament games have extra live state fields
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get live scores for all games
  const gameIds = games.map(game => game.id);
  const { scores: liveScores, isConnected: scoresConnected } = useMultiGameScores(gameIds);

  useEffect(() => {
    async function loadGames() {
      setLoading(true);
      try {
        // First get current tournament
        const tournamentResponse = await getCurrentTournament();
        if (tournamentResponse.success && tournamentResponse.data) {
          // Then get tournament games with live state
          const gamesResponse = await fetch(`/api/tournaments/${tournamentResponse.data.id}/games`);
          const gamesData = await gamesResponse.json();
          
          if (gamesResponse.ok && gamesData.success) {
            setGames(gamesData.data || []);
          } else {
            setError('Failed to load tournament games');
          }
        } else {
          setError('No tournament found for the current year. Go to Admin to create and start a tournament.');
        }
      } catch (err) {
        console.error('Error loading games:', err);
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, [limit]);

  // Merge live scores with game data and filter out unknown teams
  const gamesWithLiveData = games.map(game => {
    const liveScore = liveScores.get(game.id);
    if (liveScore) {
      return {
        ...game,
        home_score: liveScore.home,
        away_score: liveScore.away,
        // Don't overwrite game.status with snapshot.status - they're different concepts
        // game.status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' 
        // snapshot.status: 'not_started' | 'in_progress' | 'paused' | 'completed'
      };
    }
    return game;
  }).filter(game => {
    // Only show games where both teams are known (not "Unknown Team" or null)
    const hasValidHomeTeam = game.home_team?.name && game.home_team.name !== 'Unknown Team';
    const hasValidAwayTeam = game.away_team?.name && game.away_team.name !== 'Unknown Team';
    return hasValidHomeTeam && hasValidAwayTeam;
  });

  // Compute team records (wins-losses) from completed games
  const recordsByTeamId = React.useMemo(() => {
    const records = new Map<string, { wins: number; losses: number }>();
    gamesWithLiveData.forEach((g: any) => {
      if (g.status !== 'completed') return;
      const home = records.get(g.home_team.id) || { wins: 0, losses: 0 };
      const away = records.get(g.away_team.id) || { wins: 0, losses: 0 };
      if ((g.home_score ?? 0) > (g.away_score ?? 0)) {
        home.wins += 1;
        away.losses += 1;
      } else if ((g.away_score ?? 0) > (g.home_score ?? 0)) {
        away.wins += 1;
        home.losses += 1;
      }
      records.set(g.home_team.id, home);
      records.set(g.away_team.id, away);
    });
    return records;
  }, [gamesWithLiveData]);

  // Split games into live, completed, and upcoming
  // Filter for live games (in progress)
  const liveGames = gamesWithLiveData.filter(game => 
    game.status === 'in_progress'
  ).slice(0, Math.min(4, limit)); // Limit live games

  const completedGames = gamesWithLiveData.filter(game => 
    game.status === 'completed'
  ).slice(0, Math.min(4, limit)); // Limit completed games

  const upcomingGames = gamesWithLiveData.filter(game => 
    game.status === 'scheduled'
  ).slice(0, Math.min(4, limit)); // Limit upcoming games

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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '120px',
          color: '#696775',
          fontSize: '16px',
          textAlign: 'center',
          gap: '12px',
        }}>
          <div>{error}</div>
          {error.includes('No tournament found') && (
            <a 
              href="/admin" 
              style={{
                color: '#6366f1',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                padding: '8px 16px',
                border: '1px solid #6366f1',
                borderRadius: '6px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#6366f1';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6366f1';
              }}
            >
              Go to Admin
            </a>
          )}
        </div>
      </div>
    );
  }

  if (liveGames.length === 0 && completedGames.length === 0 && upcomingGames.length === 0) {
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
          No games found with known teams
        </div>
      </div>
    );
  }

  const hasLiveGames = liveGames.length > 0;

  return (
    <div style={{
      background: '#fdfcfe',
      borderRadius: '12px',
      border: '1px solid #e4e2e8',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid #e9e8eb',
        background: '#f9f8fc',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#1c1b20',
          }}>
            Games
          </h2>
          
          {/* Live connection indicator */}
          {hasLiveGames && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: scoresConnected ? '#22c55e' : '#f59e0b',
                animation: scoresConnected ? 'pulse 2s infinite' : 'none',
              }}></div>
              <span style={{
                fontSize: '12px',
                color: scoresConnected ? '#22c55e' : '#f59e0b',
                fontWeight: '500',
              }}>
                {scoresConnected ? 'Live Updates' : 'Connecting...'}
              </span>
            </div>
          )}
        </div>
        
        {hasLiveGames && (
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
      {hasLiveGames && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(34, 197, 94, 0.08) 100%)',
          borderBottom: (completedGames.length > 0 || upcomingGames.length > 0) ? '3px solid #22c55e' : 'none',
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
                <LiveGameCard game={game} isLive={true} teamRecords={recordsByTeamId} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Games Section */}
      {completedGames.length > 0 && (
        <div style={{
          background: '#fdfcfe',
        }}>
          {/* Recent Games Header */}
          <div style={{
            padding: '20px 24px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: hasLiveGames ? 'none' : '1px solid #e9e8eb',
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
              {completedGames.length} Completed
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
            {completedGames.map((game, index) => (
              <div key={game.id} style={{
                borderBottom: index < completedGames.length - 1 ? '1px solid #e9e8eb' : 'none',
              }}>
                <LiveGameCard game={game} isLive={false} teamRecords={recordsByTeamId} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Games Section */}
      {upcomingGames.length > 0 && (
        <div style={{
          background: '#fdfcfe',
        }}>
          {/* Upcoming Games Header */}
          <div style={{
            padding: '20px 24px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: (hasLiveGames || completedGames.length > 0) ? '1px solid #e9e8eb' : 'none',
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
                background: '#3b82f6',
              }}></div>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}>
                📅 Upcoming Games
              </span>
            </div>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#2563eb',
            }}>
              {upcomingGames.length} Scheduled
            </div>
          </div>
          
          {/* Upcoming Games List */}
          <div style={{
            background: '#fdfcfe',
            margin: '0 16px 16px',
            borderRadius: '8px',
            border: '1px solid #dbeafe',
            overflow: 'hidden',
          }}>
            {upcomingGames.map((game, index) => (
              <div key={game.id} style={{
                borderBottom: index < upcomingGames.length - 1 ? '1px solid #e9e8eb' : 'none',
              }}>
                <LiveGameCard game={game} isLive={false} teamRecords={recordsByTeamId} />
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

// Enhanced game card component with live updates
interface LiveGameCardProps {
  game: GameDisplayData;
  isLive: boolean;
  teamRecords?: Map<string, { wins: number; losses: number }>;
}

function LiveGameCard({ game, isLive, teamRecords }: LiveGameCardProps) {
  const handleGameClick = () => {
    window.location.href = `/game/${game.id}`;
  };

  return (
    <div
      onClick={handleGameClick}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        background: isLive ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isLive ? 'rgba(255, 255, 255, 0.9)' : '#f9f8fc';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isLive ? 'rgba(255, 255, 255, 0.7)' : 'transparent';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Team names and scores */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}>
                         <span style={{
               fontSize: '13px',
               fontWeight: '500',
               color: '#1c1b20',
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               whiteSpace: 'nowrap',
               maxWidth: '65%',
            }}>
              {(() => {
                const rec = teamRecords?.get(game.away_team.id) || { wins: 0, losses: 0 };
                return `${game.away_team.name} (${rec.wins}-${rec.losses})`;
              })()}
             </span>
             <span style={{
               fontSize: '16px',
               fontWeight: '700',
               color: '#1c1b20',
               minWidth: '24px',
             }}>
               {game.away_score}
             </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
                         <span style={{
               fontSize: '13px',
               fontWeight: '500',
               color: '#1c1b20',
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               whiteSpace: 'nowrap',
               maxWidth: '65%',
            }}>
              {(() => {
                const rec = teamRecords?.get(game.home_team.id) || { wins: 0, losses: 0 };
                return `${game.home_team.name} (${rec.wins}-${rec.losses})`;
              })()}
             </span>
             <span style={{
               fontSize: '16px',
               fontWeight: '700',
               color: '#1c1b20',
               minWidth: '24px',
             }}>
               {game.home_score}
             </span>
          </div>
        </div>

        {/* Game status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            textAlign: 'center',
            minWidth: '60px',
          }}>
            {game.status === 'in_progress' ? (
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#22c55e',
                }}>
                  LIVE
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#696775',
                  marginTop: '2px',
                }}>
                  Inning {game.current_inning || '?'}
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#696775',
                }}>
                  {game.status === 'completed' ? 'FINAL' : 'SCHEDULED'}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#8b8a94',
                  marginTop: '2px',
                }}>
                  {game.innings} inn
                </div>
              </div>
            )}
          </div>

          {/* Live indicator dot */}
          {isLive && (
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse 2s infinite',
            }}></div>
          )}
        </div>
      </div>

      {/* Tournament info */}
      {game.tournament && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #e9e8eb',
          fontSize: '11px',
          color: '#8b8a94',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          🏆 {game.tournament.name}
        </div>
      )}
    </div>
  );
} 