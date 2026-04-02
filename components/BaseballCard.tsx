'use client';

import { Player } from '../lib/types';

interface BaseballCardProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export default function BaseballCard({ player, isOpen, onClose }: BaseballCardProps) {
  if (!isOpen) return null;

  const statLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#6C6D6F',
    textTransform: 'uppercase',
    marginBottom: 4
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#151617'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          width: '400px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          border: '1px solid #D0D0D0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          backgroundColor: '#2B2C2D',
          padding: 20,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
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

          {/* Avatar */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: player.avatar_url ? undefined : '#484A4A',
            backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: 12
          }}>
            {!player.avatar_url && player.name.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <h2 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center'
          }}>
            {player.name}
          </h2>

          {/* Nickname */}
          {player.nickname && (
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 14,
              color: '#A5A6A7',
              textAlign: 'center'
            }}>
              &ldquo;{player.nickname}&rdquo;
            </p>
          )}
        </div>

        {/* Body / Stats */}
        <div style={{
          padding: 20,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* Current Town */}
          <div>
            <div style={statLabelStyle}>Current Town</div>
            <div style={statValueStyle}>{player.current_town || 'N/A'}</div>
          </div>

          {/* Hometown */}
          <div>
            <div style={statLabelStyle}>Hometown</div>
            <div style={statValueStyle}>{player.hometown || 'N/A'}</div>
          </div>

          {/* Championships Won */}
          <div>
            <div style={statLabelStyle}>Championships Won</div>
            <div style={statValueStyle}>
              {(player.championships_won || 0) > 0
                ? `\uD83C\uDFC6 ${player.championships_won}`
                : '0'}
            </div>
          </div>
        </div>

        {/* Close button at bottom */}
        <div style={{ padding: '0 20px 20px 20px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              backgroundColor: '#F1F2F3',
              color: '#484A4A',
              border: 'none',
              borderRadius: 4,
              padding: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 