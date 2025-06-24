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

const mauve = {
  50: '#faf8ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d6b4fa',
  400: '#c084fc',
  500: '#a56eff',
  600: '#9333ea',
  700: '#7c3aed',
  800: '#6b21a8',
  900: '#4b206b',
  950: '#2e1065',
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
        background: mauve[100],
        border: `1.5px solid ${mauve[300]}`,
        borderRadius: 12,
        padding: 'clamp(8px, 2vw, 12px)',
        marginBottom: 16,
        boxShadow: '0 2px 8px 0 rgba(80, 60, 120, 0.06)',
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
            background: mauve[50],
            border: `1px solid ${mauve[300]}`,
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
              color: mauve[800],
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
              color: mauve[800],
              lineHeight: 1,
            }}>
              {homeTeam.name.substring(0, 3).toUpperCase()} {homeTeam.score}
            </div>
          )}
        </div>

        {/* Middle Section: Outs, Ball-Strike Count, and Batter */}
        <div
          style={{
            background: mauve[50],
            border: `1px solid ${mauve[300]}`,
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
              color: mauve[700],
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
              color: mauve[800],
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
              color: mauve[600],
              textTransform: 'uppercase',
            }}>
              {currentBatter.name}
            </div>
          )}
        </div>

        {/* Right Section: Base Runners and Inning */}
        <div
          style={{
            background: mauve[50],
            border: `1px solid ${mauve[300]}`,
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
                background: runnerOnSecond ? '#FFD700' : mauve[300],
                border: `clamp(1px, 0.5vw, 2px) solid ${runnerOnSecond ? '#FFA500' : mauve[400]}`,
                transform: 'rotate(45deg)',
                transition: 'all 0.3s ease',
                boxShadow: runnerOnSecond ? '0 0 8px rgba(255, 215, 0, 0.5)' : 'none',
              }}
            />
            
            {/* Third and First Base */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 'clamp(16px, 4vw, 20px)',
                  height: 'clamp(16px, 4vw, 20px)',
                  background: runnerOnThird ? '#FFD700' : mauve[300],
                  border: `clamp(1px, 0.5vw, 2px) solid ${runnerOnThird ? '#FFA500' : mauve[400]}`,
                  transform: 'rotate(45deg)',
                  transition: 'all 0.3s ease',
                  boxShadow: runnerOnThird ? '0 0 8px rgba(255, 215, 0, 0.5)' : 'none',
                }}
              />
              
              <div
                style={{
                  width: 'clamp(16px, 4vw, 20px)',
                  height: 'clamp(16px, 4vw, 20px)',
                  background: runnerOnFirst ? '#FFD700' : mauve[300],
                  border: `clamp(1px, 0.5vw, 2px) solid ${runnerOnFirst ? '#FFA500' : mauve[400]}`,
                  transform: 'rotate(45deg)',
                  transition: 'all 0.3s ease',
                  boxShadow: runnerOnFirst ? '0 0 8px rgba(255, 215, 0, 0.5)' : 'none',
                }}
              />
            </div>
          </div>

          {/* Inning and Live Indicator */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(2px, 1vw, 4px)',
          }}>
            {/* Inning */}
            {currentInning && currentInningHalf && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontSize: 'clamp(10px, 2.5vw, 12px)',
                fontWeight: 700,
                color: mauve[800],
              }}>
                <div style={{ fontSize: 'clamp(12px, 3.5vw, 16px)' }}>
                  {currentInningHalf === 'top' ? '▲' : '▼'}
                </div>
                <div>{currentInning}</div>
              </div>
            )}

            {/* Live Indicator with Pulse Animation */}
            <div
              className="live-indicator"
              style={{
                fontSize: 'clamp(6px, 1.8vw, 8px)',
                fontWeight: 700,
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: '#FF4444',
                padding: 'clamp(1px, 0.5vw, 2px) clamp(2px, 1vw, 4px)',
                borderRadius: 3,
                boxShadow: '0 0 8px rgba(255, 68, 68, 0.4)',
              }}
            >
              LIVE
            </div>
          </div>
        </div>
      </div>

      {/* TODO: Add live status indicator with CSS pulse animation */}
    </div>
  );
};

export default LiveGameInfo; 