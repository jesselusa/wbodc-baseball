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

  isLocked?: boolean;
  savingTeams?: boolean;
}

interface PlayerDragItem {
  id: string;
  player: Player;
  isInTeam: boolean;
  teamId?: string;
}

interface TeamStats {
  playerCount: number;
  avgChampionships: number;
  totalChampionships: number;
  locations: string[];
}

// Sortable Player Component
const SortablePlayer: React.FC<{
  player: Player;
  isInTeam: boolean;
  teamId?: string;
  isDragging?: boolean;
}> = ({ player, isInTeam, teamId, isDragging }) => {
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
      className={`player-drag-item ${isInTeam ? 'in-team' : 'available'}`}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: isInTeam ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : 'white',
        borderRadius: '8px',
        border: `2px solid ${isInTeam ? '#0ea5e9' : '#e4e2e8'}`,
        cursor: 'grab',
        transition: 'all 0.2s ease',
        boxShadow: isDragging ? '0 8px 25px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          flexShrink: 0,
        }}>
          {!player.avatar_url && player.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: '600',
            color: '#1c1b20',
            fontSize: '14px',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {player.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#696775',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>{player.current_town || 'Unknown'}</span>
            <span>•</span>
            <span>
              {player.championships_won === 0 ? '-' : 
               '💍'.repeat(player.championships_won || 0)}
            </span>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#8b8a94',
          flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="12" r="1"/>
            <circle cx="9" cy="5" r="1"/>
            <circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="12" r="1"/>
            <circle cx="15" cy="5" r="1"/>
            <circle cx="15" cy="19" r="1"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Droppable Team Zone
const DroppableTeamZone: React.FC<{
  children: React.ReactNode;
  teamId: string;
  isLocked: boolean;
}> = ({ children, teamId, isLocked }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: teamId,
    disabled: isLocked,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver && !isLocked
          ? 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)'
          : 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: `2px solid ${isLocked ? '#22c55e' : isOver && !isLocked ? '#0ea5e9' : '#e4e2e8'}`,
        padding: '20px',
        boxShadow: isOver && !isLocked 
          ? '0 4px 20px rgba(14, 165, 233, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  );
};

// Team Card Component
const TeamCard: React.FC<{
  team: TeamDragDrop;
  stats: TeamStats;
  isLocked: boolean;
  onToggleLock: (teamId: string) => void;
  onRenameTeam: (teamId: string, newName: string) => void;
  teamSize: number;
}> = ({ team, stats, isLocked, onToggleLock, onRenameTeam, teamSize }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);

  const handleNameSubmit = () => {
    if (editName.trim() && editName.trim() !== team.name) {
      onRenameTeam(team.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(team.name);
      setIsEditing(false);
    }
  };

  return (
    <DroppableTeamZone teamId={team.id} isLocked={isLocked}>
      {/* Team Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e4e2e8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyPress}
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1c1b20',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                flex: 1,
              }}
              autoFocus
            />
          ) : (
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1c1b20',
                margin: 0,
                cursor: isLocked ? 'default' : 'pointer',
                flex: 1,
              }}
              onClick={() => !isLocked && setIsEditing(true)}
            >
              {team.name}
            </h3>
          )}
          {!isLocked && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b8a94',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 138, 148, 0.1)';
                e.currentTarget.style.color = '#1c1b20';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#8b8a94';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => onToggleLock(team.id)}
          style={{
            background: isLocked ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isLocked ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Locked
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Unlocked
            </>
          )}
        </button>
      </div>

      {/* Team Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(139, 138, 148, 0.05)',
        borderRadius: '8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1c1b20' }}>
            {stats.playerCount}
          </div>
          <div style={{ fontSize: '11px', color: '#696775', fontWeight: '600' }}>
            PLAYERS
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1c1b20' }}>
            {stats.totalChampionships}
          </div>
          <div style={{ fontSize: '11px', color: '#696775', fontWeight: '600' }}>
            TITLES
          </div>
        </div>
      </div>

      {/* Player List */}
      <div style={{
        flex: 1,
        minHeight: '120px',
        padding: '12px',
        background: team.players.length === 0 ? 'rgba(139, 138, 148, 0.05)' : 'transparent',
        borderRadius: '8px',
        border: team.players.length === 0 ? '2px dashed #e4e2e8' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {team.players.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8b8a94',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Drop players here
          </div>
        ) : (
          <SortableContext items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {team.players.map((player) => (
              <SortablePlayer
                key={player.id}
                player={player}
                isInTeam={true}
                teamId={team.id}
              />
            ))}
          </SortableContext>
        )}
      </div>

      {/* Team Size Indicator */}
      <div style={{
        marginTop: '12px',
        padding: '8px 12px',
        background: team.players.length === teamSize ? 'rgba(34, 197, 94, 0.1)' : 
                   team.players.length > teamSize ? 'rgba(239, 68, 68, 0.1)' : 
                   'rgba(139, 138, 148, 0.1)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '600',
        color: team.players.length === teamSize ? '#22c55e' : 
               team.players.length > teamSize ? '#ef4444' : '#8b8a94',
      }}>
        {team.players.length} / {teamSize} players
      </div>
    </DroppableTeamZone>
  );
};

// Custom collision detection for better drag behavior
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerIntersections = pointerWithin(args);
  if (pointerIntersections.length > 0) {
    return pointerIntersections;
  }
  return rectIntersection(args);
};

// Droppable Available Players Zone
const AvailablePlayersZone: React.FC<{
  children: React.ReactNode;
  isMobile: boolean;
  numTeams: number;
}> = ({ children, isMobile, numTeams }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'available-players',
  });

  // Calculate height to match 2 stacked team cards with gap
  // Team card minHeight: 300px + padding: 40px (20px top + 20px bottom) + border: 4px + shadow space: 10px = ~354px
  // For 2 stacked cards: 2 × 354px + 20px gap = 728px
  // This ensures the bottom of available players aligns with bottom of 2nd team card
  const calculatedHeight = isMobile ? 'auto' : `${2 * 354 + 20}px`; // 728px

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver 
          ? 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)'
          : 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: isOver 
          ? '2px solid #0ea5e9'
          : '1px solid #e4e2e8',
        padding: '20px',
        boxShadow: isOver 
          ? '0 4px 20px rgba(14, 165, 233, 0.2)'
          : '0 1px 3px rgba(28, 27, 32, 0.1)',
        position: 'sticky',
        top: '20px',
        height: calculatedHeight,
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  );
};

