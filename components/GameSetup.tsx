import React, { useState, useEffect } from 'react';
import { 
  Team, 
  Player, 
  GameSetupData,
  GameStartEventPayload 
} from '../lib/types';
import { 
  fetchTeams, 
  fetchPlayers, 
  submitEvent 
} from '../lib/api';

export interface GameSetupProps {
  gameId: string;
  onGameStarted?: (gameData: GameSetupData) => void;
  onCancel?: () => void;
  className?: string;
}

interface LineupState {
  home: string[];
  away: string[];
}

/**
 * GameSetup component for initializing a new game
 * Handles team selection, lineup management, and game configuration
 */
export function GameSetup({ 
  gameId, 
  onGameStarted, 
  onCancel, 
  className = '' 
}: GameSetupProps) {
  // Data state
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // Form state
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [lineups, setLineups] = useState<LineupState>({ home: [], away: [] });
  const [innings, setInnings] = useState<3 | 5 | 7 | 9>(7);
  const [umpireId, setUmpireId] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<'teams' | 'lineups' | 'settings'>('teams');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [teamsResponse, playersResponse] = await Promise.all([
          fetchTeams(),
          fetchPlayers()
        ]);

        if (teamsResponse.success) {
          setTeams(teamsResponse.data);
        } else {
          setError(teamsResponse.error || 'Failed to load teams');
        }

        if (playersResponse.success) {
          setPlayers(playersResponse.data);
          // Default umpire to first player
          if (playersResponse.data.length > 0) {
            setUmpireId(playersResponse.data[0].id);
          }
        } else {
          setError(playersResponse.error || 'Failed to load players');
        }
      } catch (err) {
        setError('Failed to load game setup data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper functions
  const getTeamById = (teamId: string) => teams.find(t => t.id === teamId);
  const getPlayerById = (playerId: string) => players.find(p => p.id === playerId);

  const canProceedToLineups = homeTeamId && awayTeamId && homeTeamId !== awayTeamId;
  const canProceedToSettings = canProceedToLineups && 
    lineups.home.length >= 3 && lineups.away.length >= 3;
  const canStartGame = canProceedToSettings && umpireId;

  // Lineup management
  const addPlayerToLineup = (playerId: string, team: 'home' | 'away') => {
    setLineups(prev => ({
      ...prev,
      [team]: [...prev[team], playerId]
    }));
  };

  const removePlayerFromLineup = (playerId: string, team: 'home' | 'away') => {
    setLineups(prev => ({
      ...prev,
      [team]: prev[team].filter(id => id !== playerId)
    }));
  };

  const movePlayerInLineup = (team: 'home' | 'away', fromIndex: number, toIndex: number) => {
    setLineups(prev => {
      const lineup = [...prev[team]];
      const [movedPlayer] = lineup.splice(fromIndex, 1);
      lineup.splice(toIndex, 0, movedPlayer);
      
      return {
        ...prev,
        [team]: lineup
      };
    });
  };

  // Form submission
  const handleStartGame = async () => {
    if (!canStartGame) return;

    try {
      setSubmitting(true);
      setError(undefined);

      const gameSetupData: GameSetupData = {
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        home_lineup: lineups.home,
        away_lineup: lineups.away,
        innings,
        umpire_id: umpireId
      };

      // Submit game start event
      const gameStartPayload: GameStartEventPayload = {
        umpire_id: umpireId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        lineups: {
          home: lineups.home,
          away: lineups.away
        },
        innings
      };

      const response = await submitEvent({
        game_id: gameId,
        type: 'game_start',
        payload: gameStartPayload,
        umpire_id: umpireId
      });

      if (response.success) {
        onGameStarted?.(gameSetupData);
      } else {
        setError(response.error || 'Failed to start game');
      }
    } catch (err) {
      setError('Failed to start game');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading game setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-900">Game Setup</h2>
        <p className="text-sm text-gray-600">Configure teams, lineups, and game settings</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('teams')}
            className={`
              flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'teams' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            1. Teams
          </button>
          <button
            onClick={() => canProceedToLineups && setActiveTab('lineups')}
            disabled={!canProceedToLineups}
            className={`
              flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'lineups' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : canProceedToLineups
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }
            `}
          >
            2. Lineups
          </button>
          <button
            onClick={() => canProceedToSettings && setActiveTab('settings')}
            disabled={!canProceedToSettings}
            className={`
              flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'settings' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : canProceedToSettings
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }
            `}
          >
            3. Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Team
              </label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select home team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === awayTeamId}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Away Team
              </label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select away team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === homeTeamId}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {homeTeamId && awayTeamId && (
              <div className="mt-6 p-4 bg-green-50 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Matchup Preview</h3>
                <p className="text-green-700">
                  <span className="font-medium">{getTeamById(awayTeamId)?.name}</span>
                  {' vs '}
                  <span className="font-medium">{getTeamById(homeTeamId)?.name}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lineups Tab */}
        {activeTab === 'lineups' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Away Team Lineup */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {getTeamById(awayTeamId)?.name} Lineup (Away)
                </h3>
                <LineupBuilder
                  players={players}
                  lineup={lineups.away}
                  onAddPlayer={(playerId) => addPlayerToLineup(playerId, 'away')}
                  onRemovePlayer={(playerId) => removePlayerFromLineup(playerId, 'away')}
                  onMovePlayer={(from, to) => movePlayerInLineup('away', from, to)}
                  excludePlayerIds={lineups.home}
                />
              </div>

              {/* Home Team Lineup */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {getTeamById(homeTeamId)?.name} Lineup (Home)
                </h3>
                <LineupBuilder
                  players={players}
                  lineup={lineups.home}
                  onAddPlayer={(playerId) => addPlayerToLineup(playerId, 'home')}
                  onRemovePlayer={(playerId) => removePlayerFromLineup(playerId, 'home')}
                  onMovePlayer={(from, to) => movePlayerInLineup('home', from, to)}
                  excludePlayerIds={lineups.away}
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p><strong>Note:</strong> Each team needs at least 3 players in their lineup. 
              Players will bat in the order shown, cycling through the lineup as needed.</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Length
              </label>
              <select
                value={innings}
                onChange={(e) => setInnings(Number(e.target.value) as 3 | 5 | 7 | 9)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={3}>3 Innings (Quick Game)</option>
                <option value={5}>5 Innings (Short Game)</option>
                <option value={7}>7 Innings (Standard)</option>
                <option value={9}>9 Innings (Full Game)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umpire
              </label>
              <select
                value={umpireId}
                onChange={(e) => setUmpireId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select umpire...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} {player.nickname && `(${player.nickname})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Game Summary</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Away:</strong> {getTeamById(awayTeamId)?.name} ({lineups.away.length} players)</p>
                <p><strong>Home:</strong> {getTeamById(homeTeamId)?.name} ({lineups.home.length} players)</p>
                <p><strong>Length:</strong> {innings} innings</p>
                <p><strong>Umpire:</strong> {getPlayerById(umpireId)?.name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>

        <div className="flex space-x-3">
          {activeTab === 'lineups' && (
            <button
              onClick={() => setActiveTab('teams')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          )}
          
          {activeTab === 'settings' && (
            <button
              onClick={() => setActiveTab('lineups')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          )}

          {activeTab === 'teams' && canProceedToLineups && (
            <button
              onClick={() => setActiveTab('lineups')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Next: Lineups
            </button>
          )}

          {activeTab === 'lineups' && canProceedToSettings && (
            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Next: Settings
            </button>
          )}

          {activeTab === 'settings' && (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame || submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500"
            >
              {submitting ? 'Starting Game...' : 'Start Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// LineupBuilder component for managing batting order
interface LineupBuilderProps {
  players: Player[];
  lineup: string[];
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onMovePlayer: (fromIndex: number, toIndex: number) => void;
  excludePlayerIds?: string[];
}

function LineupBuilder({
  players,
  lineup,
  onAddPlayer,
  onRemovePlayer,
  onMovePlayer,
  excludePlayerIds = []
}: LineupBuilderProps) {
  const availablePlayers = players.filter(p => 
    !lineup.includes(p.id) && !excludePlayerIds.includes(p.id)
  );

  return (
    <div className="space-y-3">
      {/* Current Lineup */}
      <div className="space-y-2">
        {lineup.map((playerId, index) => {
          const player = players.find(p => p.id === playerId);
          if (!player) return null;

          return (
            <div 
              key={playerId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500 w-6">
                  {index + 1}.
                </span>
                <div>
                  <p className="font-medium text-gray-900">{player.name}</p>
                  {player.nickname && (
                    <p className="text-sm text-gray-600">({player.nickname})</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => index > 0 && onMovePlayer(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => index < lineup.length - 1 && onMovePlayer(index, index + 1)}
                  disabled={index === lineup.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  onClick={() => onRemovePlayer(playerId)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Player */}
      {availablePlayers.length > 0 && (
        <div>
          <select
            onChange={(e) => e.target.value && onAddPlayer(e.target.value)}
            value=""
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Add player to lineup...</option>
            {availablePlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} {player.nickname && `(${player.nickname})`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-gray-500">
        {lineup.length} players in lineup 
        {lineup.length < 3 && (
          <span className="text-red-500"> (minimum 3 required)</span>
        )}
      </div>
    </div>
  );
} 