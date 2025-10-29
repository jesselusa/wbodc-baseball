"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Tournament, TournamentRecord } from '../lib/types';

interface TournamentCardProps {
  tournament: Tournament | TournamentRecord;
  onTournamentClick?: () => void;
  isHero?: boolean;
}

export default function TournamentCard({ tournament, onTournamentClick, isHero = false }: TournamentCardProps) {
  const router = useRouter();





  const handleClick = () => {
    if (onTournamentClick) {
      onTournamentClick();
    } else {
      router.push('/games');
    }
  };

  // Calculate tournament stats from real data
  const isTournamentRecord = 'num_teams' in tournament;
  const teamCount: number = isTournamentRecord ? (tournament as TournamentRecord).num_teams : 4; // Default to 4 if basic Tournament
  const gamesPlayed: number = isTournamentRecord ? (tournament as TournamentRecord).pool_play_games : 6; // Default to 6 if basic Tournament
  const format: string = isTournamentRecord && (tournament as TournamentRecord).bracket_type 
    ? `${(tournament as TournamentRecord).bracket_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}` 
    : 'Round Robin';

  // Hero-specific styling
  const heroStyles = isHero ? {
    maxWidth: '600px',
    width: '100%',
    padding: '24px',
    fontSize: '1.1em',
    transform: 'scale(1.02)',
    boxShadow: '0 8px 32px rgba(28, 27, 32, 0.15)',
    margin: '0 auto',
  } : {};

  const heroLogoStyles = isHero ? {
    width: '64px',
    height: '64px',
    fontSize: '24px',
  } : {};

  const heroTitleStyles = isHero ? {
    fontSize: '22px',
    marginBottom: '6px',
  } : {};

  return (
    <div
      onClick={handleClick}
      role="button"
      aria-label={`View ${tournament.name} tournament details`}
      className={isHero ? 'hero-card' : ''}
      style={{
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        borderRadius: '16px',
        border: '1px solid #e4e2e8',
        padding: '24px',
        marginTop: isHero ? '0' : '2rem', // Remove top margin for hero
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(28, 27, 32, 0.1)',
        ...heroStyles, // Apply hero-specific styles
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = isHero ? 'scale(1.08)' : 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isHero 
          ? '0 12px 48px rgba(28, 27, 32, 0.2)' 
          : '0 4px 12px rgba(28, 27, 32, 0.15)';
        e.currentTarget.style.borderColor = '#d1cdd7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isHero ? 'scale(1.05)' : 'translateY(0)';
        e.currentTarget.style.boxShadow = isHero 
          ? '0 8px 32px rgba(28, 27, 32, 0.15)' 
          : '0 1px 3px rgba(28, 27, 32, 0.1)';
        e.currentTarget.style.borderColor = '#e4e2e8';
      }}
    >
      {/* Tournament Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px',
      }}>
        {/* Tournament Logo */}
        <div 
          className={isHero ? 'hero-logo' : ''}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b8a94 0%, #696775 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(28, 27, 32, 0.2)',
            ...heroLogoStyles, // Apply hero logo styles
          }}>
          {tournament.name.charAt(0)}
        </div>

        {/* Tournament Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 
            className={isHero ? 'hero-title' : ''}
            style={{
              margin: '0 0 4px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1c1b20',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...heroTitleStyles, // Apply hero title styles
            }}>
            {tournament.name}
          </h3>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {/* Status Badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: tournament.status === 'in_progress' 
                ? 'rgba(34, 197, 94, 0.1)' 
                : tournament.status === 'upcoming'
                ? 'rgba(139, 138, 148, 0.1)'
                : 'rgba(105, 103, 117, 0.1)',
              color: tournament.status === 'in_progress' 
                ? '#22c55e' 
                : tournament.status === 'upcoming'
                ? '#8b8a94'
                : '#696775',
            }}>
              {tournament.status === 'in_progress' && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulse 2s infinite',
                }}></div>
              )}
              {tournament.status === 'in_progress' ? 'Live' : tournament.status}
            </span>

            {/* Date Range */}
            <span 
              key={`dates-${tournament.id}-${tournament.start_date}-${tournament.end_date}`}
              style={{
                fontSize: '14px',
                color: '#696775',
              }}
            >
              {tournament.start_date ? (
                <>
                  {new Date(tournament.start_date + 'T00:00:00').toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit'
                  })}
                  {tournament.end_date && tournament.end_date !== tournament.start_date && (
                    <>
                      {' - '}
                      {new Date(tournament.end_date + 'T00:00:00').toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </>
                  )}
                </>
              ) : (
                'Dates TBD'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tournament Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: '16px',
        padding: '16px',
        background: 'rgba(249, 248, 252, 0.6)',
        borderRadius: '8px',
        border: '1px solid #f2f1f5',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div 
            className={isHero ? 'hero-stats' : ''}
            style={{
              fontSize: isHero ? '24px' : '20px',
              fontWeight: '600',
              color: '#1c1b20',
              marginBottom: '2px',
            }}>
            {teamCount}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#696775',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {teamCount === 1 ? 'Team' : 'Teams'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div 
            className={isHero ? 'hero-stats' : ''}
            style={{
              fontSize: isHero ? '24px' : '20px',
              fontWeight: '600',
              color: '#1c1b20',
              marginBottom: '2px',
            }}>
            {gamesPlayed}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#696775',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {gamesPlayed === 1 ? 'Game' : 'Games'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isHero ? '16px' : '14px',
            fontWeight: '600',
            color: '#1c1b20',
            marginBottom: '2px',
          }}>
            {format}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#696775',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Format
          </div>
        </div>
      </div>

      {/* Pulse animation for active status */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        /* Responsive adjustments for hero card */
        @media (max-width: 480px) {
          .hero-card {
            transform: scale(1) !important;
            padding: 16px !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: calc(100vw - 1.5rem) !important;
          }
          .hero-card:hover {
            transform: scale(1.02) !important;
          }
          .hero-logo {
            width: 56px !important;
            height: 56px !important;
            fontSize: 20px !important;
          }
          .hero-title {
            fontSize: 18px !important;
          }
          .hero-stats {
            font-size: 18px !important;
          }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          .hero-card {
            transform: scale(1.01) !important;
            padding: 20px !important;
          }
          .hero-card:hover {
            transform: scale(1.04) !important;
          }
        }
      `}</style>
    </div>
  );
} 