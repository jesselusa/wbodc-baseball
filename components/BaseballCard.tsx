'use client';

import { Player } from '../lib/types';
import { ESPN } from '../lib/utils';
import ModalOverlay from './ModalOverlay';
import { useIsMobile } from '../hooks/useIsMobile';

interface BaseballCardProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export default function BaseballCard({ player, isOpen, onClose }: BaseballCardProps) {
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const statLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: ESPN.gray500,
    textTransform: 'uppercase',
    marginBottom: 4
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: ESPN.black
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={400}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          backgroundColor: ESPN.gray900,
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

          {/* Avatar */}
          <div style={{
            width: isMobile ? 60 : 80,
            height: isMobile ? 60 : 80,
            borderRadius: '50%',
            backgroundColor: player.avatar_url ? undefined : ESPN.gray700,
            backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 600,
            color: ESPN.white,
            marginBottom: 12
          }}>
            {!player.avatar_url && player.name.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? 18 : 20,
            fontWeight: 700,
            color: ESPN.white,
            textAlign: 'center'
          }}>
            {player.name}
          </h2>

          {/* Nickname */}
          {player.nickname && (
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 14,
              color: ESPN.gray400,
              textAlign: 'center'
            }}>
              &ldquo;{player.nickname}&rdquo;
            </p>
          )}
        </div>

        {/* Body / Stats */}
        <div style={{
          padding: 20,
          backgroundColor: ESPN.white,
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
              backgroundColor: ESPN.gray100,
              color: ESPN.gray700,
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
    </ModalOverlay>
  );
} 