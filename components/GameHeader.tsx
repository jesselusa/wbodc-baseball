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

export default function GameHeader({ homeTeam, awayTeam, status = 'scheduled', timeStatus, tournament }: GameHeaderProps) {
  const getStatusStyle = () => {
    switch (status) {
      case 'in_progress':
        return {
          background: '#dcfce7',
          color: '#166534',
          border: '1px solid #bbf7d0',
          label: timeStatus || 'Live'
        };
      case 'completed':
        return {
          background: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db',
          label: timeStatus || 'Final'
        };
      default:
        return {
          background: '#fefce8',
          color: '#a16207',
          border: '1px solid #fde047',
          label: timeStatus || 'Scheduled'
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e4e2e8',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Tournament Header */}
      {tournament && (
        <div style={{
          background: '#f9fafb',
          borderBottom: '1px solid #e4e2e8',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {tournament.logo_url && (
              <img 
                src={tournament.logo_url} 
                alt={`${tournament.name} logo`}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              {tournament.name}
            </span>
          </div>
          
          {/* Status Badge */}
          <span style={{
            padding: '4px 8px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '500',
            background: statusStyle.background,
            color: statusStyle.color,
            border: statusStyle.border
          }}>
            {statusStyle.label}
          </span>
        </div>
      )}

      {/* Game Matchup */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Away Team */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              fontSize: '18px',
              fontWeight: '700',
              color: '#374151'
            }}>
              {awayTeam.logoUrl ? (
                <img 
                  src={awayTeam.logoUrl} 
                  alt={`${awayTeam.name} logo`}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                awayTeam.initials || awayTeam.name.charAt(0)
              )}
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '4px',
              lineHeight: '1.2'
            }}>
              {awayTeam.name}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {awayTeam.score ?? '-'}
            </div>
          </div>

          {/* VS */}
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#6b7280',
            padding: '0 8px'
          }}>
            VS
          </div>

          {/* Home Team */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              fontSize: '18px',
              fontWeight: '700',
              color: '#374151'
            }}>
              {homeTeam.logoUrl ? (
                <img 
                  src={homeTeam.logoUrl} 
                  alt={`${homeTeam.name} logo`}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                homeTeam.initials || homeTeam.name.charAt(0)
              )}
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '4px',
              lineHeight: '1.2'
            }}>
              {homeTeam.name}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {homeTeam.score ?? '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge for mobile when no tournament */}
      {!tournament && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px'
        }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '500',
            background: statusStyle.background,
            color: statusStyle.color,
            border: statusStyle.border
          }}>
            {statusStyle.label}
          </span>
        </div>
      )}
    </div>
  );
} 