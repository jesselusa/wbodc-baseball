'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Player, TournamentSettingsFormData, TeamAssignment, TournamentConfig, TournamentAdminData, TeamDragDrop } from '../../lib/types';
import { 
  fetchPlayers, 
  savePlayer, 
  deletePlayer, 
  saveTournamentConfig, 
  loadTournamentConfig, 
  savePlayerData, 
  saveTeamAssignments,
  loadTeamAssignments,
  fetchActiveTournament,
  getPlayerTeamAssignments,
  getCurrentTournament
} from '../../lib/api';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
import PlayerActionsModal from '../../components/PlayerActionsModal';
import BaseballCard from '../../components/BaseballCard';


interface ValidationError {
  field: string;
  message: string;
}

interface SaveStatus {
  type: 'success' | 'error' | 'warning' | null;
  message: string;
  timestamp?: number;
}

export default function AdminPage() {
  // Core state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTournamentId, setCurrentTournamentId] = useState<string>('e4d1b3ad-620d-4cee-9431-a1ac3be68ba9');
  const [tournamentSettings, setTournamentSettings] = useState<TournamentSettingsFormData>({
    pool_play_games: 2,
    pool_play_innings: 3,
    bracket_type: 'single_elimination',
    bracket_innings: 3,
    final_innings: 5,
    num_teams: 4,
    team_size: 3
  });
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
  const [playerTeamAssignments, setPlayerTeamAssignments] = useState<Map<string, string>>(new Map());
  const [currentTeams, setCurrentTeams] = useState<TeamDragDrop[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'players' | 'teams' | 'settings'>('players');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: null, message: '' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [settingsLocked, setSettingsLocked] = useState(false);

  const [tournamentLive, setTournamentLive] = useState(false);
  const [startingTournament, setStartingTournament] = useState(false);

  // Players tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'championships_won'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null);
  const [showCard, setShowCard] = useState(false);

  // Session storage keys
  const SESSION_KEYS = {
    players: `tournament-admin-players-default-tournament`,
    settings: `tournament-admin-settings-default-tournament`,
    teams: `tournament-admin-teams-default-tournament`
  };

  // Load data on component mount
  useEffect(() => {
    loadTournamentData();
  }, []);

  // Session persistence
  useEffect(() => {
    if (!loading) {
      sessionStorage.setItem(SESSION_KEYS.players, JSON.stringify(players));
      sessionStorage.setItem(SESSION_KEYS.settings, JSON.stringify(tournamentSettings));
      sessionStorage.setItem(SESSION_KEYS.teams, JSON.stringify(teamAssignments));
    }
  }, [players, tournamentSettings, teamAssignments, loading]);

  // Auto-save status timer
  useEffect(() => {
    if (saveStatus.type && saveStatus.timestamp) {
      const timer = setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);




  const loadTournamentData = async () => {
    try {
      setLoading(true);
      
      // Try to load from session storage first
      const sessionPlayers = sessionStorage.getItem(SESSION_KEYS.players);
      const sessionSettings = sessionStorage.getItem(SESSION_KEYS.settings);
      const sessionTeams = sessionStorage.getItem(SESSION_KEYS.teams);

      if (sessionPlayers && sessionSettings) {
        setPlayers(JSON.parse(sessionPlayers));
        setTournamentSettings(JSON.parse(sessionSettings));
        if (sessionTeams) {
          setTeamAssignments(JSON.parse(sessionTeams));
        }
      }

      // Load fresh data from API
      const [playersResponse, activeTournamentResponse, playerTeamResponse] = await Promise.all([
        fetchPlayers(),
        fetchActiveTournament(),
        getPlayerTeamAssignments()
      ]);

      // Use the active tournament or the first available tournament
      let tournamentId = 'e4d1b3ad-620d-4cee-9431-a1ac3be68ba9'; // Default to your current tournament
      if (activeTournamentResponse.success && activeTournamentResponse.data) {
        tournamentId = activeTournamentResponse.data.id;
      }
      
      // Update the state with the current tournament ID
      setCurrentTournamentId(tournamentId);

      // Now load config and teams with the correct tournament ID
      const configResponse = await loadTournamentConfig(tournamentId);
      
      // Load team assignments using the new API route
      const teamsApiResponse = await fetch(`/api/tournaments/${tournamentId}/assignments`);
      
      if (!teamsApiResponse.ok) {
        console.error('API response not ok:', teamsApiResponse.status, teamsApiResponse.statusText);
      }
      
      const teamsResponse = await teamsApiResponse.json();

      if (playersResponse.success) {
        setPlayers(playersResponse.data);
      }

      if (configResponse.success) {
        setTournamentSettings({
          pool_play_games: configResponse.data.pool_play_games,
          pool_play_innings: configResponse.data.pool_play_innings,
          bracket_type: configResponse.data.bracket_type,
          bracket_innings: configResponse.data.bracket_innings,
          final_innings: configResponse.data.final_innings,
          num_teams: configResponse.data.num_teams || configResponse.data.team_size,
          team_size: configResponse.data.team_size
        });
        setSettingsLocked(configResponse.data.settings_locked);
      }

      if (teamsResponse.success) {
        setTeamAssignments(teamsResponse.data);
        
        // Convert team assignments to current teams format for TeamManager
        if (teamsResponse.data && teamsResponse.data.length > 0) {
          const convertedTeams: TeamDragDrop[] = teamsResponse.data.map((assignment: any) => {
            // Find the players for this team
            const teamPlayers = assignment.players || [];
            
            return {
              id: assignment.team_id,
              name: assignment.team_name,
              players: teamPlayers,
              isLocked: assignment.is_locked || false,
              color: undefined // Will be set by TeamManager if needed
            };
          });
          
          setCurrentTeams(convertedTeams);
        }
      } else {
        console.error('Teams response failed:', teamsResponse);
      }

      if (playerTeamResponse.success) {
        setPlayerTeamAssignments(playerTeamResponse.data);
      }

      if (activeTournamentResponse.success && activeTournamentResponse.data) {
        const tournament = activeTournamentResponse.data as any;         // Set states based on tournament status only
        const isActiveTournament = tournament.status === 'in_progress';
        setIsActive(isActiveTournament);
        setSettingsLocked(isActiveTournament);
        setTournamentLive(isActiveTournament);
      }

    } catch (error) {
      console.error('Error loading tournament data:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to load tournament data. Please refresh the page.',
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const validateTournamentData = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate players
    if (players.length < 4) {
      errors.push({
        field: 'players',
        message: 'At least 4 players are required for a tournament'
      });
    }

    // Validate team configuration
    const maxPossibleTeams = Math.floor(players.length / 2);
    if (tournamentSettings.num_teams > maxPossibleTeams) {
      errors.push({
        field: 'teams',
        message: `Cannot create ${tournamentSettings.num_teams} teams with only ${players.length} players. Maximum possible teams: ${maxPossibleTeams}`
      });
    }

    // Validate tournament settings
    if (tournamentSettings.pool_play_games < 1) {
      errors.push({
        field: 'settings',
        message: 'Pool play games must be at least 1'
      });
    }

    if (tournamentSettings.pool_play_innings < 1 || tournamentSettings.pool_play_innings > 9) {
      errors.push({
        field: 'settings',
        message: 'Pool play innings must be between 1 and 9'
      });
    }

    if (tournamentSettings.bracket_innings < 1 || tournamentSettings.bracket_innings > 9) {
      errors.push({
        field: 'settings',
        message: 'Bracket innings must be between 1 and 9'
      });
    }

    if (tournamentSettings.final_innings < 1 || tournamentSettings.final_innings > 9) {
      errors.push({
        field: 'settings',
        message: 'Final innings must be between 1 and 9'
      });
    }

    return errors;
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);

      // Validate data first
      const errors = validateTournamentData();
      if (errors.length > 0) {
        setValidationErrors(errors);
        setSaveStatus({
          type: 'error',
          message: `Please fix ${errors.length} validation error${errors.length > 1 ? 's' : ''} before saving`,
          timestamp: Date.now()
        });
        return;
      }

      // Save all data
      const tournamentConfig: TournamentConfig = {
        tournament_id: currentTournamentId,
        pool_play_games: tournamentSettings.pool_play_games,
        pool_play_innings: tournamentSettings.pool_play_innings,
        bracket_type: tournamentSettings.bracket_type,
        bracket_innings: tournamentSettings.bracket_innings,
        final_innings: tournamentSettings.final_innings,
        team_size: tournamentSettings.num_teams,
        is_active: isActive,
        settings_locked: settingsLocked
      };

      // Get current tournament ID for team assignments
      const currentTournamentResponse = await getCurrentTournament();
      const tournamentId = currentTournamentResponse.success && currentTournamentResponse.data 
        ? currentTournamentResponse.data.id 
        : 'default-tournament';

      // Save basic data
      await Promise.all([
        savePlayerData(players),
        saveTournamentConfig(tournamentConfig)
      ]);

      // Save team assignments if we're on teams tab
      if (activeTab === 'teams') {
        if (currentTeams.length > 0) {
          // Save team assignments
          const formattedTeamAssignments = currentTeams.map(team => ({
            tournament_id: tournamentId,
            team_id: team.id,
            team_name: team.name,
            player_ids: team.players.map(player => player.id),
            is_locked: team.isLocked || false
          }));
          
          const teamSaveResponse = await saveTeamAssignments(formattedTeamAssignments);
          if (!teamSaveResponse.success) {
            throw new Error(teamSaveResponse.error || 'Failed to save teams');
          }
        }

        // Reload player team assignments to update the players table
        const playerTeamResponse = await getPlayerTeamAssignments();
        if (playerTeamResponse.success) {
          setPlayerTeamAssignments(playerTeamResponse.data);
        }
      }

      setHasUnsavedChanges(false);
      setSaveStatus({
        type: 'success',
        message: activeTab === 'teams' 
          ? (currentTeams.length > 0 
              ? 'All tournament data and team assignments successfully saved!'
              : 'Tournament data saved! (No teams to save)')
          : 'All tournament data successfully saved!',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error saving tournament data:', error);
      setSaveStatus({
        type: 'error',
        message: 'Error saving tournament data. Please try again.',
        timestamp: Date.now()
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Clear session storage and reload
    sessionStorage.removeItem(SESSION_KEYS.players);
    sessionStorage.removeItem(SESSION_KEYS.settings);
    sessionStorage.removeItem(SESSION_KEYS.teams);
    
    setValidationErrors([]);
    setSaveStatus({ type: null, message: '' });
    setHasUnsavedChanges(false);
    
    loadTournamentData();
  };

  const handlePlayerSaved = (player: Player) => {
    setPlayers(prev => {
      const existing = prev.find(p => p.id === player.id);
      if (existing) {
        return prev.map(p => p.id === player.id ? player : p);
      }
      return [...prev, player];
    });
    setHasUnsavedChanges(true);
  };

  const handlePlayerDeleted = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setHasUnsavedChanges(true);
  };

  const handleSettingsChange = useCallback((settings: TournamentSettingsFormData) => {
    setTournamentSettings(settings);
    setHasUnsavedChanges(true);
  }, []);

  const handleTeamSizeChange = useCallback((newTeamSize: number) => {
    // This is handled in TournamentSettings component now
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveTeams = async (teams: any[]) => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/tournaments/${currentTournamentId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teams }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update current teams state
        setCurrentTeams(teams);
        
        // Reload player team assignments to update the players table
        const playerTeamResponse = await getPlayerTeamAssignments();
        if (playerTeamResponse.success) {
          setPlayerTeamAssignments(playerTeamResponse.data);
        }
        
        setSaveStatus({
          type: 'success',
          message: data.message || 'Teams saved successfully!',
          timestamp: Date.now()
        });
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || 'Failed to save teams',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving teams:', error);
      setSaveStatus({
        type: 'error',
        message: 'An error occurred while saving teams',
        timestamp: Date.now()
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearTeams = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/tournaments/${currentTournamentId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teams: [] }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear current teams state - this will trigger TeamManager to reset
        setCurrentTeams([]);
        
        // Reload player team assignments to update the players table
        const playerTeamResponse = await getPlayerTeamAssignments();
        if (playerTeamResponse.success) {
          setPlayerTeamAssignments(playerTeamResponse.data);
        }
        
        setSaveStatus({
          type: 'success',
          message: data.message || 'Teams cleared successfully!',
          timestamp: Date.now()
        });
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || 'Failed to clear teams',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error clearing teams:', error);
      setSaveStatus({
        type: 'error',
        message: 'An error occurred while clearing teams',
        timestamp: Date.now()
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartTournament = async () => {
    if (currentTeams.length === 0) {
      setSaveStatus({
        type: 'error',
        message: 'No teams configured to start tournament',
        timestamp: Date.now()
      });
      return;
    }

    try {
      setStartingTournament(true);
      
      const response = await fetch(`/api/tournaments/${currentTournamentId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teams: currentTeams }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTournamentLive(true);
        setIsActive(true);
        setSettingsLocked(true);
        setSaveStatus({
          type: 'success',
          message: 'Tournament started successfully!',
          timestamp: Date.now()
        });
        
        // Reload tournament data to reflect changes
        await loadTournamentData();
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || 'Failed to start tournament',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      setSaveStatus({
        type: 'error',
        message: 'An error occurred while starting tournament',
        timestamp: Date.now()
      });
    } finally {
      setStartingTournament(false);
    }
  };

  const handleResetTournament = async () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset the tournament? This will:\n' +
      '• Clear all team assignments\n' +
      '• Clear all games (pool play and bracket)\n' +
      '• Set tournament status back to upcoming\n' +
      '• Unlock tournament settings for editing\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmReset) return;

    try {
      setStartingTournament(true);
      
      const response = await fetch(`/api/tournaments/${currentTournamentId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Immediately update UI states
        setTournamentLive(false);
        setIsActive(false);
        setSettingsLocked(false);
        setCurrentTeams([]);
        
        // Show success message
        setSaveStatus({
          type: 'success',
          message: 'Tournament reset successfully! Settings are now unlocked.',
          timestamp: Date.now()
        });
        
        // Reload tournament data to reflect changes
        await loadTournamentData();
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || 'Failed to reset tournament',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error resetting tournament:', error);
      setSaveStatus({
        type: 'error',
        message: 'An error occurred while resetting tournament',
        timestamp: Date.now()
      });
    } finally {
      setStartingTournament(false);
    }
  };

  const getTabErrors = (tab: string) => {
    return validationErrors.filter(error => {
      if (tab === 'players') return error.field === 'players';
      if (tab === 'teams') return error.field === 'teams';
      if (tab === 'settings') return error.field === 'settings';
      return false;
    }).length;
  };

  // Players tab functionality
  const handleAddPlayer = () => {
    setSelectedPlayer(null);
    setShowActionsModal(true);
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setShowActionsModal(true);
  };

  const handlePlayerUpdated = (updatedPlayer: Player) => {
    handlePlayerSaved(updatedPlayer);
    setShowActionsModal(false);
  };

  const handleShowCard = (player: Player) => {
    setCardPlayer(player);
    setShowCard(true);
  };

  const handleCloseCard = () => {
    setShowCard(false);
    setCardPlayer(null);
  };

  const handleSort = (field: 'name' | 'championships_won') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };



  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#6C6D6F', fontSize: 14 }}>Loading admin...</span>
      </div>
    );
  }

  // Filter and sort players
  const filteredPlayers = players
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.nickname && p.nickname.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') return multiplier * a.name.localeCompare(b.name);
      return multiplier * ((a.championships_won || 0) - (b.championships_won || 0));
    });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

      {/* Section header */}
      <div style={{
        backgroundColor: '#2B2C2D',
        color: '#FFFFFF',
        padding: '16px 20px',
        marginTop: 24,
        borderRadius: '10px 10px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Tournament Admin</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: hasUnsavedChanges ? '#f59e0b' : '#22c55e' }} />
          <span style={{ fontSize: 12, color: '#A5A6A7' }}>{hasUnsavedChanges ? 'Unsaved' : 'Saved'}</span>
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D0D0D0',
        borderTop: 'none',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {!tournamentLive ? (
          <button
            onClick={handleStartTournament}
            disabled={startingTournament || currentTeams.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: currentTeams.length === 0 ? '#A5A6A7' : '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              cursor: currentTeams.length === 0 ? 'default' : 'pointer',
            }}
          >
            {startingTournament ? 'Starting...' : 'Start Tournament'}
          </button>
        ) : (
          <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
            Tournament Live
          </span>
        )}
        <button
          onClick={handleResetTournament}
          disabled={startingTournament}
          style={{ padding: '8px 16px', backgroundColor: '#CC0000', color: '#FFFFFF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Reset
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving || validationErrors.length > 0}
          style={{
            padding: '8px 16px',
            backgroundColor: saving ? '#A5A6A7' : '#2B2C2D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #D0D0D0',
        borderRight: '1px solid #D0D0D0',
        display: 'flex',
        borderBottom: '1px solid #D0D0D0',
        padding: '0 20px',
      }}>
        {(['players', 'settings', 'teams'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#151617' : '#6C6D6F',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #CC0000' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D0D0D0',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        overflow: 'hidden',
      }}>
        {activeTab === 'players' && (
          <div style={{ padding: '20px' }}>
            {/* Search + Add */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: 13,
                  width: 240,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddPlayer}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2B2C2D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add Player
              </button>
            </div>

            {/* Players table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                    <th
                      onClick={() => handleSort('name')}
                      style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#2B2C2D', textTransform: 'uppercase', textAlign: 'left', cursor: 'pointer' }}
                    >
                      Player {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#2B2C2D', textTransform: 'uppercase', textAlign: 'left' }}>Location</th>
                    <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#2B2C2D', textTransform: 'uppercase', textAlign: 'left' }}>Hometown</th>
                    <th
                      onClick={() => handleSort('championships_won')}
                      style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#2B2C2D', textTransform: 'uppercase', textAlign: 'center', cursor: 'pointer' }}
                    >
                      Titles {sortBy === 'championships_won' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#2B2C2D', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, i) => (
                    <tr key={player.id} style={{ borderBottom: '1px solid #E5E5E5', backgroundColor: i % 2 === 1 ? '#F9F9F9' : '#FFFFFF' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#6C6D6F', flexShrink: 0 }}>
                            {player.name.charAt(0)}
                          </div>
                          <div>
                            <span
                              onClick={() => handleShowCard(player)}
                              style={{ fontWeight: 600, color: '#0066CC', cursor: 'pointer' }}
                            >
                              {player.name}
                            </span>
                            {player.nickname && <span style={{ marginLeft: 6, fontSize: 11, color: '#A5A6A7' }}>"{player.nickname}"</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#484A4A' }}>{player.current_town || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#484A4A' }}>{player.hometown || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#2B2C2D', textAlign: 'center', fontWeight: 600 }}>{player.championships_won || 0}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEditPlayer(player)}
                          style={{ background: 'none', border: 'none', color: '#0066CC', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '8px 12px', fontSize: 12, color: '#A5A6A7' }}>
                {filteredPlayers.length} of {players.length} players
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div style={{ padding: '20px' }}>
            {/* Action bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#6C6D6F' }}>{currentTeams.length} teams · {players.length} players</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleClearTeams} style={{ padding: '8px 16px', backgroundColor: '#F1F2F3', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#484A4A' }}>Clear Teams</button>
                <button onClick={() => handleSaveTeams(currentTeams)} disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#2B2C2D', color: '#FFFFFF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Teams'}</button>
              </div>
            </div>

            {currentTeams.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#A5A6A7', fontSize: 14, border: '1px dashed #D0D0D0', borderRadius: 10 }}>
                No teams configured. Go to Settings tab to set number of teams, then come back here.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
                {/* Left: Player assignment list */}
                <div style={{ padding: '0 16px 0 0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: '2px solid #E5E5E5', marginBottom: 8 }}>
                    Assign Players
                  </div>
                  {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((player, i) => {
                    // Find which team this player is on
                    const assignedTeam = currentTeams.find(t => t.players.some(p => p.id === player.id));
                    return (
                      <div key={player.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 120px',
                        alignItems: 'center',
                        padding: '6px 8px',
                        borderBottom: '1px solid #F1F2F3',
                        gap: 8,
                        backgroundColor: i % 2 === 1 ? '#F9F9F9' : '#FFFFFF',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#6C6D6F', flexShrink: 0 }}>
                            {player.name.charAt(0)}
                          </div>
                          <span style={{ fontSize: 13, color: '#151617', fontWeight: 500 }}>{player.name}</span>
                        </div>
                        <select
                          value={assignedTeam?.id || ''}
                          onChange={(e) => {
                            const newTeams = currentTeams.map(t => ({
                              ...t,
                              players: t.players.filter(p => p.id !== player.id),
                            }));
                            if (e.target.value) {
                              const targetTeam = newTeams.find(t => t.id === e.target.value);
                              if (targetTeam) {
                                targetTeam.players.push(player);
                              }
                            }
                            setCurrentTeams(newTeams);
                            setHasUnsavedChanges(true);
                          }}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #D0D0D0',
                            borderRadius: 4,
                            fontSize: 12,
                            backgroundColor: '#FFFFFF',
                            color: assignedTeam ? '#151617' : '#A5A6A7',
                          }}
                        >
                          <option value="">Unassigned</option>
                          {[...currentTeams].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Vertical divider */}
                <div style={{ backgroundColor: '#D0D0D0' }} />

                {/* Right: Team viewer */}
                <div style={{ padding: '0 0 0 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: '2px solid #E5E5E5', marginBottom: 12 }}>
                    Teams
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...currentTeams].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(team => (
                      <div key={team.id} style={{ border: '1px solid #D0D0D0', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#2B2C2D', color: '#FFFFFF', padding: '8px 12px', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{team.name}</span>
                          <span style={{ fontSize: 11, color: '#A5A6A7', fontWeight: 400 }}>{team.players.length}</span>
                        </div>
                        <div style={{ backgroundColor: '#FFFFFF' }}>
                          {team.players.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#A5A6A7', fontSize: 12 }}>Empty</div>
                          ) : (
                            team.players.sort((a, b) => a.name.localeCompare(b.name)).map((p, pi) => (
                              <div key={p.id} style={{ padding: '5px 12px', fontSize: 12, color: '#484A4A', borderBottom: pi < team.players.length - 1 ? '1px solid #F1F2F3' : 'none' }}>
                                {p.name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '20px' }}>
            {/* Teams Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: '2px solid #E5E5E5', marginBottom: 16 }}>
                Teams
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6C6D6F', marginBottom: 6 }}>Number of Teams</label>
                  <select value={tournamentSettings.num_teams} onChange={(e) => handleSettingsChange({ ...tournamentSettings, num_teams: parseInt(e.target.value) })} disabled={settingsLocked} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 14, backgroundColor: settingsLocked ? '#F9F9F9' : '#FFFFFF' }}>
                    {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6C6D6F', marginBottom: 6 }}>Players per Team</label>
                  <select value={tournamentSettings.team_size} onChange={(e) => handleSettingsChange({ ...tournamentSettings, team_size: parseInt(e.target.value) })} disabled={settingsLocked} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 14, backgroundColor: settingsLocked ? '#F9F9F9' : '#FFFFFF' }}>
                    {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Pool Play Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: '2px solid #E5E5E5', marginBottom: 16 }}>
                Pool Play
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6C6D6F', marginBottom: 6 }}>Games per Team</label>
                  <select value={tournamentSettings.pool_play_games} onChange={(e) => handleSettingsChange({ ...tournamentSettings, pool_play_games: parseInt(e.target.value) })} disabled={settingsLocked} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 14, backgroundColor: settingsLocked ? '#F9F9F9' : '#FFFFFF' }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6C6D6F', marginBottom: 6 }}>Innings per Game</label>
                  <select value={tournamentSettings.pool_play_innings} onChange={(e) => handleSettingsChange({ ...tournamentSettings, pool_play_innings: parseInt(e.target.value) })} disabled={settingsLocked} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 14, backgroundColor: settingsLocked ? '#F9F9F9' : '#FFFFFF' }}>
                    {[3,5,7,9].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Bracket Play Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 8, borderBottom: '2px solid #E5E5E5', marginBottom: 16 }}>
                Bracket Play
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6C6D6F', marginBottom: 6 }}>Format</label>
                  <select value={tournamentSettings.bracket_type} onChange={(e) => handleSettingsChange({ ...tournamentSettings, bracket_type: e.target.value as 'single_elimination' | 'double_elimination' })} disabled={settingsLocked} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 14, backgroundColor: settingsLocked ? '#F9F9F9' : '#FFFFFF' }}>
                    <option value="single_elimination">Single Elimination</option>
                    <option value="double_elimination">Double Elimination</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6C6D6F', marginBottom: 6 }}>Bracket Innings</label>
                  <select value={tournamentSettings.bracket_innings} onChange={(e) => handleSettingsChange({ ...tournamentSettings, bracket_innings: parseInt(e.target.value) })} disabled={settingsLocked} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 14, backgroundColor: settingsLocked ? '#F9F9F9' : '#FFFFFF' }}>
                    {[3,5,7,9].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6C6D6F', marginBottom: 6 }}>Finals Innings</label>
                  <select value={tournamentSettings.final_innings} onChange={(e) => handleSettingsChange({ ...tournamentSettings, final_innings: parseInt(e.target.value) })} disabled={settingsLocked} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D0D0D0', borderRadius: 4, fontSize: 14, backgroundColor: settingsLocked ? '#F9F9F9' : '#FFFFFF' }}>
                    {[3,5,7,9].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {settingsLocked && (
              <div style={{ padding: '12px 16px', backgroundColor: '#F9F9F9', borderRadius: 4, fontSize: 13, color: '#6C6D6F', border: '1px solid #E5E5E5' }}>
                Settings are locked while the tournament is active.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div style={{
          marginTop: 12,
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D0D0D0',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#CC0000', marginBottom: 8 }}>
            Validation Errors ({validationErrors.length})
          </div>
          {validationErrors.map((err, i) => (
            <div key={i} style={{ fontSize: 13, color: '#484A4A', padding: '4px 0' }}>
              <strong style={{ textTransform: 'capitalize' }}>{err.field}:</strong> {err.message}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showActionsModal && (
        <PlayerActionsModal
          player={selectedPlayer}
          isOpen={showActionsModal}
          onClose={() => setShowActionsModal(false)}
          onPlayerUpdated={handlePlayerUpdated}
          onPlayerDeleted={handlePlayerDeleted}
        />
      )}

      {cardPlayer && (
        <BaseballCard
          player={cardPlayer}
          isOpen={showCard}
          onClose={handleCloseCard}
        />
      )}

      <div style={{ height: 32 }} />
    </div>
  );
}
