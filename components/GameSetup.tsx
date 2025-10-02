import React, { useState, useEffect } from 'react';
import { 
  Player, 
  GameSetupData,
  GameStartEventPayload,
  TournamentRecord
} from '../lib/types';

// Interface for tournament games API response
interface TournamentGame {
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
  game_type?: string;
  brackets?: Array<{
    round_number: number;
    round_name: string;
    game_number: number;
    home_seed: number;
    away_seed: number;
    next_game_id?: string;
    bracket_type: string;
  }>;
}
import { 
  fetchPlayers,
  fetchTeamPlayers,
  submitEvent,
  getCurrentTournament
} from '../lib/api';

export interface GameSetupProps {
  gameId: string | null;
  onGameStarted?: (gameData: GameSetupData) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * GameSetup component for starting existing tournament games
 * Allows selection of a scheduled game and umpire
 */
export function GameSetup({ 
  gameId, 
  onGameStarted, 
  onCancel, 
  className = '' 
}: GameSetupProps) {
  // Data state
  const [tournament, setTournament] = useState<TournamentRecord | null>(null);
  const [games, setGames] = useState<TournamentGame[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // Form state
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [innings, setInnings] = useState<3 | 5 | 7 | 9>(7);
  const [umpireId, setUmpireId] = useState<string>('');
  const [scoringMethod, setScoringMethod] = useState<'live' | 'quick_result'>('live');
  const [quickHomeScore, setQuickHomeScore] = useState<number>(0);
  const [quickAwayScore, setQuickAwayScore] = useState<number>(0);
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [showQuickConfirm, setShowQuickConfirm] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get current tournament and its games
        const [tournamentResponse, playersResponse] = await Promise.all([
          getCurrentTournament(),
          fetchPlayers()
        ]);

        if (tournamentResponse.success && tournamentResponse.data) {
          const currentTournament = tournamentResponse.data;
          setTournament(currentTournament);
          
          // Set default innings from tournament settings
          if (currentTournament.pool_play_innings) {
            setInnings(currentTournament.pool_play_innings as 3 | 5 | 7 | 9);
          }

          // Fetch tournament games
          const gamesResponse = await fetch(`/api/tournaments/${currentTournament.id}/games`);
          const gamesData = await gamesResponse.json();

          if (gamesResponse.ok && gamesData.success) {
            // Filter to show games that can be started or rejoined
            // Allow: scheduled games (to start) and in_progress games (to rejoin)
            const availableGames = gamesData.data?.filter((game: TournamentGame) => {
              // Allow scheduled games (to start) and active games (to rejoin as umpire)
              const isAvailable = game.status === 'scheduled' || game.status === 'in_progress';
              
              // Ensure both teams are real (not placeholder teams)
              const hasValidTeams = game.home_team?.name !== 'Unknown Team' && 
                                   game.away_team?.name !== 'Unknown Team' &&
                                   game.home_team?.name !== 'TBD' &&
                                   game.away_team?.name !== 'TBD' &&
                                   game.home_team?.name &&
                                   game.away_team?.name;
              
              return isAvailable && hasValidTeams;
            }) || [];
            
            setGames(availableGames);

          } else {
            setError('Failed to load tournament games');
          }
        } else {
          setError('No active tournament found. Please set up a tournament first.');
        }

        if (playersResponse.success) {
          setPlayers(playersResponse.data);
          // Default umpire to first player
          if (playersResponse.data.length > 0) {
            setUmpireId(playersResponse.data[0].id);
          }
        } else {
          setError(playersResponse.error || 'Failed to load players');
        }
      } catch (err) {
        setError('Failed to load game setup data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load team players when a game is selected
  useEffect(() => {
    if (selectedGameId && tournament) {
      const selectedGame = games.find(g => g.id === selectedGameId);
      if (selectedGame) {
        // Load both team rosters
        Promise.all([
          fetchTeamPlayers(selectedGame.home_team_id, tournament.id),
          fetchTeamPlayers(selectedGame.away_team_id, tournament.id)
        ]).then(([homeResponse, awayResponse]) => {
          if (homeResponse.success) {
            setHomeTeamPlayers(homeResponse.data);
          }
          if (awayResponse.success) {
            setAwayTeamPlayers(awayResponse.data);
          }
        });
      }
    } else {
      setHomeTeamPlayers([]);
      setAwayTeamPlayers([]);
    }
  }, [selectedGameId, games, tournament]);

  // Helper functions
  const getSelectedGame = () => games.find(g => g.id === selectedGameId);
  const getPlayerById = (playerId: string) => players.find(p => p.id === playerId);

  const canStartGame = (() => {
    if (!selectedGameId || !umpireId) return false;
    if (scoringMethod === 'quick_result') {
      // Validate quick result scores
      const nonNegative = quickHomeScore >= 0 && quickAwayScore >= 0;
      const notTie = quickHomeScore !== quickAwayScore;
      const anyPositive = quickHomeScore > 0 || quickAwayScore > 0;
      return nonNegative && notTie && anyPositive;
    }
    return true;
  })();

  const handleStartGame = async () => {
    if (!canStartGame) return;

    try {
      setSubmitting(true);
      setError(undefined);

      const selectedGame = getSelectedGame();
      if (!selectedGame) {
        setError('Selected game not found');
        return;
      }

      // Race condition protection: re-check game status before starting
      const gameCheckResponse = await fetch(`/api/tournaments/${tournament?.id}/games`);
      const gameCheckData = await gameCheckResponse.json();
      
      if (gameCheckResponse.ok && gameCheckData.success) {
        const currentGameState = gameCheckData.data?.find((g: TournamentGame) => g.id === selectedGameId);
        
        if (!currentGameState) {
          setError('Game not found in current tournament');
          return;
        }
        
        // Allow scheduled games (to start) and active/in_progress games (to rejoin)
        if (currentGameState.status !== 'scheduled' && currentGameState.status !== 'in_progress') {
          setError('This game is not available (completed or cancelled). Please refresh and select a different game.');
          return;
        }
      }

      // Check if this is rejoining an active/in-progress game
      if (selectedGame.status === 'in_progress') {
        // For active/in-progress games, just navigate to the umpire interface
        window.location.href = `/umpire/${selectedGame.id}`;
        return;
      }

      // For scheduled games, proceed with normal game start or quick result
      const gameData: GameSetupData = {
        home_team_id: selectedGame.home_team_id,
        away_team_id: selectedGame.away_team_id,
        innings,
        umpire_id: umpireId,
        game_id: selectedGameId // Pass the existing game ID
      };

      if (scoringMethod === 'quick_result') {
        gameData.quick_result = {
          final_score_home: quickHomeScore,
          final_score_away: quickAwayScore,
          notes: quickNotes || undefined
        };
      }

      if (scoringMethod === 'quick_result') {
        // Confirm before proceeding with quick result
        setShowQuickConfirm(true);
        // The actual submission will happen in confirmQuickResult()
      } else {
        if (onGameStarted) {
          await onGameStarted(gameData);
        }
      }
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmQuickResult = async () => {
    // Called after user confirms quick result
    const selectedGame = getSelectedGame();
    if (!selectedGame) return;
    const gameData: GameSetupData = {
      home_team_id: selectedGame.home_team_id,
      away_team_id: selectedGame.away_team_id,
      innings,
      umpire_id: umpireId,
      game_id: selectedGameId,
      quick_result: {
        final_score_home: quickHomeScore,
        final_score_away: quickAwayScore,
        notes: quickNotes || undefined
      }
    };
    setShowQuickConfirm(false);
    if (onGameStarted) {
      await onGameStarted(gameData);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#696775'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e4e2e8',
            borderTop: '3px solid #8b8a94',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading game setup...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        color: '#dc2626'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>Setup Error</h3>
        <p style={{ margin: '0 0 16px 0', color: '#696775' }}>{error}</p>
        <button
          onClick={() => setError(undefined)}
          style={{
            background: 'linear-gradient(135deg, #8b8a94 0%, #a5a4ac 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #696775 0%, #8b8a94 100%)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #8b8a94 0%, #a5a4ac 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className} style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1c1b20'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: '1px solid #e4e2e8',
        padding: '32px',
        marginBottom: '32px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(28, 27, 32, 0.1)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 24px',
          boxShadow: '0 4px 12px rgba(139, 138, 148, 0.3)'
        }}>
          ⚾
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 12px 0',
          color: '#1c1b20'
        }}>
          Game Setup
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#696775',
          margin: '0',
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Select a game from the tournament to start playing or rejoin as umpire
        </p>
      </div>



      {/* Main Content Card */}
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: '1px solid #e4e2e8',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(28, 27, 32, 0.1)',
        minHeight: '500px'
      }}>
        {/* Combined Setup Screen */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          {/* Game Selection Section */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0',
                color: '#1c1b20'
              }}>
                Select Game
              </h2>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #f9f8fc 0%, #f2f1f5 100%)',
                  color: '#696775',
                  border: '1px solid #e4e2e8',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f2f1f5 0%, #e4e2e8 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f9f8fc 0%, #f2f1f5 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e4e2e8',
                background: 'white',
                fontSize: '16px',
                color: '#1c1b20',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b8a94';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 138, 148, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e4e2e8';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">Select a game to start or rejoin...</option>
              {games.map(game => {
                let gameLabel = `${game.home_team?.name || 'Home'} vs ${game.away_team?.name || 'Away'}`;
                
                // Add round/bracket info if available
                if (game.brackets && game.brackets.length > 0) {
                  const bracket = game.brackets[0];
                  if (bracket.round_name) {
                    gameLabel = `${bracket.round_name} - ${gameLabel}`;
                  }
                } else if (game.game_type?.includes('pool')) {
                  gameLabel = `Pool Play - ${gameLabel}`;
                }
                
                // Add status indicator
                if (game.status === 'in_progress') {
                  gameLabel = `🔴 ${gameLabel} (IN PROGRESS - Rejoin)`;
                } else if (game.status === 'scheduled') {
                  gameLabel = `⚪ ${gameLabel} (Start Game)`;
                }
                
                return (
                  <option key={game.id} value={game.id}>
                    {gameLabel}
                  </option>
                );
              })}
            </select>

            {games.length === 0 && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                textAlign: 'center',
                color: '#dc2626'
              }}>
                <p style={{ margin: 0 }}>
                  No games available to start. All tournament games may already be in progress, completed, or still have placeholder teams (TBD). Please check the tournament schedule or admin panel.
                </p>
              </div>
            )}
          </div>

