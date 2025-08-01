'use client';

import { useState, useEffect, useMemo } from 'react';
import { TournamentSettingsFormData, BracketType, Player, TournamentRecord, TeamDragDrop, getTournamentYear } from '../lib/types';
import { createTournament, getCurrentTournament, lockTournament, unlockTournament, updateTournamentSettings } from '../lib/api';
import { generateTournamentStandings } from '../lib/utils/tournament-helpers';
import TournamentBracket from './TournamentBracket';

interface TournamentSettingsProps {
  tournamentId: string;
  players: Player[];
  teams: TeamDragDrop[];
  onSettingsChange?: (settings: TournamentSettingsFormData) => void;
  onTeamSizeChange?: (teamSize: number) => void;
  onTournamentChange?: (tournament: TournamentRecord | null) => void;
  onReset?: () => void;
  disabled?: boolean;
  isActive?: boolean;
  hasActiveGames?: boolean;
}

// Default tournament settings
const getDefaultTournamentSettings = (): TournamentSettingsFormData => ({
  pool_play_games: 3, // num_teams - 1 (4 - 1 = 3)
  pool_play_innings: 3,
  bracket_type: 'single_elimination',
  bracket_innings: 3,
  final_innings: 5,
  num_teams: 4
});

export default function TournamentSettings({
  tournamentId,
  players,
  teams,
  onSettingsChange,
  onReset,
  onTeamSizeChange,
  onTournamentChange,
  disabled = false,
  isActive = false,
  hasActiveGames = false
}: TournamentSettingsProps) {
  const [localSettings, setLocalSettings] = useState<TournamentSettingsFormData>(getDefaultTournamentSettings());
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Calculate team size from number of teams and players
  const teamSize = useMemo(() => {
    if (players.length === 0 || localSettings.num_teams === 0) return 0;
    return Math.ceil(players.length / localSettings.num_teams);
  }, [players.length, localSettings.num_teams]);

  // Update pool play games default based on number of teams (only when user changes teams, not on initial load)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  useEffect(() => {
    if (hasLoadedInitialData && localSettings.num_teams > 1) {
      setLocalSettings(prev => ({
        ...prev,
        pool_play_games: localSettings.num_teams - 1
      }));
    }
  }, [localSettings.num_teams, hasLoadedInitialData]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Tournament management state
  const [currentTournament, setCurrentTournament] = useState<TournamentRecord | null>(null);
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    start_date: '', // Will be set to today in useEffect
    end_date: '', // Will be set to today in useEffect  
    location: '',
    tournament_number: 9
  });
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [lockingTournament, setLockingTournament] = useState(false);

  // Calculate if settings are locked
  const settingsLocked = useMemo(() => {
    // Settings are locked if tournament is locked OR if explicitly disabled
    return currentTournament?.locked_status || disabled;
  }, [currentTournament?.locked_status, disabled]);

  // Handle mobile detection and default dates (client-side only to avoid hydration issues)
  useEffect(() => {
    setIsClient(true);
    // Set default dates to today (only on client to avoid hydration mismatch)
    const today = new Date().toISOString().split('T')[0];
    setTournamentForm(prev => ({
      ...prev,
      start_date: prev.start_date || today,
      end_date: prev.end_date || today
    }));

    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate team distribution based on desired number of teams
  const teamDistribution = useMemo(() => {
    if (players.length === 0 || localSettings.num_teams === 0) {
      return {
        teamCount: 0,
        actualTeamSize: 0,
        remainder: 0,
        distribution: []
      };
    }

    const teamCount = localSettings.num_teams;
    const baseSize = Math.floor(players.length / teamCount);
    const remainder = players.length % teamCount;
    
    // Create distribution array - some teams get one extra player
    const distribution = Array(teamCount).fill(baseSize);
    for (let i = 0; i < remainder; i++) {
      distribution[i] += 1;
    }

    return {
      teamCount,
      actualTeamSize: teamSize,
      remainder: 0, // No remainder when distributing to fixed number of teams
      distribution
    };
  }, [players.length, localSettings.num_teams, teamSize]);

  // Generate mock standings for preview
  const mockStandings = useMemo(() => {
    if (!showPreview || teamDistribution.teamCount === 0) return [];
    
    const mockTeams = Array.from({ length: teamDistribution.teamCount }, (_, i) => ({
      id: `team-${i + 1}`,
      name: `Team ${i + 1}`,
      players: [],
      is_locked: false
    }));

    const mockGameResults = Array.from({ length: localSettings.pool_play_games }, (_, i) => ({
      home_team_id: `team-${(i % teamDistribution.teamCount) + 1}`,
      away_team_id: `team-${((i + 1) % teamDistribution.teamCount) + 1}`,
      home_score: ((i * 3) % 10) + 8, // Deterministic scores 8-17
      away_score: ((i * 2) % 8) + 6,  // Deterministic scores 6-13
      status: 'completed' as const
    }));

    return generateTournamentStandings(mockTeams, mockGameResults);
  }, [showPreview, teamDistribution.teamCount, localSettings.pool_play_games]);

  // Load current tournament on mount
  useEffect(() => {
    const loadCurrentTournament = async () => {
      setLoading(true);
      try {
        const response = await getCurrentTournament();
        if (response.success && response.data) {
          setCurrentTournament(response.data);
          onTournamentChange?.(response.data);
          
          // Update form with current tournament data
          setTournamentForm(prev => ({
            name: response.data.name,
            start_date: response.data.start_date || prev.start_date,
            end_date: response.data.end_date || prev.end_date,
            location: response.data.location || '',
            tournament_number: response.data.tournament_number
          }));

          // Update settings form with tournament settings
          const tournamentSettings = {
            pool_play_games: response.data.pool_play_games,
            pool_play_innings: response.data.pool_play_innings,
            bracket_type: response.data.bracket_type,
            bracket_innings: response.data.bracket_innings,
            final_innings: response.data.final_innings,
            num_teams: response.data.num_teams
          };
          setLocalSettings(tournamentSettings);
          onSettingsChange?.(tournamentSettings);
          onTeamSizeChange?.(Math.ceil(players.length / response.data.num_teams));
        } else {
          // No tournament found - this is normal for initial setup
          setCurrentTournament(null);
          onTournamentChange?.(null);
          
          // Reset to default values when no tournament exists
          const defaultSettings = getDefaultTournamentSettings();
          setLocalSettings(defaultSettings);
          onSettingsChange?.(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading current tournament:', error);
        // On error, also set tournament to null so UI can show create form
        setCurrentTournament(null);
        onTournamentChange?.(null);
        
        // Reset to default values on error
        const defaultSettings = getDefaultTournamentSettings();
        setLocalSettings(defaultSettings);
        onSettingsChange?.(defaultSettings);
      } finally {
        setLoading(false);
        setHasLoadedInitialData(true);
      }
    };

    loadCurrentTournament();
  }, [players.length]); // Only depend on players.length, not callback functions

  // Settings are now loaded from the tournament record in the useEffect above

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Tournament details validation (only when not locked)
    if (!currentTournament?.locked_status && !tournamentForm.name.trim()) {
      newErrors.name = 'Tournament name is required';
    }
    if (!currentTournament?.locked_status && !tournamentForm.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (localSettings.pool_play_games < 1) {
      newErrors.pool_play_games = 'Pool play games must be at least 1';
    }

    if (localSettings.pool_play_games > 10) {
      newErrors.pool_play_games = 'Pool play games cannot exceed 10';
    }

    if (localSettings.pool_play_innings < 3) {
      newErrors.pool_play_innings = 'Pool play innings must be at least 3';
    }

    if (localSettings.bracket_innings < 3) {
      newErrors.bracket_innings = 'Bracket innings must be at least 3';
    }

    if (localSettings.final_innings < 3) {
      newErrors.final_innings = 'Final innings must be at least 3';
    }

    if (localSettings.num_teams < 2) {
      newErrors.num_teams = 'Number of teams must be at least 2';
    }

    if (localSettings.num_teams > 20) {
      newErrors.num_teams = 'Number of teams cannot exceed 20';
    }

    if (localSettings.bracket_innings > localSettings.final_innings) {
      newErrors.bracket_innings = 'Bracket innings cannot exceed final innings';
    }

    if (players.length > 0 && localSettings.num_teams > players.length) {
      newErrors.num_teams = 'Number of teams cannot exceed total number of players';
    }

    if (players.length > 0 && localSettings.num_teams < 2) {
      newErrors.num_teams = 'Need at least 2 teams';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TournamentSettingsFormData, value: any) => {
    const newFormData = { ...localSettings, [field]: value };
    setLocalSettings(newFormData);
    setErrors({ ...errors, [field]: '' });
    setSuccess(false);
    onSettingsChange?.(newFormData);
    
    if (field === 'num_teams') {
      // Calculate new team size when num_teams changes
      const newTeamSize = players.length > 0 ? Math.ceil(players.length / value) : 0;
      onTeamSizeChange?.(newTeamSize);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!currentTournament) {
      setErrors({ submit: 'No tournament selected' });
      return;
    }

    setSaving(true);
    try {
      // Save both tournament details and settings in one call
      const updateData = {
        ...localSettings,
        name: tournamentForm.name,
        start_date: tournamentForm.start_date,
        end_date: tournamentForm.end_date,
        location: tournamentForm.location,
        tournament_number: tournamentForm.tournament_number
      };

      const response = await updateTournamentSettings(currentTournament.id, updateData);

      if (response.success) {
        // Update local tournament state
        setCurrentTournament(response.data);
        onTournamentChange?.(response.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrors({ submit: response.error || 'Failed to save settings' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving settings' });
    } finally {
      setSaving(false);
    }
  };

  // Tournament management functions
  const handleCreateTournament = async () => {
          if (!tournamentForm.name.trim()) {
        setErrors({ name: 'Tournament name is required' });
        return;
    }

    setSaving(true);
    try {
      const response = await createTournament({
        ...tournamentForm,
        // Include current settings in the new tournament
        ...localSettings
      });
      if (response.success) {
        setCurrentTournament(response.data);
        onTournamentChange?.(response.data);
        setShowTournamentForm(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrors({ submit: response.error || 'Failed to create tournament' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while creating tournament' });
    } finally {
      setSaving(false);
    }
  };

  const handleLockTournament = async () => {
    if (!currentTournament) {
      setErrors({ submit: 'No tournament to lock' });
      return;
    }

    if ((teams?.length || 0) === 0) {
      setErrors({ submit: 'No teams configured to lock' });
      return;
    }

    setLockingTournament(true);
    try {
      const response = await lockTournament(currentTournament.id, teams);
      if (response.success) {
        const updatedTournament = { ...currentTournament, locked_status: true };
        setCurrentTournament(updatedTournament);
        onTournamentChange?.(updatedTournament);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrors({ submit: response.error || 'Failed to lock tournament' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while locking tournament' });
    } finally {
      setLockingTournament(false);
    }
  };

  const handleUnlockTournament = async () => {
    if (!currentTournament) return;

    setLockingTournament(true);
    try {
      const response = await unlockTournament(currentTournament.id);
      if (response.success) {
        const updatedTournament = { ...currentTournament, locked_status: false };
        setCurrentTournament(updatedTournament);
        onTournamentChange?.(updatedTournament);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrors({ submit: response.error || 'Failed to unlock tournament' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while unlocking tournament' });
    } finally {
      setLockingTournament(false);
    }
  };



  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e4e2e8',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Loading tournament settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e4e2e8',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: isMobile ? '22px' : '20px',
          fontWeight: '600',
          color: '#1c1b20',
          margin: 0
        }}>
          Tournament Settings
        </h3>
        
        {settingsLocked && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#ef4444',
            fontWeight: '600'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Settings Locked
          </div>
        )}
      </div>

      {/* Tournament Management Section */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          fontSize: isMobile ? '18px' : '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: isMobile ? '20px' : '16px'
        }}>
          Tournament Management
        </h4>

        {currentTournament ? (
          <div style={{
            padding: isMobile ? '16px' : '20px',
            background: 'rgba(139, 138, 148, 0.05)',
            borderRadius: '8px',
            border: '1px solid #e4e2e8'
          }}>
                        <div style={{
              display: 'grid',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* Tournament Name, Start Date, End Date - Responsive Row */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', 
                gap: isMobile ? '16px' : '12px' 
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '15px' : '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: isMobile ? '8px' : '6px'
                  }}>
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={tournamentForm.name}
                    onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                    disabled={currentTournament.locked_status}
                    style={{
                      width: '100%',
                      padding: isMobile ? '14px 16px' : '10px 12px',
                      border: `1px solid ${errors.name ? '#ef4444' : '#e4e2e8'}`,
                      borderRadius: '8px',
                      fontSize: isMobile ? '16px' : '14px', // 16px prevents zoom on iOS
                      backgroundColor: currentTournament.locked_status ? '#f9fafb' : 'white'
                    }}
                  />
                  {errors.name && (
                    <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '15px' : '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: isMobile ? '8px' : '6px'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tournamentForm.start_date}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setTournamentForm(prev => ({
                        ...prev,
                        start_date: newStartDate,
                        // If end date is before new start date, update it to match start date
                        end_date: prev.end_date < newStartDate ? newStartDate : prev.end_date
                      }));
                    }}
                    disabled={currentTournament.locked_status}
                    style={{
                      width: '100%',
                      padding: isMobile ? '14px 16px' : '10px 12px',
                      border: '1px solid #e4e2e8',
                      borderRadius: '8px',
                      fontSize: isMobile ? '16px' : '14px',
                      backgroundColor: currentTournament.locked_status ? '#f9fafb' : 'white',
                      cursor: currentTournament.locked_status ? 'not-allowed' : 'pointer'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '15px' : '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: isMobile ? '8px' : '6px'
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tournamentForm.end_date}
                    min={tournamentForm.start_date} // End date can't be before start date
                    onChange={(e) => setTournamentForm({ ...tournamentForm, end_date: e.target.value })}
                    disabled={currentTournament.locked_status}
                    style={{
                      width: '100%',
                      padding: isMobile ? '14px 16px' : '10px 12px',
                      border: '1px solid #e4e2e8',
                      borderRadius: '8px',
                      fontSize: isMobile ? '16px' : '14px',
                      backgroundColor: currentTournament.locked_status ? '#f9fafb' : 'white',
                      cursor: currentTournament.locked_status ? 'not-allowed' : 'pointer'
                    }}
                  />
                </div>
              </div>

              {/* Location and Tournament Number - Responsive Row */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: isMobile ? '16px' : '12px' 
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '15px' : '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: isMobile ? '8px' : '6px'
                  }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={tournamentForm.location}
                    onChange={(e) => setTournamentForm({ ...tournamentForm, location: e.target.value })}
                    disabled={currentTournament.locked_status}
                    style={{
                      width: '100%',
                      padding: isMobile ? '14px 16px' : '10px 12px',
                      border: `1px solid ${errors.location ? '#ef4444' : '#e4e2e8'}`,
                      borderRadius: '8px',
                      fontSize: isMobile ? '16px' : '14px',
                      backgroundColor: currentTournament.locked_status ? '#f9fafb' : 'white'
                    }}
                  />
                  {errors.location && (
                    <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                      {errors.location}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '15px' : '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: isMobile ? '8px' : '6px'
                  }}>
                    Tournament Number
                  </label>
                  <select
                    value={tournamentForm.tournament_number}
                    onChange={(e) => setTournamentForm({ ...tournamentForm, tournament_number: parseInt(e.target.value) })}
                    disabled={currentTournament.locked_status}
                    style={{
                      width: '100%',
                      padding: isMobile ? '14px 16px' : '10px 12px',
                      border: '1px solid #e4e2e8',
                      borderRadius: '8px',
                      fontSize: isMobile ? '16px' : '14px',
                      backgroundColor: currentTournament.locked_status ? '#f9fafb' : 'white',
                      cursor: currentTournament.locked_status ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {Array.from({ length: 20 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: currentTournament.locked_status ? '#22c55e' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: currentTournament.locked_status ? '#22c55e' : '#f59e0b'
                }}></div>
                Status: {currentTournament.locked_status ? 'Locked' : 'Configuring'}
              </div>
              {tournamentForm.start_date && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Year: {new Date(tournamentForm.start_date).getFullYear()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '20px',
            background: 'rgba(139, 138, 148, 0.05)',
            borderRadius: '8px',
            border: '1px solid #e4e2e8',
            textAlign: 'center'
          }}>
            {showTournamentForm ? (
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div style={{
                  display: 'grid',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px',
                      textAlign: 'left'
                    }}>
                      Tournament Name *
                    </label>
                    <input
                      type="text"
                      value={tournamentForm.name}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                      placeholder="e.g., WBDoc Baseball Championship"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${errors.name ? '#ef4444' : '#e4e2e8'}`,
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    {errors.name && (
                      <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0', textAlign: 'left' }}>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px',
                        textAlign: 'left'
                      }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={tournamentForm.start_date}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          setTournamentForm(prev => ({
                            ...prev,
                            start_date: newStartDate,
                            // If end date is before new start date, update it to match start date
                            end_date: prev.end_date < newStartDate ? newStartDate : prev.end_date
                          }));
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e4e2e8',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px',
                        textAlign: 'left'
                      }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={tournamentForm.end_date}
                        min={tournamentForm.start_date} // End date can't be before start date
                        onChange={(e) => setTournamentForm({ ...tournamentForm, end_date: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e4e2e8',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '6px',
                        textAlign: 'left'
                      }}>
                        Tournament #
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tournamentForm.tournament_number}
                        onChange={(e) => setTournamentForm({ ...tournamentForm, tournament_number: parseInt(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e4e2e8',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px',
                      textAlign: 'left'
                    }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={tournamentForm.location}
                      onChange={(e) => setTournamentForm({ ...tournamentForm, location: e.target.value })}
                      placeholder="e.g., San Francisco, CA"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e4e2e8',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowTournamentForm(false)}
                    style={{
                      background: 'transparent',
                      color: '#696775',
                      border: '1px solid #e4e2e8',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTournament}
                    disabled={saving}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: saving ? 0.7 : 1
                    }}
                  >
                    {saving ? 'Creating...' : 'Create Tournament'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#696775',
                  marginBottom: '16px'
                }}>
                  No tournament configured. Create a new tournament to get started.
                </div>
                <button
                  onClick={() => setShowTournamentForm(true)}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Create New Tournament
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Distribution Preview */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          fontSize: isMobile ? '18px' : '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: isMobile ? '20px' : '16px'
        }}>
          Team Distribution
        </h4>

                {/* Team Distribution Preview */}
        {players.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(139, 138, 148, 0.05)',
            borderRadius: '8px',
            border: '1px solid #e4e2e8'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : (localSettings.num_teams > 0 ? 'repeat(auto-fit, minmax(150px, 1fr))' : 'repeat(2, 1fr)'),
              gap: isMobile ? '16px' : '12px',
              marginBottom: '12px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1c1b20' }}>
                  {players.length}
                </div>
                <div style={{ fontSize: '12px', color: '#696775', fontWeight: '500' }}>
                  Total Players
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1c1b20' }}>
                  {localSettings.num_teams || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#696775', fontWeight: '500' }}>
                  Teams
                </div>
              </div>
              {localSettings.num_teams > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1c1b20' }}>
                    {teamDistribution.distribution.length > 0 
                      ? (Math.min(...teamDistribution.distribution) === Math.max(...teamDistribution.distribution) 
                          ? Math.min(...teamDistribution.distribution)
                          : `${Math.min(...teamDistribution.distribution)} - ${Math.max(...teamDistribution.distribution)}`)
                      : '0'
                    }
                  </div>
                  <div style={{ fontSize: '12px', color: '#696775', fontWeight: '500' }}>
                    Players per Team
                  </div>
                </div>
              )}
            </div>
            
            {localSettings.num_teams > 0 && teamDistribution.distribution.length > 0 && Math.min(...teamDistribution.distribution) !== Math.max(...teamDistribution.distribution) && (
              <div style={{
                fontSize: '12px',
                color: '#f59e0b',
                fontWeight: '500',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                ⚠️ Some teams will have {Math.max(...teamDistribution.distribution)} players, others {Math.min(...teamDistribution.distribution)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pool Play Settings */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          fontSize: isMobile ? '18px' : '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: isMobile ? '20px' : '16px'
        }}>
          Pool Play Configuration
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '20px' : '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Number of Teams
            </label>
            <select
              value={localSettings.num_teams}
              onChange={(e) => handleInputChange('num_teams', parseInt(e.target.value))}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.num_teams ? '#ef4444' : '#e4e2e8'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white',
                cursor: settingsLocked ? 'not-allowed' : 'pointer'
              }}
            >
              {Array.from({ length: 19 }, (_, i) => (
                <option key={i + 2} value={i + 2}>
                  {i + 2}
                </option>
              ))}
            </select>
            {errors.num_teams && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.num_teams}
              </p>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Pool Play Games
            </label>
            <select
              value={localSettings.pool_play_games}
              onChange={(e) => handleInputChange('pool_play_games', parseInt(e.target.value))}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.pool_play_games ? '#ef4444' : '#e4e2e8'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white',
                cursor: settingsLocked ? 'not-allowed' : 'pointer'
              }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            {errors.pool_play_games && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.pool_play_games}
              </p>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Pool Play Innings
            </label>
            <select
              value={localSettings.pool_play_innings}
              onChange={(e) => handleInputChange('pool_play_innings', parseInt(e.target.value))}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.pool_play_innings ? '#ef4444' : '#e4e2e8'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white'
              }}
            >
              <option value={3}>3 Innings</option>
              <option value={5}>5 Innings</option>
              <option value={7}>7 Innings</option>
              <option value={9}>9 Innings</option>
            </select>
            {errors.pool_play_innings && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.pool_play_innings}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bracket Play Settings */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          fontSize: isMobile ? '18px' : '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: isMobile ? '20px' : '16px'
        }}>
          Bracket Play Configuration
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '20px' : '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Bracket Type
            </label>
            <select
              value={localSettings.bracket_type}
              onChange={(e) => handleInputChange('bracket_type', e.target.value as BracketType)}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e4e2e8',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white'
              }}
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Bracket Innings
            </label>
            <select
              value={localSettings.bracket_innings}
              onChange={(e) => handleInputChange('bracket_innings', parseInt(e.target.value))}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.bracket_innings ? '#ef4444' : '#e4e2e8'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white'
              }}
            >
              <option value={3}>3 Innings</option>
              <option value={5}>5 Innings</option>
              <option value={7}>7 Innings</option>
              <option value={9}>9 Innings</option>
            </select>
            {errors.bracket_innings && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.bracket_innings}
              </p>
            )}
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Final Game Innings
            </label>
            <select
              value={localSettings.final_innings}
              onChange={(e) => handleInputChange('final_innings', parseInt(e.target.value))}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.final_innings ? '#ef4444' : '#e4e2e8'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white'
              }}
            >
              <option value={3}>3 Innings</option>
              <option value={5}>5 Innings</option>
              <option value={7}>7 Innings</option>
              <option value={9}>9 Innings</option>
            </select>
            {errors.final_innings && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.final_innings}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bracket Preview */}
      {teamDistribution.teamCount > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              margin: 0
            }}>
              Bracket Preview
            </h4>
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                background: 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {showPreview && (
            <div style={{
              padding: '20px',
              background: 'rgba(139, 138, 148, 0.05)',
              borderRadius: '8px',
              border: '1px solid #e4e2e8'
            }}>
              {/* Pool Play Standings */}
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '16px'
              }}>
                Sample Pool Play Standings → {localSettings.bracket_type === 'single_elimination' ? 'Single' : 'Double'} Elimination Bracket
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
                marginBottom: '24px'
              }}>
                {mockStandings.slice(0, Math.min(localSettings.num_teams, 8)).map((standing, index) => (
                  <div key={standing.team_id} style={{
                    padding: '6px 10px',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #e4e2e8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#374151',
                      width: '16px'
                    }}>
                      #{standing.seed}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#1c1b20',
                      flex: 1
                    }}>
                      {standing.team_name}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#696775'
                    }}>
                      {standing.wins}-{standing.losses}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bracket Visualization */}
              <div style={{
                borderTop: '1px solid #e4e2e8',
                paddingTop: '20px'
              }}>
                <TournamentBracket 
                  teams={mockStandings}
                  bracketType={localSettings.bracket_type}
                  bracketInnings={localSettings.bracket_innings}
                  finalInnings={localSettings.final_innings}
                  showMockData={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Button and Status */}
      <div style={{
        borderTop: '1px solid #e4e2e8',
        paddingTop: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: '#059669',
              fontSize: '14px'
            }}>
              <span style={{ marginRight: '8px' }}>✓</span>
              Settings saved successfully
            </div>
          )}
          {errors.submit && (
            <div style={{
              color: '#ef4444',
              fontSize: '14px'
            }}>
              {errors.submit}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentTournament?.locked_status ? (
            <button
              onClick={handleUnlockTournament}
              disabled={lockingTournament}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: lockingTournament ? 0.7 : 1
              }}
            >
              {lockingTournament ? 'Unlocking...' : 'Unlock Tournament'}
            </button>
          ) : (
            <>
              {onReset && (
                <button
                  onClick={onReset}
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
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                >
                  Reset
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={settingsLocked || saving}
                style={{
                  background: settingsLocked 
                    ? '#e5e7eb' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: settingsLocked ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: settingsLocked ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              
              {currentTournament && (
                <button
                  onClick={handleLockTournament}
                  disabled={lockingTournament || (teams?.length || 0) === 0}
                  style={{
                    background: (teams?.length || 0) === 0 
                      ? '#e5e7eb' 
                      : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: (teams?.length || 0) === 0 ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (teams?.length || 0) === 0 ? 'not-allowed' : 'pointer',
                    opacity: lockingTournament ? 0.7 : 1
                  }}
                >
                  {lockingTournament ? 'Locking...' : 'Lock Tournament'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 