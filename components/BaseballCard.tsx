'use client';

import { Player } from '../lib/types';

interface BaseballCardProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export default function BaseballCard({ player, isOpen, onClose }: BaseballCardProps) {
  if (!isOpen) return null;



  return (
    <div 
      style={{
        position: 'fixed',
        inset: '0',
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          borderRadius: '20px',
          padding: '0',
          width: '400px',
          maxWidth: '90vw',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid #e4e2e8',
          overflow: 'hidden',
          position: 'relative',
          transform: 'scale(0.95)',
          animation: 'cardEnter 0.3s ease-out forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient background */}
        <div style={{
          background: 'linear-gradient(135deg, #1c1b20 0%, #2d2c32 50%, #3d3c42 100%)',
          color: 'white',
          padding: '32px 32px 24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '120px',
            height: '120px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '50%',
            transform: 'translate(-20px, 20px)'
          }} />
          
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Player photo and name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            position: 'relative',
            zIndex: 5
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: player.avatar_url ? `url(${player.avatar_url})` : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '600',
              color: 'white',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }}>
              {!player.avatar_url && player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '700',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                {player.name}
              </h2>
              {player.nickname && (
                <p style={{
                  margin: '0',
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontStyle: 'italic'
                }}>
                  "{player.nickname}"
                </p>
              )}
            </div>
          </div>

          {/* Championships badge */}
          {(player.championships_won || 0) > 0 && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#8B4513',
              padding: '8px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 8px rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {player.championships_won} Champion{player.championships_won > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Player stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div style={{
              background: 'rgba(139, 138, 148, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e4e2e8'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#696775',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Current Location
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1c1b20'
              }}>
                {player.current_town || 'N/A'}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(139, 138, 148, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e4e2e8'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#696775',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Hometown
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1c1b20'
              }}>
                {player.hometown || 'N/A'}
              </div>
            </div>
          </div>



          {/* Championships */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#696775',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Championships Won
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1c1b20',
              marginBottom: '4px'
            }}>
              {(player.championships_won || 0) > 0 
                ? '💍'.repeat(player.championships_won || 0)
                : '-'
              }
            </div>
            <div style={{
              fontSize: '12px',
              color: '#696775',
              fontStyle: 'italic'
            }}>
              {(player.championships_won || 0) === 0 ? 'Ready to win their first!' : 
               (player.championships_won || 0) === 1 ? 'Championship winner!' : 
               'Multiple-time champion!'}
            </div>
          </div>


        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes cardEnter {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
} 