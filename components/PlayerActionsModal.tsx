'use client';

import { useState, useEffect } from 'react';
import { Player, PlayerFormData } from '../lib/types';
import { savePlayer, deletePlayer } from '../lib/api';
import { validatePlayerData } from '../lib/utils/player-validation';

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

  return (
    <div style={{
      position: 'fixed',
      inset: '0',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: '0',
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '1px solid #D0D0D0'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2B2C2D',
          color: '#FFFFFF',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: player?.avatar_url ? `url(${player.avatar_url})` : '#6C6D6F',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              border: '2px solid #D0D0D0'
            }}>
              {!player?.avatar_url && (player?.name || 'New Player').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{
                margin: '0',
                fontSize: 16,
                fontWeight: 700,
                color: '#FFFFFF'
              }}>
                {player?.name || 'New Player'}
              </h2>
              {player?.nickname && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  "{player.nickname}"
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {showDeleteConfirmation && player ? (
            <div style={{
              textAlign: 'center',
              padding: '24px 0',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '12px',
              border: '2px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#dc2626'
              }}>
                Confirm Deletion
              </h3>
              <p style={{
                margin: '0',
                fontSize: '14px',
                color: '#6C6D6F',
                lineHeight: '1.5'
              }}>
                Are you sure you want to delete <strong>{player.name}</strong>? This action cannot be undone.
              </p>
            </div>
          ) : null}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Name Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#6C6D6F',
                textTransform: 'uppercase' as const,
                marginBottom: '8px'
              }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: validationErrors.name ? '2px solid #dc2626' : '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  if (!validationErrors.name) {
                    e.currentTarget.style.borderColor = '#151617';
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.name) {
                    e.currentTarget.style.borderColor = '#D0D0D0';
                  }
                }}
              />
              {validationErrors.name && (
                <span style={{
                  fontSize: '12px',
                  color: '#dc2626',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {validationErrors.name}
                </span>
              )}
            </div>

            {/* Nickname Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#6C6D6F',
                textTransform: 'uppercase' as const,
                marginBottom: '8px'
              }}>
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#151617'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D0D0D0'}
              />
            </div>

            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#6C6D6F',
                textTransform: 'uppercase' as const,
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: validationErrors.email ? '2px solid #dc2626' : '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  if (!validationErrors.email) {
                    e.currentTarget.style.borderColor = '#151617';
                  }
                }}
                onBlur={(e) => {
                  if (!validationErrors.email) {
                    e.currentTarget.style.borderColor = '#D0D0D0';
                  }
                }}
              />
              {validationErrors.email && (
                <span style={{
                  fontSize: '12px',
                  color: '#dc2626',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Current Location Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#6C6D6F',
                textTransform: 'uppercase' as const,
                marginBottom: '8px'
              }}>
                Current Location
              </label>
              <input
                type="text"
                value={formData.current_town}
                onChange={(e) => handleInputChange('current_town', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#151617'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D0D0D0'}
              />
            </div>

            {/* Hometown Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#6C6D6F',
                textTransform: 'uppercase' as const,
                marginBottom: '8px'
              }}>
                Hometown
              </label>
              <input
                type="text"
                value={formData.hometown}
                onChange={(e) => handleInputChange('hometown', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#151617'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D0D0D0'}
              />
            </div>

            {/* Championships Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#6C6D6F',
                textTransform: 'uppercase' as const,
                marginBottom: '8px'
              }}>
                Championships Won
              </label>
              <input
                type="number"
                min="0"
                value={formData.championships_won}
                onChange={(e) => handleInputChange('championships_won', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#151617'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D0D0D0'}
              />
            </div>

            {/* Profile Picture Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#6C6D6F',
                textTransform: 'uppercase' as const,
                marginBottom: '8px'
              }}>
                Profile Picture URL
              </label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D0D0D0',
                  borderRadius: 4,
                  fontSize: '14px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#151617'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D0D0D0'}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid #D0D0D0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #D0D0D0',
                borderRadius: 4,
                background: 'white',
                color: '#6C6D6F',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#151617';
                e.currentTarget.style.color = '#151617';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D0D0D0';
                e.currentTarget.style.color = '#6C6D6F';
              }}
            >
              Cancel
            </button>

            {player && (
              <button
                onClick={handleDeleteClick}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 4,
                  background: isLoading ? '#A5A6A7' : '#CC0000',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isLoading && showDeleteConfirmation ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Deleting...
                  </>
                ) : showDeleteConfirmation ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Confirm Delete
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </>
                )}
              </button>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: 4,
              background: isLoading ? '#A5A6A7' : '#2B2C2D',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(28, 27, 32, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading && !showDeleteConfirmation ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Saving...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17,21 17,13 7,13 7,21"/>
                  <polyline points="7,3 7,8 15,8"/>
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 