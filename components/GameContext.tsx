import React from 'react';
import { Tournament } from '../lib/types';
import BackButton from './BackButton';

export interface GameContextProps {
  gameType: 'tournament' | 'free_play';
  tournament?: Tournament | null;
  gameDate?: string;
  gameTime?: string;
  showBackButton?: boolean;
  showBreadcrumbs?: boolean;
  className?: string;
  onTournamentClick?: () => void;
}

/**
 * GameContext component for displaying game metadata and navigation
 * Provides tournament information, game type, timing, and navigation elements
 */
export default function GameContext({
  gameType,
  tournament,
  gameDate,
  gameTime,
  showBackButton = true,
  showBreadcrumbs = true,
  className = '',
  onTournamentClick
}: GameContextProps) {
  
  // Format date and time for display
  const formatDateTime = (date?: string, time?: string) => {
    if (!date && !time) return null;
    
    try {
      if (date) {
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        if (time) {
          const timeStr = dateObj.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          return `${dateStr} at ${timeStr}`;
        }
        
        return dateStr;
      }
      
      return time;
    } catch (error) {
      console.warn('Error formatting date/time:', error);
      return date || time;
    }
  };

  const formattedDateTime = formatDateTime(gameDate, gameTime);

  return (
    <div 
      className={className}
      style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e4e2e8',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Header with navigation */}
      <div 
        style={{ 
          padding: '12px 20px',
          borderBottom: '1px solid #e4e2e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f9fafb'
        }}
      >
        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <nav aria-label="Breadcrumb" className="flex items-center text-sm">
            <button
              onClick={() => window.history.back()}
              className="hover:underline focus:outline-none focus:underline"
              style={{ color: '#696775' }}
              aria-label="Go back"
            >
              ← Back
            </button>
            <span 
              className="mx-2"
              style={{ color: '#696775' }}
              aria-hidden="true"
            >
              /
            </span>
            <span 
              style={{ color: '#312f36' }}
              aria-current="page"
            >
              Game Details
            </span>
          </nav>
        )}

        {/* Back button for smaller screens */}
        {showBackButton && (
          <div className="sm:hidden">
            <BackButton />
          </div>
        )}
      </div>

      {/* Game metadata content */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Game type indicator */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              style={{ 
                fontSize: '14px',
                fontWeight: '500',
                marginRight: '12px',
                color: '#312f36' 
              }}
            >
              Game Type:
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: gameType === 'tournament' ? '#dbeafe' : '#dcfce7',
                  color: gameType === 'tournament' ? '#1e40af' : '#166534',
                  border: `1px solid ${gameType === 'tournament' ? '#bfdbfe' : '#bbf7d0'}`
                }}
              >
                {gameType === 'tournament' ? (
                  <>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: '#60a5fa',
                      borderRadius: '50%',
                      marginRight: '6px'
                    }}></span>
                    Tournament
                  </>
                ) : (
                  <>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: '#4ade80',
                      borderRadius: '50%',
                      marginRight: '6px'
                    }}></span>
                    Free Play
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tournament information */}
          {gameType === 'tournament' && tournament && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div 
                style={{ 
                  fontSize: '14px',
                  fontWeight: '500',
                  marginRight: '12px',
                  marginTop: '4px',
                  color: '#312f36' 
                }}
              >
                Tournament:
              </div>
              <div style={{ flex: '1' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {tournament.logo_url && (
                    <img
                      src={tournament.logo_url}
                      alt={`${tournament.name} logo`}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <button
                    style={{ 
                      color: '#1c1b20',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onClick={() => {
                      if (onTournamentClick) {
                        onTournamentClick();
                      } else {
                        console.log('Navigate to tournament:', tournament.id);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                    aria-label={`View ${tournament.name} tournament details`}
                  >
                    {tournament.name}
                  </button>
                </div>
                {tournament.description && (
                  <div 
                    className="text-sm mt-1 line-clamp-2"
                    style={{ color: '#696775' }}
                  >
                    {tournament.description}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date and time */}
          {formattedDateTime && (
            <div className="flex items-center">
              <div 
                className="text-sm font-medium mr-3"
                style={{ color: '#312f36' }}
              >
                When:
              </div>
              <div 
                className="text-sm"
                style={{ color: '#1c1b20' }}
              >
                {formattedDateTime}
              </div>
            </div>
          )}

          {/* Empty state for free play games */}
          {gameType === 'free_play' && (
            <div 
              className="text-sm italic"
              style={{ color: '#696775' }}
            >
              Casual game between friends
            </div>
          )}
        </div>

        {/* Desktop back button */}
        {showBackButton && (
          <div className="hidden sm:block mt-6 pt-6 border-t" style={{ borderColor: '#e5e3e8' }}>
            <BackButton />
          </div>
        )}
      </div>
    </div>
  );
} 