export default function TeamManager({ 
  players, 
  teamSize = 4, 
  onTeamSizeChange,
  numTeams = 4,
  teams: externalTeams,
  onTeamsChange,
  onClearAllPlayers,
  onClearLocalTeams,
  onClearTeams,
  onSaveTeams,

  isLocked: propIsLocked,
  savingTeams: propSavingTeams,
}: TeamManagerProps) {
  const [teams, setTeams] = useState<TeamDragDrop[]>([]);
  const [unassignedPlayers, setUnassignedPlayers] = useState<Player[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingTeams, setSavingTeams] = useState(false);

  // Use external teams if provided, otherwise use internal state
  const setTeamsState = (newTeams: TeamDragDrop[] | ((prev: TeamDragDrop[]) => TeamDragDrop[])) => {
    if (typeof newTeams === 'function') {
      const updatedTeams = newTeams(teams);
      if (externalTeams && onTeamsChange) {
        onTeamsChange(updatedTeams);
      } else {
        setTeams(updatedTeams);
      }
    } else {
      if (externalTeams && onTeamsChange) {
        onTeamsChange(newTeams);
      } else {
        setTeams(newTeams);
      }
    }
  };

  const [isLocked, setIsLocked] = useState(false);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);

  // Save teams functionality
  const handleSaveTeams = async () => {
    if (!onSaveTeams) return;
    
    setSavingTeams(true);
    try {
      await onSaveTeams(teams);
    } catch (error) {
      console.error('Error saving teams:', error);
    } finally {
      setSavingTeams(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  // Sync prop teamSize with local state
  useEffect(() => {
    // setTeamSize(propTeamSize); // This line is removed as per the new_code
  }, [teamSize]);

  // Initialize teams - use external teams if provided, otherwise generate initial teams
  useEffect(() => {
    if (!isClient) return;
    
    if (externalTeams && externalTeams.length > 0) {
      // Use external teams if provided
      setTeams(externalTeams);
    } else {
      // Generate initial teams based on desired number of teams
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
    }
  }, [numTeams, isClient, externalTeams]);

  // Filter available players (not assigned to any team)
  const availablePlayers = useMemo(() => {
    if (!teams || teams.length === 0) {
      // If no teams exist, all players are available
      return players.filter(player => 
        player.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    const assignedPlayerIds = new Set(teams.flatMap(team => team.players.map(p => p.id)));
    return players.filter(player => 
      !assignedPlayerIds.has(player.id) && 
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [players, teams, searchQuery]);

  // Calculate team statistics
  const getTeamStats = (team: TeamDragDrop): TeamStats => {
    const playerCount = team.players.length;
    const totalChampionships = team.players.reduce((sum, player) => sum + (player.championships_won || 0), 0);
    const avgChampionships = playerCount > 0 ? totalChampionships / playerCount : 0;
    const locations = [...new Set(team.players.map(p => p.current_town).filter(Boolean))];
    
    return {
      playerCount,
      avgChampionships,
      totalChampionships,
      locations,
    };
  };

  // Randomize teams functionality
  const randomizeTeams = () => {
    if (isLocked || !isClient) return; // Don't randomize during SSR
    if (!teams || teams.length === 0) return; // Don't randomize if no teams exist
    
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const newTeams = teams.map(team => ({ ...team, players: [] }));
    
    shuffledPlayers.forEach((player, index) => {
      const teamIndex = index % newTeams.length;
      newTeams[teamIndex].players.push(player);
    });
    
    setTeamsState(newTeams);
  };

  const clearLocalTeams = () => {
    if (!teams || teams.length === 0) return; // Don't clear if no teams exist
    
    setTeamsState(prevTeams => 
      prevTeams.map(team => ({ ...team, players: [] }))
    );
  };

  const handleClearAllPlayers = () => {
    if (!teams || teams.length === 0) {
      // If no teams exist, just call the API clear function
      if (onClearAllPlayers) {
        onClearAllPlayers();
      }
      return;
    }
    
    // Check if any team has players assigned
    const hasAssignedPlayers = teams.some(team => team.players.length > 0);
    
    if (hasAssignedPlayers && onClearLocalTeams) {
      // Clear local state first
      clearLocalTeams();
      // Then call the local clear function if available
      onClearLocalTeams();
    } else if (onClearAllPlayers) {
      // If no local assignments or no local clear function, use API
      onClearAllPlayers();
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const player = players.find(p => p.id === active.id);
    setActivePlayer(player || null);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the player being dragged
    const draggedPlayer = players.find(p => p.id === activeId);
    if (!draggedPlayer) return;

    // Find source and destination
    const sourceTeam = teams.find(team => team.players.some(p => p.id === activeId));
    const destinationTeam = teams.find(team => team.id === overId || team.players.some(p => p.id === overId));

    if (sourceTeam && destinationTeam && sourceTeam.id !== destinationTeam.id) {
      // Moving between teams
      if (destinationTeam.isLocked) return;

      setTeamsState(prevTeams => 
        prevTeams.map(team => {
          if (team.id === sourceTeam.id) {
            return {
              ...team,
              players: team.players.filter(p => p.id !== activeId),
            };
          }
          if (team.id === destinationTeam.id) {
            return {
              ...team,
              players: [...team.players, draggedPlayer],
            };
          }
          return team;
        })
      );
    } else if (!sourceTeam && destinationTeam) {
      // Moving from available players to team
      if (destinationTeam.isLocked) return;

      setTeamsState(prevTeams => 
        prevTeams.map(team => 
          team.id === destinationTeam.id
            ? { ...team, players: [...team.players, draggedPlayer] }
            : team
        )
      );
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlayer(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the dragged player
    const draggedPlayer = players.find(p => p.id === activeId);
    if (!draggedPlayer) return;

    // Find source team (if player is in a team)
    const sourceTeam = teams.find(team => team.players.some(p => p.id === activeId));
    
    // Find destination team
    const destinationTeam = teams.find(team => team.id === overId);
    const destinationTeamFromPlayer = teams.find(team => team.players.some(p => p.id === overId));

    // If dropping on available players section
    if (overId === 'available-players') {
      if (sourceTeam) {
        // Remove player from source team (return to available players)
        setTeamsState(prevTeams => 
          prevTeams.map(team => 
            team.id === sourceTeam.id 
              ? { ...team, players: team.players.filter(p => p.id !== activeId) }
              : team
          )
        );
      }
      return;
    }

    // If dropping on a team area
    if (destinationTeam) {
      // Check if team is locked
      if (destinationTeam.isLocked) return;

      // Check team size limit
      if (destinationTeam.players.length >= teamSize && !sourceTeam) return;

      setTeamsState(prevTeams => {
        return prevTeams.map(team => {
          if (team.id === destinationTeam.id) {
            // Add player to destination team (if not already there)
            if (!team.players.some(p => p.id === activeId)) {
              return { ...team, players: [...team.players, draggedPlayer] };
            }
            return team;
          } else if (sourceTeam && team.id === sourceTeam.id) {
            // Remove player from source team
            return { ...team, players: team.players.filter(p => p.id !== activeId) };
          }
          return team;
        });
      });
    }
    // If dropping on a player within a team (reordering)
    else if (destinationTeamFromPlayer && sourceTeam && destinationTeamFromPlayer.id === sourceTeam.id) {
      const activeIndex = sourceTeam.players.findIndex(p => p.id === activeId);
      const overIndex = sourceTeam.players.findIndex(p => p.id === overId);

      if (activeIndex !== overIndex) {
        setTeamsState(prevTeams => 
          prevTeams.map(team => 
            team.id === sourceTeam.id
              ? { ...team, players: arrayMove(team.players, activeIndex, overIndex) }
              : team
          )
        );
      }
    }
    // If dropping on a player in a different team
    else if (destinationTeamFromPlayer && sourceTeam && destinationTeamFromPlayer.id !== sourceTeam.id) {
      if (destinationTeamFromPlayer.isLocked) return;
      if (destinationTeamFromPlayer.players.length >= teamSize) return;

      setTeamsState(prevTeams => {
        return prevTeams.map(team => {
          if (team.id === destinationTeamFromPlayer.id) {
            return { ...team, players: [...team.players, draggedPlayer] };
          } else if (team.id === sourceTeam.id) {
            return { ...team, players: team.players.filter(p => p.id !== activeId) };
          }
          return team;
        });
      });
    }
  };

  // Toggle team lock
  const toggleTeamLock = (teamId: string) => {
    setTeamsState(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, isLocked: !team.isLocked } : team
      )
    );
  };

  // Rename team
  const renameTeam = (teamId: string, newName: string) => {
    setTeamsState(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
  };

  // Validate teams
  const validateTeams = () => {
    const errors: string[] = [];
    const teamNames = teams.map(team => team.name.toLowerCase());
    const duplicateNames = teamNames.filter((name, index) => teamNames.indexOf(name) !== index);
    const calculatedTeamSize = Math.ceil(players.length / numTeams);
    
    if (duplicateNames.length > 0) {
      errors.push('Team names must be unique');
    }
    
    teams.forEach(team => {
      if (team.players.length === 0) {
        errors.push(`${team.name} has no players`);
      }
      if (team.players.length > calculatedTeamSize) {
        errors.push(`${team.name} exceeds maximum team size`);
      }
    });
    
    return errors;
  };

  // Don't render until client-side
  if (!isClient) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '16px',
        color: '#696775'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e4e2e8',
            borderTop: '2px solid #8b8a94',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading team management...
        </div>
      </div>
    );
  }

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

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'start',
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

          {/* Action Buttons */}
          <div>
            <div style={{ 
              height: '22px', // Height of label + margin
              marginBottom: '8px' 
            }}></div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={randomizeTeams}
                disabled={isLocked}
                style={{
                  padding: '12px 24px',
                  height: '44px', // Match input box height
                  background: isLocked ? '#e4e2e8' : 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
                  color: isLocked ? '#696775' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'inherit',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                Randomize Teams
              </button>

              {(onClearAllPlayers || onClearLocalTeams) && (
                <button
                  onClick={handleClearAllPlayers}
                  style={{
                    padding: '12px 24px',
                    height: '44px', // Match input box height
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'inherit',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  Clear All Players
                </button>
              )}
              {onSaveTeams && (
                <button
                  onClick={handleSaveTeams}
                  disabled={savingTeams}
                  style={{
                    padding: '12px 24px',
                    height: '44px', // Match input box height
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: savingTeams ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'inherit',
                  }}
                >
                  {savingTeams ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <path d="M14 2v6h6"/>
                        <path d="M10 14H8v-2h2v2z"/>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                        <path d="M20 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                        <path d="M1 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                        <path d="M15 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>
                      </svg>
                      Save Teams
                    </>
                  )}
                </button>
              )}
            </div>
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
              maxHeight: isMobile ? '300px' : '640px', // Adjusted for new calculated height
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