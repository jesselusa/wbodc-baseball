"use client";

import { useState, useEffect } from 'react';
import { Player } from '@/lib/types';
import { CardTheme, getThemeById } from '@/lib/themes';

interface TradingCardProps {
  width?: number;
  height?: number;
  className?: string;
  children?: React.ReactNode;
  // New props for card builder
  player?: Player;
  theme?: CardTheme;
  customRatings?: {
    hitting: number;
    flipping: number;
    talking: number;
    catching: number;
  };
  showBack?: boolean;
  onFlip?: () => void;
}

export default function TradingCard({ 
  width = 350, 
  height = 490, 
  className = "",
  children,
  player,
  theme,
  customRatings,
  showBack = false,
  onFlip
}: TradingCardProps) {
  const [isFlipped, setIsFlipped] = useState(showBack);
  
  // Sync internal state with showBack prop
  useEffect(() => {
    setIsFlipped(showBack);
  }, [showBack]);
  
  // Use default theme if none provided
  const currentTheme = theme || getThemeById('unbranded')!;
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  const cardStyle = {
    width: `${width}px`,
    height: `${height}px`,
    aspectRatio: '5/7',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)',
    borderRadius: currentTheme.borderStyle.radius,
    border: `${currentTheme.borderStyle.width} ${currentTheme.borderStyle.style} ${currentTheme.borderStyle.color}`,
    background: isFlipped ? currentTheme.backBackground : currentTheme.frontBackground,
    fontFamily: currentTheme.fontFamily,
    color: currentTheme.colorScheme.text,
    position: 'relative' as const,
    cursor: onFlip ? 'pointer' : 'default',
    transition: 'transform 0.6s ease-in-out',
    transformStyle: 'preserve-3d' as const,
  };

  const cardContent = (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      backfaceVisibility: 'hidden' as const,
    }}>
      {isFlipped ? (
        // Card Back
        <div style={{ 
          width: '100%', 
          height: '100%', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: currentTheme.backBackground
        }}>
          {/* Player Image/Name on back */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {player?.avatar_url ? (
              <img 
                src={player.avatar_url} 
                alt={player.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: '10px'
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: currentTheme.colorScheme.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {player?.name.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              margin: '0',
              color: currentTheme.colorScheme.text
            }}>
              {player?.name || 'No Player'}
            </h3>
            {player?.nickname && (
              <p style={{ 
                fontSize: '14px', 
                margin: '5px 0 0',
                color: currentTheme.colorScheme.secondary,
                fontStyle: 'italic'
              }}>
                "{player.nickname}"
              </p>
            )}
          </div>

          {/* Custom Ratings */}
          {customRatings && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                margin: '0 0 15px',
                textAlign: 'center',
                color: currentTheme.colorScheme.primary
              }}>
                Player Stats
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.entries(customRatings).map(([key, value]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      marginBottom: '5px',
                      color: currentTheme.colorScheme.secondary
                    }}>
                      {key}
                    </div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: currentTheme.colorScheme.accent
                    }}>
                      {value}/10
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Championship Count */}
          {player?.championships_won !== undefined && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              padding: '10px',
              backgroundColor: currentTheme.colorScheme.accent,
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '5px'
              }}>
                Championships
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: 'white'
              }}>
                {player.championships_won}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Card Front
        <div style={{ 
          width: '100%', 
          height: '100%', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: currentTheme.frontBackground
        }}>
          {/* Player Avatar */}
          {player?.avatar_url ? (
            <img 
              src={player.avatar_url} 
              alt={player.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: '20px',
                border: `3px solid ${currentTheme.colorScheme.accent}`
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: currentTheme.colorScheme.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              border: `3px solid ${currentTheme.colorScheme.accent}`
            }}>
              {player?.name.charAt(0).toUpperCase() || '?'}
            </div>
          )}

          {/* Player Name */}
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            margin: '0 0 10px',
            textAlign: 'center',
            color: currentTheme.colorScheme.text
          }}>
            {player?.name || 'No Player'}
          </h2>

          {/* Nickname */}
          {player?.nickname && (
            <p style={{ 
              fontSize: '16px', 
              margin: '0',
              textAlign: 'center',
              color: currentTheme.colorScheme.secondary,
              fontStyle: 'italic'
            }}>
              "{player.nickname}"
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`shadow-2xl ${className}`}
      style={cardStyle}
      onClick={onFlip ? handleFlip : undefined}
    >
      {children || cardContent}
    </div>
  );
}
