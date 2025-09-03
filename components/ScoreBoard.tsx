import React, { useState, useEffect } from 'react';

// Type for inning-by-inning scoring data
export interface InningScore {
  inning: number;
  home_runs: number;
  away_runs: number;
}

export interface ScoreBoardData {
  home_team: {
    name: string;
    total_runs: number;
    total_hits?: number;
    errors?: number;
  };
  away_team: {
    name: string;
    total_runs: number;
    total_hits?: number;
    errors?: number;
  };
  innings: InningScore[];
  total_innings: number; // 3, 5, 7, or 9
}

export interface ScoreBoardProps {
  data: ScoreBoardData;
  className?: string;
}

/**
 * Traditional baseball scoreboard component
 * Displays inning-by-inning runs with totals in familiar baseball format
 */
export default function ScoreBoard({ data, className = '' }: ScoreBoardProps) {
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

  const { home_team, away_team, innings, total_innings } = data;

  // Create array of inning numbers (1 through total_innings)
  const inningNumbers = Array.from({ length: total_innings }, (_, i) => i + 1);

  // Helper to get runs for a specific inning and team
  const getInningRuns = (inning: number, team: 'home' | 'away') => {
    const inningData = innings.find(i => i.inning === inning);
    if (!inningData) return '-';
    
    const runs = team === 'home' ? inningData.home_runs : inningData.away_runs;
    
    // Return "-" for future innings (marked with -1) or missing data
    if (runs === -1 || runs === null || runs === undefined) return '-';
    
    return runs;
  };

  // Mobile team card component (ESPN-inspired)
  const MobileTeamCard = ({ 
    team, 
    isHome, 
    isWinner 
  }: { 
    team: { name: string; total_runs: number }; 
    isHome: boolean; 
    isWinner: boolean;
  }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      position: 'relative'
    }}>
      {/* Team info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1c1b20',
          marginBottom: '2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {team.name}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {isHome ? 'Home' : 'Away'}
        </div>
      </div>

      {/* Score */}
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: isWinner ? '#dc2626' : '#1f2937',
        marginLeft: '16px'
      }}>
        {team.total_runs}
      </div>
    </div>
  );

  // Mobile innings display component
  const MobileInningsDisplay = () => (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        Inning-by-Inning
      </div>
      
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '8px',
        paddingBottom: '8px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {/* Inning headers */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '60px'
        }}>
          <div style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280'
          }}>
            Team
          </div>
          {inningNumbers.map(inning => (
            <div key={inning} style={{
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: '4px',
              minWidth: '32px'
            }}>
              {inning}
            </div>
          ))}
          <div style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: '#dc2626',
            background: '#fef2f2',
            borderRadius: '4px',
            minWidth: '32px'
          }}>
            R
          </div>
        </div>

        {/* Away team innings */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '80px'
        }}>
          <div style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: '#1f2937',
            paddingLeft: '8px'
          }}>
            {away_team.name}
          </div>
          {inningNumbers.map(inning => (
            <div key={inning} style={{
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {getInningRuns(inning, 'away')}
            </div>
          ))}
          <div style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '700',
            color: '#dc2626',
            background: '#fef2f2',
            border: '2px solid #dc2626',
            borderRadius: '4px'
          }}>
            {away_team.total_runs}
          </div>
        </div>

        {/* Home team innings */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '80px'
        }}>
          <div style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: '#1f2937',
            paddingLeft: '8px'
          }}>
            {home_team.name}
          </div>
          {inningNumbers.map(inning => (
            <div key={inning} style={{
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              {getInningRuns(inning, 'home')}
            </div>
          ))}
          <div style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '700',
            color: '#dc2626',
            background: '#fef2f2',
            border: '2px solid #dc2626',
            borderRadius: '4px'
          }}>
            {home_team.total_runs}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );

  // Determine winner
  const isHomeWinner = home_team.total_runs > away_team.total_runs;
  const isAwayWinner = away_team.total_runs > home_team.total_runs;

  return (
    <div 
      className={className}
      style={{
        background: isMobile ? 'white' : '#fafbfc',
        borderRadius: isMobile ? '12px' : '8px',
        border: isMobile ? '1px solid #e5e7eb' : '2px solid #d1d5db',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: isMobile ? '0 1px 3px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <div>
          {/* Header */}
          <div style={{
            backgroundColor: '#374151',
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            textAlign: 'center',
            padding: '12px 16px',
            letterSpacing: '0.5px'
          }}>
            OFFICIAL SCORECARD
          </div>

          {/* Team Cards */}
          <div style={{ borderBottom: '1px solid #e5e7eb' }}>
            <MobileTeamCard 
              team={away_team} 
              isHome={false} 
              isWinner={isAwayWinner} 
            />
            <MobileTeamCard 
              team={home_team} 
              isHome={true} 
              isWinner={isHomeWinner} 
            />
          </div>

          {/* Innings Display */}
          <MobileInningsDisplay />

          {/* Game Info */}
          <div style={{
            padding: '16px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#6b7280',
            fontStyle: 'italic',
            borderTop: '1px solid #e5e7eb'
          }}>
            {total_innings} innings • {isHomeWinner || isAwayWinner ? 'Final' : 'In Progress'}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <>
          {/* Header */}
          <div 
            style={{ 
              backgroundColor: '#374151',
              color: 'white',
              fontSize: '12px',
              fontWeight: '700',
              textAlign: 'center',
              padding: '8px 16px',
              letterSpacing: '0.5px'
            }}
          >
            OFFICIAL SCORECARD
          </div>

          {/* Scoreboard table */}
          <div style={{ padding: '16px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                {/* Header row with inning numbers */}
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th 
                      style={{ 
                        textAlign: 'left', 
                        padding: '8px 12px', 
                        fontWeight: '700',
                        color: '#1f2937',
                        border: '1px solid #d1d5db',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      TEAM
                    </th>
                    {inningNumbers.map(inning => (
                      <th 
                        key={inning}
                        style={{ 
                          textAlign: 'center', 
                          padding: '8px 6px', 
                          fontWeight: '700',
                          color: '#1f2937',
                          border: '1px solid #d1d5db',
                          minWidth: '32px',
                          fontSize: '11px'
                        }}
                      >
                        {inning}
                      </th>
                    ))}
                    <th 
                      style={{ 
                        textAlign: 'center', 
                        padding: '8px 12px', 
                        fontWeight: '700',
                        color: '#991b1b',
                        border: '2px solid #dc2626',
                        backgroundColor: '#fef2f2',
                        fontSize: '12px'
                      }}
                    >
                      R
                    </th>
                    {(home_team.total_hits !== undefined || away_team.total_hits !== undefined) && (
                      <th 
                        style={{ 
                          textAlign: 'center', 
                          padding: '8px 8px', 
                          fontWeight: '700',
                          color: '#1f2937',
                          border: '1px solid #d1d5db',
                          fontSize: '11px'
                        }}
                      >
                        H
                      </th>
                    )}
                    {(home_team.errors !== undefined || away_team.errors !== undefined) && (
                      <th 
                        style={{ 
                          textAlign: 'center', 
                          padding: '8px 8px', 
                          fontWeight: '700',
                          color: '#1f2937',
                          border: '1px solid #d1d5db',
                          fontSize: '11px'
                        }}
                      >
                        E
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {/* Away team row */}
                  <tr style={{ backgroundColor: 'white' }}>
                    <td 
                      style={{ 
                        padding: '10px 12px', 
                        fontWeight: '600',
                        color: '#1f2937',
                        border: '1px solid #d1d5db',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={away_team.name}
                    >
                      {away_team.name}
                    </td>
                    {inningNumbers.map(inning => (
                      <td 
                        key={inning}
                        style={{ 
                          textAlign: 'center', 
                          padding: '10px 6px', 
                          fontFamily: 'Monaco, Consolas, monospace',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          fontWeight: '600'
                        }}
                      >
                        {getInningRuns(inning, 'away')}
                      </td>
                    ))}
                    <td 
                      style={{ 
                        textAlign: 'center', 
                        padding: '10px 12px', 
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#991b1b',
                        border: '2px solid #dc2626',
                        backgroundColor: '#fef2f2'
                      }}
                    >
                      {away_team.total_runs}
                    </td>
                    {away_team.total_hits !== undefined && (
                      <td 
                        style={{ 
                          textAlign: 'center', 
                          padding: '10px 8px', 
                          fontWeight: '600',
                          color: '#374151',
                          border: '1px solid #d1d5db'
                        }}
                      >
                        {away_team.total_hits}
                      </td>
                    )}
                    {away_team.errors !== undefined && (
                      <td 
                        style={{ 
                          textAlign: 'center', 
                          padding: '10px 8px', 
                          fontWeight: '600',
                          color: '#374151',
                          border: '1px solid #d1d5db'
                        }}
                      >
                        {away_team.errors}
                      </td>
                    )}
                  </tr>

                  {/* Home team row */}
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <td 
                      style={{ 
                        padding: '10px 12px', 
                        fontWeight: '600',
                        color: '#1f2937',
                        border: '1px solid #d1d5db',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={home_team.name}
                    >
                      {home_team.name}
                    </td>
                    {inningNumbers.map(inning => (
                      <td 
                        key={inning}
                        style={{ 
                          textAlign: 'center', 
                          padding: '10px 6px', 
                          fontFamily: 'Monaco, Consolas, monospace',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          fontWeight: '600'
                        }}
                      >
                        {getInningRuns(inning, 'home')}
                      </td>
                    ))}
                    <td 
                      style={{ 
                        textAlign: 'center', 
                        padding: '10px 12px', 
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#991b1b',
                        border: '2px solid #dc2626',
                        backgroundColor: '#fef2f2'
                      }}
                    >
                      {home_team.total_runs}
                    </td>
                    {home_team.total_hits !== undefined && (
                      <td 
                        style={{ 
                          textAlign: 'center', 
                          padding: '10px 8px', 
                          fontWeight: '600',
                          color: '#374151',
                          border: '1px solid #d1d5db'
                        }}
                      >
                        {home_team.total_hits}
                      </td>
                    )}
                    {home_team.errors !== undefined && (
                      <td 
                        style={{ 
                          textAlign: 'center', 
                          padding: '10px 8px', 
                          fontWeight: '600',
                          color: '#374151',
                          border: '1px solid #d1d5db'
                        }}
                      >
                        {home_team.errors}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 