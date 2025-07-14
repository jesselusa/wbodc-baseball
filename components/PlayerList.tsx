'use client';

import { useState, useEffect } from 'react';
import { Player } from '../lib/types';
import { fetchPlayers } from '../lib/api';

interface PlayerListProps {
  onPlayerSelect?: (player: Player) => void;
  selectedPlayers?: Player[];
  allowMultiSelect?: boolean;
  showActions?: boolean;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
  className?: string;
}

export default function PlayerList({
  onPlayerSelect,
  selectedPlayers = [],
  allowMultiSelect = false,
  showActions = false,
  onEdit,
  onDelete,
  className = ''
}: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'championships_won'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'champions' | 'no_championships'>('all');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetchPlayers();
      if (response.success) {
        setPlayers(response.data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    // Text search
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.hometown?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.current_town?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.current_state?.toLowerCase().includes(searchQuery.toLowerCase());

    // Championship filter
    const matchesFilter = filterBy === 'all' ||
      (filterBy === 'champions' && (player.championships_won || 0) > 0) ||
      (filterBy === 'no_championships' && (player.championships_won || 0) === 0);

    return matchesSearch && matchesFilter;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return (b.championships_won || 0) - (a.championships_won || 0);
    }
  });

  const handlePlayerClick = (player: Player) => {
    if (onPlayerSelect) {
      onPlayerSelect(player);
    }
  };

  const isSelected = (player: Player) => {
    return selectedPlayers.some(p => p.id === player.id);
  };

  const getLocationString = (player: Player) => {
    if (player.current_town && player.current_state) {
      return `${player.current_town}, ${player.current_state}`;
    }
    if (player.hometown && player.state) {
      return `${player.hometown}, ${player.state}`;
    }
    return 'N/A';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'championships_won')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="championships_won">Sort by Championships</option>
            </select>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'champions' | 'no_championships')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Players</option>
              <option value="champions">Champions Only</option>
              <option value="no_championships">No Championships</option>
            </select>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Player List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">Loading players...</div>
          </div>
        ) : sortedPlayers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">No players found</div>
          </div>
        ) : (
          sortedPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => handlePlayerClick(player)}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                onPlayerSelect ? 'cursor-pointer' : ''
              } ${isSelected(player) ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {player.profile_picture ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={player.profile_picture}
                        alt={player.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">{player.name}</h3>
                      {player.nickname && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          "{player.nickname}"
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">{getLocationString(player)}</span>
                      {(player.championships_won || 0) > 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          {player.championships_won} championship{player.championships_won !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {allowMultiSelect && isSelected(player) && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center space-x-2 ml-4">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(player);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(player);
                        }}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {player.email && (
                <div className="mt-2 text-sm text-gray-500">
                  {player.email}
                </div>
              )}
              
              {player.hometown && player.state && player.current_town && player.current_state && 
               (player.hometown !== player.current_town || player.state !== player.current_state) && (
                <div className="mt-1 text-xs text-gray-400">
                  Originally from: {player.hometown}, {player.state}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 