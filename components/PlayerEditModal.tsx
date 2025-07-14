'use client';

import { useState, useEffect } from 'react';
import { Player, PlayerFormData } from '../lib/types';
import { savePlayer, fetchPlayers } from '../lib/api';
import { validatePlayerData, checkForDuplicates, normalizePlayerData } from '../lib/utils/player-validation';

interface PlayerEditModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Player) => void;
  onDelete?: (playerId: string) => void;
}

export default function PlayerEditModal({
  player,
  isOpen,
  onClose,
  onSave,
  onDelete
}: PlayerEditModalProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);

  useEffect(() => {
    if (player) {
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
    }
  }, [player]);

  useEffect(() => {
    if (isOpen) {
      loadAllPlayers();
    }
  }, [isOpen]);

  const loadAllPlayers = async () => {
    try {
      const response = await fetchPlayers();
      if (response.success) {
        setAllPlayers(response.data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleInputChange = (field: keyof PlayerFormData, value: string | number) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);

    // Clear errors for this field
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }

    // Real-time validation for name and email changes
    if (field === 'name' || field === 'email') {
      const normalized = normalizePlayerData(newFormData);
      const duplicateResult = checkForDuplicates(normalized, allPlayers);
      setDuplicateCheck(duplicateResult);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize and validate data
    const normalizedData = normalizePlayerData(formData);
    const validation = validatePlayerData(normalizedData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      return;
    }

    // Check for duplicates
    const duplicateResult = checkForDuplicates(normalizedData, allPlayers);
    if (duplicateResult.isDuplicate) {
      setErrors({
        duplicate: `A player with the same ${duplicateResult.duplicateType} already exists: ${duplicateResult.duplicatePlayer?.name}`
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setWarnings(validation.warnings);

    try {
      const response = await savePlayer(normalizedData);
      if (response.success) {
        onSave(response.data);
        onClose();
      } else {
        setErrors({ submit: response.error || 'Failed to save player' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save player' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!player || !onDelete) return;

    try {
      onDelete(player.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      setErrors({ delete: 'Failed to delete player' });
    }
  };

  const handleClose = () => {
    setErrors({});
    setWarnings({});
    setDuplicateCheck(null);
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {player ? 'Edit Player' : 'Add New Player'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

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
                {errors.nickname && <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>}
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
                {warnings.championships_won && <p className="text-yellow-600 text-sm mt-1">{warnings.championships_won}</p>}
              </div>

              {/* Profile Picture */}
              <div className="md:col-span-2">
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
                {warnings.profile_picture && <p className="text-yellow-600 text-sm mt-1">{warnings.profile_picture}</p>}
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
                {errors.hometown && <p className="text-red-500 text-sm mt-1">{errors.hometown}</p>}
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
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
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
                {errors.current_town && <p className="text-red-500 text-sm mt-1">{errors.current_town}</p>}
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
                {errors.current_state && <p className="text-red-500 text-sm mt-1">{errors.current_state}</p>}
              </div>
            </div>

            {/* Profile Picture Preview */}
            {formData.profile_picture && isValidUrl(formData.profile_picture) && (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Preview:</span>
                <img
                  src={formData.profile_picture}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border border-gray-300"
                />
              </div>
            )}

            {/* Warnings */}
            {warnings.location && (
              <div className="text-yellow-600 text-sm bg-yellow-50 p-3 rounded-lg">
                {warnings.location}
              </div>
            )}

            {/* Duplicate Check */}
            {duplicateCheck?.isDuplicate && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                Warning: A player with the same {duplicateCheck.duplicateType} already exists: {duplicateCheck.duplicatePlayer?.name}
              </div>
            )}

            {/* Submit Errors */}
            {errors.submit && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.submit}</div>
            )}

            {errors.duplicate && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errors.duplicate}</div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4">
              <div>
                {player && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete Player
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || duplicateCheck?.isDuplicate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (player ? 'Update Player' : 'Add Player')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{player?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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