          {/* Game Preview */}
          {selectedGameId && (() => {
            const selectedGame = getSelectedGame();
            return (
              <div style={{
                padding: '24px',
                background: 'rgba(34, 197, 94, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20',
                  textAlign: 'center'
                }}>
                  Selected Game
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1c1b20',
                  marginBottom: '16px'
                }}>
                  <span>{selectedGame?.home_team?.name || 'Home Team'}</span>
                  <span style={{ color: '#696775' }}>vs</span>
                  <span>{selectedGame?.away_team?.name || 'Away Team'}</span>
                </div>
                
                {/* Team Rosters */}
                {(homeTeamPlayers.length > 0 || awayTeamPlayers.length > 0) && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginTop: '16px'
                  }}>
                    {/* Home Team Roster */}
                    {homeTeamPlayers.length > 0 && (
                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        border: '1px solid #f2f1f5'
                      }}>
                        <h4 style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#696775',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: '0 0 12px 0'
                        }}>
                          {selectedGame?.home_team?.name} ({homeTeamPlayers.length} players)
                        </h4>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {homeTeamPlayers.map(player => (
                            <div
                              key={player.id}
                              style={{
                                padding: '4px 8px',
                                background: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e4e2e8',
                                fontSize: '11px',
                                fontWeight: '500',
                                color: '#1c1b20'
                              }}
                            >
                              {player.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Away Team Roster */}
                    {awayTeamPlayers.length > 0 && (
                      <div style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        border: '1px solid #f2f1f5'
                      }}>
                        <h4 style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#696775',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: '0 0 12px 0'
                        }}>
                          {selectedGame?.away_team?.name} ({awayTeamPlayers.length} players)
                        </h4>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {awayTeamPlayers.map(player => (
                            <div
                              key={player.id}
                              style={{
                                padding: '4px 8px',
                                background: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e4e2e8',
                                fontSize: '11px',
                                fontWeight: '500',
                                color: '#1c1b20'
                              }}
                            >
                              {player.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Game Settings */}
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 24px 0',
              color: '#1c1b20'
            }}>
              Game Settings
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px'
            }}>
              {/* Innings */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '16px'
                }}>
                  Number of Innings
                  {tournament && (
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '400',
                      color: '#696775',
                      marginLeft: '8px'
                    }}>
                      (Tournament default: {tournament.pool_play_innings})
                    </span>
                  )}
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px'
                }}>
                  {[3, 5, 7, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => setInnings(num as 3 | 5 | 7 | 9)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: innings === num ? '2px solid #8b8a94' : '1px solid #e4e2e8',
                        background: innings === num 
                          ? 'linear-gradient(135deg, #8b8a94 0%, #a5a4ac 100%)'
                          : 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
                        color: innings === num ? 'white' : '#1c1b20',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (innings !== num) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f9f8fc 0%, #f2f1f5 100%)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (innings !== num) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Umpire */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '8px'
                }}>
                  Umpire
                </label>
                <select
                  value={umpireId}
                  onChange={(e) => setUmpireId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e4e2e8',
                    background: 'white',
                    fontSize: '16px',
                    color: '#1c1b20',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8b8a94';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 138, 148, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e4e2e8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select umpire...</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scoring Method */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '8px'
                }}>
                  Scoring Method
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="scoring_method"
                      value="live"
                      checked={scoringMethod === 'live'}
                      onChange={() => setScoringMethod('live')}
                    />
                    Live Scoring (default)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="scoring_method"
                      value="quick_result"
                      checked={scoringMethod === 'quick_result'}
                      onChange={() => setScoringMethod('quick_result')}
                    />
                    Quick Result
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Result Inputs */}
            {scoringMethod === 'quick_result' && selectedGameId && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(234,179,8,0.08)',
                border: '1px solid rgba(234,179,8,0.25)',
                borderRadius: '12px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1c1b20',
                  margin: '0 0 12px 0'
                }}>Quick Result</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#696775', marginBottom: '6px' }}>
                      Final Home Score ({getSelectedGame()?.home_team?.name || 'Home'})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quickHomeScore}
                      onChange={(e) => setQuickHomeScore(parseInt(e.target.value || '0', 10))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e4e2e8'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#696775', marginBottom: '6px' }}>
                      Final Away Score ({getSelectedGame()?.away_team?.name || 'Away'})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={quickAwayScore}
                      onChange={(e) => setQuickAwayScore(parseInt(e.target.value || '0', 10))}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e4e2e8'
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#696775', marginBottom: '6px' }}>
                      Notes (optional)
                    </label>
                    <textarea
                      value={quickNotes}
                      onChange={(e) => setQuickNotes(e.target.value)}
                      placeholder="Add any context about using quick result..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e4e2e8',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Game Summary */}
            {selectedGameId && (
              <div style={{
                padding: '24px',
                background: 'rgba(34, 197, 94, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                marginTop: '32px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20'
                }}>
                  Ready to Start
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  fontSize: '14px',
                  color: '#696775'
                }}>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Game:</strong><br />
                    {(() => {
                      const selectedGame = getSelectedGame();
                      return `${selectedGame?.home_team?.name || 'Home'} vs ${selectedGame?.away_team?.name || 'Away'}`;
                    })()}
                  </div>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Innings:</strong><br />
                    {innings}
                  </div>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Umpire:</strong><br />
                    {getPlayerById(umpireId)?.name || 'Not selected'}
                  </div>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Players:</strong><br />
                    {homeTeamPlayers.length + awayTeamPlayers.length} total
                  </div>
                </div>
              </div>
            )}

            {/* Start Game Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '32px'
            }}>
              <button
                onClick={handleStartGame}
                disabled={!canStartGame || submitting}
                style={{
                  background: canStartGame && !submitting
                    ? (scoringMethod === 'quick_result'
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)')
                    : 'linear-gradient(135deg, #d1cdd7 0%, #e4e2e8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: canStartGame && !submitting ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: canStartGame && !submitting
                    ? (scoringMethod === 'quick_result' ? '0 2px 8px rgba(245, 158, 11, 0.35)' : '0 2px 8px rgba(34, 197, 94, 0.3)')
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (canStartGame && !submitting) {
                    e.currentTarget.style.background = scoringMethod === 'quick_result'
                      ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                      : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canStartGame && !submitting) {
                    e.currentTarget.style.background = scoringMethod === 'quick_result'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    {scoringMethod === 'quick_result' ? 'Submitting Quick Result...' : 'Starting Game...'}
                  </>
                ) : (
                  <>{scoringMethod === 'quick_result' ? '🏁 Submit Quick Result' : '⚾ '}{(() => {
                    const selectedGame = getSelectedGame();
                    if (selectedGame?.status === 'in_progress') {
                      return 'Rejoin Game';
                    }
                    return scoringMethod === 'quick_result' ? '' : 'Start Game';
                  })()}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '24px'
      }}>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            color: '#696775',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1c1b20';
            e.currentTarget.style.background = 'rgba(139, 138, 148, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#696775';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Cancel Setup
        </button>
      </div>

      {/* Quick Result Confirmation Modal */}
      {showQuickConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1c1b20' }}>Confirm Quick Result</h3>
            <p style={{ color: '#696775', marginTop: '8px' }}>This will skip live scoring and record the final result immediately.</p>
            <div style={{ marginTop: '12px', background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', color: '#1c1b20' }}>
                {getSelectedGame()?.home_team?.name || 'Home'} {quickHomeScore} - {quickAwayScore} {getSelectedGame()?.away_team?.name || 'Away'}
              </div>
              {quickNotes && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#696775' }}>“{quickNotes}”</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => setShowQuickConfirm(false)}
                style={{
                  background: 'transparent', color: '#1c1b20', border: '1px solid #e4e2e8', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmQuickResult}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Spinner Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 