'use client';

import { useState, useEffect, useMemo } from 'react';
import { TournamentSettingsFormData, BracketType, Player } from '../lib/types';
import { saveTournamentConfig, loadTournamentConfig } from '../lib/api';
import { calculateOptimalTeamDistribution, generateTournamentStandings, isSettingsLocked } from '../lib/utils/tournament-helpers';
import TournamentBracket from './TournamentBracket';

interface TournamentSettingsProps {
  tournamentId: string;
  players: Player[];
  onSettingsChange?: (settings: TournamentSettingsFormData) => void;
  onTeamSizeChange?: (teamSize: number) => void;
  disabled?: boolean;
  isActive?: boolean;
  hasActiveGames?: boolean;
}

const TournamentSettings: React.FC<TournamentSettingsProps> = ({
  tournamentId,
  players,
  onSettingsChange,
  onTeamSizeChange,
  disabled = false,
  isActive = false,
  hasActiveGames = false
}) => {
  const [formData, setFormData] = useState<TournamentSettingsFormData>({
    pool_play_games: 2,
    pool_play_innings: 3,
    bracket_type: 'single_elimination',
    bracket_innings: 3,
    final_innings: 5,
    num_teams: 4
  });

  // Calculate team size from number of teams and players
  const teamSize = useMemo(() => {
    if (players.length === 0 || formData.num_teams === 0) return 0;
    return Math.ceil(players.length / formData.num_teams);
  }, [players.length, formData.num_teams]);

  // Update pool play games default based on number of teams
  useEffect(() => {
    if (formData.num_teams > 1) {
      setFormData(prev => ({
        ...prev,
        pool_play_games: formData.num_teams - 1
      }));
    }
  }, [formData.num_teams]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Calculate if settings are locked
  const settingsLocked = useMemo(() => {
    const config = { ...formData, team_size: teamSize, tournament_id: tournamentId, is_active: isActive, settings_locked: disabled };
    return isSettingsLocked(config, hasActiveGames);
  }, [formData, teamSize, tournamentId, isActive, disabled, hasActiveGames]);

  // Calculate team distribution based on desired number of teams
  const teamDistribution = useMemo(() => {
    if (players.length === 0 || formData.num_teams === 0) {
      return {
        teamCount: 0,
        actualTeamSize: 0,
        remainder: 0,
        distribution: []
      };
    }

    const teamCount = formData.num_teams;
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
  }, [players.length, formData.num_teams, teamSize]);

  // Generate mock standings for preview
  const mockStandings = useMemo(() => {
    if (!showPreview || teamDistribution.teamCount === 0) return [];
    
    const mockTeams = Array.from({ length: teamDistribution.teamCount }, (_, i) => ({
      id: `team-${i + 1}`,
      name: `Team ${i + 1}`,
      players: [],
      is_locked: false
    }));

    const mockGameResults = Array.from({ length: formData.pool_play_games }, (_, i) => ({
      home_team_id: `team-${(i % teamDistribution.teamCount) + 1}`,
      away_team_id: `team-${((i + 1) % teamDistribution.teamCount) + 1}`,
      home_score: Math.floor(Math.random() * 15) + 5,
      away_score: Math.floor(Math.random() * 15) + 5,
      status: 'completed' as const
    }));

    return generateTournamentStandings(mockTeams, mockGameResults);
  }, [showPreview, teamDistribution.teamCount, formData.pool_play_games]);

  // Load existing configuration on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!tournamentId) return;
      
      setLoading(true);
      try {
        const response = await loadTournamentConfig(tournamentId);
        if (response.success && response.data) {
          // Convert team_size to num_teams for the form
          const numTeams = players.length > 0 ? Math.ceil(players.length / response.data.team_size) : 4;
          const settings = {
            pool_play_games: response.data.pool_play_games,
            pool_play_innings: response.data.pool_play_innings,
            bracket_type: response.data.bracket_type,
            bracket_innings: response.data.bracket_innings,
            final_innings: response.data.final_innings,
            num_teams: numTeams
          };
          setFormData(settings);
          onSettingsChange?.(settings);
          onTeamSizeChange?.(response.data.team_size);
        }
      } catch (error) {
        console.error('Error loading tournament settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [tournamentId, onSettingsChange, onTeamSizeChange]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.pool_play_games < 1) {
      newErrors.pool_play_games = 'Pool play games must be at least 1';
    }

    if (formData.pool_play_games > 10) {
      newErrors.pool_play_games = 'Pool play games cannot exceed 10';
    }

    if (formData.pool_play_innings < 3) {
      newErrors.pool_play_innings = 'Pool play innings must be at least 3';
    }

    if (formData.bracket_innings < 3) {
      newErrors.bracket_innings = 'Bracket innings must be at least 3';
    }

    if (formData.final_innings < 3) {
      newErrors.final_innings = 'Final innings must be at least 3';
    }

    if (formData.num_teams < 2) {
      newErrors.num_teams = 'Number of teams must be at least 2';
    }

    if (formData.num_teams > 20) {
      newErrors.num_teams = 'Number of teams cannot exceed 20';
    }

    if (formData.bracket_innings > formData.final_innings) {
      newErrors.bracket_innings = 'Bracket innings cannot exceed final innings';
    }

    if (players.length > 0 && formData.num_teams > players.length) {
      newErrors.num_teams = 'Number of teams cannot exceed total number of players';
    }

    if (players.length > 0 && formData.num_teams < 2) {
      newErrors.num_teams = 'Need at least 2 teams';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TournamentSettingsFormData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
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

    setSaving(true);
    try {
      const response = await saveTournamentConfig({
        tournament_id: tournamentId,
        ...formData,
        team_size: teamSize, // Convert num_teams back to team_size for saving
        is_active: isActive,
        settings_locked: settingsLocked
      });

      if (response.success) {
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
          fontSize: '20px',
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

      {/* Team Distribution Preview */}
      <div style={{ marginBottom: '32px' }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '16px'
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
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
                  {teamDistribution.teamCount}
                </div>
                <div style={{ fontSize: '12px', color: '#696775', fontWeight: '500' }}>
                  Teams
                </div>
              </div>
                             <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '18px', fontWeight: '600', color: '#1c1b20' }}>
                   {Math.min(...teamDistribution.distribution) === Math.max(...teamDistribution.distribution) 
                     ? Math.min(...teamDistribution.distribution)
                     : `${Math.min(...teamDistribution.distribution)} - ${Math.max(...teamDistribution.distribution)}`
                   }
                 </div>
                 <div style={{ fontSize: '12px', color: '#696775', fontWeight: '500' }}>
                   Players per Team
                 </div>
               </div>
             </div>
             
             {teamDistribution.distribution.length > 0 && Math.min(...teamDistribution.distribution) !== Math.max(...teamDistribution.distribution) && (
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
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '16px'
        }}>
          Pool Play Configuration
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
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
            <input
              type="number"
              min="2"
              max="20"
              value={formData.num_teams}
              onChange={(e) => handleInputChange('num_teams', parseInt(e.target.value))}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.num_teams ? '#ef4444' : '#e4e2e8'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white'
              }}
            />
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
            <input
              type="number"
              min="1"
              max="10"
              value={formData.pool_play_games}
              onChange={(e) => handleInputChange('pool_play_games', parseInt(e.target.value))}
              disabled={settingsLocked}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.pool_play_games ? '#ef4444' : '#e4e2e8'}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: settingsLocked ? '#f9fafb' : 'white'
              }}
            />
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
              value={formData.pool_play_innings}
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
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '16px'
        }}>
          Bracket Play Configuration
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
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
              value={formData.bracket_type}
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
              value={formData.bracket_innings}
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
              value={formData.final_innings}
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
                Sample Pool Play Standings → {formData.bracket_type === 'single_elimination' ? 'Single' : 'Double'} Elimination Bracket
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
                marginBottom: '24px'
              }}>
                {mockStandings.slice(0, Math.min(formData.num_teams, 8)).map((standing, index) => (
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
                  bracketType={formData.bracket_type}
                  bracketInnings={formData.bracket_innings}
                  finalInnings={formData.final_innings}
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
      </div>
    </div>
  );
};

export default TournamentSettings; 