import React from 'react';
import { useRouter } from 'next/navigation';
import ScoreBoard, { ScoreBoardData } from './ScoreBoard';

export interface HistoricalGame {
  id: string;
  status: string;
  total_innings: number;
  started_at?: string;
  completed_at?: string;
  home_score: number;
  away_score: number;
  home_team: {
    id: string;
    name: string;
  };
  away_team: {
    id: string;
    name: string;
  };
  tournament?: {
    id: string;
    name: string;
    location?: string;
  };
  innings_data?: Array<{
    inning: number;
    home_runs: number;
    away_runs: number;
  }>;
}

export interface GameResultsListProps {
  games: HistoricalGame[];
  loading?: boolean;
  className?: string;
}

/**
 * GameResultsList component for displaying historical game results
 * Shows game cards with scores and inning-by-inning scoreboards
 */
export default function GameResultsList({
  games,
  loading = false,
  className = ''
}: GameResultsListProps) {
  const router = useRouter();

  const handleGameClick = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  const formatGamePhase = (game: HistoricalGame, index: number) => {
    // Simple phase detection based on game order and timing
    const totalGames = games.length;
    
    if (totalGames <= 3) {
      return `Game ${index + 1}`;
    }
    
    if (index < totalGames - 3) {
      return 'Pool Play';
    } else if (index < totalGames - 1) {
      return 'Semifinal';
    } else {
      return 'Championship';
    }
  };

  const formatGameTime = (startTime?: string) => {
    if (!startTime) return 'Time TBD';
    return new Date(startTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getWinnerTeam = (game: HistoricalGame) => {
    if (game.home_score > game.away_score) {
      return { team: game.home_team, isHome: true };
    } else if (game.away_score > game.home_score) {
      return { team: game.away_team, isHome: false };
    }
    return null; // Tie (shouldn't happen in baseball, but just in case)
  };

  const createScoreboardData = (game: HistoricalGame): ScoreBoardData | null => {
    if (!game.innings_data || game.innings_data.length === 0) {
      return null;
    }

    return {
      home_team: {
        name: game.home_team.name,
        total_runs: game.home_score
      },
      away_team: {
        name: game.away_team.name,
        total_runs: game.away_score
      },
      innings: game.innings_data.map(inning => ({
        inning: inning.inning,
        home_runs: inning.home_runs,
        away_runs: inning.away_runs
      })),
      total_innings: game.total_innings
    };
  };

  if (loading) {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e4e2e8',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '20px 24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px', width: '96px' }}></div>
              <div style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px', width: '64px' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '20px', background: '#f3f4f6', borderRadius: '4px', width: '80px', margin: '0 auto 8px' }}></div>
                <div style={{ height: '32px', background: '#f3f4f6', borderRadius: '4px', width: '48px', margin: '0 auto' }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px', width: '32px', margin: '0 auto' }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '20px', background: '#f3f4f6', borderRadius: '4px', width: '80px', margin: '0 auto 8px' }}></div>
                <div style={{ height: '32px', background: '#f3f4f6', borderRadius: '4px', width: '48px', margin: '0 auto' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div 
        className={className}
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e4e2e8',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '48px 32px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
        <h3 
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1c1b20',
            margin: '0 0 8px 0'
          }}
        >
          No Games Found
        </h3>
        <p 
          style={{
            fontSize: '14px',
            color: '#696775',
            margin: '0'
          }}
        >
          No completed games found for the selected tournament.
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {games.map((game, index) => {
        const winner = getWinnerTeam(game);
        const scoreboardData = createScoreboardData(game);
        
        return (
          <div
            key={game.id}
            onClick={() => handleGameClick(game.id)}
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e4e2e8',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
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
                    {formatGamePhase(game, index)}
                  </span>
                  {game.tournament && (
                    <span 
                      style={{ 
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: '#696775'
                      }}
                    >
                      {game.tournament.name}
                    </span>
                  )}
                </div>
                <span 
                  style={{ 
                    fontSize: '12px',
                    color: '#696775'
                  }}
                >
                  {formatGameTime(game.started_at)}
                </span>
              </div>

              {/* Teams and Scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                {/* Away Team */}
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{ 
                      fontWeight: winner && !winner.isHome ? '700' : '500',
                      marginBottom: '8px',
                      color: winner && !winner.isHome ? '#1c1b20' : '#374151'
                    }}
                  >
                    {game.away_team.name}
                    {winner && !winner.isHome && (
                      <span style={{ marginLeft: '4px', color: '#059669' }}>👑</span>
                    )}
                  </div>
                  <div 
                    style={{ 
                      fontSize: '24px',
                      fontWeight: '700',
                      color: winner && !winner.isHome ? '#059669' : '#1c1b20'
                    }}
                  >
                    {game.away_score}
                  </div>
                </div>

                {/* VS */}
                <div style={{ textAlign: 'center' }}>
                  <span 
                    style={{ 
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#696775'
                    }}
                  >
                    VS
                  </span>
                </div>

                {/* Home Team */}
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{ 
                      fontWeight: winner && winner.isHome ? '700' : '500',
                      marginBottom: '8px',
                      color: winner && winner.isHome ? '#1c1b20' : '#374151'
                    }}
                  >
                    {game.home_team.name}
                    {winner && winner.isHome && (
                      <span style={{ marginLeft: '4px', color: '#059669' }}>👑</span>
                    )}
                  </div>
                  <div 
                    style={{ 
                      fontSize: '24px',
                      fontWeight: '700',
                      color: winner && winner.isHome ? '#059669' : '#1c1b20'
                    }}
                  >
                    {game.home_score}
                  </div>
                </div>
              </div>
            </div>

            {/* Always Show Scoreboard */}
            {scoreboardData && (
              <div style={{ borderTop: '1px solid #e4e2e8', padding: '20px 24px' }}>
                <ScoreBoard data={scoreboardData} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 