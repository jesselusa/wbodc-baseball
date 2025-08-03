'use client';

import { useState, useEffect } from 'react';
import { Player } from '../lib/types';

interface BaseballCardProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export default function BaseballCard({ player, isOpen, onClose }: BaseballCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Hydration-safe mobile detection
  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        padding: isMobile ? '16px' : '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          borderRadius: isMobile ? '16px' : '20px',
          padding: '0',
          width: isMobile ? '100%' : '400px',
          maxWidth: '90vw',
          maxHeight: isMobile ? '90vh' : '80vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid #e4e2e8',
          overflow: 'hidden',
          position: 'relative',
          transform: 'scale(0.95)',
          animation: 'cardEnter 0.3s ease-out forwards',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient background */}
        <div style={{
          background: 'linear-gradient(135deg, #1c1b20 0%, #2d2c32 50%, #3d3c42 100%)',
          color: 'white',
          padding: isMobile ? '24px 20px 20px' : '32px 32px 24px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: isMobile ? '80px' : '120px',
            height: isMobile ? '80px' : '120px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: isMobile ? '60px' : '80px',
            height: isMobile ? '60px' : '80px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '50%',
            transform: 'translate(-20px, 20px)'
          }} />
          
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '12px' : '16px',
              right: isMobile ? '12px' : '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: isMobile ? '36px' : '32px',
              height: isMobile ? '36px' : '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s ease',
              zIndex: 10,
              minHeight: isMobile ? '44px' : 'auto' // Touch target size
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width={isMobile ? "16" : "14"} height={isMobile ? "16" : "14"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Player photo and name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '16px' : '20px',
            position: 'relative',
            zIndex: 5
          }}>
            <div style={{
              width: isMobile ? '64px' : '80px',
              height: isMobile ? '64px' : '80px',
              borderRadius: '50%',
              background: player.avatar_url ? `url(${player.avatar_url})` : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: '600',
              color: 'white',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }}>
              {!player.avatar_url && player.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: isMobile ? '22px' : '28px',
                fontWeight: '700',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                lineHeight: isMobile ? '1.2' : '1.1',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {player.name}
              </h2>
              {player.nickname && (
                <p style={{
                  margin: '0',
                  fontSize: isMobile ? '14px' : '16px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
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
              top: isMobile ? '12px' : '16px',
              left: isMobile ? '12px' : '16px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#8B4513',
              padding: isMobile ? '6px 10px' : '8px 12px',
              borderRadius: '20px',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 8px rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              maxWidth: isMobile ? '120px' : 'auto'
            }}>
              <svg width={isMobile ? "10" : "12"} height={isMobile ? "10" : "12"} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {player.championships_won} Champion{player.championships_won > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '20px' : '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '16px' : '24px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* Player stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '12px' : '16px'
          }}>
            <div style={{
              background: 'rgba(139, 138, 148, 0.05)',
              padding: isMobile ? '12px' : '16px',
              borderRadius: '12px',
              border: '1px solid #e4e2e8'
            }}>
              <div style={{
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '600',
                color: '#696775',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Current Location
              </div>
              <div style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                color: '#1c1b20'
              }}>
                {player.current_town || 'N/A'}
              </div>
            </div>
            
            <div style={{
              background: 'rgba(139, 138, 148, 0.05)',
              padding: isMobile ? '12px' : '16px',
              borderRadius: '12px',
              border: '1px solid #e4e2e8'
            }}>
              <div style={{
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '600',
                color: '#696775',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Hometown
              </div>
              <div style={{
                fontSize: isMobile ? '14px' : '16px',
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
            padding: isMobile ? '16px' : '20px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '600',
              color: '#696775',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Championships Won
            </div>
            <div style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: '700',
              color: '#1c1b20',
              marginBottom: '4px'
            }}>
              {(player.championships_won || 0) > 0 
                ? '💍'.repeat(Math.min(player.championships_won || 0, isMobile ? 5 : 10))
                : '-'
              }
              {(player.championships_won || 0) > (isMobile ? 5 : 10) && (
                <span style={{ fontSize: isMobile ? '16px' : '20px', color: '#696775' }}>
                  +{(player.championships_won || 0) - (isMobile ? 5 : 10)}
                </span>
              )}
            </div>
            <div style={{
              fontSize: isMobile ? '11px' : '12px',
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