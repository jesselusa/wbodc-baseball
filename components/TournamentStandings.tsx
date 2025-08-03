/**
 * TournamentStandings Component
 * 
 * Displays team rankings with standings, tiebreaker information,
 * and seeding details in a clean, sortable table format.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { BracketStanding, Tournament } from '@/lib/types';

interface TournamentStandingsProps {
  tournamentId: string;
  tournament?: Tournament;
  standings: BracketStanding[];
  roundRobinComplete?: boolean;
  onTeamClick?: (teamId: string) => void;
  className?: string;
}

type SortField = 'seed' | 'wins' | 'losses' | 'win_percentage' | 'runs_scored' | 'runs_allowed' | 'run_differential';
type SortDirection = 'asc' | 'desc';

export default function TournamentStandings({
  tournamentId,
  tournament,
  standings = [],
  roundRobinComplete = false,
  onTeamClick,
  className = ''
}: TournamentStandingsProps) {
  const [sortField, setSortField] = useState<SortField>('seed');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Sort standings based on current sort field and direction
  const sortedStandings = useMemo(() => {
    if (!standings.length) return [];

    return [...standings].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle string comparisons
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle numeric comparisons
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (sortDirection === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // Handle string comparisons
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [standings, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTeamClick = (teamId: string) => {
    setSelectedTeam(teamId);
    onTeamClick?.(teamId);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getSeedBadgeColor = (seed: number) => {
    if (seed <= 4) return 'bg-blue-100 text-blue-800';
    if (seed <= 8) return 'bg-green-100 text-green-800';
    if (seed <= 12) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getWinPercentageColor = (percentage: number) => {
    if (percentage >= 0.750) return 'text-green-600 font-semibold';
    if (percentage >= 0.500) return 'text-blue-600';
    if (percentage >= 0.250) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRunDifferentialColor = (differential: number) => {
    if (differential > 10) return 'text-green-600 font-semibold';
    if (differential > 0) return 'text-blue-600';
    if (differential > -10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!standings.length) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium">No Standings Available</p>
          <p className="text-sm">Team standings will appear here once games begin.</p>
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
            {tournament?.name || 'Tournament'} Standings
          </h2>
          <p className="text-gray-600">
            Round Robin Phase {roundRobinComplete && '• Complete'}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="flex space-x-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{standings.length}</div>
            <div className="text-gray-600">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {standings.filter(s => s.wins > s.losses).length}
            </div>
            <div className="text-gray-600">Winning Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {standings.filter(s => s.run_differential > 0).length}
            </div>
            <div className="text-gray-600">Positive Run Diff</div>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Seed */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('seed')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Seed</span>
                    {getSortIcon('seed')}
                  </div>
                </th>

                {/* Team */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>

                {/* Record */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('wins')}
                >
                  <div className="flex items-center space-x-1">
                    <span>W</span>
                    {getSortIcon('wins')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('losses')}
                >
                  <div className="flex items-center space-x-1">
                    <span>L</span>
                    {getSortIcon('losses')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('win_percentage')}
                >
                  <div className="flex items-center space-x-1">
                    <span>PCT</span>
                    {getSortIcon('win_percentage')}
                  </div>
                </th>

                {/* Runs */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('runs_scored')}
                >
                  <div className="flex items-center space-x-1">
                    <span>RS</span>
                    {getSortIcon('runs_scored')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('runs_allowed')}
                >
                  <div className="flex items-center space-x-1">
                    <span>RA</span>
                    {getSortIcon('runs_allowed')}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('run_differential')}
                >
                  <div className="flex items-center space-x-1">
                    <span>DIFF</span>
                    {getSortIcon('run_differential')}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStandings.map((standing, index) => (
                <tr
                  key={standing.team_id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedTeam === standing.team_id ? 'bg-blue-50' : ''
                  } ${onTeamClick ? 'cursor-pointer' : ''}`}
                  onClick={() => handleTeamClick(standing.team_id)}
                >
                  {/* Seed */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeedBadgeColor(standing.seed)}`}>
                        #{standing.seed}
                      </span>
                      {index === 0 && (
                        <span className="text-yellow-500">🥇</span>
                      )}
                      {index === 1 && (
                        <span className="text-gray-400">🥈</span>
                      )}
                      {index === 2 && (
                        <span className="text-orange-500">🥉</span>
                      )}
                    </div>
                  </td>

                  {/* Team */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {standing.team_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {standing.team_name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Wins */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {standing.wins}
                  </td>

                  {/* Losses */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {standing.losses}
                  </td>

                  {/* Win Percentage */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getWinPercentageColor(standing.win_percentage)}>
                      {standing.win_percentage.toFixed(3)}
                    </span>
                  </td>

                  {/* Runs Scored */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {standing.runs_scored}
                  </td>

                  {/* Runs Allowed */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {standing.runs_allowed}
                  </td>

                  {/* Run Differential */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getRunDifferentialColor(standing.run_differential)}>
                      {standing.run_differential > 0 ? '+' : ''}{standing.run_differential}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tiebreaker Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Tiebreaker Rules</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. Win-Loss Record</p>
          <p>2. Run Differential (Runs Scored - Runs Allowed)</p>
          <p>3. Runs Scored</p>
          <p>4. Head-to-Head Record (if applicable)</p>
          <p>5. Coin Flip</p>
        </div>
      </div>

      {/* Playoff Qualification */}
      {roundRobinComplete && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-green-900">Round Robin Complete</h4>
              <p className="text-sm text-green-800">Top teams have qualified for the playoff bracket.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
 
 