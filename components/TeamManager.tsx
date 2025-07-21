'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Player, TeamDragDrop } from '../lib/types';
import { getCurrentTournament, getTournamentWithTeams } from '../lib/api';

interface TeamManagerProps {
  players: Player[];
  teamSize?: number;
  onTeamSizeChange?: (teamSize: number) => void;
  numTeams?: number;
  teams?: TeamDragDrop[];
  onTeamsChange?: (teams: TeamDragDrop[]) => void;
  onClearAllPlayers?: () => void;
  onClearLocalTeams?: () => void;
  onClearTeams?: () => Promise<void>;
  onSaveTeams?: (teams: TeamDragDrop[]) => Promise<void>;
  onLockTournament?: () => Promise<void>;
  isLocked?: boolean;
  savingTeams?: boolean;
}

interface PlayerDragItem {
  id: string;
  player: Player;
  isInTeam: boolean;
  teamId?: string;
}

// Custom collision detection
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerIntersections = pointerWithin(args);
  if (pointerIntersections.length > 0) {
    return pointerIntersections;
  }
  return rectIntersection(args);
};

// Sortable Player Component
const SortablePlayer: React.FC<{
  player: Player;
  isInTeam: boolean;
  isDragging?: boolean;
}> = ({ player, isInTeam, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="sortable-player"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e4e2e8',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.name}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
          }}>
            {player.name[0]}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1c1b20',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {player.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#696775',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {player.current_town || 'Unknown location'}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#8b8a94',
        }}>
          {player.championships_won && player.championships_won > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
              {player.championships_won}
            </div>
          )}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
            <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Available Players Zone Component
const AvailablePlayersZone: React.FC<{
  children: React.ReactNode;
  isMobile: boolean;
  numTeams: number;
}> = ({ children, isMobile, numTeams }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'available-players',
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? 'rgba(59, 130, 246, 0.05)' : 'rgba(139, 138, 148, 0.05)',
        borderRadius: '12px',
        border: isOver ? '2px dashed #3b82f6' : '2px dashed #e4e2e8',
        padding: '20px',
        transition: 'all 0.2s ease',
        height: 'fit-content',
        minHeight: isMobile ? '250px' : `${Math.max(400, numTeams * 120)}px`,
      }}
    >
      {children}
    </div>
  );
};

// Team Card Component
const TeamCard: React.FC<{
  team: TeamDragDrop;
  stats: { playerCount: number; titleCount: number };
  isLocked: boolean;
  onToggleLock: (teamId: string) => void;
  onRenameTeam: (teamId: string, newName: string) => void;
  teamSize: number;
}> = ({ team, stats, isLocked, onToggleLock, onRenameTeam, teamSize }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);

  const { isOver, setNodeRef } = useDroppable({
    id: team.id,
  });

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== team.name) {
      onRenameTeam(team.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    }
    if (e.key === 'Escape') {
      setEditName(team.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? 'rgba(59, 130, 246, 0.02)' : 'white',
        borderRadius: '12px',
        border: isOver ? '2px dashed #3b82f6' : '1px solid #e4e2e8',
        padding: '20px',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(28, 27, 32, 0.1)',
        height: 'fit-content',
        minHeight: '300px',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyPress}
            autoFocus
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1c1b20',
              border: '1px solid #3b82f6',
              borderRadius: '4px',
              padding: '4px 8px',
              background: 'white',
              outline: 'none',
            }}
          />
        ) : (
          <h3
            onClick={() => setIsEditing(true)}
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1c1b20',
              margin: 0,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 138, 148, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {team.name}
          </h3>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: team.isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 138, 148, 0.1)',
          borderRadius: '20px',
          fontSize: '12px',
          color: team.isLocked ? '#ef4444' : '#8b8a94',
          fontWeight: '600',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: team.isLocked ? '#ef4444' : '#8b8a94',
          }}></div>
          {team.isLocked ? 'Locked' : 'Unlocked'}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1c1b20',
            lineHeight: 1,
          }}>
            {stats.playerCount}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8b8a94',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            PLAYERS
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1c1b20',
            lineHeight: 1,
          }}>
            {stats.titleCount}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8b8a94',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            TITLES
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
      }}>
        <SortableContext items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {team.players.map((player) => (
            <SortablePlayer
              key={player.id}
              player={player}
              isInTeam={true}
            />
          ))}
        </SortableContext>
        
        {team.players.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#8b8a94',
            fontSize: '14px',
            fontWeight: '500',
            border: '2px dashed #e4e2e8',
            borderRadius: '8px',
          }}>
            Drag players here
          </div>
        )}
      </div>
    </div>
  );
};

