"use client";

import React from 'react';
import { GameDisplayData } from '../lib/types';

interface GameRowProps {
  game: GameDisplayData;
  isLive: boolean;
}

export default function GameRow({ game, isLive }: GameRowProps) {
  const handleGameClick = () => {
    // Navigate to game details page
    window.location.href = `/game/${game.id}`;
  };

  // Format team name to fit in smaller spaces
  const formatTeamName = (name: string) => {
    if (name.length <= 16) return name;
    // Try to abbreviate common words
    return name
      .replace(/Champions?/i, 'Champs')
      .replace(/Legends?/i, 'Legends')
      .replace(/Heroes?/i, 'Heroes')
      .slice(0, 16) + '...';
  };

  // Get game status display info
  const getStatusInfo = () => {
    if (game.status === 'in_progress') {
      const inningHalf = game.current_inning_half === 'top' ? '▲' : '▼';
      return {
        text: `${inningHalf} ${game.current_inning}`,
        subtext: `${game.outs} out${game.outs === 1 ? '' : 's'}`,
        color: '#22c55e',
        background: 'rgba(34, 197, 94, 0.1)',
      };
    } else if (game.status === 'completed') {
      return {
        text: 'Final',
        subtext: `${game.innings} inn`,
        color: '#696775',
        background: 'transparent',
      };
    } else if (game.status === 'scheduled') {
      return {
        text: game.time_status || 'Scheduled',
        subtext: `${game.innings} inn`,
        color: '#8b8a94',
        background: 'transparent',
      };
    }
    return {
      text: game.status,
      subtext: '',
      color: '#696775',
      background: 'transparent',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      onClick={handleGameClick}
      style={{
        padding: '16px 24px',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        background: isLive ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isLive ? 'rgba(255, 255, 255, 0.9)' : '#f9f8fc';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isLive ? 'rgba(255, 255, 255, 0.7)' : 'transparent';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Teams and Scores */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Away Team */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              minWidth: 0,
            }}>
              {/* Team Logo Placeholder */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #9c9ba6, #ada9b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                flexShrink: 0,
              }}>
                {game.away_team.name.charAt(0)}
              </div>
              
              {/* Team Name */}
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1c1b20',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {formatTeamName(game.away_team.name)}
              </span>
            </div>
            
            {/* Away Score */}
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1c1b20',
              minWidth: '24px',
              textAlign: 'right',
            }}>
              {game.away_score}
            </span>
          </div>

          {/* Home Team */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              minWidth: 0,
            }}>
              {/* Team Logo Placeholder */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #696775, #8b8a94)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                flexShrink: 0,
              }}>
                {game.home_team.name.charAt(0)}
              </div>
              
              {/* Team Name */}
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1c1b20',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {formatTeamName(game.home_team.name)}
              </span>
            </div>
            
            {/* Home Score */}
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1c1b20',
              minWidth: '24px',
              textAlign: 'right',
            }}>
              {game.home_score}
            </span>
          </div>
        </div>

        {/* Game Status and Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          minWidth: '80px',
        }}>
          {/* Status Badge */}
          <div style={{
            background: statusInfo.background,
            borderRadius: '6px',
            padding: '4px 8px',
            minWidth: '50px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: statusInfo.color,
              lineHeight: '1',
            }}>
              {statusInfo.text}
            </div>
            {statusInfo.subtext && (
              <div style={{
                fontSize: '10px',
                color: '#696775',
                lineHeight: '1',
                marginTop: '2px',
              }}>
                {statusInfo.subtext}
              </div>
            )}
          </div>

          {/* Game Type */}
          <div style={{
            fontSize: '10px',
            color: '#8b8a94',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            {game.game_type === 'tournament' ? (
              game.tournament?.name.includes('IX') ? 'Tournament' : 'Tourney'
            ) : (
              'Free Play'
            )}
          </div>
        </div>

        {/* Live Indicator */}
        {isLive && (
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#22c55e',
            flexShrink: 0,
            animation: 'pulse 2s infinite',
          }}></div>
        )}
      </div>

      {/* Tournament Name (if applicable and space allows) */}
      {game.tournament && game.game_type === 'tournament' && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #e9e8eb',
          fontSize: '11px',
          color: '#8b8a94',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          🏆 {game.tournament.name}
        </div>
      )}

      {/* Pulse animation for live indicator */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
} 