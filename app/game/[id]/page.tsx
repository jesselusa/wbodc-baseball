'use client';

import { Metadata } from 'next';
import { notFound, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchGameById, getLiveGameStatus, fetchTeamPlayers, supabase } from '../../../lib/api';
import { GameDisplayData, LiveGameStatus, GameSnapshot, Player } from '../../../lib/types';
import { useViewerGameUpdates } from '../../../hooks/useViewerGameUpdates';
import ScoreBoard from '../../../components/ScoreBoard';
import BackButton from '../../../components/BackButton';
import { ConnectionStatus } from '../../../components/ConnectionStatus';

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const [gameId, setGameId] = useState<string>('');
  const [initialGame, setInitialGame] = useState<GameDisplayData | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveGameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [inningScores, setInningScores] = useState<any[]>([]);

  const router = useRouter();

  // Real-time game updates subscription (viewer-optimized)
  const {
    gameSnapshot: snapshot,
    connectionStatus,
    isConnected,
    hasError,
    reconnect,
    lastUpdateTime
  } = useViewerGameUpdates({
    gameId,
    autoConnect: !!gameId,
    onError: (error) => console.error('Real-time error:', error)
  });

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

  // Navigation helper
  const handleTournamentClick = () => {
    if (initialGame?.tournament) {
      const gameDate = initialGame.scheduled_start || initialGame.actual_start;
      if (gameDate) {
        const year = new Date(gameDate).getFullYear();
        router.push(`/results?year=${year}`);
      } else {
        // Fallback to current year if no date available
        const currentYear = new Date().getFullYear();
        router.push(`/results?year=${currentYear}`);
      }
    }
  };

  // Format game phase (same logic as results page)
  const formatGamePhase = () => {
    // For now, we'll use a simple heuristic based on game timing
    // In a real implementation, you might want to store this data
    if (!initialGame) return 'Tournament';
    
    // This is a simplified version - in reality you'd want to determine
    // this based on tournament structure or explicit game phase data
    const gameDate = new Date(initialGame.actual_start || initialGame.scheduled_start || '');
    const hour = gameDate.getHours();
    
    // Simple heuristic: early games are pool play, later games are elimination
    if (hour < 14) {
      return 'Pool Play';
    } else if (hour < 17) {
      return 'Semifinal';
    } else {
      return 'Championship';
    }
  };

  // Fetch team players
  const fetchPlayersForGame = async () => {
    if (!initialGame) return;
    
    setLoadingPlayers(true);
    try {
      const [homeResponse, awayResponse] = await Promise.all([
        fetchTeamPlayers(initialGame.home_team.id, initialGame.tournament?.id),
        fetchTeamPlayers(initialGame.away_team.id, initialGame.tournament?.id)
      ]);

      if (homeResponse.success) {
        setHomePlayers(homeResponse.data);
      }
      if (awayResponse.success) {
        setAwayPlayers(awayResponse.data);
      }
    } catch (error) {
      console.error('Error fetching team players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Fetch inning scores for the game
  const fetchInningScores = async () => {
    if (!initialGame) return;
    
    try {
      const { data: innings, error } = await supabase
        .from('inning_scores')
        .select('game_id, inning, home_runs, away_runs')
        .eq('game_id', initialGame.id)
        .order('inning', { ascending: true });

      if (!error && innings) {
        setInningScores(innings);
      }
    } catch (error) {
      console.error('Error fetching inning scores:', error);
    }
  };

  // Extract gameId from params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setGameId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Load initial game data
  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        setError(null);

        const [gameResponse, statusResponse] = await Promise.all([
          fetchGameById(gameId),
          getLiveGameStatus(gameId)
        ]);

        if (!gameResponse.success || !gameResponse.data) {
          setError('Game not found');
          return;
        }

        setInitialGame(gameResponse.data);
        
        if (statusResponse) {
          setLiveStatus(statusResponse);
        }

      } catch (err) {
        setError('Failed to load game data');
        console.error('Error loading game data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [gameId]);

  // Fetch players and inning scores when game data is loaded
  useEffect(() => {
    if (initialGame) {
      fetchPlayersForGame();
      fetchInningScores();
    }
  }, [initialGame]);

  // Helper function to get current game state (real-time snapshot or fallback to initial data)
  const getCurrentGameState = () => {
    if (snapshot) {
      // Use real-time snapshot data
      return {
        status: snapshot.status,
        score_home: snapshot.score_home,
        score_away: snapshot.score_away,
        current_inning: snapshot.current_inning,
        is_top_of_inning: snapshot.is_top_of_inning,
        outs: snapshot.outs,
        balls: snapshot.balls,
        strikes: snapshot.strikes,
        base_runners: snapshot.base_runners,
        batter_id: snapshot.batter_id,
        catcher_id: snapshot.catcher_id
      };
    }

    if (liveStatus) {
      // Use live status data
      return {
        status: liveStatus.status,
        score_home: liveStatus.score_home,
        score_away: liveStatus.score_away,
        current_inning: liveStatus.current_inning,
        is_top_of_inning: liveStatus.is_top_of_inning,
        outs: liveStatus.outs,
        balls: liveStatus.balls,
        strikes: liveStatus.strikes,
        base_runners: liveStatus.base_runners,
        batter_name: liveStatus.batter_name,
        catcher_name: liveStatus.catcher_name
      };
    }

    if (initialGame) {
      // Fallback to initial game data
      return {
        status: initialGame.status,
        score_home: initialGame.home_score,
        score_away: initialGame.away_score,
        current_inning: undefined,
        is_top_of_inning: undefined,
        outs: undefined,
        balls: undefined,
        strikes: undefined,
        base_runners: undefined,
        batter_name: undefined,
        catcher_name: undefined
      };
    }

    return null;
  };

  const currentState = getCurrentGameState();

  if (loading) {
    return (
      <main 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b20'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game details...</p>
        </div>
      </main>
    );
  }

  if (error || !initialGame) {
    return (
      <main 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b20'
        }}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested game could not be found.'}</p>
          <BackButton />
        </div>
      </main>
    );
  }

  const isGameInProgress = currentState?.status === 'in_progress';

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
            Game Details
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#696775',
            margin: '0',
            fontWeight: '500'
          }}>
            Live game information and scoring details
          </p>
        </div>

              {/* Breadcrumb Navigation */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '0 12px 16px' : '0 24px 16px'
        }}>
          <nav style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: '#696775',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              ← Back
            </button>
            <span style={{ margin: '0 8px', color: '#696775' }}>/</span>
            <span style={{ color: '#312f36' }}>Game Details</span>
          </nav>
        </div>

        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%'
        }}>
        {/* Connection Status for Live Games */}
        {isGameInProgress && (
          <div style={{ 
            marginBottom: '16px', 
            display: 'flex', 
            justifyContent: 'center' 
          }}>
            <ConnectionStatus 
              status={connectionStatus}
              onReconnect={reconnect}
              size="small"
            />
          </div>
        )}

        {/* Game Card - Same Structure as Results Page */}
        <section style={{ 
          width: '100%', 
          marginBottom: isMobile ? '24px' : '32px'
        }}>
          {initialGame && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e4e2e8',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {/* Game Card Header */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <span 
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      {formatGamePhase()}
                    </span>
                    {initialGame.tournament && (
                      <button 
                        onClick={handleTournamentClick}
                        style={{ 
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#696775',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontFamily: 'inherit',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = '#696775';
                        }}
                      >
                        {initialGame.tournament.name}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span 
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        background: initialGame.status === 'completed' ? '#f3f4f6' : initialGame.status === 'in_progress' ? '#dcfce7' : '#fefce8',
                        color: initialGame.status === 'completed' ? '#374151' : initialGame.status === 'in_progress' ? '#166534' : '#a16207',
                        border: `1px solid ${initialGame.status === 'completed' ? '#d1d5db' : initialGame.status === 'in_progress' ? '#bbf7d0' : '#fde047'}`
                      }}
                    >
                      {initialGame.status === 'completed' ? 'Final' : initialGame.status === 'in_progress' ? 'Live' : 'Scheduled'}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '12px',
                        color: '#696775'
                      }}
                    >
                      {(initialGame.actual_start || initialGame.scheduled_start) ? new Date(initialGame.actual_start || initialGame.scheduled_start!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      }) : 'Time TBD'}
                    </span>
                  </div>
                </div>

                {/* Teams and Scores */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                  {/* Away Team */}
                  <div style={{ textAlign: 'center' }}>
                    <div 
                      style={{ 
                        fontWeight: (currentState?.score_away ?? initialGame.away_score) > (currentState?.score_home ?? initialGame.home_score) ? '700' : '500',
                        marginBottom: '8px',
                        color: (currentState?.score_away ?? initialGame.away_score) > (currentState?.score_home ?? initialGame.home_score) ? '#1c1b20' : '#374151'
                      }}
                    >
                      {initialGame.away_team.name}
                      {(currentState?.score_away ?? initialGame.away_score) > (currentState?.score_home ?? initialGame.home_score) && (
                        <span style={{ marginLeft: '4px', color: '#059669' }}>👑</span>
                      )}
                    </div>
                    <div 
                      style={{ 
                        fontSize: '24px',
                        fontWeight: '700',
                        color: (currentState?.score_away ?? initialGame.away_score) > (currentState?.score_home ?? initialGame.home_score) ? '#059669' : '#1c1b20'
                      }}
                    >
                      {currentState?.score_away ?? initialGame.away_score}
                    </div>
                  </div>

                  {/* VS */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#696775', fontWeight: '500' }}>VS</span>
                  </div>

                  {/* Home Team */}
                  <div style={{ textAlign: 'center' }}>
                    <div 
                      style={{ 
                        fontWeight: (currentState?.score_home ?? initialGame.home_score) > (currentState?.score_away ?? initialGame.away_score) ? '700' : '500',
                        marginBottom: '8px',
                        color: (currentState?.score_home ?? initialGame.home_score) > (currentState?.score_away ?? initialGame.away_score) ? '#1c1b20' : '#374151'
                      }}
                    >
                      {initialGame.home_team.name}
                      {(currentState?.score_home ?? initialGame.home_score) > (currentState?.score_away ?? initialGame.away_score) && (
                        <span style={{ marginLeft: '4px', color: '#059669' }}>👑</span>
                      )}
                    </div>
                    <div 
                      style={{ 
                        fontSize: '24px',
                        fontWeight: '700',
                        color: (currentState?.score_home ?? initialGame.home_score) > (currentState?.score_away ?? initialGame.away_score) ? '#059669' : '#1c1b20'
                      }}
                    >
                      {currentState?.score_home ?? initialGame.home_score}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoreboard Section */}
              <div style={{ borderTop: '1px solid #e4e2e8', padding: '20px 24px' }}>
                <ScoreBoard 
                  data={{
                    home_team: {
                      name: initialGame.home_team.name,
                      total_runs: currentState?.score_home ?? initialGame.home_score
                    },
                    away_team: {
                      name: initialGame.away_team.name,
                      total_runs: currentState?.score_away ?? initialGame.away_score
                    },
                    innings: inningScores,
                    total_innings: initialGame.innings || 5
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Team Rosters section */}
        <section style={{ 
          width: '100%', 
          marginBottom: isMobile ? '24px' : '32px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '24px' : '32px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Away Team Players */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e4e2e8',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#f9fafb',
                borderBottom: '1px solid #e4e2e8',
                padding: '16px 20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0'
                }}>
                  {initialGame?.away_team.name} Roster
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                {loadingPlayers ? (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    Loading players...
                  </div>
                ) : awayPlayers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {awayPlayers.map((player) => (
                      <div key={player.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1f2937'
                          }}>
                            {player.name}
                          </div>
                          {player.nickname && (
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280'
                            }}>
                              "{player.nickname}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    No players listed
                  </div>
                )}
              </div>
            </div>

            {/* Home Team Players */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e4e2e8',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#f9fafb',
                borderBottom: '1px solid #e4e2e8',
                padding: '16px 20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0'
                }}>
                  {initialGame?.home_team.name} Roster
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                {loadingPlayers ? (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    Loading players...
                  </div>
                ) : homePlayers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {homePlayers.map((player) => (
                      <div key={player.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1f2937'
                          }}>
                            {player.name}
                          </div>
                          {player.nickname && (
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280'
                            }}>
                              "{player.nickname}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    No players listed
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Status Indicator */}
        {isGameInProgress && (
          <section style={{ 
            width: '100%', 
            marginBottom: '24px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '14px',
                background: isConnected 
                  ? '#dcfce7' 
                  : hasError 
                    ? '#fef2f2'
                    : '#fefce8',
                color: isConnected 
                  ? '#166534' 
                  : hasError 
                    ? '#991b1b'
                    : '#a16207'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '8px',
                  background: isConnected ? '#22c55e' : hasError ? '#ef4444' : '#eab308'
                }}></div>
                {isConnected ? 'Live Updates' : hasError ? 'Connection Error' : 'Connecting...'}
              </div>
              
                             {lastUpdateTime && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>
                   Last update: {lastUpdateTime.toLocaleTimeString()}
                 </p>
               )}
            </div>
          </section>
        )}

        {/* Error Messages */}
        {hasError && (
          <section style={{ 
            width: '100%', 
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ 
                  color: '#f87171', 
                  fontSize: '18px', 
                  marginRight: '12px' 
                }}>⚠️</div>
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#991b1b',
                    margin: '0 0 4px 0'
                  }}>
                    Connection Issues
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#b91c1c',
                    margin: '0 0 12px 0'
                  }}>
                    {connectionStatus.error || 'Unable to connect to live updates'}
                  </p>
                  <div>
                    <button
                      onClick={reconnect}
                      style={{
                        fontSize: '14px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: '1px solid #fecaca',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fef2f2';
                      }}
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}



        {/* Navigation section */}
        <nav style={{ marginTop: '32px', textAlign: 'center', width: '100%' }}>
          <BackButton />
        </nav>
        </div>
      </div>
    </div>
  );
} 