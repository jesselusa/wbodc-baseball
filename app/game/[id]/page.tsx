'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchGameById, getLiveGameStatus, fetchTeamPlayers, calculateInningScores, supabase } from '../../../lib/api';
import { GameDisplayData, LiveGameStatus, GameSnapshot, Player } from '../../../lib/types';
import { useViewerGameUpdates } from '../../../hooks/useViewerGameUpdates';
import ScoreBoard from '../../../components/ScoreBoard';
import { ConnectionStatus } from '../../../components/ConnectionStatus';

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const [gameId, setGameId] = useState<string>('');
  const [initialGame, setInitialGame] = useState<GameDisplayData | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveGameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [inningScores, setInningScores] = useState<any[]>([]);
  const [teamRecords, setTeamRecords] = useState<Map<string, { wins: number; losses: number }>>(new Map());

  const router = useRouter();

  // Real-time game updates subscription (viewer-optimized)
  const {
    gameSnapshot: snapshot,
    connectionStatus,
    isConnected,
    hasError,
    reconnect,
    lastUpdateTime
  } = useViewerGameUpdates({
    gameId,
    autoConnect: !!gameId,
    onError: (error) => console.error('Real-time error:', error)
  });

  // Navigation helper
  const handleTournamentClick = () => {
    if (initialGame?.tournament) {
      const gameDate = initialGame.scheduled_start || initialGame.actual_start;
      if (gameDate) {
        const year = new Date(gameDate).getFullYear();
        const currentYear = new Date().getFullYear();

        // Route to /games for current year (2025), /results for historical years
        if (year === currentYear) {
          router.push('/games');
        } else {
          router.push(`/results?year=${year}`);
        }
      } else {
        // Fallback to current year if no date available
        const currentYear = new Date().getFullYear();
        router.push('/games');
      }
    }
  };

  // Format game phase (same logic as results page)
  const formatGamePhase = () => {
    // For now, we'll use a simple heuristic based on game timing
    // In a real implementation, you might want to store this data
    if (!initialGame) return 'Tournament';

    // This is a simplified version - in reality you'd want to determine
    // this based on tournament structure or explicit game phase data
    const gameDate = new Date(initialGame.actual_start || initialGame.scheduled_start || '');
    const hour = gameDate.getHours();

    // Simple heuristic: early games are pool play, later games are elimination
    if (hour < 14) {
      return 'Pool Play';
    } else if (hour < 17) {
      return 'Semifinal';
    } else {
      return 'Championship';
    }
  };

  // Fetch team players
  const fetchPlayersForGame = async () => {
    if (!initialGame) return;

    setLoadingPlayers(true);
    try {
      const [homeResponse, awayResponse] = await Promise.all([
        fetchTeamPlayers(initialGame.home_team.id, initialGame.tournament?.id),
        fetchTeamPlayers(initialGame.away_team.id, initialGame.tournament?.id)
      ]);

      if (homeResponse.success) {
        setHomePlayers(homeResponse.data);
      }
      if (awayResponse.success) {
        setAwayPlayers(awayResponse.data);
      }
    } catch (error) {
      console.error('Error fetching team players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Fetch inning scores for the game
  const fetchInningScores = async () => {
    if (!initialGame) return;

    try {
      const scores = await calculateInningScores(initialGame.id);
      setInningScores(scores);
    } catch (error) {
      console.error('Error fetching inning scores:', error);
    }
  };

  // Fetch team records (standings) for this game's tournament
  const fetchTeamRecords = async () => {
    try {
      const tid = initialGame?.tournament?.id;
      if (!tid) return;
      const res = await fetch(`/api/tournaments/${tid}/standings`);
      const data = await res.json();
      const standings = (data?.data?.standings || []) as Array<{ teamId: string; wins: number; losses: number }>;
      const map = new Map<string, { wins: number; losses: number }>();
      standings.forEach((s) => {
        map.set(s.teamId, { wins: s.wins || 0, losses: s.losses || 0 });
      });
      setTeamRecords(map);
    } catch (err) {
      console.error('Error fetching team records:', err);
    }
  };

  // Extract gameId from params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setGameId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Load initial game data
  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        setError(null);

        const [gameResponse, statusResponse] = await Promise.all([
          fetchGameById(gameId),
          getLiveGameStatus(gameId)
        ]);

        if (!gameResponse.success || !gameResponse.data) {
          setError('Game not found');
          return;
        }

        setInitialGame(gameResponse.data);

        if (statusResponse) {
          setLiveStatus(statusResponse);
        }

      } catch (err) {
        setError('Failed to load game data');
        console.error('Error loading game data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [gameId]);

  // Fetch players and inning scores when game data is loaded
  useEffect(() => {
    if (initialGame) {
      fetchPlayersForGame();
      fetchInningScores();
      fetchTeamRecords();
    }
  }, [initialGame]);

  // Helper function to get current game state (real-time snapshot or fallback to initial data)
  const getCurrentGameState = () => {
    if (snapshot) {
      // Use real-time snapshot data
      return {
        status: snapshot.status,
        score_home: snapshot.score_home,
        score_away: snapshot.score_away,
        current_inning: snapshot.current_inning,
        is_top_of_inning: snapshot.is_top_of_inning,
        outs: snapshot.outs,
        balls: snapshot.balls,
        strikes: snapshot.strikes,
        base_runners: snapshot.base_runners,
        batter_id: snapshot.batter_id,
        catcher_id: snapshot.catcher_id
      };
    }

    if (liveStatus) {
      // Use live status data
      return {
        status: liveStatus.status,
        score_home: liveStatus.score_home,
        score_away: liveStatus.score_away,
        current_inning: liveStatus.current_inning,
        is_top_of_inning: liveStatus.is_top_of_inning,
        outs: liveStatus.outs,
        balls: liveStatus.balls,
        strikes: liveStatus.strikes,
        base_runners: liveStatus.base_runners,
        batter_name: liveStatus.batter_name,
        catcher_name: liveStatus.catcher_name
      };
    }

    if (initialGame) {
      // Fallback to initial game data
      return {
        status: initialGame.status,
        score_home: initialGame.home_score,
        score_away: initialGame.away_score,
        current_inning: undefined,
        is_top_of_inning: undefined,
        outs: undefined,
        balls: undefined,
        strikes: undefined,
        base_runners: undefined,
        batter_name: undefined,
        catcher_name: undefined
      };
    }

    return null;
  };

  const currentState = getCurrentGameState();

  const formatNameWithRecord = (teamId: string, name: string) => {
    const rec = teamRecords.get(teamId) || { wins: 0, losses: 0 };
    return `${name} (${rec.wins}-${rec.losses})`;
  };

  const isGameInProgress = currentState?.status === 'in_progress';

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#6C6D6F', fontSize: 14 }}>Loading game...</span>
      </div>
    );
  }

  if (error || !initialGame) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <span style={{ color: '#6C6D6F', fontSize: 16, fontWeight: 600 }}>Game Not Found</span>
        <span style={{ color: '#A5A6A7', fontSize: 14 }}>{error || 'The requested game could not be found.'}</span>
        <button onClick={() => router.back()} style={{ marginTop: 8, color: '#0066CC', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>← Go back</button>
      </div>
    );
  }

  const awayScore = currentState?.score_away ?? initialGame.away_score;
  const homeScore = currentState?.score_home ?? initialGame.home_score;
  const awayWon = awayScore > homeScore;
  const homeWon = homeScore > awayScore;
  const statusText = initialGame.status === 'completed' ? 'Final' : initialGame.status === 'in_progress' ? 'Live' : 'Scheduled';
  const gameType = initialGame.game_type === 'round_robin' ? 'Pool Play' : 'Bracket';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
      {/* Dark hero header */}
      <div style={{
        backgroundColor: '#2B2C2D',
        borderRadius: '10px 10px 0 0',
        padding: '32px 24px',
        marginTop: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
      }}>
        {/* Away team */}
        <div style={{ flex: 1, textAlign: 'right', paddingRight: 24 }}>
          <div style={{ fontSize: 18, fontWeight: awayWon ? 700 : 400, color: '#FFFFFF', marginBottom: 4 }}>
            {initialGame.away_team.name}
          </div>
          <div style={{ fontSize: 13, color: '#A5A6A7' }}>
            {(() => { const r = teamRecords.get(initialGame.away_team.id); return r ? `${r.wins}-${r.losses}` : ''; })()}
          </div>
        </div>

        {/* Away score */}
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#FFFFFF',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 60,
          textAlign: 'center',
        }}>
          {awayScore}
        </div>

        {/* Status center */}
        <div style={{ padding: '0 20px', textAlign: 'center', minWidth: 80 }}>
          {initialGame.status === 'in_progress' ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', backgroundColor: '#CC0000', padding: '4px 10px', borderRadius: 3 }}>LIVE</span>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#A5A6A7' }}>{statusText}</div>
          )}
          <div style={{ fontSize: 11, color: '#6C6D6F', marginTop: 4, textTransform: 'uppercase' }}>{gameType}</div>
        </div>

        {/* Home score */}
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#FFFFFF',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 60,
          textAlign: 'center',
        }}>
          {homeScore}
        </div>

        {/* Home team */}
        <div style={{ flex: 1, textAlign: 'left', paddingLeft: 24 }}>
          <div style={{ fontSize: 18, fontWeight: homeWon ? 700 : 400, color: '#FFFFFF', marginBottom: 4 }}>
            {initialGame.home_team.name}
          </div>
          <div style={{ fontSize: 13, color: '#A5A6A7' }}>
            {(() => { const r = teamRecords.get(initialGame.home_team.id); return r ? `${r.wins}-${r.losses}` : ''; })()}
          </div>
        </div>
      </div>

      {/* Box Score tab bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #D0D0D0',
        borderRight: '1px solid #D0D0D0',
        padding: '0 16px',
        display: 'flex',
        borderBottom: '1px solid #D0D0D0',
      }}>
        <span style={{
          padding: '10px 0',
          fontSize: 14,
          fontWeight: 700,
          color: '#151617',
          borderBottom: '2px solid #CC0000',
        }}>
          Box Score
        </span>
      </div>

      {/* Scoreboard */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D0D0D0',
        borderTop: 'none',
        padding: '20px 16px',
      }}>
        <ScoreBoard
          data={{
            home_team: {
              name: initialGame.home_team.name,
              total_runs: homeScore,
            },
            away_team: {
              name: initialGame.away_team.name,
              total_runs: awayScore,
            },
            innings: inningScores,
            total_innings: Math.max(3, inningScores?.length || 3),
          }}
        />
      </div>

      {/* Live game state */}
      {isGameInProgress && currentState && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D0D0D0',
          borderTop: 'none',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6C6D6F', marginBottom: 2 }}>Inning</div>
              <div style={{ fontWeight: 700, color: '#151617' }}>
                {currentState.is_top_of_inning ? 'Top' : 'Bot'} {currentState.current_inning}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6C6D6F', marginBottom: 2 }}>Count</div>
              <div style={{ fontWeight: 700, color: '#151617' }}>{currentState.balls || 0}-{currentState.strikes || 0}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6C6D6F', marginBottom: 2 }}>Outs</div>
              <div style={{ fontWeight: 700, color: '#151617' }}>{currentState.outs || 0}</div>
            </div>
          </div>
          <ConnectionStatus status={connectionStatus} onReconnect={reconnect} size="small" />
        </div>
      )}

      {/* Team Rosters */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D0D0D0',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        padding: '0 16px 16px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '16px 0' }}>
          {/* Away roster */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E5E5E5' }}>
              {initialGame.away_team.name}
            </div>
            {loadingPlayers ? (
              <span style={{ fontSize: 13, color: '#A5A6A7' }}>Loading...</span>
            ) : awayPlayers.length > 0 ? (
              awayPlayers.map(p => (
                <div key={p.id} style={{ fontSize: 13, color: '#484A4A', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#6C6D6F', flexShrink: 0 }}>
                    {p.name.charAt(0)}
                  </div>
                  {p.name}
                </div>
              ))
            ) : (
              <span style={{ fontSize: 13, color: '#A5A6A7' }}>No players listed</span>
            )}
          </div>

          {/* Home roster */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E5E5E5' }}>
              {initialGame.home_team.name}
            </div>
            {loadingPlayers ? (
              <span style={{ fontSize: 13, color: '#A5A6A7' }}>Loading...</span>
            ) : homePlayers.length > 0 ? (
              homePlayers.map(p => (
                <div key={p.id} style={{ fontSize: 13, color: '#484A4A', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#6C6D6F', flexShrink: 0 }}>
                    {p.name.charAt(0)}
                  </div>
                  {p.name}
                </div>
              ))
            ) : (
              <span style={{ fontSize: 13, color: '#A5A6A7' }}>No players listed</span>
            )}
          </div>
        </div>
      </div>

      {/* Back link */}
      <div style={{ padding: '16px 0 32px' }}>
        <button onClick={() => router.back()} style={{ color: '#0066CC', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>← Back to scores</button>
      </div>
    </div>
  );
}
