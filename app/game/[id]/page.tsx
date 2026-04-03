'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchGameById, getLiveGameStatus, fetchTeamPlayers, calculateInningScores } from '../../../lib/api';
import { GameDisplayData, LiveGameStatus, GameSnapshot, Player } from '../../../lib/types';
import { useViewerGameUpdates } from '../../../hooks/useViewerGameUpdates';
import ScoreBoard from '../../../components/ScoreBoard';
import { ConnectionStatus } from '../../../components/ConnectionStatus';
import TeamRosterPanel from '../../../components/TeamRosterPanel';
import { ESPN } from '../../../lib/utils';
import { useIsMobile } from '../../../hooks/useIsMobile';

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
  const isMobile = useIsMobile();

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
  // For completed games, always use the games table scores (snapshots may be stale/incorrect)
  const getCurrentGameState = () => {
    if (snapshot && initialGame?.status !== 'completed') {
      // Use real-time snapshot data only for non-completed games
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
        <span style={{ color: ESPN.gray500, fontSize: 14 }}>Loading game...</span>
      </div>
    );
  }

  if (error || !initialGame) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <span style={{ color: ESPN.gray500, fontSize: 16, fontWeight: 600 }}>Game Not Found</span>
        <span style={{ color: ESPN.gray400, fontSize: 14 }}>{error || 'The requested game could not be found.'}</span>
        <button onClick={() => router.back()} style={{ marginTop: 8, color: ESPN.blue, background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>← Go back</button>
      </div>
    );
  }

  const awayScore = currentState?.score_away ?? initialGame.away_score;
  const homeScore = currentState?.score_home ?? initialGame.home_score;
  const awayWon = awayScore > homeScore;
  const homeWon = homeScore > awayScore;
  const statusText = initialGame.status === 'completed' ? 'Final' : initialGame.status === 'in_progress' ? 'Live' : 'Scheduled';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

      {/* Breadcrumb */}
      <div style={{ padding: isMobile ? '10px 0 0' : '16px 0 0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => router.back()} style={{ color: ESPN.blue, background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', fontWeight: 500, padding: 0 }}>← Back</button>
        <span style={{ color: ESPN.gray400 }}>/</span>
        <span style={{ color: ESPN.gray500 }}>{initialGame.away_team.name} vs {initialGame.home_team.name}</span>
      </div>

      {/* Section 1: Matchup hero — separate white card */}
      <div style={{
        backgroundColor: ESPN.white,
        borderRadius: 10,
        padding: '40px 24px 32px',
        marginTop: 24,
        border: '1px solid #D0D0D0',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : undefined,
        }}>
          {/* Away team name + record */}
          <div style={{ flex: isMobile ? undefined : 1, textAlign: isMobile ? 'center' : 'right', paddingRight: isMobile ? 0 : 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: awayWon ? ESPN.black : ESPN.gray400 }}>
              {initialGame.bracketRoundName === 'Finals' && awayWon && <span style={{ marginRight: 4 }}>🏆</span>}
              {initialGame.away_team.name}
            </div>
            <div style={{ fontSize: 13, color: ESPN.gray400, marginTop: 2 }}>
              {(() => { const r = teamRecords.get(initialGame.away_team.id); return r ? `${r.wins}-${r.losses}` : ''; })()}
            </div>
          </div>

          {/* Away score with triangle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: isMobile ? 8 : 0 }}>
            <div style={{
              fontSize: isMobile ? 32 : 36,
              fontWeight: 700,
              color: awayWon ? ESPN.black : ESPN.gray400,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 44,
              textAlign: 'center',
              lineHeight: 1,
            }}>
              {awayScore}
            </div>
            {awayWon && initialGame.status === 'completed' && !isMobile && (
              <span style={{ fontSize: 9, color: ESPN.black, lineHeight: 1 }}>◀</span>
            )}
          </div>

          {/* Center: Status */}
          <div style={{ padding: isMobile ? '8px 0' : '0 20px', textAlign: 'center', minWidth: 70 }}>
            {initialGame.status === 'in_progress' ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: ESPN.white, backgroundColor: ESPN.red, padding: '4px 12px', borderRadius: 3 }}>LIVE</span>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: ESPN.black }}>{statusText}</div>
            )}
          </div>

          {/* Home score with triangle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {homeWon && initialGame.status === 'completed' && !isMobile && (
              <span style={{ fontSize: 9, color: ESPN.black, lineHeight: 1 }}>▶</span>
            )}
            <div style={{
              fontSize: isMobile ? 32 : 36,
              fontWeight: 700,
              color: homeWon ? ESPN.black : ESPN.gray400,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 44,
              textAlign: 'center',
              lineHeight: 1,
            }}>
              {homeScore}
            </div>
          </div>

          {/* Home team name + record */}
          <div style={{ flex: isMobile ? undefined : 1, textAlign: isMobile ? 'center' : 'left', paddingLeft: isMobile ? 0 : 20, marginTop: isMobile ? 8 : 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: homeWon ? ESPN.black : ESPN.gray400 }}>
              {initialGame.home_team.name}
              {initialGame.bracketRoundName === 'Finals' && homeWon && <span style={{ marginLeft: 4 }}>🏆</span>}
            </div>
            <div style={{ fontSize: 13, color: ESPN.gray400, marginTop: 2 }}>
              {(() => { const r = teamRecords.get(initialGame.home_team.id); return r ? `${r.wins}-${r.losses}` : ''; })()}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Tab bar — separate white card with gap above */}
      <div style={{
        backgroundColor: ESPN.white,
        borderRadius: '10px 10px 0 0',
        border: '1px solid #D0D0D0',
        borderBottom: 'none',
        padding: '0 16px',
        display: 'flex',
        marginTop: 12,
      }}>
        <span style={{
          padding: '12px 0',
          fontSize: 14,
          fontWeight: 700,
          color: ESPN.black,
          borderBottom: '2px solid #CC0000',
        }}>
          Box Score
        </span>
      </div>

      {/* Section 3: Line score — continues from tab bar */}
      <div style={{
        backgroundColor: ESPN.white,
        border: '1px solid #D0D0D0',
        borderTop: '1px solid #D0D0D0',
        padding: isMobile ? '12px 16px' : '20px 16px',
        borderRadius: isGameInProgress ? '0' : '0 0 10px 10px',
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
          backgroundColor: ESPN.white,
          border: '1px solid #D0D0D0',
          borderTop: 'none',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: ESPN.gray500, marginBottom: 2 }}>Inning</div>
              <div style={{ fontWeight: 700, color: ESPN.black }}>
                {currentState.is_top_of_inning ? 'Top' : 'Bot'} {currentState.current_inning}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: ESPN.gray500, marginBottom: 2 }}>Count</div>
              <div style={{ fontWeight: 700, color: ESPN.black }}>{currentState.balls || 0}-{currentState.strikes || 0}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: ESPN.gray500, marginBottom: 2 }}>Outs</div>
              <div style={{ fontWeight: 700, color: ESPN.black }}>{currentState.outs || 0}</div>
            </div>
          </div>
          <ConnectionStatus status={connectionStatus} onReconnect={reconnect} size="small" />
        </div>
      )}

      {/* Section 4: Team Rosters — side by side with vertical divider */}
      <div style={{
        backgroundColor: ESPN.white,
        border: '1px solid #D0D0D0',
        borderRadius: 10,
        marginTop: 12,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1px 1fr',
      }}>
        {/* Away roster */}
        <div style={{ padding: '16px 20px' }}>
          <TeamRosterPanel teamName={initialGame.away_team.name} players={awayPlayers} loading={loadingPlayers} />
        </div>

        {/* Vertical divider */}
        <div style={{ backgroundColor: ESPN.gray200, display: isMobile ? 'none' : 'block' }} />

        {/* Home roster */}
        <div style={{ padding: '16px 20px' }}>
          <TeamRosterPanel teamName={initialGame.home_team.name} players={homePlayers} loading={loadingPlayers} />
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: 32 }} />
    </div>
  );
}
