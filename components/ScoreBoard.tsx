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
 * Traditional baseball line score component with ESPN-style styling.
 * Single responsive layout using a horizontally scrollable table.
 */
export default function ScoreBoard({ data, className = '' }: ScoreBoardProps) {
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

  // Determine winner
  const isHomeWinner = home_team.total_runs > away_team.total_runs;
  const isAwayWinner = away_team.total_runs > home_team.total_runs;

  const showHits = home_team.total_hits !== undefined || away_team.total_hits !== undefined;
  const showErrors = home_team.errors !== undefined || away_team.errors !== undefined;

  const cellBase: React.CSSProperties = {
    textAlign: 'center',
    padding: '8px 8px',
    fontFamily: '"SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", monospace',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '13px',
    color: '#151617',
    borderBottom: '1px solid #D0D0D0',
    borderRight: '1px solid #D0D0D0',
  };

  const headerCellBase: React.CSSProperties = {
    textAlign: 'center',
    padding: '6px 8px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'white',
    backgroundColor: '#2B2C2D',
    borderBottom: '1px solid #D0D0D0',
    borderRight: '1px solid #444',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      className={className}
      style={{
        border: '1px solid #D0D0D0',
        borderRadius: '4px',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth: 'max-content',
            fontSize: '13px',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              {/* Team header */}
              <th
                style={{
                  ...headerCellBase,
                  textAlign: 'left',
                  paddingLeft: '12px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  minWidth: '100px',
                }}
              >
                TEAM
              </th>
              {/* Inning headers */}
              {inningNumbers.map(inning => (
                <th
                  key={inning}
                  style={{
                    ...headerCellBase,
                    minWidth: '28px',
                  }}
                >
                  {inning}
                </th>
              ))}
              {/* R / H / E headers */}
              <th
                style={{
                  ...headerCellBase,
                  minWidth: '32px',
                  borderRight: showHits || showErrors ? headerCellBase.borderRight : 'none',
                }}
              >
                R
              </th>
              {showHits && (
                <th
                  style={{
                    ...headerCellBase,
                    minWidth: '32px',
                    borderRight: showErrors ? headerCellBase.borderRight : 'none',
                  }}
                >
                  H
                </th>
              )}
              {showErrors && (
                <th
                  style={{
                    ...headerCellBase,
                    minWidth: '32px',
                    borderRight: 'none',
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
                  ...cellBase,
                  textAlign: 'left',
                  paddingLeft: '12px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: isAwayWinner ? 700 : 600,
                  color: '#151617',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'white',
                  zIndex: 1,
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={away_team.name}
              >
                {away_team.name}
              </td>
              {inningNumbers.map(inning => (
                <td key={inning} style={{ ...cellBase, color: getInningRuns(inning, 'away') === '-' ? '#6C6D6F' : '#151617' }}>
                  {getInningRuns(inning, 'away')}
                </td>
              ))}
              <td
                style={{
                  ...cellBase,
                  fontWeight: isAwayWinner ? 700 : 600,
                  fontSize: '14px',
                  color: '#151617',
                  borderRight: showHits || showErrors ? cellBase.borderRight : 'none',
                }}
              >
                {away_team.total_runs}
              </td>
              {showHits && (
                <td style={{ ...cellBase, color: '#6C6D6F', borderRight: showErrors ? cellBase.borderRight : 'none' }}>
                  {away_team.total_hits ?? '-'}
                </td>
              )}
              {showErrors && (
                <td style={{ ...cellBase, color: '#6C6D6F', borderRight: 'none' }}>
                  {away_team.errors ?? '-'}
                </td>
              )}
            </tr>

            {/* Home team row */}
            <tr style={{ backgroundColor: 'white' }}>
              <td
                style={{
                  ...cellBase,
                  textAlign: 'left',
                  paddingLeft: '12px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: isHomeWinner ? 700 : 600,
                  color: '#151617',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'white',
                  zIndex: 1,
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  borderBottom: 'none',
                }}
                title={home_team.name}
              >
                {home_team.name}
              </td>
              {inningNumbers.map(inning => (
                <td key={inning} style={{ ...cellBase, borderBottom: 'none', color: getInningRuns(inning, 'home') === '-' ? '#6C6D6F' : '#151617' }}>
                  {getInningRuns(inning, 'home')}
                </td>
              ))}
              <td
                style={{
                  ...cellBase,
                  fontWeight: isHomeWinner ? 700 : 600,
                  fontSize: '14px',
                  color: '#151617',
                  borderBottom: 'none',
                  borderRight: showHits || showErrors ? cellBase.borderRight : 'none',
                }}
              >
                {home_team.total_runs}
              </td>
              {showHits && (
                <td style={{ ...cellBase, color: '#6C6D6F', borderBottom: 'none', borderRight: showErrors ? cellBase.borderRight : 'none' }}>
                  {home_team.total_hits ?? '-'}
                </td>
              )}
              {showErrors && (
                <td style={{ ...cellBase, color: '#6C6D6F', borderBottom: 'none', borderRight: 'none' }}>
                  {home_team.errors ?? '-'}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
