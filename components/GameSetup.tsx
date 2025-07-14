import React, { useState, useEffect } from 'react';
import { 
  Team, 
  Player, 
  GameSetupData,
  GameStartEventPayload 
} from '../lib/types';
import { 
  fetchTeams, 
  fetchPlayers,
  fetchTeamPlayers,
  submitEvent 
} from '../lib/api';

export interface GameSetupProps {
  gameId: string | null;
  onGameStarted?: (gameData: GameSetupData) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * GameSetup component for initializing a new game
 * Handles team selection and game configuration
 */
export function GameSetup({ 
  gameId, 
  onGameStarted, 
  onCancel, 
  className = '' 
}: GameSetupProps) {
  // Data state
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // Form state
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [innings, setInnings] = useState<3 | 5 | 7 | 9>(7);
  const [umpireId, setUmpireId] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<'teams' | 'settings'>('teams');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [teamsResponse, playersResponse] = await Promise.all([
          fetchTeams(),
          fetchPlayers()
        ]);

        if (teamsResponse.success) {
          setTeams(teamsResponse.data);
        } else {
          setError(teamsResponse.error || 'Failed to load teams');
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

  // Load team players when a team is selected
  useEffect(() => {
    if (homeTeamId) {
      fetchTeamPlayers(homeTeamId).then(response => {
        if (response.success) {
          setHomeTeamPlayers(response.data);
        }
      });
    } else {
      setHomeTeamPlayers([]);
    }
  }, [homeTeamId]);

  useEffect(() => {
    if (awayTeamId) {
      fetchTeamPlayers(awayTeamId).then(response => {
        if (response.success) {
          setAwayTeamPlayers(response.data);
        }
      });
    } else {
      setAwayTeamPlayers([]);
    }
  }, [awayTeamId]);

  // Helper functions
  const getTeamById = (teamId: string) => teams.find(t => t.id === teamId);
  const getPlayerById = (playerId: string) => players.find(p => p.id === playerId);

  const canProceedToSettings = homeTeamId && awayTeamId && homeTeamId !== awayTeamId;
  const canStartGame = canProceedToSettings && umpireId;

  const handleStartGame = async () => {
    if (!canStartGame) return;

    try {
      setSubmitting(true);
      setError(undefined);

      const gameData: GameSetupData = {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        innings,
        umpire_id: umpireId
      };

      if (onGameStarted) {
        await onGameStarted(gameData);
      }
    } catch (err) {
      setError('Failed to start game');
    } finally {
      setSubmitting(false);
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
          Configure teams and game settings to start your baseball game
        </p>
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px',
        gap: '12px'
      }}>
        {(['teams', 'settings'] as const).map((step, index) => {
          const isActive = activeTab === step;
          const isCompleted = (step === 'teams' && canProceedToSettings) ||
                             (step === 'settings' && canStartGame);
          const isDisabled = (step === 'settings' && !canProceedToSettings);

          return (
            <button
              key={step}
              onClick={() => !isDisabled && setActiveTab(step)}
              disabled={isDisabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: isActive ? '2px solid #8b8a94' : '1px solid #e4e2e8',
                background: isActive 
                  ? 'linear-gradient(135deg, #8b8a94 0%, #a5a4ac 100%)'
                  : isCompleted 
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
                color: isActive || isCompleted ? 'white' : isDisabled ? '#d1cdd7' : '#1c1b20',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize',
                boxShadow: isActive ? '0 2px 8px rgba(139, 138, 148, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 138, 148, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isActive ? '0 2px 8px rgba(139, 138, 148, 0.3)' : 'none';
                }
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: isActive || isCompleted ? 'rgba(255, 255, 255, 0.3)' : 'rgba(139, 138, 148, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {isCompleted ? '✓' : index + 1}
              </div>
              {step}
            </button>
          );
        })}
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
        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 24px 0',
              color: '#1c1b20',
              textAlign: 'center'
            }}>
              Select Teams
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {/* Home Team */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '8px'
                }}>
                  Home Team
                </label>
                <select
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(e.target.value)}
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
                  <option value="">Select home team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id} disabled={team.id === awayTeamId}>
                      {team.name}
                    </option>
                  ))}
                </select>

                {/* Home Team Players */}
                {homeTeamPlayers.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'rgba(249, 248, 252, 0.6)',
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
                      Team Roster ({homeTeamPlayers.length} players)
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {homeTeamPlayers.map(player => (
                        <div
                          key={player.id}
                          style={{
                            padding: '6px 12px',
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px solid #e4e2e8',
                            fontSize: '12px',
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

              {/* Away Team */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1c1b20',
                  marginBottom: '8px'
                }}>
                  Away Team
                </label>
                <select
                  value={awayTeamId}
                  onChange={(e) => setAwayTeamId(e.target.value)}
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
                  <option value="">Select away team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id} disabled={team.id === homeTeamId}>
                      {team.name}
                    </option>
                  ))}
                </select>

                {/* Away Team Players */}
                {awayTeamPlayers.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'rgba(249, 248, 252, 0.6)',
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
                      Team Roster ({awayTeamPlayers.length} players)
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {awayTeamPlayers.map(player => (
                        <div
                          key={player.id}
                          style={{
                            padding: '6px 12px',
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px solid #e4e2e8',
                            fontSize: '12px',
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
            </div>

            {/* Team Preview */}
            {homeTeamId && awayTeamId && (
              <div style={{
                marginTop: '32px',
                padding: '24px',
                background: 'rgba(34, 197, 94, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20'
                }}>
                  Game Matchup
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1c1b20'
                }}>
                  <span>{getTeamById(homeTeamId)?.name}</span>
                  <span style={{ color: '#696775' }}>vs</span>
                  <span>{getTeamById(awayTeamId)?.name}</span>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '32px'
            }}>
              <button
                onClick={() => setActiveTab('settings')}
                disabled={!canProceedToSettings}
                style={{
                  background: canProceedToSettings 
                    ? 'linear-gradient(135deg, #8b8a94 0%, #a5a4ac 100%)'
                    : 'linear-gradient(135deg, #d1cdd7 0%, #e4e2e8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: canProceedToSettings ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: canProceedToSettings ? '0 2px 8px rgba(139, 138, 148, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (canProceedToSettings) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #696775 0%, #8b8a94 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canProceedToSettings) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8b8a94 0%, #a5a4ac 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Continue to Settings →
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 32px 0',
              color: '#1c1b20',
              textAlign: 'center'
            }}>
              Game Settings
            </h2>

            <div style={{
              maxWidth: '600px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
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

              {/* Game Summary */}
              <div style={{
                padding: '24px',
                background: 'rgba(34, 197, 94, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20'
                }}>
                  Game Summary
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  fontSize: '14px',
                  color: '#696775'
                }}>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Home:</strong><br />
                    {getTeamById(homeTeamId)?.name} ({homeTeamPlayers.length} players)
                  </div>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Away:</strong><br />
                    {getTeamById(awayTeamId)?.name} ({awayTeamPlayers.length} players)
                  </div>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Innings:</strong><br />
                    {innings}
                  </div>
                  <div>
                    <strong style={{ color: '#1c1b20' }}>Umpire:</strong><br />
                    {getPlayerById(umpireId)?.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '32px'
            }}>
              <button
                onClick={() => setActiveTab('teams')}
                style={{
                  background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
                  color: '#696775',
                  border: '1px solid #e4e2e8',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f9f8fc 0%, #f2f1f5 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ← Back to Teams
              </button>
              
              <button
                onClick={handleStartGame}
                disabled={!canStartGame || submitting}
                style={{
                  background: canStartGame && !submitting
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #d1cdd7 0%, #e4e2e8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: canStartGame && !submitting ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: canStartGame && !submitting ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (canStartGame && !submitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canStartGame && !submitting) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
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
                    Starting Game...
                  </>
                ) : (
                  <>⚾ Start Game</>
                )}
              </button>
            </div>
          </div>
        )}
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