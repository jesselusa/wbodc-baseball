'use client';

import React, { useState } from 'react';
import { Player } from '../lib/types';
import { ESPN } from '../lib/utils';
import BaseballCard from './BaseballCard';
import SectionHeader from './SectionHeader';
import { useIsMobile } from '../hooks/useIsMobile';

export interface StandingRow {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  players: Player[];
}

interface StandingsClientProps {
  standings: StandingRow[];
  tournamentName: string;
  tournamentWinner: string;
}

export default function StandingsClient({ standings, tournamentName, tournamentWinner }: StandingsClientProps) {
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const isMobile = useIsMobile();

  function pct(w: number, l: number): string {
    const total = w + l;
    return total > 0 ? (w / total).toFixed(3).replace(/^0/, '') : '--';
  }

  if (standings.length === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 16px', textAlign: 'center', color: '#6c6c6c' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: ESPN.gray900 }}>No standings available</h2>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>Teams and standings will appear once a tournament is configured.</p>
      </div>
    );
  }

  const headerCell: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: ESPN.gray900,
    letterSpacing: '0.3px',
    textAlign: 'right',
  };

  const dataCell: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '13px',
    color: ESPN.gray900,
    textAlign: 'right',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 48px' }}>
      <SectionHeader title="Standings" rightText={tournamentName} />

      {/* Table */}
      <div style={{ overflow: 'hidden', borderRadius: '0 0 10px 10px', border: '1px solid #E5E5E5', borderTop: 'none' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: ESPN.gray50, borderBottom: '2px solid #E5E5E5' }}>
              <th style={{ ...headerCell, textAlign: 'center', width: '40px' }}>RK</th>
              <th style={{ ...headerCell, textAlign: 'left' }}>Team</th>
              {!isMobile && <th style={{ ...headerCell, textAlign: 'left' }}>Players</th>}
              <th style={{ ...headerCell, width: '44px' }}>W</th>
              <th style={{ ...headerCell, width: '44px' }}>L</th>
              <th style={{ ...headerCell, width: '56px' }}>PCT</th>
              {!isMobile && <th style={{ ...headerCell, width: '44px' }}>RS</th>}
              {!isMobile && <th style={{ ...headerCell, width: '44px' }}>RA</th>}
              <th style={{ ...headerCell, width: '56px' }}>DIFF</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const rowBg = i % 2 === 0 ? ESPN.white : ESPN.gray50;
              const isExpanded = isMobile && expandedTeam === row.teamId;
              const colCount = isMobile ? 6 : 9;
              return (
                <React.Fragment key={row.teamId}>
                  <tr
                    onClick={isMobile ? () => setExpandedTeam(expandedTeam === row.teamId ? null : row.teamId) : undefined}
                    style={{ cursor: isMobile ? 'pointer' : undefined }}
                  >
                    <td style={{ ...dataCell, textAlign: 'center', fontWeight: 700, color: '#6c6c6c', background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{i + 1}</td>
                    <td style={{ ...dataCell, textAlign: 'left', fontWeight: 600, background: rowBg, borderBottom: '1px solid #E5E5E5', whiteSpace: 'nowrap' }}>
                      {row.teamName}
                      {tournamentWinner === row.teamName && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: ESPN.red, fontWeight: 700 }}>🏆</span>
                      )}
                    </td>
                    {!isMobile && (
                      <td style={{ ...dataCell, textAlign: 'left', background: rowBg, borderBottom: '1px solid #E5E5E5', fontSize: '12px', color: ESPN.gray500 }}>
                        {row.players.length === 0 ? (
                          <span style={{ fontStyle: 'italic', color: ESPN.gray400 }}>—</span>
                        ) : (
                          [...row.players].sort((a, b) => a.name.localeCompare(b.name)).map((p, j) => (
                            <span key={p.id}>
                              <span
                                onClick={() => { setCardPlayer(p); setShowCard(true); }}
                                style={{ cursor: 'pointer', textDecoration: 'none', color: ESPN.blue }}
                                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                              >
                                {p.name}
                              </span>
                              {j < row.players.length - 1 && <span style={{ color: ESPN.gray400 }}>, </span>}
                            </span>
                          ))
                        )}
                      </td>
                    )}
                    <td style={{ ...dataCell, fontWeight: 600, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.wins}</td>
                    <td style={{ ...dataCell, fontWeight: 600, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.losses}</td>
                    <td style={{ ...dataCell, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{pct(row.wins, row.losses)}</td>
                    {!isMobile && <td style={{ ...dataCell, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.runsScored}</td>}
                    {!isMobile && <td style={{ ...dataCell, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.runsAllowed}</td>}
                    <td style={{
                      ...dataCell,
                      fontWeight: 600,
                      color: row.runDiff > 0 ? '#2e7d32' : row.runDiff < 0 ? '#c62828' : ESPN.gray900,
                      background: rowBg,
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                      {row.runDiff > 0 ? '+' : ''}{row.runDiff}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={colCount} style={{ padding: '8px 12px', background: ESPN.gray50, borderBottom: '1px solid #E5E5E5', fontSize: 12, color: ESPN.gray500 }}>
                        {row.players.length === 0 ? (
                          <span style={{ fontStyle: 'italic', color: ESPN.gray400 }}>No players</span>
                        ) : (
                          [...row.players].sort((a, b) => a.name.localeCompare(b.name)).map((p, j) => (
                            <span key={p.id}>
                              <span
                                onClick={(e) => { e.stopPropagation(); setCardPlayer(p); setShowCard(true); }}
                                style={{ cursor: 'pointer', textDecoration: 'none', color: ESPN.blue }}
                              >
                                {p.name}
                              </span>
                              {j < row.players.length - 1 && <span style={{ color: ESPN.gray400 }}>, </span>}
                            </span>
                          ))
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Baseball Card Modal */}
      {cardPlayer && (
        <BaseballCard
          player={cardPlayer}
          isOpen={showCard}
          onClose={() => { setShowCard(false); setCardPlayer(null); }}
        />
      )}
    </div>
  );
}
