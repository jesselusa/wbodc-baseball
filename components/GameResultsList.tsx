import React, { useState } from 'react';
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
  game_type?: 'round_robin' | 'bracket' | 'exhibition';
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
  is_round_robin?: boolean;
  round_number?: number;
  game_number?: number;
  bracket_position?: string;
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
  groupByPhase?: boolean;
  showTournamentInfo?: boolean;
  onGameClick?: (gameId: string) => void;
  onTournamentClick?: (tournamentId: string) => void;
}

/**
 * GameResultsList component for displaying historical game results
 * Shows game cards with scores and inning-by-inning scoreboards
 */
export default function GameResultsList({
  games,
  loading = false,
  className = '',
  groupByPhase = false,
  showTournamentInfo = true,
  onGameClick,
  onTournamentClick
}: GameResultsListProps) {
  const router = useRouter();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleGameClick = (gameId: string) => {
    if (onGameClick) {
      onGameClick(gameId);
    } else {
    router.push(`/game/${gameId}`);
    }
  };

  const handleTournamentClick = (tournamentId: string) => {
    if (onTournamentClick) {
      onTournamentClick(tournamentId);
    }
  };

  const toggleGroupExpansion = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatGamePhase = (game: HistoricalGame) => {
    // Use tournament system data for better phase detection
    if (game.is_round_robin) {
      return `Round ${game.round_number || 1}`;
    }
    
    if (game.bracket_position) {
      return game.bracket_position;
    }
    
    // Fallback to old logic for legacy games
    return `Game ${game.game_number || 1}`;
  };



  // Group games by phase if requested
  const groupedGames = React.useMemo(() => {
    if (groupByPhase) {
      
      // Separate games by type
      const poolPlayGames = games.filter(game => 
        game.game_type === 'round_robin' || game.game_type === undefined
      );
      const bracketGames = games.filter(game => 
        game.game_type === 'bracket'
      );
      


      const gamesBySection: { [key: string]: HistoricalGame[] } = {};

      // Handle Pool Play games
      if (poolPlayGames.length > 0) {
        const teams = new Set<string>();
        poolPlayGames.forEach(game => {
          if (game.home_team?.id) teams.add(game.home_team.id);
          if (game.away_team?.id) teams.add(game.away_team.id);
        });
        
        if (teams.size === 4 && poolPlayGames.length === 6) {
          // This is a 4-team round-robin tournament, organize into Pool Play rounds
          const poolPlayRounds: { [key: string]: HistoricalGame[] } = {
            'Pool Play - Round 1': [],
            'Pool Play - Round 2': [],
            'Pool Play - Round 3': []
          };
          
          // Smart distribution ensuring each team plays exactly once per round
          const teamsArray = Array.from(teams).sort();
          const usedInRound = new Map<number, Set<string>>();
          
          // Initialize round tracking
          for (let i = 1; i <= 3; i++) {
            usedInRound.set(i, new Set());
          }
          
          // Assign games to rounds ensuring each team plays once per round
          poolPlayGames.forEach(game => {
            for (let roundNum = 1; roundNum <= 3; roundNum++) {
              const usedTeams = usedInRound.get(roundNum)!;
              
              // Check if both teams are available for this round
              if (!usedTeams.has(game.home_team.id) && !usedTeams.has(game.away_team.id)) {
                poolPlayRounds[`Pool Play - Round ${roundNum}`].push(game);
                usedTeams.add(game.home_team.id);
                usedTeams.add(game.away_team.id);
                break;
              }
            }
          });
          
          // Add pool play rounds to the main games object
          Object.assign(gamesBySection, poolPlayRounds);
        } else {
          // Check if games are explicitly marked as round-robin with round numbers
          const hasRoundRobin = poolPlayGames.some(g => g.is_round_robin === true);
          if (hasRoundRobin && poolPlayGames.some(g => g.round_number)) {
            // Use explicit round numbers if available
            const rounds: { [key: string]: HistoricalGame[] } = {};
            poolPlayGames.forEach(game => {
              const roundKey = `Pool Play - Round ${game.round_number || 1}`;
              if (!rounds[roundKey]) {
                rounds[roundKey] = [];
              }
              rounds[roundKey].push(game);
            });
            Object.assign(gamesBySection, rounds);
          } else {
            gamesBySection['Pool Play'] = poolPlayGames;
          }
        }
      }

              // Handle Bracket Play games
        if (bracketGames.length > 0) {

          // Group bracket games by round
          const bracketRounds: { [key: string]: HistoricalGame[] } = {};

          bracketGames.forEach(game => {
            // Use bracket data if available
            const bracketInfo = (game as any).brackets?.[0];
            let roundName: string;



            if (bracketInfo?.round_name) {
              roundName = `Bracket Play - ${bracketInfo.round_name}`;
            } else {
              // Fallback logic for games without bracket data
              const gameIndex = bracketGames.indexOf(game) + 1;

              if (bracketGames.length === 1) {
                roundName = 'Bracket Play - Finals';
              } else if (bracketGames.length === 2) {
                roundName = 'Bracket Play - Finals';
              } else if (bracketGames.length === 3) {
                // 3 games = 2 semifinals + 1 final
                if (gameIndex <= 2) {
                  roundName = 'Bracket Play - Semifinals';
                } else {
                  roundName = 'Bracket Play - Finals';
                }
              } else {
                // More complex bracket structure
                if (gameIndex <= Math.floor(bracketGames.length / 2)) {
                  roundName = 'Bracket Play - Semifinals';
                } else {
                  roundName = 'Bracket Play - Finals';
                }
              }
            }



            if (!bracketRounds[roundName]) {
              bracketRounds[roundName] = [];
            }
            bracketRounds[roundName].push(game);
          });

          // Add bracket rounds to the main games object
          Object.assign(gamesBySection, bracketRounds);
        }

      // Return the combined sections or fallback
      if (Object.keys(gamesBySection).length > 0) {
        return gamesBySection;
      }
      
      return { 'Other Games': games };
    }

    const groups: { [key: string]: HistoricalGame[] } = {};
    
    games.forEach(game => {
      let groupKey: string;
      
      if (game.is_round_robin) {
        groupKey = 'Round Robin';
      } else if (game.bracket_position) {
        // Extract round from bracket position (e.g., "Quarterfinals", "Semifinals", "Championship")
        if (game.bracket_position.toLowerCase().includes('championship')) {
          groupKey = 'Championship';
        } else if (game.bracket_position.toLowerCase().includes('semifinal')) {
          groupKey = 'Semifinals';
        } else if (game.bracket_position.toLowerCase().includes('quarterfinal')) {
          groupKey = 'Quarterfinals';
        } else {
          groupKey = game.bracket_position;
        }
      } else {
        groupKey = 'Other Games';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(game);
    });

    // Sort groups by tournament progression
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const order = ['Round Robin', 'Quarterfinals', 'Semifinals', 'Championship', 'Other Games'];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    const sortedGroups: { [key: string]: HistoricalGame[] } = {};
    sortedGroupKeys.forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => {
        // Sort games within group by date
        const dateA = new Date(a.started_at || a.completed_at || '').getTime();
        const dateB = new Date(b.started_at || b.completed_at || '').getTime();
        return dateA - dateB;
      });
    });

    return sortedGroups;
  }, [games, groupByPhase]);

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

  const createScoreboardData = (game: HistoricalGame, homeTeamName?: string, awayTeamName?: string): ScoreBoardData | null => {
    if (!game.innings_data || game.innings_data.length === 0) {
      return null;
    }

    return {
      home_team: {
        name: homeTeamName || game.home_team?.name || 'TBD',
        total_runs: game.home_score
      },
      away_team: {
        name: awayTeamName || game.away_team?.name || 'TBD',
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

  const renderGameCard = (game: HistoricalGame, gameNumber: number, roundNumber: number) => {
        const winner = getWinnerTeam(game);
    const isGameStarted = game.status !== 'scheduled' || game.started_at;
    
    // Check if this is a bracket game with seed placeholders
    const bracketInfo = (game as any).brackets?.[0];
    const bracketHomeSeed = bracketInfo?.home_seed;
    const bracketAwaySeed = bracketInfo?.away_seed;
    const isBracketGame = game.game_type === 'bracket';
    
    // Determine team display names
    const homeTeamName = game.home_team?.name === 'Unknown Team' ? 'TBD' : (game.home_team?.name || 'TBD');
    const awayTeamName = game.away_team?.name === 'Unknown Team' ? 'TBD' : (game.away_team?.name || 'TBD');
    
    const scoreboardData = createScoreboardData(game, homeTeamName, awayTeamName);
    
    // Round colors
    const roundColors = {
      1: { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af' }, // Blue - Pool Round 1
      2: { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' }, // Green - Pool Round 2  
      3: { bg: '#fef3c7', border: '#fde68a', text: '#92400e' }, // Amber - Pool Round 3
      4: { bg: '#f3e8ff', border: '#d8b4fe', text: '#7c3aed' }, // Purple - Semifinals
      5: { bg: '#fce7f3', border: '#f9a8d4', text: '#be185d' }  // Pink - Finals
    };
    
    const colors = roundColors[roundNumber as keyof typeof roundColors] || roundColors[1];
        
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
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`
                }}
              >
                Game {gameNumber}
                  </span>
              {game.tournament && showTournamentInfo && (
                    <span 
                      style={{ 
                        marginLeft: '8px',
                        fontSize: '12px',
                    color: '#696775',
                    cursor: onTournamentClick ? 'pointer' : 'default',
                    textDecoration: onTournamentClick ? 'underline' : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTournamentClick(game.tournament!.id);
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
                {awayTeamName}
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
                {isGameStarted ? game.away_score : '-'}
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
                {homeTeamName}
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
                {isGameStarted ? game.home_score : '-'}
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
  };

  const renderGroupHeader = (groupName: string, gameCount: number) => {
    return (
      <div
        style={{
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '12px 16px',
          userSelect: 'none'
        }}
      >
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#374151', 
            margin: 0 
          }}>
            {groupName}
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            margin: '4px 0 0 0' 
          }}>
            {gameCount} game{gameCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Object.entries(groupedGames).map(([groupName, groupGames]) => {
        const isPoolPlay = groupName.startsWith('Pool Play');
        const showHeader = groupByPhase || isPoolPlay; // Show headers for Pool Play rounds or when grouping by phase
        const isBracketPlay = groupName.startsWith('Bracket Play');
        const isExpanded = !groupByPhase || isPoolPlay || isBracketPlay || expandedGroups.has(groupName); // Pool Play and Bracket Play always expanded
        
        return (
          <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {showHeader && renderGroupHeader(groupName, groupGames.length)}
            
            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {groupGames.map((game, index) => {
                  // Calculate game number and round based on section type
                  let gameNumber: number;
                  let roundNum: number;
                  
                  if (isPoolPlay) {
                    // Pool Play rounds
                    roundNum = parseInt(groupName.split('Round ')[1]);
                    gameNumber = (roundNum - 1) * 2 + index + 1;
                  } else if (groupName.startsWith('Bracket Play')) {
                    // Bracket Play rounds - use bracket info if available
                    const bracketInfo = (game as any).brackets?.[0];
                    roundNum = bracketInfo?.round_number || (groupName.includes('Semifinals') ? 4 : 5);
                    gameNumber = bracketInfo?.game_number || (6 + index + 1); // Fallback to sequential
                  } else {
                    // Default numbering
                    roundNum = 1;
                    gameNumber = index + 1;
                  }
                  
                  return renderGameCard(game, gameNumber, roundNum);
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 