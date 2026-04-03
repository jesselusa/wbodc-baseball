'use client';

import { useState, useEffect } from 'react';
import { Player, PlayerFormData } from '../lib/types';
import { savePlayer, deletePlayer } from '../lib/api';
import { validatePlayerData } from '../lib/utils/player-validation';
import { ESPN } from '../lib/utils';
import ModalOverlay from './ModalOverlay';

interface PlayerActionsModalProps {
  player?: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayerUpdated: (player: Player) => void;
  onPlayerDeleted: (playerId: string) => void;
}

export default function PlayerActionsModal({
  player,
  isOpen,
  onClose,
  onPlayerUpdated,
  onPlayerDeleted
}: PlayerActionsModalProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    name: player?.name || '',
    nickname: player?.nickname || '',
    email: player?.email || '',
    current_town: player?.current_town || '',
    hometown: player?.hometown || '',
    championships_won: player?.championships_won || 0,
    avatar_url: player?.avatar_url || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Reset form data when player changes
  useEffect(() => {
    setFormData({
      name: player?.name || '',
      nickname: player?.nickname || '',
      email: player?.email || '',
      current_town: player?.current_town || '',
      hometown: player?.hometown || '',
      championships_won: player?.championships_won || 0,
      avatar_url: player?.avatar_url || ''
    });
    setValidationErrors({});
    setShowDeleteConfirmation(false);
  }, [player]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof PlayerFormData, value: string | number) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setValidationErrors({});

      const validation = await validatePlayerData(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      const response = await savePlayer({ ...formData, id: player?.id });
      if (response.success) {
        onPlayerUpdated(response.data);
        onClose();
      } else {
        console.error('Failed to update player:', response.error);
      }
    } catch (error) {
      console.error('Error updating player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!player) return;
    
    try {
      setIsLoading(true);
      const response = await deletePlayer(player.id);
      if (response.success) {
        onPlayerDeleted(player.id);
        onClose();
      } else {
        console.error('Failed to delete player:', response.error);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (showDeleteConfirmation) {
      handleDelete();
    } else {
      setShowDeleteConfirmation(true);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '8px 12px',
    border: hasError ? '2px solid #dc2626' : '1px solid #D0D0D0',
    borderRadius: 4,
    fontSize: 16,
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box'
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: ESPN.gray500,
    textTransform: 'uppercase',
    marginBottom: 6
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={500}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: ESPN.gray900,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: ESPN.white
          }}>
            {player?.name || 'New Player'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: ESPN.white,
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div style={{
          padding: 20,
          overflowY: 'auto',
          flex: 1
        }}>
          {showDeleteConfirmation && player ? (
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: '#FEF2F2',
              borderRadius: 4,
              border: '1px solid #FECACA',
              marginBottom: 16
            }}>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: '#dc2626',
                lineHeight: 1.5
              }}>
                Are you sure you want to delete <strong>{player.name}</strong>? This cannot be undone.
              </p>
            </div>
          ) : null}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={inputStyle(!!validationErrors.name)}
              />
              {validationErrors.name && (
                <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4, display: 'block' }}>
                  {validationErrors.name}
                </span>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label style={labelStyle}>Nickname</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                style={inputStyle()}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={inputStyle(!!validationErrors.email)}
              />
              {validationErrors.email && (
                <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4, display: 'block' }}>
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Current Location */}
            <div>
              <label style={labelStyle}>Current Location</label>
              <input
                type="text"
                value={formData.current_town}
                onChange={(e) => handleInputChange('current_town', e.target.value)}
                style={inputStyle()}
              />
            </div>

            {/* Hometown */}
            <div>
              <label style={labelStyle}>Hometown</label>
              <input
                type="text"
                value={formData.hometown}
                onChange={(e) => handleInputChange('hometown', e.target.value)}
                style={inputStyle()}
              />
            </div>

            {/* Championships Won */}
            <div>
              <label style={labelStyle}>Championships Won</label>
              <input
                type="number"
                min="0"
                value={formData.championships_won}
                onChange={(e) => handleInputChange('championships_won', parseInt(e.target.value) || 0)}
                style={inputStyle()}
              />
            </div>

            {/* Profile Picture URL */}
            <div>
              <label style={labelStyle}>Profile Picture URL</label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                style={inputStyle()}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #E5E5E5',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #D0D0D0',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: ESPN.gray700,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          {player && (
            <button
              onClick={handleDeleteClick}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 4,
                backgroundColor: isLoading && showDeleteConfirmation ? ESPN.gray400 : ESPN.red,
                color: ESPN.white,
                fontSize: 14,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading && showDeleteConfirmation
                ? 'Deleting...'
                : showDeleteConfirmation
                  ? 'Confirm Delete'
                  : 'Delete'}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 4,
              backgroundColor: isLoading && !showDeleteConfirmation ? ESPN.gray400 : ESPN.gray900,
              color: ESPN.white,
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading && !showDeleteConfirmation ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
} 