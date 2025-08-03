/**
 * TournamentProgress Component
 * 
 * Displays overall tournament status with statistics, progress indicators,
 * and key metrics in a comprehensive dashboard view.
 */

'use client';

import React from 'react';
import { Tournament, Game, BracketStanding } from '@/lib/types';

interface TournamentProgressProps {
  tournament?: Tournament;
  games: Game[];
  standings: BracketStanding[];
  currentPhase: 'setup' | 'round_robin' | 'bracket' | 'completed';
  className?: string;
}

interface ProgressStats {
  totalTeams: number;
  totalGames: number;
  completedGames: number;
  roundRobinGames: number;
  completedRoundRobinGames: number;
  bracketGames: number;
  completedBracketGames: number;
  averageScore: number;
  highestScore: number;
  totalRuns: number;
  averageGameLength: number;
  gamesPerTeam: number;
  champion?: BracketStanding;
}

export default function TournamentProgress({
  tournament,
  games,
  standings,
  currentPhase,
  className = ''
}: TournamentProgressProps) {

  // Calculate comprehensive tournament statistics
  const calculateStats = (): ProgressStats => {
    const totalTeams = standings.length;
    const totalGames = games.length;
    const completedGames = games.filter(g => g.status === 'completed').length;
    
    const roundRobinGames = games.filter(g => g.game_type === 'round_robin' || g.game_type === undefined).length;
    const completedRoundRobinGames = games.filter(g => (g.game_type === 'round_robin' || g.game_type === undefined) && g.status === 'completed').length;
    
    const bracketGames = games.filter(g => g.game_type === 'bracket' || g.game_type === 'single_elimination').length;
    const completedBracketGames = games.filter(g => (g.game_type === 'bracket' || g.game_type === 'single_elimination') && g.status === 'completed').length;

    const completedGameScores = games.filter(g => g.status === 'completed');
    const totalRuns = completedGameScores.reduce((sum, g) => sum + g.home_score + g.away_score, 0);
    const averageScore = completedGameScores.length > 0 ? totalRuns / (completedGameScores.length * 2) : 0;
    
    const highestScore = completedGameScores.reduce((max, g) => 
      Math.max(max, Math.max(g.home_score, g.away_score)), 0);

    // Calculate average game length (if data available)
    const gamesWithDuration = completedGameScores.filter(g => g.started_at && g.completed_at);
    const averageGameLength = gamesWithDuration.length > 0 ? 
      gamesWithDuration.reduce((sum, g) => {
        const start = new Date(g.started_at!).getTime();
        const end = new Date(g.completed_at!).getTime();
        return sum + (end - start);
      }, 0) / gamesWithDuration.length / 1000 / 60 : 0; // Convert to minutes

    const gamesPerTeam = totalTeams > 0 ? (completedGames * 2) / totalTeams : 0;

    // Find champion (if tournament is complete)
    const champion = currentPhase === 'completed' ? 
      standings.find(s => s.seed === 1) : undefined;

    return {
      totalTeams,
      totalGames,
      completedGames,
      roundRobinGames,
      completedRoundRobinGames,
      bracketGames,
      completedBracketGames,
      averageScore,
      highestScore,
      totalRuns,
      averageGameLength,
      gamesPerTeam,
      champion
    };
  };

  const stats = calculateStats();

  const getPhaseProgress = () => {
    if (currentPhase === 'round_robin') {
      return stats.roundRobinGames > 0 ? 
        (stats.completedRoundRobinGames / stats.roundRobinGames) * 100 : 0;
    } else if (currentPhase === 'bracket') {
      return stats.bracketGames > 0 ? 
        (stats.completedBracketGames / stats.bracketGames) * 100 : 0;
    } else if (currentPhase === 'completed') {
      return 100;
    }
    return 0;
  };

  const getOverallProgress = () => {
    return stats.totalGames > 0 ? (stats.completedGames / stats.totalGames) * 100 : 0;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'setup':
        return '⚙️';
      case 'round_robin':
        return '🔄';
      case 'bracket':
        return '🏆';
      case 'completed':
        return '🎉';
      default:
        return '📊';
    }
  };

  const getPhaseDescription = () => {
    switch (currentPhase) {
      case 'setup':
        return 'Tournament configuration in progress';
      case 'round_robin':
        return 'Round robin phase - determining seeding';
      case 'bracket':
        return 'Playoff bracket - elimination rounds';
      case 'completed':
        return 'Tournament complete - champion crowned!';
      default:
        return 'Tournament status unknown';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tournament Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-3xl">{getPhaseIcon()}</span>
              {tournament?.name || 'Tournament'} Progress
            </h2>
            <p className="text-gray-600 mt-2">{getPhaseDescription()}</p>
          </div>
          
          {/* Overall Progress Circle */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={`${getOverallProgress()} 100`}
                className="text-blue-600"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-900">
                {Math.round(getOverallProgress())}%
              </span>
            </div>
          </div>
        </div>

        {/* Current Phase Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Current Phase Progress
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(getPhaseProgress())}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getPhaseProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Key Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Teams */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Teams</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        {/* Completed Games */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Games Complete</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completedGames}/{stats.totalGames}
              </p>
            </div>
          </div>
        </div>

        {/* Total Runs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">⚾</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Runs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRuns}</p>
            </div>
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Highest Score</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.highestScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phase Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Round Robin Games</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.completedRoundRobinGames}/{stats.roundRobinGames}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ 
                  width: `${stats.roundRobinGames > 0 ? 
                    (stats.completedRoundRobinGames / stats.roundRobinGames) * 100 : 0}%` 
                }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bracket Games</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.completedBracketGames}/{stats.bracketGames}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ 
                  width: `${stats.bracketGames > 0 ? 
                    (stats.completedBracketGames / stats.bracketGames) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Game Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Score</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.averageScore.toFixed(1)} runs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Games per Team</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.gamesPerTeam.toFixed(1)}
              </span>
            </div>
            {stats.averageGameLength > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Game Length</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(stats.averageGameLength)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Champion Section */}
      {stats.champion && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center">
            <div className="text-4xl mr-4">🏆</div>
            <div>
              <h3 className="text-xl font-bold text-yellow-900">Tournament Champion</h3>
              <p className="text-lg text-yellow-800">{stats.champion.team_name}</p>
              <p className="text-sm text-yellow-700">
                Final Record: {stats.champion.wins}-{stats.champion.losses} 
                ({(stats.champion.win_percentage * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
 