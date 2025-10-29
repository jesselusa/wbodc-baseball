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
import TeamManager from '../../components/TeamManager';
import TournamentSettings from '../../components/TournamentSettings';
import PlayersTable from '../../components/PlayersTable';

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
  const [isMobile, setIsMobile] = useState(false);
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

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: '1px solid #e4e2e8',
        padding: '64px 32px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: '1200px',
        margin: '0 auto',
        marginTop: '64px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '16px',
          color: '#696775'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #e4e2e8',
            borderTop: '3px solid #8b8a94',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading tournament administration...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      minHeight: '100vh',
      paddingTop: '64px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: '1px solid #e4e2e8',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: '1200px',
        margin: '32px auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1c1b20 0%, #2d2c32 100%)',
          color: 'white',
          padding: isMobile ? '24px' : '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '50%'
          }} />

          <div style={{ position: 'relative', zIndex: 5 }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Tournament Administration
            </h1>
            <p style={{
              fontSize: '16px',
              margin: '0',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Configure tournament settings, manage teams and organize players
            </p>
          </div>
        </div>

        {/* Save Status Bar */}
        {saveStatus.type && (
          <div style={{
            padding: isMobile ? '12px 20px' : '16px 32px',
            background: saveStatus.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                        saveStatus.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                        'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px solid #e4e2e8',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: saveStatus.type === 'success' ? '#22c55e' : 
                         saveStatus.type === 'error' ? '#ef4444' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {saveStatus.type === 'success' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2"/>
                </svg>
              )}
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: saveStatus.type === 'success' ? '#15803d' : 
                     saveStatus.type === 'error' ? '#dc2626' : '#d97706'
            }}>
              {saveStatus.message}
            </span>
          </div>
        )}

        {/* Action Bar */}
        <div style={{
          padding: isMobile ? '16px 20px' : '24px 32px',
          borderBottom: '1px solid #e4e2e8',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '12px' : '16px',
          background: 'rgba(248, 250, 252, 0.5)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#696775',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: hasUnsavedChanges ? '#f59e0b' : '#22c55e'
              }} />
              {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
            </div>
            {validationErrors.length > 0 && (
              <div style={{
                fontSize: '14px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {/* Tournament Control Buttons */}
            {!tournamentLive ? (
              <button
                onClick={handleStartTournament}
                disabled={startingTournament || currentTeams.length === 0}
                style={{
                  padding: '12px 24px',
                  background: (currentTeams.length === 0) 
                    ? '#e5e7eb' 
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: (currentTeams.length === 0) ? '#9ca3af' : 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (startingTournament || currentTeams.length === 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: startingTournament ? 0.7 : 1
                }}
              >
                {startingTournament && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {startingTournament ? 'Starting...' : 'Start Tournament'}
              </button>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulse 2s infinite'
                }}></span>
                Tournament Live
              </div>
            )}
            
            <button
              onClick={handleResetTournament}
              disabled={startingTournament}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: startingTournament ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: startingTournament ? 0.7 : 1
              }}
            >
              {startingTournament ? 'Resetting...' : 'Reset Tournament'}
            </button>

            {/* Separator */}
            <div style={{
              width: '1px',
              height: '40px',
              background: '#e4e2e8',
              margin: '0 8px'
            }}></div>

            {/* Data Management Buttons */}
            <button
              onClick={handleReset}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: saving ? 0.6 : 1
              }}
            >
              Reset Data
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || validationErrors.length > 0}
              style={{
                padding: '12px 24px',
                background: saving ? '#8b8a94' : 
                           validationErrors.length > 0 ? '#d1d5db' :
                           'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: saving || validationErrors.length > 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {saving && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e4e2e8',
          background: 'white',
          overflowX: isMobile ? 'auto' : 'visible'
        }}>
          {(['players', 'settings', 'teams'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const errorCount = getTabErrors(tab);
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: isMobile ? '12px 16px' : '16px 24px',
                  background: isActive ? 'white' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  color: isActive ? '#3b82f6' : '#696775',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                  minWidth: isMobile ? 'auto' : '100px',
                  flexShrink: 0
                }}
              >
                {tab}
                {errorCount > 0 && (
                  <div style={{
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: '700',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {errorCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: isMobile ? '20px' : '32px' }}>
          {activeTab === 'players' && (
            <div>
              {/* Players Tab Header */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1c1b20',
                  margin: '0 0 8px 0'
                }}>
                  Player Management
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#696775',
                  margin: '0'
                }}>
                  Add, edit, and manage players for the tournament
                </p>
              </div>

              {/* Players Table */}
              <PlayersTable
                players={players}
                loading={false}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onPlayerClick={handleShowCard}
                onPlayerEdit={handleEditPlayer}
                onAddPlayer={handleAddPlayer}
                showAddButton={true}
                showEditColumn={true}
                showResultsCount={true}
                isReadOnly={false}
                playerTeamAssignments={playerTeamAssignments}
              />
            </div>
          )}

          {activeTab === 'teams' && (
            <TeamManager
              players={players}
              teamSize={tournamentSettings.team_size}
              numTeams={tournamentSettings.num_teams}
              teams={currentTeams}
              onTeamSizeChange={handleTeamSizeChange}
              onTeamsChange={setCurrentTeams}
              onSaveTeams={handleSaveTeams}
              onClearTeams={handleClearTeams}

              isLocked={isActive}
              savingTeams={saving}
            />
          )}

          {activeTab === 'settings' && (
            <TournamentSettings
              tournamentId={currentTournamentId}
              players={players}
              teams={currentTeams}
              onSettingsChange={handleSettingsChange}
              onReset={handleReset}
              disabled={settingsLocked}
              isActive={isActive}
            />
          )}
        </div>

        {/* Validation Errors Panel */}
        {validationErrors.length > 0 && (
          <div style={{
            margin: isMobile ? '0 20px 20px' : '0 32px 32px',
            padding: isMobile ? '16px' : '20px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Validation Errors
            </h3>
            <ul style={{
              margin: '0',
              padding: '0 0 0 20px',
              color: '#7f1d1d'
            }}>
              {validationErrors.map((error, index) => (
                <li key={index} style={{
                  marginBottom: '8px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ textTransform: 'capitalize' }}>{error.field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Player Actions Modal */}
        {showActionsModal && (
          <PlayerActionsModal
            player={selectedPlayer}
            isOpen={showActionsModal}
            onClose={() => setShowActionsModal(false)}
            onPlayerUpdated={handlePlayerUpdated}
            onPlayerDeleted={handlePlayerDeleted}
          />
        )}

        {/* Baseball Card */}
        {cardPlayer && (
          <BaseballCard
            player={cardPlayer}
            isOpen={showCard}
            onClose={handleCloseCard}
          />
        )}
      </div>
    </div>
  );
} 