// Main TeamManager Component
export default function TeamManager({
  players,
  teamSize: propTeamSize = 5,
  onTeamSizeChange,
  numTeams = 4,
  teams: propTeams,
  onTeamsChange,
  onClearTeams,
  onSaveTeams,
  onLockTournament,
  isLocked = false,
  savingTeams = false,
}: TeamManagerProps) {
  // State
  const [internalTeams, setInternalTeams] = useState<TeamDragDrop[]>([]);
  const [teamSize, setTeamSize] = useState(propTeamSize);
  
  // Use external teams if provided, otherwise use internal state
  const teams = propTeams || internalTeams;
  const setTeams = (newTeams: TeamDragDrop[] | ((prev: TeamDragDrop[]) => TeamDragDrop[])) => {
    if (typeof newTeams === 'function') {
      const updatedTeams = newTeams(teams);
      if (onTeamsChange) {
        onTeamsChange(updatedTeams);
      } else {
        setInternalTeams(updatedTeams);
      }
    } else {
      if (onTeamsChange) {
        onTeamsChange(newTeams);
      } else {
        setInternalTeams(newTeams);
      }
    }
  };

  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Save teams functionality
  const handleSaveTeams = async () => {
    if (!onSaveTeams) return;
    await onSaveTeams(teams);
  };

  // DnD Setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Effects
  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (propTeamSize !== teamSize) {
      setTeamSize(propTeamSize);
    }
  }, [propTeamSize, teamSize]);

  // Load existing teams on mount
  useEffect(() => {
    if (!isClient || propTeams) return;

    const loadTeamsData = async () => {
      try {
        // First, try to load existing tournament teams
        const currentTournamentResponse = await getCurrentTournament();
        
        if (currentTournamentResponse.success && currentTournamentResponse.data) {
          const tournamentWithTeamsResponse = await getTournamentWithTeams(currentTournamentResponse.data.id);
          
          if (tournamentWithTeamsResponse.success && 
              tournamentWithTeamsResponse.data && 
              tournamentWithTeamsResponse.data.teams.length > 0) {
            
            // Convert tournament teams to TeamDragDrop format
            const existingTeams: TeamDragDrop[] = tournamentWithTeamsResponse.data.teams.map((team, index) => ({
              id: team.id,
              name: team.team_name,
              players: team.players || [],
              isLocked: false,
              color: (team as any).team_color || `hsl(${(index * 360) / tournamentWithTeamsResponse.data.teams.length}, 70%, 60%)`,
            }));
            
            setTeams(existingTeams);
            return; // Exit early if we loaded existing teams
          }
        }
        
        // Fallback: Generate empty teams if no existing teams found
        const teamCount = Math.max(2, numTeams);
        const initialTeams: TeamDragDrop[] = [];
        
        for (let i = 0; i < teamCount; i++) {
          initialTeams.push({
            id: `team-${i + 1}`,
            name: `Team ${i + 1}`,
            players: [],
            isLocked: false,
            color: `hsl(${(i * 360) / teamCount}, 70%, 60%)`,
          });
        }
        
        setTeams(initialTeams);
      } catch (error) {
        console.error('Error loading teams:', error);
        
        // Fallback to empty teams on error
        const teamCount = Math.max(2, numTeams);
        const fallbackTeams: TeamDragDrop[] = [];
        
        for (let i = 0; i < teamCount; i++) {
          fallbackTeams.push({
            id: `team-${i + 1}`,
            name: `Team ${i + 1}`,
            players: [],
            isLocked: false,
            color: `hsl(${(i * 360) / teamCount}, 70%, 60%)`,
          });
        }
        
        setTeams(fallbackTeams);
      }
    };

    loadTeamsData();
  }, [isClient, numTeams, propTeams, setTeams]);

  // Randomize teams functionality
  const randomizeTeams = () => {
    if (isLocked || players.length === 0) return;

    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const teamCount = Math.max(2, numTeams);
    const playersPerTeam = Math.floor(shuffledPlayers.length / teamCount);
    const remainderPlayers = shuffledPlayers.length % teamCount;

    const newTeams: TeamDragDrop[] = [];
    let playerIndex = 0;

    for (let i = 0; i < teamCount; i++) {
      const teamPlayers: Player[] = [];
      const teamPlayerCount = playersPerTeam + (i < remainderPlayers ? 1 : 0);
      
      for (let j = 0; j < teamPlayerCount; j++) {
        if (playerIndex < shuffledPlayers.length) {
          teamPlayers.push(shuffledPlayers[playerIndex]);
          playerIndex++;
        }
      }

      newTeams.push({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        players: teamPlayers,
        isLocked: false,
        color: `hsl(${(i * 360) / teamCount}, 70%, 60%)`,
      });
    }

    setTeams(newTeams);
  };

  // Available players calculation
  const availablePlayers = useMemo(() => {
    const assignedPlayerIds = new Set(teams.flatMap(team => team.players.map(p => p.id)));
    return players
      .filter(player => !assignedPlayerIds.has(player.id))
      .filter(player => 
        searchQuery === '' || 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.current_town && player.current_town.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [players, teams, searchQuery]);

  // Team statistics
  const getTeamStats = (team: TeamDragDrop) => {
    const playerCount = team.players.length;
    const titleCount = team.players.reduce((sum, player) => {
      return sum + (player.championships_won || 0);
    }, 0);
    return { playerCount, titleCount };
  };

  // Team management functions
  const toggleTeamLock = (teamId: string) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, isLocked: !team.isLocked } : team
      )
    );
  };

  const renameTeam = (teamId: string, newName: string) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const player = players.find(p => p.id === active.id);
    if (player) {
      setActivePlayer(player);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activePlayerId = active.id as string;
    const overId = over.id as string;

    // Find source team (if any)
    const activeTeam = teams.find(team => 
      team.players.some(player => player.id === activePlayerId)
    );

    // Find target team
    const overTeam = teams.find(team => team.id === overId);

    if (overId === 'available-players') {
      // Moving to available players
      if (activeTeam) {
        setTeams(prevTeams =>
          prevTeams.map(team =>
            team.id === activeTeam.id
              ? { ...team, players: team.players.filter(p => p.id !== activePlayerId) }
              : team
          )
        );
      }
    } else if (overTeam && (!activeTeam || activeTeam.id !== overTeam.id)) {
      // Moving to a different team
      const player = players.find(p => p.id === activePlayerId);
      if (!player) return;

      setTeams(prevTeams =>
        prevTeams.map(team => {
          if (team.id === overTeam.id) {
            // Add to target team
            return { ...team, players: [...team.players, player] };
          } else if (activeTeam && team.id === activeTeam.id) {
            // Remove from source team
            return { ...team, players: team.players.filter(p => p.id !== activePlayerId) };
          }
          return team;
        })
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);

    if (!over) return;

    const activePlayerId = active.id as string;
    const overId = over.id as string;

    // Handle reordering within the same container
    const activeTeam = teams.find(team => 
      team.players.some(player => player.id === activePlayerId)
    );
    const overTeam = teams.find(team => team.id === overId || 
      team.players.some(player => player.id === overId)
    );

    if (activeTeam && overTeam && activeTeam.id === overTeam.id) {
      // Reordering within the same team
      const activeIndex = activeTeam.players.findIndex(p => p.id === activePlayerId);
      const overIndex = activeTeam.players.findIndex(p => p.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        setTeams(prevTeams =>
          prevTeams.map(team =>
            team.id === activeTeam.id
              ? { ...team, players: arrayMove(team.players, activeIndex, overIndex) }
              : team
          )
        );
      }
    }
  };

  // Validation
  const validateTeams = () => {
    const errors: string[] = [];
    teams.forEach((team, index) => {
      if (team.players.length === 0) {
        errors.push(`${team.name} has no players`);
      }
    });
    return errors;
  };

  const validationErrors = validateTeams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Configuration Card */}
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: '1px solid #e4e2e8',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(28, 27, 32, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1c1b20',
            margin: 0,
          }}>
            Team Configuration
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 138, 148, 0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: isLocked ? '#ef4444' : '#8b8a94',
            fontWeight: '600',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isLocked ? '#ef4444' : '#8b8a94',
            }}></div>
            {isLocked ? 'Tournament Active' : 'Configuration Mode'}
          </div>
        </div>

        {/* Team Size and Search Players Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '16px',
          alignItems: 'start',
          marginBottom: '20px',
        }}>
          {/* Team Size Display */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1c1b20',
              marginBottom: '8px',
            }}>
              Team Size
            </label>
            <div style={{
              padding: '12px 16px',
              border: '2px solid #e4e2e8',
              borderRadius: '8px',
              fontSize: '14px',
              background: '#f9f9f9',
              color: '#696775',
              fontFamily: 'inherit',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              {(() => {
                if (players.length === 0) return `${teamSize} players`;
                const minPlayers = Math.floor(players.length / numTeams);
                const maxPlayers = Math.ceil(players.length / numTeams);
                if (minPlayers === maxPlayers) {
                  return `${maxPlayers} players`;
                } else {
                  return `${minPlayers} - ${maxPlayers} players`;
                }
              })()}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#696775',
              marginTop: '4px',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Set in Tournament Settings
            </div>
          </div>

          {/* Search Available Players */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1c1b20',
              marginBottom: '8px',
            }}>
              Search Players
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search available players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: '2px solid #e4e2e8',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  color: '#1c1b20',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#696775',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div style={{
          marginBottom: '20px',
        }}>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '8px' : '12px', 
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: isMobile ? 'center' : 'flex-start',
            alignItems: 'center',
            width: '100%',
          }}>
            {/* 1. Randomize Teams */}
            <button
              onClick={randomizeTeams}
              disabled={isLocked || savingTeams}
              style={{
                padding: isMobile ? '10px 16px' : '12px 24px',
                height: isMobile ? '40px' : '44px',
                minWidth: isMobile ? '80px' : '160px',
                background: (isLocked || savingTeams) ? '#e4e2e8' : 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
                color: (isLocked || savingTeams) ? '#696775' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600',
                cursor: (isLocked || savingTeams) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                fontFamily: 'inherit',
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              {isMobile ? 'Randomize' : 'Randomize Teams'}
            </button>

            {/* 2. Clear Teams */}
            <button
              onClick={onClearTeams}
              disabled={savingTeams}
              style={{
                padding: isMobile ? '10px 16px' : '12px 24px',
                height: isMobile ? '40px' : '44px',
                minWidth: isMobile ? '80px' : '140px',
                background: savingTeams ? '#e4e2e8' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: savingTeams ? '#696775' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600',
                cursor: savingTeams ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                fontFamily: 'inherit',
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              {isMobile ? 'Clear' : 'Clear Teams'}
            </button>

            {/* 3. Save Teams */}
            <button
              onClick={handleSaveTeams}
              disabled={savingTeams}
              style={{
                padding: isMobile ? '10px 16px' : '12px 24px',
                height: isMobile ? '40px' : '44px',
                minWidth: isMobile ? '80px' : '140px',
                background: savingTeams ? '#e4e2e8' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                color: savingTeams ? '#696775' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600',
                cursor: savingTeams ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                fontFamily: 'inherit',
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                whiteSpace: 'nowrap',
              }}
            >
              {savingTeams ? (
                <>
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  {isMobile ? 'Saving...' : 'Saving...'}
                </>
              ) : (
                <>
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
                  {isMobile ? 'Save' : 'Save Teams'}
                </>
              )}
            </button>

            {/* 4. Lock Tournament */}
            <button
              onClick={onLockTournament}
              disabled={savingTeams}
              style={{
                padding: isMobile ? '10px 16px' : '12px 24px',
                height: isMobile ? '40px' : '44px',
                minWidth: isMobile ? '80px' : '160px',
                background: savingTeams ? '#e4e2e8' : (isLocked ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'),
                color: savingTeams ? '#696775' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600',
                cursor: savingTeams ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                fontFamily: 'inherit',
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                whiteSpace: 'nowrap',
              }}
            >
              {isLocked ? (
                <>
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  {isMobile ? 'Unlock' : 'Unlock Tournament'}
                </>
              ) : (
                <>
                  <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {isMobile ? 'Lock' : 'Lock Tournament'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#ef4444',
              margin: '0 0 8px 0',
            }}>
              Configuration Issues:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              color: '#ef4444',
              fontSize: '12px',
            }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, 1fr) 2fr',
          gap: '24px',
          alignItems: 'start',
        }}>
          {/* Available Players */}
          <AvailablePlayersZone isMobile={isMobile} numTeams={numTeams}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1c1b20',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              Available Players
              <span style={{
                background: 'rgba(139, 138, 148, 0.1)',
                color: '#8b8a94',
                fontSize: '12px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '12px',
              }}>
                {availablePlayers.length}
              </span>
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: isMobile ? '300px' : '640px',
              overflowY: 'auto',
            }}>
              <SortableContext items={availablePlayers.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {availablePlayers.map((player) => (
                  <SortablePlayer
                    key={player.id}
                    player={player}
                    isInTeam={false}
                  />
                ))}
              </SortableContext>
              
              {availablePlayers.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: '#8b8a94',
                  fontSize: '14px',
                  fontWeight: '500',
                }}>
                  {searchQuery ? 'No players match your search' : 'All players have been assigned to teams'}
                </div>
              )}
            </div>
          </AvailablePlayersZone>

          {/* Teams Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {teams.map((team) => (
              <div key={team.id} style={{ position: 'relative' }}>
                <SortableContext items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <TeamCard
                    team={team}
                    stats={getTeamStats(team)}
                    isLocked={team.isLocked}
                    onToggleLock={toggleTeamLock}
                    onRenameTeam={renameTeam}
                    teamSize={Math.ceil(players.length / numTeams)}
                  />
                </SortableContext>
              </div>
            ))}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePlayer ? (
            <div style={{ transform: 'rotate(5deg)' }}>
              <SortablePlayer
                player={activePlayer}
                isInTeam={false}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 