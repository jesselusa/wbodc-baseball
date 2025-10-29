'use client';

import { useState, useEffect } from 'react';
import { Player, Team, TournamentWithTeams, TournamentTeamWithPlayers } from '../../lib/types';
import { fetchPlayers, fetchTeams, getCurrentTournament, getTournamentWithTeams } from '../../lib/api';
import BaseballCard from '../../components/BaseballCard';

interface TeamWithStandings extends TournamentTeamWithPlayers {
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithStandings[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

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

  // Load teams data on component mount
  useEffect(() => {
    if (isClient) {
      loadTeamsData();
    }
  }, [isClient]);

  const loadTeamsData = async () => {
    try {
      setLoading(true);
      const hasLockedTournament = await checkTournamentStatus();
      setTournamentStarted(hasLockedTournament);
      
      // Try to load tournament teams regardless of lock status
      // This allows users to see teams even if tournament isn't officially started
      await loadTournamentTeams();
    } catch (error) {
      console.error('Error loading teams data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTournamentStatus = async (): Promise<boolean> => {
    try {
      const response = await getCurrentTournament();
      return response.success && response.data && response.data.status === 'in_progress';
    } catch {
      return false;
    }
  };

  const loadTournamentTeams = async () => {
    try {
      const currentTournamentResponse = await getCurrentTournament();
      
      if (!currentTournamentResponse.success || !currentTournamentResponse.data) {
        console.error('No current tournament found');
        return;
      }

      // Fetch teams and standings
      const [teamsRes, standingsRes] = await Promise.all([
        fetch(`/api/tournaments/${currentTournamentResponse.data.id}/teams`),
        fetch(`/api/tournaments/${currentTournamentResponse.data.id}/standings`)
      ]);
      const teamsData = await teamsRes.json();
      const standingsData = await standingsRes.json();
      
      if (!teamsData.success || !teamsData.data) {
        console.error('Failed to load tournament teams:', teamsData.error);
        return;
      }

      const teams = teamsData.data;
      const standings = (standingsData?.data?.standings || []) as Array<{ teamId: string; wins: number; losses: number; gamesPlayed?: number }>;
      const standingsMap = new Map(standings.map(s => [s.teamId, s]));

      // Merge teams with real standings (fallback to zeros when missing)
      const teamsWithData: TeamWithStandings[] = teams.map((team) => {
        const s = standingsMap.get(team.id);
        const wins = s?.wins || 0;
        const losses = s?.losses || 0;
        const gamesPlayed = s?.gamesPlayed != null ? s.gamesPlayed : wins + losses;
        const winPercentage = gamesPlayed > 0 ? wins / gamesPlayed : 0;
        return {
          ...team,
          wins,
          losses,
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
    } catch (error) {
      console.error('Error loading tournament teams:', error);
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

  // Helper to determine if we should show coming soon for 2025 or when no teams exist
  const shouldShowComingSoon = () => {
    const currentYear = new Date().getFullYear();
    
    // If it's 2025 and no teams exist, or tournament hasn't started yet
    if (currentYear === 2025) {
      return teams.length === 0;
    }
    
    // For other years, show coming soon if no teams exist
    return teams.length === 0;
  };

  const showComingSoon = shouldShowComingSoon();

  // Show "Teams Coming Soon" placeholder
  if (showComingSoon) {
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '24px' : '28px',
            fontWeight: '600',
            color: '#1c1b20',
            margin: '0 0 16px 0'
          }}>
            Teams Coming Soon
          </h2>
          
          <p style={{
            fontSize: isMobile ? '16px' : '18px',
            color: '#6b7280',
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}>
            {new Date().getFullYear() === 2025 
              ? 'Tournament teams will be available once the 2025 tournament begins.'
              : 'This page will display tournament teams, players, and standings once teams are configured.'
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
                TEAM ROSTERS
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Player assignments & lineups
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
                Win-loss records & rankings
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
                STATS
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Player & team statistics
              </div>
            </div>
          </div>
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
                      {team.team_name}
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
                    {team.team_name}
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
                        borderRadius: '50%',
                        backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
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