import React from 'react';

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
  const { home_team, away_team, innings, total_innings } = data;

  // Create array of inning numbers (1 through total_innings)
  const inningNumbers = Array.from({ length: total_innings }, (_, i) => i + 1);

  // Helper to get runs for a specific inning and team
  const getInningRuns = (inning: number, team: 'home' | 'away') => {
    const inningData = innings.find(i => i.inning === inning);
    if (!inningData) return '-';
    return team === 'home' ? inningData.home_runs : inningData.away_runs;
  };

  return (
    <div 
      className={className}
      style={{
        background: '#fafbfc',
        borderRadius: '8px',
        border: '2px solid #d1d5db',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
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

        {/* Mobile-friendly summary for small screens */}
        <div 
          style={{ 
            display: 'block',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #d1d5db'
          }}
          className="sm:hidden"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
            <div>
              <div 
                style={{
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {away_team.name}
              </div>
              <div 
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#991b1b'
                }}
              >
                {away_team.total_runs}
              </div>
            </div>
            <div>
              <div 
                style={{
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {home_team.name}
              </div>
              <div 
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#991b1b'
                }}
              >
                {home_team.total_runs}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 