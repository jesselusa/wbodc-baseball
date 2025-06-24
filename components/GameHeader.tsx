import React from 'react';

interface Team {
  id: string;
  name: string;
  initials?: string;
  logoUrl?: string;
  score?: number;
}

interface Tournament {
  id: string;
  name: string;
  logo_url?: string;
}

interface GameHeaderProps {
  homeTeam: Team;
  awayTeam: Team;
  status?: 'in_progress' | 'completed' | 'scheduled';
  timeStatus?: string;
  tournament?: Tournament;
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

const statusStyles = {
  in_progress: {
    background: '#d1fadf',
    color: '#15803d',
    label: 'Live',
  },
  completed: {
    background: '#e5e7eb',
    color: '#374151',
    label: 'Final',
  },
  scheduled: {
    background: mauve[300],
    color: mauve[900],
    label: 'Scheduled',
  },
};

const TeamBlock: React.FC<{ team: Team; side: 'home' | 'away' }> = ({ team, side }) => (
  <div 
    className="team-block"
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minWidth: 'clamp(60px, 15vw, 80px)',
      flex: 1,
    }}
  >
    <div 
      className={`team-identifier ${side}`} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minWidth: 'clamp(28px, 8vw, 32px)', 
        minHeight: 'clamp(28px, 8vw, 32px)',
      }}
    >
      {team.logoUrl ? (
        <img 
          src={team.logoUrl} 
          alt={team.name + ' logo'} 
          className="team-logo" 
          style={{ 
            width: 'clamp(28px, 8vw, 32px)', 
            height: 'clamp(28px, 8vw, 32px)', 
            borderRadius: '50%' 
          }} 
        />
      ) : (
        <span 
          className="team-initials" 
          style={{ 
            fontWeight: 700, 
            fontSize: 'clamp(16px, 5vw, 20px)'
          }}
        >
          {team.initials || team.name.charAt(0)}
        </span>
      )}
    </div>
    <span 
      className="team-name" 
      style={{ 
        marginTop: 4, 
        fontWeight: 500, 
        fontSize: 'clamp(12px, 3.5vw, 16px)',
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {team.name}
    </span>
    <span 
      className="team-score" 
      style={{ 
        marginTop: 2, 
        fontWeight: 700, 
        fontSize: 'clamp(20px, 7vw, 28px)', 
        color: mauve[900] 
      }}
    >
      {team.score ?? ''}
    </span>
  </div>
);

const GameHeader: React.FC<GameHeaderProps> = ({ homeTeam, awayTeam, status = 'scheduled', timeStatus, tournament }) => {
  const badge = statusStyles[status] || statusStyles.scheduled;
  return (
    <div
      className="game-header-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: 'clamp(16px, 4vw, 24px)',
        borderRadius: 16,
        background: mauve[100],
        boxShadow: '0 2px 12px 0 rgba(80, 60, 120, 0.08)',
        border: `1.5px solid ${mauve[300]}`,
        marginBottom: 16,
      }}
    >
      {/* Tournament context */}
      {tournament && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: mauve[300],
          color: mauve[900],
          borderRadius: 999,
          padding: '2px 14px',
          fontWeight: 600,
          fontSize: 'clamp(12px, 3.5vw, 14px)',
          marginBottom: 12,
          alignSelf: 'flex-start',
          maxWidth: '70%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {tournament.logo_url && (
            <img 
              src={tournament.logo_url} 
              alt={tournament.name + ' logo'} 
              style={{ 
                width: 'clamp(16px, 4vw, 20px)', 
                height: 'clamp(16px, 4vw, 20px)', 
                borderRadius: '50%',
                flexShrink: 0,
              }} 
            />
          )}
          <span>{tournament.name}</span>
        </div>
      )}
      {/* Status badge */}
      <span
        style={{
          position: 'absolute',
          top: 'clamp(12px, 3vw, 16px)',
          right: 'clamp(16px, 4vw, 24px)',
          background: badge.background,
          color: badge.color,
          padding: '4px 14px',
          borderRadius: 999,
          fontWeight: 600,
          fontSize: 'clamp(12px, 3.5vw, 14px)',
          letterSpacing: 0.5,
          boxShadow: '0 1px 4px 0 rgba(80, 60, 120, 0.06)',
        }}
      >
        {timeStatus || badge.label}
      </span>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 'clamp(20px, 8vw, 40px)', 
        width: '100%' 
      }}>
        <TeamBlock team={awayTeam} side="away" />
        <div 
          className="vs" 
          style={{ 
            fontWeight: 600, 
            fontSize: 'clamp(16px, 5vw, 22px)', 
            color: mauve[500], 
            minWidth: 'clamp(24px, 6vw, 40px)', 
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          vs
        </div>
        <TeamBlock team={homeTeam} side="home" />
      </div>
    </div>
  );
};

export default GameHeader; 