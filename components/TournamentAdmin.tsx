'use client';

import { useState, useEffect, useCallback } from 'react';
import { Player, TournamentSettingsFormData, TeamAssignment, TournamentConfig, TournamentAdminData, TeamDragDrop, TournamentRecord } from '../lib/types';
import { 
  fetchPlayers, 
  savePlayer, 
  deletePlayer, 
  saveTournamentConfig, 
  loadTournamentConfig, 
  savePlayerData, 
  saveTeamAssignments,
  loadTeamAssignments,
  fetchActiveTournament
} from '../lib/api';
import PlayerManagement from './PlayerManagement';
import TeamManager from './TeamManager';
import TournamentSettings from './TournamentSettings';

interface TournamentAdminProps {
  tournamentId?: string;
  className?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface SaveStatus {
  type: 'success' | 'error' | 'warning' | null;
  message: string;
  timestamp?: number;
}

const TournamentAdmin: React.FC<TournamentAdminProps> = ({ 
  tournamentId = 'default-tournament',
  className = ''
}) => {
  // Core state
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentSettings, setTournamentSettings] = useState<TournamentSettingsFormData>({
    pool_play_games: 2,
    pool_play_innings: 3,
    bracket_type: 'single_elimination',
    bracket_innings: 3,
    final_innings: 5,
    num_teams: 4
  });
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
  const [teams, setTeams] = useState<TeamDragDrop[]>([]);
  const [currentTournament, setCurrentTournament] = useState<TournamentRecord | null>(null);

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

  // Session storage keys
  const SESSION_KEYS = {
    players: `tournament-admin-players-${tournamentId}`,
    settings: `tournament-admin-settings-${tournamentId}`,
    teams: `tournament-admin-teams-${tournamentId}`
  };

  // Load data on component mount
  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

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

      if (sessionPlayers && sessionSettings && sessionTeams) {
        setPlayers(JSON.parse(sessionPlayers));
        setTournamentSettings(JSON.parse(sessionSettings));
        setTeamAssignments(JSON.parse(sessionTeams));
      } else {
        // Load from API
        const [playersResponse, tournamentResponse, activeTournamentResponse] = await Promise.all([
          fetchPlayers(),
          loadTournamentConfig(tournamentId).catch(() => ({ success: false, data: null })),
          fetchActiveTournament().catch(() => ({ success: false, data: null }))
        ]);

        if (playersResponse.success) {
          setPlayers(playersResponse.data);
        }

        if (tournamentResponse.success && tournamentResponse.data) {
          const config = tournamentResponse.data;
          setTournamentSettings({
            pool_play_games: config.pool_play_games,
            pool_play_innings: config.pool_play_innings,
            bracket_type: config.bracket_type,
            bracket_innings: config.bracket_innings,
            final_innings: config.final_innings,
            num_teams: Math.ceil(playersResponse.data.length / config.team_size)
          });
          setIsActive(config.is_active);
          setSettingsLocked(config.settings_locked);
        }

        // Load team assignments
        const teamsResponse = await loadTeamAssignments(tournamentId).catch(() => ({ success: false, data: [] }));
        if (teamsResponse.success) {
          setTeamAssignments(teamsResponse.data);
        }
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

    // Player validation
    if (players.length < 4) {
      errors.push({
        field: 'players',
        message: 'At least 4 players are required for a tournament'
      });
    }

    // Check for duplicate player names
    const playerNames = players.map(p => p.name.toLowerCase());
    const duplicateNames = playerNames.filter((name, index) => playerNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push({
        field: 'players',
        message: `Duplicate player names found: ${duplicateNames.join(', ')}`
      });
    }

    // Tournament settings validation
    if (tournamentSettings.num_teams < 2) {
      errors.push({
        field: 'settings',
        message: 'At least 2 teams are required'
      });
    }

    if (tournamentSettings.pool_play_innings < 3) {
      errors.push({
        field: 'settings',
        message: 'Pool play games must be at least 3 innings'
      });
    }

    if (tournamentSettings.bracket_innings < 3) {
      errors.push({
        field: 'settings',
        message: 'Bracket games must be at least 3 innings'
      });
    }

    if (tournamentSettings.final_innings < tournamentSettings.bracket_innings) {
      errors.push({
        field: 'settings',
        message: 'Final game innings must be at least as long as bracket games'
      });
    }

    // Team assignment validation
    const assignedPlayers = teamAssignments.flatMap(team => team.player_ids);
    const unassignedPlayers = players.filter(player => !assignedPlayers.includes(player.id));
    
    if (unassignedPlayers.length > 0 && teamAssignments.length > 0) {
      errors.push({
        field: 'teams',
        message: `${unassignedPlayers.length} players are not assigned to teams`
      });
    }

    return errors;
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);

      // Validate all data
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

      // Save players
      const playersToSave = players.map(player => ({
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        email: player.email,
        hometown: player.hometown,
        current_town: player.current_town,
        championships_won: player.championships_won
      }));

