/**
 * TournamentSchedule Component
 * 
 * Displays round robin tournament schedules in an organized format
 * with game status indicators, team information, and scheduling details.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Game, Team, Tournament } from '@/lib/types';

interface TournamentScheduleProps {
  tournamentId: string;
  tournament?: Tournament;
  games?: Game[];
  teams?: Team[];
  onGameClick?: (gameId: string) => void;
  className?: string;
}

interface ScheduleGame extends Omit<Game, 'home_team' | 'away_team'> {
  home_team?: Team;
  away_team?: Team;
  round_number?: number;
  game_number?: number;
}

interface ScheduleRound {
  roundNumber: number;
  games: ScheduleGame[];
  date?: string;
}

export default function TournamentSchedule({
  tournamentId,
  tournament,
  games = [],
  teams = [],
  onGameClick,
  className = ''
}: TournamentScheduleProps) {
  const [scheduleRounds, setScheduleRounds] = useState<ScheduleRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create a map of teams for quick lookup
  const teamsMap = React.useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach(team => map.set(team.id, team));
    return map;
  }, [teams]);

  // Process games into rounds
  useEffect(() => {
    if (!games.length) return;

    const roundMap = new Map<number, ScheduleGame[]>();
    
    games.forEach(game => {
      if (game.game_type !== 'round_robin') return; // Only show round robin games
      
      const roundNumber = game.round_number || 1;
      if (!roundMap.has(roundNumber)) {
        roundMap.set(roundNumber, []);
      }
      
      const scheduleGame: ScheduleGame = {
        ...game,
        home_team: teamsMap.get(game.home_team_id),
        away_team: teamsMap.get(game.away_team_id)
      };
      
      roundMap.get(roundNumber)!.push(scheduleGame);
    });

    // Convert to array and sort
    const rounds: ScheduleRound[] = Array.from(roundMap.entries())
      .map(([roundNumber, games]) => ({
        roundNumber,
        games: games.sort((a, b) => (a.game_number || 0) - (b.game_number || 0))
      }))
      .sort((a, b) => a.roundNumber - b.roundNumber);

    setScheduleRounds(rounds);
    
    // Set first round as selected by default
    if (rounds.length > 0 && selectedRound === null) {
      setSelectedRound(rounds[0].roundNumber);
    }
  }, [games, teamsMap, selectedRound]);

  const getGameStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGameStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Final';
      case 'in_progress':
        return 'Live';
      case 'scheduled':
        return 'Scheduled';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatGameTime = (scheduledStart?: string) => {
    if (!scheduledStart) return 'TBD';
    
    try {
      const date = new Date(scheduledStart);
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'TBD';
    }
  };

  const formatGameDate = (scheduledStart?: string) => {
    if (!scheduledStart) return '';
    
    try {
      const date = new Date(scheduledStart);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const handleGameClick = (gameId: string) => {
    onGameClick?.(gameId);
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 h-8 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!scheduleRounds.length) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium">No Schedule Available</p>
          <p className="text-sm">Round robin schedule will appear here once games are scheduled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {tournament?.name || 'Tournament'} Schedule
          </h2>
          <p className="text-gray-600">
            Round Robin Phase • {scheduleRounds.length} Rounds
          </p>
        </div>
        
        {/* Round Selector */}
        {scheduleRounds.length > 1 && (
          <div className="flex space-x-2">
            {scheduleRounds.map(round => (
              <button
                key={round.roundNumber}
                onClick={() => setSelectedRound(round.roundNumber)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedRound === round.roundNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Round {round.roundNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Content */}
      <div className="space-y-6">
        {scheduleRounds
          .filter(round => selectedRound === null || round.roundNumber === selectedRound)
          .map(round => (
            <div key={round.roundNumber} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Round Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900">
                  Round {round.roundNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  {round.games.length} Games
                </p>
              </div>

              {/* Games List */}
              <div className="divide-y divide-gray-200">
                {round.games.map((game, index) => (
                  <div
                    key={game.id}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      onGameClick ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    onClick={() => handleGameClick(game.id)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Game Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          {/* Game Number */}
                          <div className="text-sm text-gray-500 font-medium min-w-[60px]">
                            Game {game.game_number || index + 1}
                          </div>

                          {/* Teams */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              {/* Home Team */}
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    {game.home_team?.name?.charAt(0) || 'H'}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">
                                  {game.home_team?.name || 'Home Team'}
                                </span>
                              </div>

                              {/* VS */}
                              <span className="text-gray-400 font-medium">vs</span>

                              {/* Away Team */}
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {game.away_team?.name || 'Away Team'}
                                </span>
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                  <span className="text-red-600 font-semibold text-sm">
                                    {game.away_team?.name?.charAt(0) || 'A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Score (if completed or in progress) */}
                            {(game.status === 'completed' || game.status === 'in_progress') && (
                              <div className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">{game.home_score}</span>
                                <span className="mx-2">-</span>
                                <span className="font-medium">{game.away_score}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Game Status and Time */}
                      <div className="flex items-center space-x-4">
                        {/* Game Time */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatGameTime(game.scheduled_start)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatGameDate(game.scheduled_start)}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getGameStatusColor(game.status)}`}>
                          {getGameStatusText(game.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {games.filter(g => g.game_type === 'round_robin').length}
            </div>
            <div className="text-sm text-gray-600">Total Games</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {games.filter(g => g.game_type === 'round_robin' && g.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {games.filter(g => g.game_type === 'round_robin' && g.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {games.filter(g => g.game_type === 'round_robin' && g.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
        </div>
      </div>
    </div>
  );
} 
 
 


