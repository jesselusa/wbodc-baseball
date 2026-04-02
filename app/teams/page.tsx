'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/api';
import { Player } from '../../lib/types';
import BaseballCard from '../../components/BaseballCard';

interface StandingRow {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  players: Player[];
}

export default function TeamsPage() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [tournamentName, setTournamentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // 1. Get most recent tournament
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (!tournament) { setLoading(false); return; }
      setTournamentName(tournament.name);

      // 2. Fetch teams, games, and player assignments in parallel
      const [teamsRes, gamesRes, assignRes] = await Promise.all([
        supabase
          .from('tournament_player_assignments')
          .select('team_id, teams!inner(id, name)')
          .eq('tournament_id', tournament.id),
        supabase
          .from('games')
          .select('home_team_id, away_team_id, home_score, away_score, status')
          .eq('tournament_id', tournament.id)
          .eq('game_type', 'round_robin')
          .eq('status', 'completed'),
        supabase
          .from('tournament_player_assignments')
          .select('team_id, players!inner(id, name, nickname, avatar_url, current_town, hometown, championships_won, created_at, updated_at)')
          .eq('tournament_id', tournament.id),
      ]);

      // Build unique teams map
      const teamMap = new Map<string, { id: string; name: string; players: Player[] }>();
      (teamsRes.data || []).forEach((row: any) => {
        const t = row.teams;
        if (t && !teamMap.has(t.id)) {
          teamMap.set(t.id, { id: t.id, name: t.name, players: [] });
        }
      });

      // Attach players
      (assignRes.data || []).forEach((row: any) => {
        const entry = teamMap.get(row.team_id);
        if (entry && row.players) {
          const p = row.players as Player;
          if (!entry.players.find(x => x.id === p.id)) {
            entry.players.push(p);
          }
        }
      });

      // Compute standings from completed games
      const rows: StandingRow[] = Array.from(teamMap.values()).map(t => ({
        teamId: t.id, teamName: t.name, wins: 0, losses: 0,
        runsScored: 0, runsAllowed: 0, runDiff: 0, players: t.players,
      }));
      const standMap = new Map(rows.map(r => [r.teamId, r]));

      (gamesRes.data || []).forEach((g: any) => {
        const home = standMap.get(g.home_team_id);
        const away = standMap.get(g.away_team_id);
        if (!home || !away) return;
        home.runsScored += g.home_score ?? 0;
        home.runsAllowed += g.away_score ?? 0;
        away.runsScored += g.away_score ?? 0;
        away.runsAllowed += g.home_score ?? 0;
        if ((g.home_score ?? 0) > (g.away_score ?? 0)) {
          home.wins++; away.losses++;
        } else {
          away.wins++; home.losses++;
        }
      });

      rows.forEach(r => { r.runDiff = r.runsScored - r.runsAllowed; });
      rows.sort((a, b) => b.wins - a.wins || b.runDiff - a.runDiff);

      setStandings(rows);
    } catch (err) {
      console.error('Failed to load standings:', err);
    } finally {
      setLoading(false);
    }
  }

  function pct(w: number, l: number): string {
    const total = w + l;
    return total > 0 ? (w / total).toFixed(3).replace(/^0/, '') : '--';
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: '#6c6c6c', fontSize: '14px' }}>
        Loading standings...
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px', textAlign: 'center', color: '#6c6c6c' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2B2C2D' }}>No standings available</h2>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>Teams and standings will appear once a tournament is configured.</p>
      </div>
    );
  }

  const headerCell: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#2B2C2D',
    letterSpacing: '0.3px',
    textAlign: 'right',
  };

  const dataCell: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#2B2C2D',
    textAlign: 'right',
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* ESPN dark section header */}
      <div style={{
        background: '#1a1a1a',
        color: '#ffffff',
        padding: '14px 16px',
        borderRadius: '10px 10px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.3px' }}>Standings</span>
        <span style={{ fontSize: '12px', color: '#a0a0a0', fontWeight: 500 }}>{tournamentName}</span>
      </div>

      {/* Table */}
      <div style={{ overflow: 'hidden', borderRadius: '0 0 10px 10px', border: '1px solid #E5E5E5', borderTop: 'none' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#F9F9F9', borderBottom: '2px solid #E5E5E5' }}>
              <th style={{ ...headerCell, textAlign: 'center', width: '40px' }}>RK</th>
              <th style={{ ...headerCell, textAlign: 'left' }}>Team</th>
              <th style={{ ...headerCell, textAlign: 'left' }}>Players</th>
              <th style={{ ...headerCell, width: '44px' }}>W</th>
              <th style={{ ...headerCell, width: '44px' }}>L</th>
              <th style={{ ...headerCell, width: '56px' }}>PCT</th>
              <th style={{ ...headerCell, width: '44px' }}>RS</th>
              <th style={{ ...headerCell, width: '44px' }}>RA</th>
              <th style={{ ...headerCell, width: '56px' }}>DIFF</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const rowBg = i % 2 === 0 ? '#ffffff' : '#F9F9F9';
              return (
                <tr key={row.teamId}>
                  <td style={{ ...dataCell, textAlign: 'center', fontWeight: 700, color: '#6c6c6c', background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{i + 1}</td>
                  <td style={{ ...dataCell, textAlign: 'left', fontWeight: 600, background: rowBg, borderBottom: '1px solid #E5E5E5', whiteSpace: 'nowrap' }}>
                    {row.teamName}
                  </td>
                  <td style={{ ...dataCell, textAlign: 'left', background: rowBg, borderBottom: '1px solid #E5E5E5', fontSize: '12px', color: '#6C6D6F' }}>
                    {row.players.length === 0 ? (
                      <span style={{ fontStyle: 'italic', color: '#A5A6A7' }}>—</span>
                    ) : (
                      [...row.players].sort((a, b) => a.name.localeCompare(b.name)).map((p, j) => (
                        <span key={p.id}>
                          <span
                            onClick={() => { setCardPlayer(p); setShowCard(true); }}
                            style={{ cursor: 'pointer', textDecoration: 'none', color: '#0066CC' }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                          >
                            {p.name}
                          </span>
                          {j < row.players.length - 1 && <span style={{ color: '#A5A6A7' }}>, </span>}
                        </span>
                      ))
                    )}
                  </td>
                  <td style={{ ...dataCell, fontWeight: 600, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.wins}</td>
                  <td style={{ ...dataCell, fontWeight: 600, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.losses}</td>
                  <td style={{ ...dataCell, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{pct(row.wins, row.losses)}</td>
                  <td style={{ ...dataCell, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.runsScored}</td>
                  <td style={{ ...dataCell, background: rowBg, borderBottom: '1px solid #E5E5E5' }}>{row.runsAllowed}</td>
                  <td style={{
                    ...dataCell,
                    fontWeight: 600,
                    color: row.runDiff > 0 ? '#2e7d32' : row.runDiff < 0 ? '#c62828' : '#2B2C2D',
                    background: rowBg,
                    borderBottom: '1px solid #E5E5E5',
                  }}>
                    {row.runDiff > 0 ? '+' : ''}{row.runDiff}
                  </td>
                </tr>
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
