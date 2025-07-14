'use client';

import { useState, useEffect } from 'react';
import { Player, Team } from '../../lib/types';
import { fetchPlayers, fetchTeams } from '../../lib/api';
import BaseballCard from '../../components/BaseballCard';

interface TeamWithPlayers extends Team {
  players: Player[];
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadTeamsData();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadTeamsData = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate checking if tournament has started
      // In real implementation, this would check tournament status
      const hasTeamMemberships = await checkTournamentStatus();
      setTournamentStarted(hasTeamMemberships);
      
      if (hasTeamMemberships) {
        await loadTeams();
      }
    } catch (error) {
      console.error('Error loading teams data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTournamentStatus = async (): Promise<boolean> => {
    // This would check if the tournament has been set up and teams locked
    // For now, we'll simulate this by checking if there are any team memberships
    try {
      const response = await fetchTeams();
      return response.success && response.data.length > 0;
    } catch {
      return false;
    }
  };

  const loadTeams = async () => {
    try {
      const [teamsResponse, playersResponse] = await Promise.all([
        fetchTeams(),
        fetchPlayers()
      ]);

      if (teamsResponse.success && playersResponse.success) {
        // Mock data for team standings - in real implementation, this would come from game results
        const teamsWithData: TeamWithPlayers[] = teamsResponse.data.map((team, index) => {
          // Generate random wins (0-4) and losses (0-2), but ensure at least 1 game played
          const wins = Math.floor(Math.random() * 5); // 0-4
          const losses = Math.floor(Math.random() * 3); // 0-2
          
          // Ensure at least 1 game has been played
          const adjustedWins = wins;
          const adjustedLosses = wins + losses === 0 ? 1 : losses;
          
          const gamesPlayed = adjustedWins + adjustedLosses;
          
          // Calculate win percentage: wins divided by total games played
          // Should be a decimal between 0 and 1
          const winPercentage = adjustedWins / gamesPlayed;
          
          // Debug logging to help track down the issue
          console.log(`Team ${team.name}: ${adjustedWins}-${adjustedLosses} (${adjustedWins}/${gamesPlayed} = ${winPercentage.toFixed(3)} = ${(winPercentage * 100).toFixed(1)}%)`);
          
          return {
            ...team,
            players: playersResponse.data.slice(index * 4, (index + 1) * 4), // Mock 4 players per team
            wins: adjustedWins,
            losses: adjustedLosses,
            gamesPlayed,
            winPercentage
          };
        });

        // Sort by win percentage (highest first), then by wins
        teamsWithData.sort((a, b) => {
          if (b.winPercentage !== a.winPercentage) {
            return b.winPercentage - a.winPercentage;
          }
          return b.wins - a.wins;
        });

        setTeams(teamsWithData);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const handleShowCard = (player: Player) => {
    setCardPlayer(player);
    setShowCard(true);
  };

  const handleCloseCard = () => {
    setShowCard(false);
    setCardPlayer(null);
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '32px 24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px',
          color: '#696775'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e4e2e8',
            borderTop: '2px solid #8b8a94',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading teams...
        </div>
      </div>
    );
  }

  // Show placeholder if tournament hasn't started
  if (!tournamentStarted) {
    return (
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1c1b20',
            margin: '0 0 8px 0'
          }}>
            Teams
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#696775',
            margin: '0',
            fontWeight: '500'
          }}>
            View tournament teams and standings
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '2px dashed #e4e2e8',
          padding: '64px 32px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 138, 148, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b8a94" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1c1b20',
            margin: '0 0 12px 0'
          }}>
            Teams Will Show After Tournament Setup
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#696775',
            margin: '0 0 24px 0',
            lineHeight: '1.5',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Once the tournament is configured and teams are locked in the admin panel, 
            you'll see all teams, their players, and current standings here.
          </p>
          <a 
            href="/admin" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Go to Tournament Admin
          </a>
        </div>
      </div>
    );
  }

  return (
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
          Teams & Standings
        </h1>
        <p style={{
          fontSize: isMobile ? '14px' : '16px',
          color: '#696775',
          margin: '0',
          fontWeight: '500'
        }}>
          Current tournament teams, players, and standings
        </p>
      </div>

      {/* Teams Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e4e2e8',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Desktop Table Header */}
        {!isMobile && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 120px 120px 120px 120px',
            gap: '16px',
            padding: '20px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e4e2e8',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div>Rank</div>
            <div>Team</div>
            <div>Record</div>
            <div>Win %</div>
            <div>Wins</div>
            <div>Losses</div>
          </div>
        )}

        {/* Teams */}
        {teams.map((team, index) => (
          <div key={team.id}>
            {/* Team Row - Responsive */}
            <div style={{
              padding: isMobile ? '16px' : '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
              ...(isMobile ? {} : {
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 120px 120px 120px',
                gap: '16px',
                alignItems: 'center'
              })
            }}>
              {isMobile ? (
                // Mobile Layout
                <>
                  {/* Mobile: Team header with rank */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    {/* Rank */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: index < 3 ? 
                        (index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                         index === 1 ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' :
                         'linear-gradient(135deg, #cd7c2f 0%, #92400e 100%)') :
                        'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                      color: index < 3 ? 'white' : '#374151',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      {index + 1}
                    </div>

                    {/* Team Name */}
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1c1b20',
                      flex: 1,
                      marginLeft: '12px'
                    }}>
                      {team.name}
                    </div>
                  </div>

                  {/* Mobile: Stats row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    {/* Record */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        Record
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#374151',
                        fontWeight: '500'
                      }}>
                        {team.wins}-{team.losses}
                      </div>
                    </div>

                    {/* Win % */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        Win %
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#374151',
                        fontWeight: '600'
                      }}>
                        {team.gamesPlayed > 0 ? `${(team.winPercentage * 100).toFixed(1)}%` : '--'}
                      </div>
                    </div>

                    {/* Wins */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        Wins
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#16a34a',
                        fontWeight: '600'
                      }}>
                        {team.wins}
                      </div>
                    </div>

                    {/* Losses */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        Losses
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#dc2626',
                        fontWeight: '600'
                      }}>
                        {team.losses}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Desktop Layout
                <>
                  {/* Rank */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: index < 3 ? 
                      (index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                       index === 1 ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' :
                       'linear-gradient(135deg, #cd7c2f 0%, #92400e 100%)') :
                      'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                    color: index < 3 ? 'white' : '#374151',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}>
                    {index + 1}
                  </div>

                  {/* Team Name */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1c1b20'
                  }}>
                    {team.name}
                  </div>

                  {/* Record */}
                  <div style={{
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {team.wins}-{team.losses}
                  </div>

                  {/* Win % */}
                  <div style={{
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    {team.gamesPlayed > 0 ? `${(team.winPercentage * 100).toFixed(1)}%` : '--'}
                  </div>

                  {/* Wins */}
                  <div style={{
                    fontSize: '14px',
                    color: '#16a34a',
                    fontWeight: '600'
                  }}>
                    {team.wins}
                  </div>

                  {/* Losses */}
                  <div style={{
                    fontSize: '14px',
                    color: '#dc2626',
                    fontWeight: '600'
                  }}>
                    {team.losses}
                  </div>
                </>
              )}
            </div>

            {/* Players Section */}
            <div style={{
              padding: isMobile ? '0 16px 20px 16px' : '0 24px 24px 24px',
              backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
              borderBottom: index < teams.length - 1 ? '2px solid #e4e2e8' : 'none'
            }}>
              <div style={{
                paddingLeft: isMobile ? '0' : '76px' // Align with team name column on desktop
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>
                  Players ({team.players.length})
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '8px'
                }}>
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handleShowCard(player)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 246, 255, 0.8)';
                        e.currentTarget.style.borderColor = '#dbeafe';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                        e.currentTarget.style.borderColor = '#f1f5f9';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        background: player.avatar_url ? `url(${player.avatar_url})` : 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {!player.avatar_url && player.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#1c1b20',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {player.name}
                        </div>
                        {player.nickname && (
                          <div style={{
                            fontSize: '11px',
                            color: '#6b7280'
                          }}>
                            "{player.nickname}"
                          </div>
                        )}
                      </div>
                      {player.championships_won > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 5px',
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: '600',
                          color: 'white'
                        }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          {player.championships_won}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Baseball Card Modal */}
      {cardPlayer && (
        <BaseballCard
          player={cardPlayer}
          isOpen={showCard}
          onClose={handleCloseCard}
        />
      )}
    </div>
  );
} 