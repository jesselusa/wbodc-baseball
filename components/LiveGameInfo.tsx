import React from 'react';

interface LiveGameInfoProps {
  status: 'in_progress' | 'completed' | 'scheduled';
  awayTeam?: {
    name: string;
    score: number;
  };
  homeTeam?: {
    name: string;
    score: number;
  };
  currentInning?: number;
  currentInningHalf?: 'top' | 'bottom';
  outs?: number;
  currentBatter?: {
    id: string;
    name: string;
  };
  runnerOnFirst?: boolean;
  runnerOnSecond?: boolean;
  runnerOnThird?: boolean;
  balls?: number;
  strikes?: number;
}

// Consistent color scheme matching home page
const colors = {
  background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
  cardBackground: '#ffffff',
  primaryText: '#1c1b20',
  secondaryText: '#312f36',
  tertiaryText: '#696775',
  border: '#e5e3e8',
  accent: '#696775',
};

const LiveGameInfo: React.FC<LiveGameInfoProps> = ({
  status,
  awayTeam,
  homeTeam,
  currentInning,
  currentInningHalf,
  outs,
  currentBatter,
  runnerOnFirst,
  runnerOnSecond,
  runnerOnThird,
  balls,
  strikes,
}) => {
  // Only render for in-progress games
  if (status !== 'in_progress') {
    return null;
  }

  // Check if there are any runners on base
  const hasRunners = runnerOnFirst || runnerOnSecond || runnerOnThird;

  return (
    <div 
      className="live-game-info"
      style={{
        background: colors.cardBackground,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 12,
        padding: 'clamp(8px, 2vw, 12px)',
        marginBottom: 16,
        boxShadow: '0 2px 8px 0 rgba(105, 103, 117, 0.06)',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Main Grid Layout */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'clamp(4px, 1vw, 8px)',
          marginBottom: 'clamp(4px, 1vw, 8px)',
        }}
      >
        {/* Left Section: Team Scores */}
        <div
          style={{
            background: '#f8f7fa',
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: 'clamp(4px, 1.5vw, 8px) clamp(3px, 1vw, 6px)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 'clamp(50px, 12vw, 60px)',
          }}
        >
          {awayTeam && (
            <div style={{
              fontSize: 'clamp(12px, 3.5vw, 16px)',
              fontWeight: 700,
              color: colors.primaryText,
              marginBottom: 'clamp(2px, 1vw, 4px)',
              lineHeight: 1,
            }}>
              {awayTeam.name.substring(0, 3).toUpperCase()} {awayTeam.score}
            </div>
          )}
          {homeTeam && (
            <div style={{
              fontSize: 'clamp(12px, 3.5vw, 16px)',
              fontWeight: 700,
              color: colors.primaryText,
              lineHeight: 1,
            }}>
              {homeTeam.name.substring(0, 3).toUpperCase()} {homeTeam.score}
            </div>
          )}
        </div>

        {/* Middle Section: Outs, Ball-Strike Count, and Batter */}
        <div
          style={{
            background: '#f8f7fa',
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: 'clamp(4px, 1.5vw, 6px) clamp(4px, 2vw, 8px)',
            textAlign: 'center',
          }}
        >
          {/* Outs */}
          {outs !== undefined && (
            <div style={{ 
              fontSize: 'clamp(10px, 2.5vw, 12px)', 
              fontWeight: 600, 
              color: colors.secondaryText,
              marginBottom: 'clamp(1px, 0.5vw, 2px)',
            }}>
              {outs} {outs === 1 ? 'OUT' : 'OUTS'}
            </div>
          )}
          
          {/* Ball-Strike Count */}
          {(balls !== undefined || strikes !== undefined) && (
            <div style={{ 
              fontSize: 'clamp(12px, 3vw, 14px)', 
              fontWeight: 700, 
              color: colors.primaryText,
              marginBottom: 'clamp(1px, 0.5vw, 2px)',
            }}>
              {balls ?? 0} - {strikes ?? 0}
            </div>
          )}

          {/* Current Batter */}
          {currentBatter && (
            <div style={{ 
              fontSize: 'clamp(8px, 2vw, 10px)', 
              fontWeight: 600, 
              color: colors.tertiaryText,
              textTransform: 'uppercase',
            }}>
              {currentBatter.name}
            </div>
          )}
        </div>

        {/* Right Section: Base Runners and Inning */}
        <div
          style={{
            background: '#f8f7fa',
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: 'clamp(4px, 1.5vw, 6px) clamp(4px, 2vw, 8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Base Runners */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(3px, 1.5vw, 6px)',
              width: 'clamp(40px, 12vw, 60px)',
            }}
          >
            {/* Second Base (Top) */}
            <div
              style={{
                width: 'clamp(16px, 4vw, 20px)',
                height: 'clamp(16px, 4vw, 20px)',
                background: runnerOnSecond ? '#FFD700' : '#e5e3e8',
                border: `clamp(1px, 0.5vw, 2px) solid ${runnerOnSecond ? '#FFA500' : colors.border}`,
                transform: 'rotate(45deg)',
                transition: 'all 0.3s ease',
              }}
            />
            
            {/* First and Third Base Row */}
            <div style={{ display: 'flex', gap: 'clamp(20px, 8vw, 32px)' }}>
              {/* Third Base (Left) */}
              <div
                style={{
                  width: 'clamp(16px, 4vw, 20px)',
                  height: 'clamp(16px, 4vw, 20px)',
                  background: runnerOnThird ? '#FFD700' : '#e5e3e8',
                  border: `clamp(1px, 0.5vw, 2px) solid ${runnerOnThird ? '#FFA500' : colors.border}`,
                  transform: 'rotate(45deg)',
                  transition: 'all 0.3s ease',
                }}
              />
              
              {/* First Base (Right) */}
              <div
                style={{
                  width: 'clamp(16px, 4vw, 20px)',
                  height: 'clamp(16px, 4vw, 20px)',
                  background: runnerOnFirst ? '#FFD700' : '#e5e3e8',
                  border: `clamp(1px, 0.5vw, 2px) solid ${runnerOnFirst ? '#FFA500' : colors.border}`,
                  transform: 'rotate(45deg)',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Inning Information */}
          <div style={{ textAlign: 'right', marginLeft: 'clamp(4px, 2vw, 8px)' }}>
            {currentInning && (
              <div style={{ 
                fontSize: 'clamp(10px, 2.5vw, 12px)', 
                fontWeight: 600, 
                color: colors.secondaryText,
                marginBottom: 'clamp(1px, 0.5vw, 2px)',
              }}>
                {currentInningHalf === 'top' ? '▲' : '▼'} {currentInning}
              </div>
            )}
            
            {/* Live Indicator */}
            <div 
              className="live-indicator" 
              style={{ 
                fontSize: 'clamp(8px, 2vw, 10px)', 
                fontWeight: 700, 
                color: '#15803d',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              LIVE
            </div>
          </div>
        </div>
      </div>

      {/* Optional Footer for Enhanced Context */}
      {hasRunners && (
        <div 
          style={{ 
            fontSize: 'clamp(8px, 2vw, 10px)', 
            color: colors.tertiaryText, 
            textAlign: 'center', 
            marginTop: 'clamp(4px, 1vw, 6px)',
            fontWeight: 500,
          }}
        >
          {[
            runnerOnFirst && 'Runner on 1st',
            runnerOnSecond && 'Runner on 2nd', 
            runnerOnThird && 'Runner on 3rd'
          ].filter(Boolean).join(' • ')}
        </div>
      )}
    </div>
  );
};

export default LiveGameInfo; 