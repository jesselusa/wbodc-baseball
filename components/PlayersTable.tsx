import React from 'react';
import { Player } from '../lib/types';

interface PlayersTableProps {
  players: Player[];
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'name' | 'championships_won';
  sortOrder: 'asc' | 'desc';
  onSort: (field: 'name' | 'championships_won') => void;
  onPlayerClick: (player: Player) => void;
  onPlayerEdit?: (player: Player) => void;
  onAddPlayer?: () => void;
  showAddButton?: boolean;
  showEditColumn?: boolean;
  showResultsCount?: boolean;
  isReadOnly?: boolean;
  playerTeamAssignments?: Map<string, string>; // player_id -> team_name
}

export default function PlayersTable({
  players,
  loading = false,
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSort,
  onPlayerClick,
  onPlayerEdit,
  onAddPlayer,
  showAddButton = false,
  showEditColumn = false,
  showResultsCount = true,
  isReadOnly = false,
  playerTeamAssignments
}: PlayersTableProps) {
  const getSortIcon = (field: 'name' | 'championships_won') => {
    if (sortBy !== field) {
      return (
        <svg style={{ width: '16px', height: '16px', color: '#8b8a94' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg style={{ width: '16px', height: '16px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg style={{ width: '16px', height: '16px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Check if teams are assigned
  const hasTeamAssignments = playerTeamAssignments && playerTeamAssignments.size > 0;

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.hometown?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.current_town?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let result = 0;
    
    if (sortBy === 'name') {
      result = a.name.localeCompare(b.name);
    } else {
      result = (a.championships_won || 0) - (b.championships_won || 0);
    }
    
    return sortOrder === 'asc' ? result : -result;
  });

  const getLocationString = (player: Player) => {
    if (player.current_town) {
      return player.current_town;
    }
    return '-';
  };

  const getOriginLocationString = (player: Player) => {
    if (player.hometown) {
      return player.hometown;
    }
    return '-';
  };

  return (
    <>
      {/* Search and Actions Bar */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Search and Add Button Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{ 
            position: 'relative',
            flexGrow: 1,
            maxWidth: '400px'
          }}>
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b8a94" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                border: '1px solid #e4e2e8',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                color: '#1c1b20',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e4e2e8';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Add Player Button */}
          {showAddButton && onAddPlayer && (
            <button
              onClick={onAddPlayer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="24" y2="13"/>
                <line x1="24" y1="8" x2="19" y2="13"/>
              </svg>
              Add Player
            </button>
          )}
        </div>

        {/* Results Count */}
        {showResultsCount && (
          <div style={{
            fontSize: '14px',
            color: '#696775',
            fontWeight: '500'
          }}>
            {loading ? 'Loading...' : `${sortedPlayers.length} of ${players.length} players`}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e4e2e8',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            padding: '64px 24px',
            textAlign: 'center',
            color: '#696775',
            fontSize: '16px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e4e2e8',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Loading players...
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : sortedPlayers.length === 0 ? (
          <div style={{
            padding: '64px 24px',
            textAlign: 'center',
            color: '#696775',
            fontSize: '16px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              No players found
            </div>
          </div>
        ) : (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                minWidth: hasTeamAssignments ? '1000px' : '800px',
                borderCollapse: 'collapse' 
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, rgba(139, 138, 148, 0.05) 0%, rgba(105, 103, 117, 0.05) 100%)',
                    borderBottom: '1px solid #e4e2e8'
                  }}>
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#696775',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <button
                        onClick={() => onSort('name')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          cursor: 'pointer',
                          padding: '0',
                          transition: 'color 0.2s ease',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#1c1b20';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#696775';
                        }}
                      >
                        <span>PLAYER</span>
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#696775',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      CURRENT LOCATION
                    </th>
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#696775',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      HOMETOWN
                    </th>
                    {hasTeamAssignments && (
                      <th style={{
                        padding: '20px 24px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#696775',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        TEAM
                      </th>
                    )}
                    <th style={{
                      padding: '20px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#696775',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <button
                        onClick={() => onSort('championships_won')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          cursor: 'pointer',
                          padding: '0',
                          transition: 'color 0.2s ease',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#1c1b20';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#696775';
                        }}
                      >
                        <span>CHAMPIONSHIPS</span>
                        {getSortIcon('championships_won')}
                      </button>
                    </th>

                    {showEditColumn && (
                      <th style={{
                        padding: '20px 24px',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#696775',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => (
                    <tr 
                      key={player.id} 
                      style={{
                        borderBottom: index < sortedPlayers.length - 1 ? '1px solid #e4e2e8' : 'none',
                        background: 'transparent',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 138, 148, 0.05)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      onClick={() => onPlayerClick(player)}
                    >
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          <div style={{
                            position: 'relative',
                            width: '48px',
                            height: '48px',
                            flexShrink: 0
                          }}>
                            {player.avatar_url ? (
                              <img
                                src={player.avatar_url}
                                alt={player.name}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '12px',
                                  objectFit: 'cover',
                                  border: '2px solid #e4e2e8',
                                  transition: 'all 0.2s ease'
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div style={{
                              display: player.avatar_url ? 'none' : 'flex',
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              fontWeight: '600',
                              color: 'white',
                              border: '2px solid #e4e2e8'
                            }}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#1c1b20',
                              marginBottom: '4px'
                            }}>
                              {player.name}
                            </div>
                            {player.nickname && (
                              <div style={{
                                fontSize: '13px',
                                color: '#696775',
                                background: 'rgba(139, 138, 148, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                display: 'inline-block'
                              }}>
                                "{player.nickname}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ 
                        padding: '20px 24px',
                        fontSize: '14px',
                        color: '#1c1b20'
                      }}>
                        {getLocationString(player)}
                      </td>
                      <td style={{ 
                        padding: '20px 24px',
                        fontSize: '14px',
                        color: '#1c1b20'
                      }}>
                        {getOriginLocationString(player)}
                      </td>
                      {hasTeamAssignments && (
                        <td style={{ 
                          padding: '20px 24px',
                          fontSize: '14px',
                          color: '#1c1b20'
                        }}>
                          {playerTeamAssignments?.get(player.id) ? (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                              </svg>
                              {playerTeamAssignments.get(player.id)}
                            </div>
                          ) : (
                            <span style={{ color: '#8b8a94', fontSize: '12px', fontStyle: 'italic' }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1c1b20'
                          }}>
                            {(player.championships_won || 0) > 0 
                              ? '💍'.repeat(player.championships_won || 0)
                              : '-'
                            }
                          </span>
                        </div>
                      </td>
                      {showEditColumn && (
                        <td style={{ 
                          padding: '20px 24px',
                          textAlign: 'right'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onPlayerEdit) {
                                  onPlayerEdit(player);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 12px',
                                background: 'rgba(139, 138, 148, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#696775',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'inherit'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 