      const playerResponse = await savePlayerData(playersToSave);
      if (!playerResponse.success) {
        throw new Error('Failed to save players');
      }

      // Save tournament configuration
      const teamSize = Math.ceil(players.length / tournamentSettings.num_teams);
      const configToSave = {
        tournament_id: tournamentId,
        pool_play_games: tournamentSettings.pool_play_games,
        pool_play_innings: tournamentSettings.pool_play_innings,
        bracket_type: tournamentSettings.bracket_type,
        bracket_innings: tournamentSettings.bracket_innings,
        final_innings: tournamentSettings.final_innings,
        team_size: teamSize,
        is_active: isActive,
        settings_locked: settingsLocked
      };

      const configResponse = await saveTournamentConfig(configToSave);
      if (!configResponse.success) {
        throw new Error('Failed to save tournament configuration');
      }

      // Save team assignments
      if (teamAssignments.length > 0) {
        const teamsResponse = await saveTeamAssignments(teamAssignments);
        if (!teamsResponse.success) {
          throw new Error('Failed to save team assignments');
        }
      }

      setHasUnsavedChanges(false);
      setSaveStatus({
        type: 'success',
        message: 'Tournament configuration saved successfully',
        timestamp: Date.now()
      });

      // Clear session storage after successful save
      Object.values(SESSION_KEYS).forEach(key => sessionStorage.removeItem(key));

    } catch (error) {
      console.error('Error saving tournament data:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save tournament configuration. Please try again.',
        timestamp: Date.now()
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (hasUnsavedChanges && !confirm('Are you sure you want to reset all changes? This will lose any unsaved data.')) {
      return;
    }

    // Clear session storage
    Object.values(SESSION_KEYS).forEach(key => sessionStorage.removeItem(key));
    
    // Reset state
    setValidationErrors([]);
    setSaveStatus({ type: null, message: '' });
    setHasUnsavedChanges(false);
    
    // Reload data from API
    loadTournamentData();
  };

  const handlePlayerSaved = (player: Player) => {
    setPlayers(prev => {
      const index = prev.findIndex(p => p.id === player.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = player;
        return updated;
      } else {
        return [...prev, player];
      }
    });
    setHasUnsavedChanges(true);
  };

  const handlePlayerDeleted = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    // Remove from team assignments
    setTeamAssignments(prev => prev.map(team => ({
      ...team,
      player_ids: team.player_ids.filter(id => id !== playerId)
    })));
    setHasUnsavedChanges(true);
  };

  const handleSettingsChange = (settings: TournamentSettingsFormData) => {
    setTournamentSettings(settings);
    setHasUnsavedChanges(true);
  };

  const handleTeamSizeChange = (newTeamSize: number) => {
    // Team size is now calculated from num_teams, so we derive num_teams from team size
    const newNumTeams = Math.ceil(players.length / newTeamSize);
    setTournamentSettings(prev => ({
      ...prev,
      num_teams: newNumTeams
    }));
    setHasUnsavedChanges(true);
  };

  const handleTeamsChange = (newTeams: TeamDragDrop[]) => {
    setTeams(newTeams);
    setHasUnsavedChanges(true);
  };

  const getTabErrors = (tab: string) => {
    return validationErrors.filter(error => error.field === tab).length;
  };

  if (loading) {
    return (
      <div className={`tournament-admin ${className}`} style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: '1px solid #e4e2e8',
        padding: '64px 32px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
    <div className={`tournament-admin ${className}`} style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      borderRadius: '16px',
      border: '1px solid #e4e2e8',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      maxWidth: '1200px',
      margin: '0 auto'
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              {saveStatus.type === 'success' ? (
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" fill="none" />
              ) : saveStatus.type === 'error' ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2" />
                </>
              ) : (
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              )}
            </svg>
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
        

      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e4e2e8',
        background: 'white',
        overflowX: isMobile ? 'auto' : 'visible'
      }}>
        {(['players', 'teams', 'settings'] as const).map((tab) => {
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
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#696775';
                  e.currentTarget.style.background = 'transparent';
                }
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
          <PlayerManagement
            onPlayerSaved={handlePlayerSaved}
            onPlayerDeleted={handlePlayerDeleted}
          />
        )}

        {activeTab === 'teams' && (
          <TeamManager
            players={players}
            numTeams={tournamentSettings.num_teams}
            teams={teams}
            onTeamSizeChange={handleTeamSizeChange}
            onTeamsChange={handleTeamsChange}
          />
        )}

        {activeTab === 'settings' && (
          <TournamentSettings
            tournamentId={tournamentId}
            players={players}
            teams={teams}
            onSettingsChange={handleSettingsChange}
            onTournamentChange={setCurrentTournament}
            disabled={settingsLocked}
            isActive={isActive}
            onReset={handleReset}
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
    </div>
  );
};

export default TournamentAdmin; 