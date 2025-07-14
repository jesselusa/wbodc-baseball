'use client';

import { useState, useEffect } from 'react';
import { Player, PlayerFormData } from '../lib/types';
import { savePlayer, deletePlayer, fetchPlayers } from '../lib/api';

interface PlayerManagementProps {
  onPlayerSaved?: (player: Player) => void;
  onPlayerDeleted?: (playerId: string) => void;
  initialPlayer?: Player | null;
  isEditing?: boolean;
}

export default function PlayerManagement({ 
  onPlayerSaved, 
  onPlayerDeleted, 
  initialPlayer, 
  isEditing = false 
}: PlayerManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(isEditing);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'championships_won'>('name');
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    nickname: '',
    email: '',
    profile_picture: '',
    hometown: '',
    state: '',
    current_town: '',
    current_state: '',
    championships_won: 0,
  });

  useEffect(() => {
    if (initialPlayer) {
      setFormData({
        id: initialPlayer.id,
        name: initialPlayer.name,
        nickname: initialPlayer.nickname || '',
        email: initialPlayer.email || '',
        profile_picture: initialPlayer.profile_picture || '',
        hometown: initialPlayer.hometown || '',
        state: initialPlayer.state || '',
        current_town: initialPlayer.current_town || '',
        current_state: initialPlayer.current_state || '',
        championships_won: initialPlayer.championships_won || 0,
      });
    }
  }, [initialPlayer]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.profile_picture && !isValidUrl(formData.profile_picture)) {
      newErrors.profile_picture = 'Invalid URL format';
    }

    if (formData.championships_won && formData.championships_won < 0) {
      newErrors.championships_won = 'Championships won cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await savePlayer(formData);
      if (response.success) {
        onPlayerSaved?.(response.data);
        resetForm();
        setShowForm(false);
        await loadPlayers();
      } else {
        setErrors({ submit: response.error || 'Failed to save player' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save player' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (playerId: string) => {
    try {
      const response = await deletePlayer(playerId);
      if (response.success) {
        onPlayerDeleted?.(playerId);
        await loadPlayers();
      } else {
        setErrors({ delete: response.error || 'Failed to delete player' });
      }
    } catch (error) {
      setErrors({ delete: 'Failed to delete player' });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nickname: '',
      email: '',
      profile_picture: '',
      hometown: '',
      state: '',
      current_town: '',
      current_state: '',
      championships_won: 0,
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof PlayerFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.hometown?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.current_town?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return (b.championships_won || 0) - (a.championships_won || 0);
    }
  });

  const handleEditPlayer = (player: Player) => {
    setFormData({
      id: player.id,
      name: player.name,
      nickname: player.nickname || '',
      email: player.email || '',
      profile_picture: player.profile_picture || '',
      hometown: player.hometown || '',
      state: player.state || '',
      current_town: player.current_town || '',
      current_state: player.current_state || '',
      championships_won: player.championships_won || 0,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Player Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add New Player
        </button>
      </div>

      {/* Player Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {formData.id ? 'Edit Player' : 'Add New Player'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter player name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter nickname"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={formData.profile_picture}
                  onChange={(e) => handleInputChange('profile_picture', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.profile_picture ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter profile picture URL"
                />
                {errors.profile_picture && <p className="text-red-500 text-sm mt-1">{errors.profile_picture}</p>}
              </div>

              {/* Hometown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hometown
                </label>
                <input
                  type="text"
                  value={formData.hometown}
                  onChange={(e) => handleInputChange('hometown', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hometown"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter state"
                />
              </div>

              {/* Current Town */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Town
                </label>
                <input
                  type="text"
                  value={formData.current_town}
                  onChange={(e) => handleInputChange('current_town', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current town"
                />
              </div>

              {/* Current State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current State
                </label>
                <input
                  type="text"
                  value={formData.current_state}
                  onChange={(e) => handleInputChange('current_state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current state"
                />
              </div>

              {/* Championships Won */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Championships Won
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.championships_won}
                  onChange={(e) => handleInputChange('championships_won', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.championships_won ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.championships_won && <p className="text-red-500 text-sm mt-1">{errors.championships_won}</p>}
              </div>
            </div>

            {/* Profile Picture Preview */}
            {formData.profile_picture && isValidUrl(formData.profile_picture) && (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Profile Picture Preview:</span>
                <img
                  src={formData.profile_picture}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border border-gray-300"
                />
              </div>
            )}

            {/* Submit Errors */}
            {errors.submit && (
              <div className="text-red-500 text-sm">{errors.submit}</div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (formData.id ? 'Update Player' : 'Add Player')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'championships_won')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="championships_won">Sort by Championships</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading players...</div>
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">No players found</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Championships
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
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
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{player.name}</div>
                          {player.nickname && (
                            <div className="text-sm text-gray-500">"{player.nickname}"</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{player.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {player.current_town && player.current_state
                          ? `${player.current_town}, ${player.current_state}`
                          : 'N/A'}
                      </div>
                      {player.hometown && player.state && (
                        <div className="text-sm text-gray-500">
                          From: {player.hometown}, {player.state}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{player.championships_won || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditPlayer(player)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(player.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this player? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 